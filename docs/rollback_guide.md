# 🔄 RepoTomo ロールバック手順書

## 緊急時の復旧方法

### 🚨 状況別対応方法

## 1. コードが動かなくなった場合

### レベル1: 直前のコミットに戻す
```bash
# 最新のコミットを確認
git log --oneline -5

# 直前のコミットに戻す（作業中の変更は保持）
git reset --soft HEAD~1

# または、作業中の変更も含めて完全に戻す
git reset --hard HEAD~1
```

### レベル2: 特定のコミットに戻す
```bash
# コミット履歴を確認
git log --oneline --graph

# 特定のコミットに戻す（コミットIDを指定）
git reset --hard <コミットID>

# 例: git reset --hard a9fab8d
```

### レベル3: 安全なブランチに切り替え
```bash
# 現在の変更を一時保存
git stash save "緊急避難_$(date +%Y%m%d_%H%M%S)"

# 安全なブランチに切り替え
git checkout main

# または開発ブランチに切り替え
git checkout develop
```

## 2. ファイルが壊れた場合

### 特定のファイルを復元
```bash
# 特定のファイルを最新コミットから復元
git checkout HEAD -- ファイル名

# 例: メインコードを復元
git checkout HEAD -- コード/main.gs
```

### 全体を復元
```bash
# 作業ディレクトリ全体を最新コミット状態に戻す
git reset --hard HEAD
```

## 3. GitHubから完全復元

### クローンし直し
```bash
# 新しいフォルダに移動
cd ~/Desktop

# GitHubから最新版をクローン
git clone https://github.com/tsailink0611/RepoTomo.git RepoTomo_復旧版

# 復旧版に移動
cd RepoTomo_復旧版
```

## 4. バックアップから復元

### 自動バックアップを使用
```bash
# バックアップ一覧を確認
ls -la backups/

# 最新のバックアップから復元
cp -r backups/backup_YYYYMMDD_HHMMSS/files/* .

# Git状態も復元
git checkout <元のブランチ名>
```

## 5. AIエージェント開発時の安全手順

### 開発前の準備
```bash
# 1. バックアップ作成
./scripts/backup.sh

# 2. 新しいブランチで作業
git checkout -b feature/ai-dev-$(date +%Y%m%d)

# 3. 頻繁にコミット
git add .
git commit -m "AIエージェント作業中: 中間セーブ"
```

### 問題発生時の対応
```bash
# 1. 即座に作業を停止
# 2. 現在の状況を保存
git stash save "問題発生時の状況"

# 3. 安全なブランチに避難
git checkout main

# 4. 問題を調査・修正
# 5. 修正後に作業再開
```

## 6. 緊急連絡先

- **GitHub Repository**: https://github.com/tsailink0611/RepoTomo.git
- **バックアップ場所**: `backups/` フォルダ
- **安全なブランチ**: `main`（本番用）、`develop`（開発用）

## 7. 予防策

### 定期的な実行コマンド
```bash
# 毎日実行（開発開始前）
./scripts/backup.sh

# 重要な変更前
git tag v$(date +%Y%m%d) -m "作業開始前のタグ"

# 作業終了時
git push origin --all --tags
```

### ⚠️ 重要な注意事項
1. **`main`ブランチは常に動作する状態を保つ**
2. **実験的な変更は必ず別ブランチで**
3. **AIエージェントには機密情報を含むファイルにアクセスさせない**
4. **1日の作業終了時は必ずバックアップ**

## 8. よくある問題と解決法

### Q: プッシュできない
```bash
# 解決法1: 強制プッシュ（注意して使用）
git push --force-with-lease origin ブランチ名

# 解決法2: マージ
git pull origin main
git push origin ブランチ名
```

### Q: マージコンフリクト
```bash
# 手動で解決後
git add .
git commit -m "コンフリクト解決"
```

### Q: .gitignoreが効かない
```bash
# キャッシュをクリア
git rm -r --cached .
git add .
git commit -m ".gitignore適用"
```

---

**🆘 このガイドを使っても解決しない場合**
1. GitHubの Issues で質問
2. バックアップから全体復旧
3. 最悪の場合は新規クローンして手動マージ