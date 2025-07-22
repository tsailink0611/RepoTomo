# RepoTomo API仕様書

## 概要
Node.js + Express + TypeScript による RESTful API設計

## ベースURL
- 開発環境: `http://localhost:3001/api`
- 本番環境: `https://repotomo-api.railway.app/api`

## 認証方式
- JWT (JSON Web Tokens)
- LINE Login OAuth 2.0
- Bearer Token形式

## 共通レスポンス形式

### 成功レスポンス
```typescript
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
}
```

### エラーレスポンス
```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}
```

## 📱 認証関連 API

### POST /api/auth/line/login
LINE Loginによる認証開始

**Request Body:**
```typescript
{
  code: string        // LINEから受け取った認証コード
  state: string       // CSRF対策用のstate
  redirectUri: string // リダイレクトURI
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    accessToken: string
    refreshToken: string
    user: {
      id: string
      staffId: string
      name: string
      role: 'STAFF' | 'MANAGER' | 'ADMIN'
      lineUserId: string
    }
  }
}
```

### POST /api/auth/refresh
トークンリフレッシュ

**Request Body:**
```typescript
{
  refreshToken: string
}
```

### POST /api/auth/logout
ログアウト

**Headers:** `Authorization: Bearer <token>`

## 👤 スタッフ管理 API

### GET /api/staff/me
現在のユーザー情報取得

**Headers:** `Authorization: Bearer <token>`

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    staffId: string
    name: string
    role: string
    preferredReminderTime: string
    stats: {
      totalSubmissions: number
      thisWeekSubmissions: number
      consecutiveDays: number
      achievements: number
    }
  }
}
```

### PUT /api/staff/me/preferences
個人設定の更新

**Request Body:**
```typescript
{
  preferredReminderTime?: string // "18:00"
  notificationEnabled?: boolean
}
```

### GET /api/staff (管理者のみ)
スタッフ一覧取得

**Query Parameters:**
- `page?: number` (default: 1)
- `limit?: number` (default: 20)
- `role?: string` 
- `search?: string`

## 📋 報告書管理 API

### GET /api/reports/templates
利用可能な報告書テンプレート一覧

**Response:**
```typescript
{
  success: true,
  data: [
    {
      id: string
      title: string
      description: string
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
      questions: [
        {
          id: string
          text: string
          type: 'TEXT' | 'CHOICE' | 'SCALE_1_TO_5'
          options?: string[]
          isRequired: boolean
        }
      ]
    }
  ]
}
```

### GET /api/reports/templates/:id
特定の報告書テンプレート詳細

### POST /api/reports/submit
報告書提出

**Request Body:**
```typescript
{
  templateId: string
  answers: Record<string, any> // { questionId: answer }
  mood: 'HAPPY' | 'NEUTRAL' | 'NEED_HELP'
  hasQuestion?: boolean
  question?: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    submittedAt: string
    message: "提出ありがとうございました！お疲れさまでした🎉"
    achievements?: [
      {
        type: string
        title: string
        icon: string
      }
    ]
  }
}
```

### GET /api/reports/my-submissions
自分の提出履歴

**Query Parameters:**
- `page?: number`
- `limit?: number`
- `templateId?: string`
- `from?: string` (ISO date)
- `to?: string` (ISO date)

### GET /api/reports/my-submissions/:id
特定の提出内容詳細

## 📊 ダッシュボード API

### GET /api/dashboard/staff
スタッフ用ダッシュボード

**Response:**
```typescript
{
  success: true,
  data: {
    pendingReports: [
      {
        templateId: string
        title: string
        dueTime: string
        isOverdue: boolean
      }
    ],
    recentSubmissions: Submission[],
    weeklyProgress: {
      completed: number
      total: number
      percentage: number
    },
    achievements: Achievement[]
  }
}
```

### GET /api/dashboard/manager (管理者のみ)
管理者用ダッシュボード

**Response:**
```typescript
{
  success: true,
  data: {
    priorityItems: [
      {
        type: 'QUESTION' | 'OVERDUE' | 'FIRST_TIME'
        staffName: string
        content: string
        urgency: 'HIGH' | 'MEDIUM' | 'LOW'
        timestamp: string
      }
    ],
    submissionStats: {
      todayRate: number
      weeklyRate: number
      totalStaff: number
      activeStaff: number
    },
    recentQuestions: Consultation[]
  }
}
```

## 💬 相談・質問 API

### POST /api/consultations
新しい相談・質問の投稿

**Request Body:**
```typescript
{
  title: string
  content: string
  isAnonymous?: boolean
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
}
```

### GET /api/consultations/my
自分の相談履歴

### GET /api/consultations (管理者のみ)
全相談一覧（管理者用）

**Query Parameters:**
- `status?: string`
- `priority?: string`
- `page?: number`
- `limit?: number`

### PUT /api/consultations/:id/reply (管理者のみ)
相談への返信

**Request Body:**
```typescript
{
  reply: string
  status?: 'IN_PROGRESS' | 'RESOLVED'
}
```

## 📈 分析・統計 API

### GET /api/analytics/submission-rates (管理者のみ)
提出率分析

**Query Parameters:**
- `period?: 'daily' | 'weekly' | 'monthly'`
- `from?: string`
- `to?: string`

### GET /api/analytics/mood-trends (管理者のみ)
気分・ムード分析

### GET /api/analytics/question-categories (管理者のみ)
よくある質問カテゴリ分析

## 🔔 通知管理 API

### POST /api/notifications/send-reminder (管理者のみ)
手動リマインダー送信

**Request Body:**
```typescript
{
  staffIds?: string[] // 未指定の場合は全員
  templateId: string
  message?: string    // カスタムメッセージ
}
```

### GET /api/notifications/settings
通知設定取得

### PUT /api/notifications/settings
通知設定更新

## 🎯 アチーブメント API

### GET /api/achievements/my
自分のアチーブメント一覧

### POST /api/achievements/check
アチーブメント判定実行（内部処理）

## エラーコード一覧

| コード | 説明 |
|--------|------|
| AUTH_001 | 無効なトークン |
| AUTH_002 | トークン期限切れ |
| AUTH_003 | 権限不足 |
| VALIDATION_001 | 入力値不正 |
| STAFF_001 | スタッフが見つからない |
| REPORT_001 | 報告書テンプレートが見つからない |
| REPORT_002 | 重複提出エラー |
| SYSTEM_001 | データベースエラー |
| SYSTEM_002 | 外部API連携エラー |

## レート制限

- 認証API: 10回/分/IP
- 通常API: 100回/分/ユーザー
- 管理者API: 1000回/分/ユーザー

## Webhookエンドポイント

### POST /api/webhooks/line
LINE Messaging API Webhook

**Headers:**
- `X-Line-Signature: <signature>`

**Request Body:**
```typescript
{
  events: [
    {
      type: 'message'
      message: {
        type: 'text'
        text: string
      }
      source: {
        userId: string
      }
    }
  ]
}
```

## 開発・テスト用エンドポイント

### GET /api/health
ヘルスチェック

### POST /api/dev/reset-db (開発環境のみ)
データベースリセット

### POST /api/dev/seed-data (開発環境のみ)
テストデータ投入