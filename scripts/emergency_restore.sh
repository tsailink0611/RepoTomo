#!/bin/bash
# 緊急復旧スクリプト
# AIエージェントがコードを壊した時の即座復旧

echo "🚨 緊急復旧スクリプト開始..."
echo "このスクリプトは作業中の変更をすべて破棄します"
echo ""

# 確認プロンプト
read -p "本当に実行しますか？ (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ 復旧をキャンセルしました"
    exit 1
fi

echo "🔄 復旧処理開始..."

# 1. 現在の状況を緊急バックアップ
EMERGENCY_BACKUP="emergency_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EMERGENCY_BACKUP"
cp -r . "$EMERGENCY_BACKUP/" 2>/dev/null
echo "📁 緊急バックアップ作成: $EMERGENCY_BACKUP"

# 2. 作業中の変更を破棄
git reset --hard HEAD
echo "🔄 ローカル変更を破棄しました"

# 3. 最新のコミットから復旧
git clean -fd
echo "🧹 未追跡ファイルを削除しました"

# 4. mainブランチに避難
git checkout main
echo "🏠 mainブランチに避難しました"

# 5. リモートから最新情報を取得
git pull origin main
echo "⬇️ リモートから最新情報を取得しました"

# 6. 状況確認
echo ""
echo "✅ 緊急復旧完了"
echo "📊 現在の状況:"
git status
echo ""
echo "📈 最新のコミット:"
git log --oneline -3

echo ""
echo "🎯 復旧が完了しました"
echo "💡 緊急バックアップ: $EMERGENCY_BACKUP"