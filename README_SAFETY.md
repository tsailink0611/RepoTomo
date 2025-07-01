# 🛡️ AIエージェント開発時の安全対策

## 🚀 開発開始前の手順

```bash
# 1. バックアップ作成
./scripts/backup.sh

# 2. 新しいブランチで作業
git checkout -b feature/ai-development-$(date +%Y%m%d)

# 3. 安全確認
git status
```

## 🆘 緊急時の復旧手順

### レベル1: 軽微な問題
```bash
git reset --soft HEAD~1  # 直前のコミットに戻す
```

### レベル2: 中程度の問題
```bash
git reset --hard HEAD    # 作業中の変更を破棄
```

### レベル3: 重大な問題
```bash
./scripts/emergency_restore.sh  # 緊急復旧実行
```

## 📋 AIエージェントに渡すべき指示

```markdown
重要な安全ルール:
1. メインブランチ(main)は絶対に直接編集しない
2. 大きな変更の前は必ずバックアップを作成
3. 機密情報(.env, トークン等)は絶対に触らない
4. 作業は feature/ai-* ブランチで行う
5. 問題が発生したら即座に作業を停止
```

## 🔍 定期チェックコマンド

```bash
# 現在の状況確認
git status
git branch --show-current

# 最近の変更確認  
git log --oneline -5

# リモートとの同期確認
git fetch origin
git status
```

## 📞 トラブル時の連絡先

- **Repository**: https://github.com/tsailink0611/RepoTomo.git
- **ドキュメント**: `docs/rollback_guide.md`
- **緊急復旧**: `./scripts/emergency_restore.sh`