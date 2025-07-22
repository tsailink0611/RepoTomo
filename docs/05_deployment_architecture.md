# RepoTomo デプロイ設計書

## 概要
Vercel + Railway を使用したフルスタックアプリケーションのデプロイメント設計

## 🏗️ インフラ構成図

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudflare    │    │     Vercel      │    │    Railway      │
│   (CDN/DNS)     │───▶│  (Frontend)     │───▶│  (Backend)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PWA Cache     │    │  PostgreSQL     │
                       │   (Service SW)  │    │  (Database)     │
                       └─────────────────┘    └─────────────────┘
                                                       │
                                              ┌─────────────────┐
                                              │     Redis       │
                                              │   (Cache)       │
                                              └─────────────────┘
```

## 🌐 フロントエンド（Vercel）

### プロジェクト設定

```bash
# Vercel CLIセットアップ
npm i -g vercel
vercel login
vercel link

# 初回デプロイ
vercel --prod
```

### ビルド設定

```json
// vercel.json
{
  "version": 2,
  "name": "repotomo",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*\\.(js|css|woff2))",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://repotomo-api.railway.app/api/$1"
    }
  ],
  
  "env": {
    "VITE_API_BASE_URL": "https://repotomo-api.railway.app/api",
    "VITE_LINE_CHANNEL_ID": "@line_channel_id",
    "VITE_ENVIRONMENT": "production",
    "VITE_PWA_ENABLED": "true"
  }
}
```

### PWA設定

```typescript
// vite.config.ts PWA設定
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/repotomo-api\.railway\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'RepoTomo',
        short_name: 'レポートモ',
        description: '心理的安全性を重視した報告書管理システム',
        theme_color: '#4A90E2',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

### ドメイン設定

```bash
# カスタムドメイン設定
vercel domains add repotomo.tsailink.com
vercel domains verify repotomo.tsailink.com

# DNS設定（Cloudflare）
# CNAME: repotomo.tsailink.com → cname.vercel-dns.com
```

## 🖥️ バックエンド（Railway）

### プロジェクト設定

```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"
watchPatterns = ["src/**"]

[deploy]
numReplicas = 1
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "always"

[env]
NODE_ENV = "production"
PORT = { default = "3001" }

[experimental]
incrementalBuilds = true
```

### Dockerfile（予備設定）

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Builder
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

USER nodejs

EXPOSE 3001

CMD ["npm", "start"]
```

### 環境変数管理

```bash
# Railway環境変数
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set REDIS_URL=${{Redis.REDIS_URL}}
railway variables set JWT_SECRET=<生成した秘密鍵>
railway variables set LINE_CHANNEL_ID=<LINEチャンネルID>
railway variables set LINE_CHANNEL_SECRET=<LINEシークレット>
railway variables set ENCRYPTION_KEY=<暗号化キー>
railway variables set ALLOWED_ORIGINS=https://repotomo.vercel.app
```

## 🗄️ データベース（Railway PostgreSQL）

### 設定

```sql
-- 初期設定
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- パフォーマンス設定
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
```

### バックアップ設定

```bash
# 自動バックアップスクリプト
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="repotomo_backup_${DATE}.sql"

# バックアップ実行
pg_dump $DATABASE_URL > "/tmp/${BACKUP_NAME}"

# S3アップロード（オプション）
aws s3 cp "/tmp/${BACKUP_NAME}" "s3://repotomo-backups/"

# 古いバックアップ削除（7日以上）
find /tmp -name "repotomo_backup_*.sql" -mtime +7 -delete

echo "Backup completed: ${BACKUP_NAME}"
```

### マイグレーション戦略

```bash
# 本番マイグレーション手順
# 1. バックアップ作成
railway run pg_dump $DATABASE_URL > backup_pre_migration.sql

# 2. マイグレーション実行
railway run npx prisma migrate deploy

# 3. データ検証
railway run npx prisma db seed --verify
```

## 📊 監視・ログ

### アプリケーション監視

```typescript
// 監視設定
import { createProxyMiddleware } from 'http-proxy-middleware'

// Vercel Analytics
import { Analytics } from '@vercel/analytics/react'

function App() {
  return (
    <div>
      {/* アプリケーション */}
      <Analytics />
    </div>
  )
}

// Railway ヘルスチェック
app.get('/api/health', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    memory: false
  }

  try {
    // データベース確認
    await prisma.$queryRaw`SELECT 1`
    checks.database = true

    // Redis確認
    await redis.ping()
    checks.redis = true

    // メモリ使用量確認
    const memUsage = process.memoryUsage()
    checks.memory = memUsage.heapUsed < 200 * 1024 * 1024 // 200MB未満

    const isHealthy = Object.values(checks).every(Boolean)

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.npm_package_version
    })
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message
    })
  }
})
```

### ログ管理

```typescript
// logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// 本番環境では外部ログサービス使用
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Http({
    host: 'logs.railway.app',
    port: 443,
    path: '/api/logs'
  }))
}

export { logger }
```

## 🚀 デプロイメントフロー

### CI/CD パイプライン

```yaml
# .github/workflows/deploy.yml
name: Deploy RepoTomo

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run typecheck

      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: repotomo-api

      - name: Run migrations
        run: |
          railway run npx prisma migrate deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: [test, deploy-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

  post-deploy:
    needs: [deploy-backend, deploy-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Health Check
        run: |
          sleep 30
          curl -f https://repotomo-api.railway.app/api/health
          curl -f https://repotomo.vercel.app

      - name: Notify Discord
        if: always()
        uses: sarisia/actions-status-discord@v1
        with:
          webhook: ${{ secrets.DISCORD_WEBHOOK }}
          status: ${{ job.status }}
          title: "RepoTomo Deployment"
```

### 手動デプロイ手順

```bash
# 1. テスト実行
npm run test
npm run typecheck
npm run lint

# 2. バックエンドデプロイ
railway login
railway environment production
railway up

# 3. マイグレーション
railway run npx prisma migrate deploy

# 4. フロントエンドデプロイ
vercel --prod

# 5. 動作確認
curl https://repotomo-api.railway.app/api/health
curl https://repotomo.vercel.app
```

## 🔄 ロールバック戦略

### 緊急ロールバック

```bash
# フロントエンド（Vercel）
vercel rollback <deployment-url>

# バックエンド（Railway）
railway rollback <deployment-id>

# データベース
railway run psql $DATABASE_URL < backup_pre_migration.sql
```

### Blue-Green デプロイ（将来対応）

```bash
# 新環境デプロイ
railway service create repotomo-api-green
railway deploy --service repotomo-api-green

# 切り替え
railway service rename repotomo-api repotomo-api-blue
railway service rename repotomo-api-green repotomo-api
```

## 📈 スケーリング設定

### Railway スケーリング

```toml
# railway.toml
[deploy]
numReplicas = { min = 1, max = 3 }
autoscaling = true

[resources]
memory = "1GB"
cpu = "1vCPU"
```

### Vercel スケーリング

```json
// vercel.json
{
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1", "nrt1"]
}
```

## 💰 コスト最適化

### 現在の構成コスト（概算）

- **Vercel Pro**: $20/月
- **Railway**: $5-20/月（使用量による）
- **Cloudflare**: 無料プラン
- **LINE Messaging API**: 無料プラン（月1000通まで）

**合計**: 約$25-40/月

### コスト削減策

1. Railway Starter プラン活用（$5/月）
2. 不要なVercel機能無効化
3. 画像最適化でCDN使用量削減
4. データベース容量監視

この設計により、スケーラブルで信頼性の高いRepoTomoを効率的に運用できます。