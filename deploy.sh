# !/usr/bin/env sh
GITHUB_URL="https://github.com/changgenglu/changgenglu-blog.git"

# 當發生錯誤時終止腳本運行
set -e

echo "🚀 開始部署流程..."

# 1. 執行測試
echo "🧪 執行測試..."
pnpm test

# 2. 製作目錄索引
echo "📂 生成文章索引..."
node makeDirectory.js

# 3. 打包建置
echo "📦 開始打包 (Build)..."
pnpm run build

# 4. 部署至 GitHub Pages
echo "🚀 推送至 GitHub Pages..."
# 移動至到打包後的 dist 目錄
cd dist

# dist 資料夾預設是 ignore 的，因此在進入 dist 資料夾後初始化 git
git init
git add -A
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"

# 將 dist 資料夾中的當前分支 (HEAD)，強制推送至 remote 的 gh-pages 分支中，取代原始內容
git push -f $GITHUB_URL HEAD:gh-pages

cd -

echo "✅ 部署成功！"