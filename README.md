# 📝 RepoTomo - 心理的安全性重視の報告書管理システム

> **月額0円〜数百円**で運用できる、スタッフが「自然に報告したくなる」システム

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)
![PWA](https://img.shields.io/badge/PWA-Ready-orange)

## 🎯 プロジェクトコンセプト

**「報告書は提出してもらうものではなく、スタッフが自然に出したくなるもの」**

飲食チェーン（120名規模）向けに設計された、心理的安全性を最重視した報告書管理システムです。

### 💡 解決する課題

| スタッフ側の悩み | 管理者側の悩み |
|----------------|---------------|
| ❌ 報告書提出のプレッシャー | ❌ 未提出者の把握と催促の手間 |
| ❌ 何を書けばいいか分からない | ❌ 質問や相談への迅速な対応 |
| ❌ 提出後の反応が怖い | ❌ スタッフの本音が聞けない |
| ❌ 忙しい中での報告書作成負担 | ❌ 提出状況の一元管理 |

⬇️

| RepoTomoの解決策 |
|-----------------|
| ✅ 「今日の18:00頃が目安です😊」優しい表現 |
| ✅ 3つのボタンで簡単提出（「提出完了」「相談したい」「後で」） |
| ✅ 提出時の励ましメッセージとアチーブメント |
| ✅ 柔軟な締切設定と個人事情への配慮 |

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudflare    │    │     Vercel      │    │    Supabase     │
│   (CDN/DNS)     │───▶│   React PWA     │───▶│   PostgreSQL    │
│     無料        │    │     無料        │    │     無料        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │ Service Worker  │    │ Edge Functions  │
                    │  (PWA Cache)    │    │ (Serverless)    │
                    └─────────────────┘    └─────────────────┘
```

## 💰 超低コスト設計

### 完全無料プラン（月額0円）
- ✅ **Vercel Hobby**: フロントエンド・PWA
- ✅ **Supabase Free**: 500MB DB + 認証 + API
- ✅ **Cloudflare Free**: CDN + DNS
- ✅ **LINE Messaging API**: 月1000通無料

### 制限と対策
| サービス | 制限 | 対策 |
|---------|------|------|
| Supabase | 500MB DB | 古いデータ自動削除（3ヶ月） |
| Vercel | 100GB帯域 | 画像圧縮・キャッシュ活用 |
| LINE API | 1000通/月 | 効率的なメッセージング |

## 🛠️ 技術スタック

### フロントエンド
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (優しいデザイン)
- **PWA** (オフライン対応)
- **Zustand** (状態管理)

### バックエンド
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Row Level Security** (RLS)
- **Edge Functions** (サーバーレス)

### インフラ
- **Vercel** (デプロイ・ホスティング)
- **Cloudflare** (CDN・DNS)

## 🚀 クイックスタート

### 1. 環境構築

```bash
# リポジトリクローン
git clone https://github.com/tsailink0611/RepoTomo.git
cd RepoTomo

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .env ファイルを編集してください
```

### 2. Supabaseセットアップ

```bash
# Supabase CLI インストール
npm install -g supabase

# プロジェクト初期化
supabase init
supabase start

# データベースマイグレーション
supabase db push
```

### 3. 開発サーバー起動

```bash
# モックモードで開発（Supabaseプロジェクト作成前）
npm run dev:mock

# 本番Supabaseに接続（プロジェクト作成後）
npm run dev:supabase
```

🎉 http://localhost:5173 でアプリケーションが起動します！

## ⚠️ 現在の開発状況（2025年7月）

### ✅ 完了済み
- React基盤とSupabase依存関係設定
- データベース設計（PostgreSQL + RLS）
- 型定義・モックデータ準備
- 認証フック（モック版）実装
- 環境変数管理システム

### ⏳ 現在のフェーズ
**Phase 1: Supabase基盤統合**
1. Supabaseプロジェクト作成（ユーザー作業）
2. 環境変数設定
3. Supabaseクライアント統合
4. 認証システム実装

## 📱 主要機能

### スタッフ向け機能
- 📋 **簡単報告書提出** - 3つのボタンで完了
- 😊 **心理的安全性** - 優しい言葉遣いと励まし
- 🏆 **アチーブメント** - 提出への動機づけ
- 💬 **気軽な相談** - 質問・相談機能
- 📱 **PWA対応** - スマホでアプリのように使用可能

### 管理者向け機能
- 🎯 **優先対応ダッシュボード** - 質問・相談を最優先表示
- 📊 **提出状況一覧** - リアルタイム把握
- ⚡ **迅速な返信** - ワンクリック返信機能
- 📈 **分析機能** - 提出率・改善状況の可視化

## 📂 プロジェクト構成

```
RepoTomo/
├── docs/                     # 技術ドキュメント
│   ├── 01_database_design.md
│   ├── 02_api_specification.md
│   ├── 03_security_design.md
│   ├── 04_environment_setup.md
│   └── 05_deployment_architecture.md
├── frontend/                 # React アプリケーション  
│   ├── src/
│   │   ├── components/      # UIコンポーネント
│   │   ├── pages/          # ページコンポーネント  
│   │   ├── hooks/          # カスタムフック
│   │   ├── lib/            # Supabase設定
│   │   ├── types/          # TypeScript型定義
│   │   ├── mocks/          # モックデータ
│   │   └── utils/          # ユーティリティ
│   ├── .env.development     # 開発環境変数
│   ├── .env.production      # 本番環境変数
│   └── .env.example         # 環境変数テンプレート
├── supabase/                # Supabase設定
│   ├── migrations/          # データベースマイグレーション
│   └── functions/           # Edge Functions
├── AI_HANDOVER_PROMPT.md    # AI開発支援プロンプト
└── public/                  # 静的ファイル
```

## 🎨 デザイン原則

### UI/UX設計の核心
```typescript
// ❌ 避けるべき表現
"締切: 本日18:00【厳守】"
"未提出です。至急提出してください。"

// ✅ 推奨する表現  
"今日の18:00頃が目安です😊"
"余裕があるときに提出してくださいね"
```

### カラーパレット
- **メイン**: 暖色系パステルカラー (`#FFE5E5`, `#FFE5CC`)
- **アクセント**: 優しいオレンジ (`#FF8C69`)
- **テキスト**: ソフトグレー (`#4A5568`)
- **成功**: 優しいグリーン (`#68D391`)

## 📊 成功指標（KPI）

| 指標 | 目標値 | 現在値 |
|------|--------|--------|
| 📈 報告書提出率 | 90%以上 | - |
| ⏱️ 平均提出遅延 | 24時間以内 | - |
| 💬 質問回答時間 | 3時間以内 | - |
| 😊 スタッフ満足度 | 4.0/5.0以上 | - |
| 💰 月額運用コスト | 500円以下 | 0円 |

## 🛡️ セキュリティ

- 🔐 **Supabase Auth** + **LINE Login**
- 🛡️ **Row Level Security (RLS)**
- 🔒 **JWT認証**
- 🚫 **XSS/CSRF対策**
- 📊 **セキュリティログ**

詳細は [セキュリティ設計書](docs/03_security_design.md) を参照

## 🚀 デプロイメント

### 本番環境
```bash
# Vercelデプロイ
vercel --prod

# Supabaseデプロイ
supabase db push --linked
```

### ステージング環境
```bash
npm run build
npm run preview
```

## 🤝 開発チーム

- **開発者・プロジェクトマネージャー**: [tsailink0611](https://github.com/tsailink0611)
- **AIアシスタント**: Claude Code + Claude (Web)
- **開発手法**: AI協働開発（30分ごとのWIPコミット）

## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🆘 サポート

### ヘルプ
- 🐛 **バグ報告**: [Issues](https://github.com/tsailink0611/RepoTomo/issues)
- 💡 **機能提案**: [Discussions](https://github.com/tsailink0611/RepoTomo/discussions)
- 📚 **ドキュメント**: [docs/](docs/) フォルダ
- 🛡️ **安全ガイド**: [README_SAFETY.md](README_SAFETY.md)

### 貢献
RepoTomoは心理的安全性を最重視したプロジェクトです。コントリビューションも同様の価値観で歓迎いたします。

---

💡 **プロジェクトモットー**: 「月額0円で、スタッフが自然に報告したくなるシステム」

⭐ このプロジェクトが気に入ったら、ぜひスターをお願いします！