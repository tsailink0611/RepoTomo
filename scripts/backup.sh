#!/bin/bash
# RepoTomo 自動バックアップスクリプト
# AIエージェント開発時の安全対策

echo "🔄 RepoTomo自動バックアップ開始..."

# 現在の日時を取得
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/backup_$TIMESTAMP"

# バックアップディレクトリ作成
mkdir -p "$BACKUP_DIR"

# 1. 現在のブランチを保存
CURRENT_BRANCH=$(git branch --show-current)
echo "現在のブランチ: $CURRENT_BRANCH" > "$BACKUP_DIR/branch_info.txt"

# 2. 全ファイルをバックアップ（.gitを除く）
echo "📁 ファイルをバックアップ中..."
rsync -av --exclude='.git' --exclude='backups' --exclude='node_modules' . "$BACKUP_DIR/files/"

# 3. Gitの状態を保存
echo "📝 Git状態を保存中..."
git status > "$BACKUP_DIR/git_status.txt"
git log --oneline -10 > "$BACKUP_DIR/recent_commits.txt"
git diff > "$BACKUP_DIR/current_changes.diff"

# 4. 設定ファイルの状態
git config --list > "$BACKUP_DIR/git_config.txt"

# 5. リモートリポジトリにプッシュ（安全なブランチのみ）
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🚀 リモートにプッシュ中..."
    git push origin "$CURRENT_BRANCH" 2>/dev/null || echo "⚠️  プッシュに失敗（認証エラーの可能性）"
fi

# 6. バックアップ完了通知
echo "✅ バックアップ完了: $BACKUP_DIR"
echo "📊 バックアップサイズ: $(du -sh $BACKUP_DIR | cut -f1)"

# 7. 古いバックアップを削除（7日以上前）
find backups/ -name "backup_*" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null

echo "🎯 バックアップスクリプト完了！"