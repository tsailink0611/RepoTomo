🛡️ AIエージェント開発時の安全対策
🚀 開発開始前の手順
bash# 1. バックアップ作成
./scripts/backup.sh

# 2. 最新の migration-dev ブランチから作業開始
git checkout migration-dev
git pull origin migration-dev

# 3. 機能別ブランチで作業
git checkout -b feat/[機能名]
# または実験的な作業の場合
git checkout -b experiment/[実験名]-$(date +%Y%m%d)

# 4. 安全確認
git status
git log --oneline -3
🆘 緊急時の復旧手順
レベル1: 軽微な問題（タイポ、小さなバグ）
bash# 直前のコミットに戻す（作業内容は保持）
git reset --soft HEAD~1

# または特定ファイルのみ元に戻す
git checkout HEAD -- [ファイル名]
レベル2: 中程度の問題（ビルドエラー、動作不良）
bash# 作業中の変更を破棄
git reset --hard HEAD

# migration-dev の最新状態に戻す
git checkout migration-dev
git pull origin migration-dev
レベル3: 重大な問題（データ破損、システム障害）
bash# GAS版の安定版に緊急復旧
git checkout gas-stable

# または緊急復旧スクリプト実行
./scripts/emergency_restore.sh
📋 AIエージェント（Claude Code）に渡すべき指示
markdown重要な安全ルール:
1. メインブランチ(main)とgas-stableは絶対に直接編集しない
2. 作業は必ず migration-dev から派生した feat/* ブランチで行う
3. 機密情報(.env, .env.local, LINEトークン等)は絶対に触らない
4. 30分ごとにWIPコミットを作成する
5. 問題が発生したら即座に作業を停止し、エラー内容を記録
6. package-lock.json の変更は慎重に（依存関係の破壊を防ぐ）
7. データベースのマイグレーションは必ずバックアップ後に実行
🔍 定期チェックコマンド
bash# 現在の状況確認
git status
git branch --show-current
pwd

# 最近の変更確認  
git log --oneline -5
git diff --stat

# リモートとの同期確認
git fetch origin
git status -sb

# ブランチの関係確認
git log --graph --oneline --all -10

# 作業ファイルの確認
git ls-files -m  # 変更されたファイル
git ls-files -o  # 追跡されていないファイル
🏷️ ブランチ保護ルール
bash# 保護されたブランチ（直接プッシュ禁止）
- main
- gas-stable
- migration-dev（マージのみ）

# 作業ブランチの命名規則
- feat/*        : 新機能開発
- fix/*         : バグ修正
- experiment/*  : 実験的な変更
- hotfix/*      : 緊急修正
📦 依存関係の安全管理
bash# パッケージ追加前の確認
npm audit

# パッケージ追加後
git add package.json package-lock.json
git commit -m "deps: [パッケージ名]を追加"

# 依存関係の問題が発生した場合
rm -rf node_modules package-lock.json
npm install
🔐 環境変数の取り扱い
bash# .env.example を参考に .env.local を作成
cp .env.example .env.local

# 絶対にコミットしない
# .gitignore で以下が除外されていることを確認
- .env
- .env.local
- .env.*.local
- *.key
- *.pem
📊 移行期特有の注意事項
bash# GASとReact/Node.jsの並行運用中の注意
1. データ形式の互換性を保つ
2. LINE Bot Webhookの切り替えは慎重に
3. ユーザー影響を最小限に
4. 常にロールバック可能な状態を維持
📞 トラブル時の対応
リポジトリ情報

Repository: https://github.com/[your-username]/RepoTomo.git
Issues: GitHub Issues でトラブル報告
Wiki: 詳細なトラブルシューティング

ドキュメント

移行ガイド: docs/current/MIGRATION.md
API仕様: docs/current/API.md
ロールバック: docs/emergency/rollback_guide.md

スクリプト

バックアップ: ./scripts/backup.sh
緊急復旧: ./scripts/emergency_restore.sh
環境チェック: ./scripts/health_check.sh

コマンドエイリアス（推奨）
bash# ~/.gitconfig に追加
[alias]
    # 安全な作業開始
    safe-start = "!git checkout migration-dev && git pull origin migration-dev && git checkout -b"
    # 現在の状態確認
    check = "!git status && echo '---' && git branch --show-current"
    # WIPコミット
    wip = "!git add . && git commit -m 'WIP: 作業中'"

💡 安全第一: 「迷ったら聞く、困ったら戻る、焦らず着実に」