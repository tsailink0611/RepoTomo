# RepoTomo セキュリティ設計書

## 概要
心理的安全性を重視しながらも、企業レベルのセキュリティを確保するための設計

## 🛡️ 認証・認可設計

### LINE Login OAuth 2.0 実装

```typescript
// LINE認証フロー
interface LineAuthConfig {
  channelId: string
  channelSecret: string
  callbackUrl: string
  scope: ['profile', 'openid']
}

// JWT設定
interface JWTConfig {
  accessTokenExpiry: '15m'    // 短期間
  refreshTokenExpiry: '30d'   // 長期間
  algorithm: 'HS256'
  issuer: 'repotomo-api'
}
```

### 認証ミドルウェア

```typescript
// 認証ミドルウェア実装例
export const authenticateToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'アクセストークンが必要です'
        }
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    const staff = await prisma.staff.findUnique({
      where: { id: decoded.staffId }
    })

    if (!staff || !staff.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: '無効なユーザーです'
        }
      })
    }

    req.user = staff
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_002',
        message: 'トークンが無効または期限切れです'
      }
    })
  }
}

// 権限チェックミドルウェア
export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: 'この操作を行う権限がありません'
        }
      })
    }
    next()
  }
}
```

## 🔐 データ保護

### パスワード・秘密情報の管理

```typescript
// bcrypt設定
const SALT_ROUNDS = 12

// 環境変数暗号化（本番環境）
interface EnvConfig {
  DATABASE_URL: string          // Railway/Renderで暗号化
  JWT_SECRET: string           // 32文字以上のランダム文字列
  LINE_CHANNEL_SECRET: string  // LINE Developer設定
  ENCRYPTION_KEY: string       // AES-256用キー
}

// 機密データ暗号化
import crypto from 'crypto'

export class DataEncryption {
  private static algorithm = 'aes-256-gcm'
  private static key = process.env.ENCRYPTION_KEY!

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.algorithm, this.key)
    cipher.setAAD(Buffer.from('repotomo-data'))
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted
  }

  static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipher(this.algorithm, this.key)
    decipher.setAAD(Buffer.from('repotomo-data'))
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}
```

### 個人情報保護

```typescript
// PIIデータの匿名化
interface AnonymizationRules {
  staff: {
    name: 'hash'           // ハッシュ化
    lineUserId: 'encrypt'  // 暗号化
  }
  submissions: {
    answers: 'encrypt'     // 回答内容暗号化
    question: 'encrypt'    // 質問内容暗号化
  }
}

// GDPR対応データ削除
export const deletePersonalData = async (staffId: string) => {
  await prisma.$transaction([
    // 提出データの匿名化
    prisma.submission.updateMany({
      where: { staffId },
      data: {
        answers: {},
        question: null,
        anonymized: true
      }
    }),
    // スタッフ情報の削除
    prisma.staff.update({
      where: { id: staffId },
      data: {
        name: '削除済みユーザー',
        lineUserId: null,
        isActive: false,
        deletedAt: new Date()
      }
    })
  ])
}
```

## 🚫 入力値検証・サニタイゼーション

### バリデーション設定

```typescript
import { z } from 'zod'
import validator from 'validator'
import DOMPurify from 'dompurify'

// 提出データバリデーション
export const submissionSchema = z.object({
  templateId: z.string().cuid(),
  answers: z.record(z.union([
    z.string().max(5000),          // テキスト回答制限
    z.number().min(1).max(5),      // スケール制限
    z.array(z.string()).max(10)    // 複数選択制限
  ])),
  mood: z.enum(['HAPPY', 'NEUTRAL', 'NEED_HELP']),
  hasQuestion: z.boolean().optional(),
  question: z.string().max(2000).optional()
})

// XSS対策
export const sanitizeInput = (input: string): string => {
  // HTMLタグ除去
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  })
  
  // 追加のサニタイゼーション
  return validator.escape(cleaned.trim())
}

// SQLインジェクション対策（Prisma使用により自動対応）
// 動的クエリが必要な場合の安全な実装
export const safeQuery = async (searchTerm: string) => {
  const sanitized = sanitizeInput(searchTerm)
  return prisma.staff.findMany({
    where: {
      name: {
        contains: sanitized,
        mode: 'insensitive'
      }
    }
  })
}
```

## 🌐 ネットワークセキュリティ

### CORS設定

```typescript
import cors from 'cors'

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',           // 開発環境
      'https://repotomo.vercel.app',     // 本番フロントエンド
      'https://repotomo-staging.vercel.app' // ステージング
    ]
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS policy violation'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24時間
}

app.use(cors(corsOptions))
```

### レート制限

```typescript
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'

// 認証API制限
const authLimiter = rateLimit({
  store: new RedisStore({
    // Redis設定
  }),
  windowMs: 60 * 1000,        // 1分
  max: 10,                    // 最大10回
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_001',
      message: 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

// 通常API制限
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1分
  max: 100,                   // 最大100回
  keyGenerator: (req) => {
    return req.user?.id || req.ip
  }
})

app.use('/api/auth', authLimiter)
app.use('/api', apiLimiter)
```

## 📋 セキュリティヘッダー

```typescript
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.line.me"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// 追加のセキュリティヘッダー
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})
```

## 🔍 監査・ログ

### セキュリティログ

```typescript
interface SecurityLog {
  timestamp: Date
  userId?: string
  ip: string
  userAgent: string
  action: string
  resource: string
  success: boolean
  details?: any
}

export const logSecurityEvent = async (event: SecurityLog) => {
  // 重要なイベントのログ記録
  const sensitiveActions = [
    'LOGIN_ATTEMPT',
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE',
    'PASSWORD_CHANGE',
    'PERMISSION_DENIED',
    'DATA_ACCESS',
    'DATA_EXPORT'
  ]

  if (sensitiveActions.includes(event.action)) {
    await prisma.securityLog.create({
      data: event
    })
    
    // 異常検知
    if (!event.success) {
      await checkForAnomalies(event)
    }
  }
}

// 異常検知
const checkForAnomalies = async (event: SecurityLog) => {
  const recentFailures = await prisma.securityLog.count({
    where: {
      ip: event.ip,
      success: false,
      timestamp: {
        gte: new Date(Date.now() - 15 * 60 * 1000) // 15分以内
      }
    }
  })

  if (recentFailures >= 5) {
    // IP一時ブロック
    await blockIP(event.ip, '15 minutes')
    
    // 管理者通知
    await notifyAdmin({
      type: 'SECURITY_ALERT',
      message: `IP ${event.ip} から連続ログイン失敗が検出されました`,
      severity: 'HIGH'
    })
  }
}
```

## 🔄 バックアップ・災害復旧

### 暗号化バックアップ

```typescript
export const createEncryptedBackup = async () => {
  const data = await prisma.$queryRaw`
    SELECT * FROM staff, submissions, consultations
  `
  
  const encryptedData = DataEncryption.encrypt(JSON.stringify(data))
  
  // S3またはGoogle Cloudに暗号化データを保存
  await uploadToSecureStorage(encryptedData, {
    bucket: 'repotomo-backups',
    key: `backup-${Date.now()}.enc`,
    serverSideEncryption: 'AES256'
  })
}
```

## 🚨 インシデント対応

### セキュリティインシデント対応フロー

```typescript
interface IncidentResponse {
  detection: {
    automated: boolean
    reportedBy?: string
    timestamp: Date
  }
  assessment: {
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    affectedUsers: number
    dataCompromised: boolean
  }
  response: {
    immediate: string[]      // 即座に実行する対策
    investigation: string[]  // 調査項目
    communication: string[]  // 連絡事項
  }
}

// 緊急時対応
export const emergencyShutdown = async () => {
  // API停止
  app.disable('trust proxy')
  
  // データベース読み取り専用モード
  await prisma.$executeRaw`ALTER DATABASE repotomo SET default_transaction_read_only = on`
  
  // 管理者緊急連絡
  await notifyAllAdmins({
    type: 'EMERGENCY',
    message: 'システムが緊急停止されました',
    timestamp: new Date()
  })
}
```

## 🛠️ セキュリティテスト

### ペネトレーションテスト項目

1. **認証バイパステスト**
   - JWT改ざんテスト
   - セッション乗っ取りテスト
   - ブルートフォース攻撃テスト

2. **入力値検証テスト**
   - SQLインジェクション
   - XSSテスト
   - CSRFテスト

3. **認可テスト**
   - 権限昇格テスト
   - 横移動テスト
   - データアクセス制御テスト

4. **インフラテスト**
   - ネットワークスキャン
   - ポート開放確認
   - SSL/TLS設定確認

## 📊 セキュリティ監視メトリクス

- ログイン失敗率
- 異常アクセスパターン
- API応答時間の異常
- データベース接続数
- セキュリティヘッダーの設定状況

## 🔖 コンプライアンス

### 個人情報保護法対応
- 利用目的の明示
- 同意取得プロセス
- 開示・訂正・削除への対応
- 第三者提供の制限

### セキュリティ認証目標
- ISO 27001準拠の管理体制
- SOC 2 Type II対応検討
- プライバシーマーク取得検討