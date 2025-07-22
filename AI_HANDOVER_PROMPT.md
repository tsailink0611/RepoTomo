# RepoTomo AI開発引き継ぎプロンプト

## 🎯 プロジェクト概要

### システム名
**RepoTomo（レポートモ）** - 心理的安全性を最重視した報告書管理システム

### コアコンセプト
**「報告書は提出してもらうものではなく、スタッフが自然に出したくなるもの」**

### 対象
- 飲食チェーン（120名規模）
- スタッフの心理的負担を最小限にしながら、管理者が必要な情報を効率的に収集

### 最重要特徴
- **月額0円〜数百円**で運用可能な超低コスト設計
- **心理的安全性**を最優先したUI/UX
- **プレッシャーを与えない**運用フロー

## 💰 技術構成・コスト戦略

### アーキテクチャ（完全無料プラン）
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudflare    │    │     Vercel      │    │    Supabase     │
│ (CDN/DNS) 無料  │───▶│ (Frontend) 無料 │───▶│ (Backend) 無料  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │ Service Worker  │    │ Edge Functions  │
                    │  (PWA Cache)    │    │ (Serverless)    │
                    └─────────────────┘    └─────────────────┘
```

### 技術スタック
#### フロントエンド
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS**（暖色系パステルカラー）
- **PWA対応**（Vite PWA Plugin）
- **Zustand**（状態管理）
- **React Query**（キャッシュ・同期）

#### バックエンド
- **Supabase**（PostgreSQL + Auth + Edge Functions + Realtime）
- **Row Level Security (RLS)**
- **Edge Functions**（TypeScript/Deno）

#### インフラ・デプロイ
- **Vercel**（フロントエンド・無料プラン）
- **Cloudflare**（CDN・無料プラン）
- **LINE Messaging API**（月1000通無料）

### 無料枠制限と対策
| サービス | 制限 | 対策 |
|---------|------|------|
| Supabase | 500MB DB | 古いデータ自動削除（3ヶ月） |
| Vercel | 100GB帯域 | 画像圧縮・Service Workerキャッシュ |
| LINE API | 1000通/月 | 効率的なメッセージング |

## 📊 データベース設計（PostgreSQL）

### 主要テーブル
```sql
-- スタッフ
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  line_user_id TEXT UNIQUE,
  role TEXT DEFAULT 'STAFF' CHECK (role IN ('STAFF', 'MANAGER', 'ADMIN')),
  is_active BOOLEAN DEFAULT true,
  preferred_reminder_time TIME DEFAULT '18:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 報告書テンプレート
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  due_time TIME DEFAULT '18:00',
  reminder_message TEXT DEFAULT 'お疲れさまです！報告書の提出をお願いします😊',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 質問設定
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT CHECK (type IN ('TEXT', 'TEXTAREA', 'CHOICE', 'SCALE_1_TO_5', 'YES_NO')),
  options TEXT[], -- JSON配列
  is_required BOOLEAN DEFAULT false,
  "order" INT DEFAULT 0
);

-- 提出履歴
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES report_templates(id),
  staff_id UUID REFERENCES staff(id),
  answers JSONB,
  mood TEXT CHECK (mood IN ('happy', 'neutral', 'need_help')),
  has_question BOOLEAN DEFAULT false,
  question TEXT,
  is_answered BOOLEAN DEFAULT false,
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 相談・質問
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED')),
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- アチーブメント
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) 設定
```sql
-- スタッフは自分のデータのみアクセス可能
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_own_data" ON staff
  FOR ALL USING (auth.uid()::text = id::text);

-- 管理者は全データアクセス可能
CREATE POLICY "admin_all_access" ON staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE id::text = auth.uid()::text 
      AND role IN ('ADMIN', 'MANAGER')
    )
  );
```

## 🎨 心理的安全性重視のUI/UX設計

### デザイン原則
1. **言葉遣い**
```typescript
// ❌ 避けるべき表現
"締切: 本日18:00【厳守】"
"未提出です。至急提出してください。"
"エラーが発生しました"

// ✅ 推奨する表現  
"今日の18:00頃が目安です😊"
"余裕があるときに提出してくださいね"
"ちょっと調子が悪いみたい😅 もう一度試してみてください"
```

2. **カラーパレット**
```css
:root {
  /* 暖色系パステルカラー */
  --primary: #FFE5E5;
  --secondary: #FFE5CC;
  --accent: #FF8C69;
  --text: #4A5568;
  --success: #68D391;
  --warning: #F6E05E;
}
```

3. **UI要素**
- 角丸・余白を多用した優しいデザイン
- 絵文字の積極的活用
- アニメーションで楽しさを演出
- 成功時は大げさに褒める

### コンポーネント設計例
```typescript
// 優しいボタンコンポーネント
interface GentleButtonProps {
  children: React.ReactNode
  variant: 'primary' | 'secondary' | 'later'
  onClick: () => void
  disabled?: boolean
}

const GentleButton: React.FC<GentleButtonProps> = ({ 
  children, 
  variant, 
  onClick, 
  disabled = false 
}) => {
  const variants = {
    primary: 'bg-orange-200 hover:bg-orange-300 text-orange-800',
    secondary: 'bg-blue-200 hover:bg-blue-300 text-blue-800',
    later: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  }
  
  return (
    <button 
      className={`px-6 py-3 rounded-xl font-medium transition-all ${variants[variant]} ${disabled ? 'opacity-50' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
```

## 🔧 主要機能の実装要件

### 1. スタッフ向け機能

#### 報告書提出フロー
```typescript
// 3つのボタン選択
interface SubmissionChoice {
  type: 'submit' | 'consult' | 'later'
  message: string
  icon: string
}

const submissionChoices: SubmissionChoice[] = [
  { type: 'submit', message: '提出完了！', icon: '📝' },
  { type: 'consult', message: '相談したい', icon: '💬' },
  { type: 'later', message: '後で', icon: '⏰' }
]
```

#### 気分選択機能
```typescript
interface MoodOption {
  value: 'happy' | 'neutral' | 'need_help'
  label: string
  icon: string
  color: string
}

const moodOptions: MoodOption[] = [
  { value: 'happy', label: '今日は調子いいです！', icon: '😊', color: 'green' },
  { value: 'neutral', label: '普通です', icon: '😐', color: 'gray' },
  { value: 'need_help', label: 'ちょっと大変かも', icon: '😅', color: 'orange' }
]
```

#### アチーブメントシステム
```typescript
interface Achievement {
  id: string
  type: string
  title: string
  description: string
  icon: string
  points: number
}

const achievementTypes = {
  firstSubmit: { icon: "🎉", message: "初めての提出！", points: 10 },
  weekStreak: { icon: "🔥", message: "1週間連続！", points: 50 },
  helpOthers: { icon: "🤝", message: "チームプレイヤー！", points: 30 },
  earlyBird: { icon: "🌅", message: "早起きさん！", points: 20 }
}
```

### 2. 管理者向け機能

#### 優先対応ダッシュボード
```typescript
interface PriorityItem {
  type: 'QUESTION' | 'OVERDUE' | 'FIRST_TIME' | 'NEED_HELP'
  staffName: string
  content: string
  urgency: 'HIGH' | 'MEDIUM' | 'LOW'
  timestamp: string
  id: string
}

// 優先度順でソート
const priorityOrder = ['QUESTION', 'NEED_HELP', 'FIRST_TIME', 'OVERDUE']
```

#### ワンクリック返信
```typescript
const quickReplyTemplates = {
  encouragement: [
    "いつもお疲れさまです！頑張ってますね😊",
    "提出ありがとうございます！とても参考になりました👍",
    "質問ありがとうございます。一緒に考えましょう💪"
  ],
  support: [
    "何か困ったことがあれば、いつでも相談してくださいね",
    "無理しないでくださいね。チームでサポートします🤝",
    "いいアイデアですね！ぜひ試してみましょう✨"
  ]
}
```

## 🔄 Supabase統合実装

### 1. Supabaseクライアント設定
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 認証フック
export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

### 2. データ操作例
```typescript
// 報告書提出
const submitReport = async (reportData: ReportSubmission) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        report_id: reportData.templateId,
        staff_id: user.id,
        answers: reportData.answers,
        mood: reportData.mood,
        has_question: reportData.hasQuestion,
        question: reportData.question
      })
      .select()

    if (error) throw error
    
    // 成功時の励ましメッセージ
    toast.success('提出ありがとうございました！お疲れさまでした🎉')
    
    // アチーブメントチェック
    await checkAchievements(user.id)
    
    return data
  } catch (error) {
    toast.error('少し調子が悪いみたい😅 もう一度お試しください')
    console.error('Report submission error:', error)
  }
}

// リアルタイム通知
useEffect(() => {
  const subscription = supabase
    .channel('submissions')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'submissions' 
      },
      (payload) => {
        toast.success('新しい報告書が提出されました！')
        // ダッシュボード更新
        queryClient.invalidateQueries(['dashboard'])
      }
    )
    .subscribe()

  return () => supabase.removeChannel(subscription)
}, [])
```

### 3. Edge Functions例
```typescript
// supabase/functions/send-reminder/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 優しいリマインダーメッセージテンプレート
  const reminderTemplates = {
    gentle: "こんにちは😊 {reportName}の提出、お時間あるときにお願いします",
    veryGentle: "お疲れさまです☕ {reportName}、今日中で大丈夫ですよ〜",
    supportive: "忙しいと思いますが、{reportName}よろしくお願いします💪"
  }

  // スタッフ一覧取得
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('is_active', true)

  // LINE Messaging API経由でリマインダー送信
  for (const s of staff || []) {
    if (s.line_user_id) {
      await sendLineMessage(s.line_user_id, reminderTemplates.gentle)
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

## 📱 PWA実装要件

### Service Worker設定
```typescript
// vite.config.ts
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
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
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
        theme_color: '#FF8C69',
        background_color: '#FFE5E5',
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

### オフライン機能
```typescript
// hooks/useOfflineSync.ts
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSubmissions, setPendingSubmissions] = useState([])

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      // オフライン中の投稿を同期
      for (const submission of pendingSubmissions) {
        try {
          await supabase.from('submissions').insert(submission)
          setPendingSubmissions(prev => 
            prev.filter(p => p.tempId !== submission.tempId)
          )
          toast.success('オフライン中の報告書を同期しました！')
        } catch (error) {
          console.error('同期エラー:', error)
        }
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.info('オフラインモードです。オンライン復帰時に自動同期します')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [pendingSubmissions])

  return { isOnline, pendingSubmissions, setPendingSubmissions }
}
```

## 🚀 デプロイ・運用

### 環境変数
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LINE_CHANNEL_ID=your-line-channel-id
VITE_ENVIRONMENT=development
```

### デプロイコマンド
```bash
# Vercelデプロイ
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod

# Supabaseマイグレーション
supabase db push --linked
```

### 監視項目
```typescript
// 無料枠使用量監視
const monitoringMetrics = {
  supabase: {
    databaseSize: '500MB以内',
    monthlyActiveUsers: '50,000以内',
    storageUsage: '1GB以内'
  },
  vercel: {
    bandwidth: '100GB以内',
    buildMinutes: '6,000分以内'
  },
  line: {
    monthlyMessages: '1,000通以内'
  }
}
```

## 🎯 成功指標・KPI

```typescript
const successMetrics = {
  submissionRate: 0.9,        // 90%以上
  userSatisfaction: 4.0,      // 5段階評価
  questionResponseTime: 180,   // 3時間以内（分）
  stressLevel: "low",         // 定性評価
  monthlyCost: 0,             // 月額0円維持
  appLoadTime: 2.0,           // 2秒以内
  offlineCapability: true     // オフライン対応
}
```

## 📋 実装優先順位

### Phase 1: MVP（2週間）
1. Supabase環境構築
2. 既存React UIをSupabase統合
3. 基本的な報告書提出機能
4. 管理者ダッシュボード基本機能

### Phase 2: PWA化（1週間）
1. Service Worker実装
2. オフライン機能
3. プッシュ通知

### Phase 3: 高度機能（1週間）
1. リアルタイム通知
2. アチーブメントシステム
3. 詳細分析機能

## 🛡️ セキュリティ要件

- Supabase RLS設定
- JWT認証
- XSS/CSRF対策
- 入力値検証
- 環境変数管理

## 💡 開発時の注意点

### DO's ✅
- スタッフの気持ちに寄り添う実装
- 失敗を恐れさせない設計
- 小さな成功を大きく褒める
- 無料枠を超えないよう監視

### DON'Ts ❌
- 威圧的・命令的な表現
- 赤文字での警告表示
- カウントダウンタイマー
- コスト発生の可能性がある操作

---

💡 **開発のモットー**: 「月額0円で、スタッフが自然に報告したくなるシステム」