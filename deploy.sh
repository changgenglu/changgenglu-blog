# !/usr/bin/env sh
GITHUB_URL="https://github.com/changgenglu/changgenglu-blog.git"

# 當發生錯誤時終止腳本運行
set -e

# 0. 部署前檢查：build 會把工作目錄的內容打包，未提交的內容不應被發布
if [ -n "$(git status --porcelain --untracked-files=no)" ] \
  || [ -n "$(git ls-files --others --exclude-standard -- public/markdownFiles prompt_engineering)" ]; then
  echo "❌ 工作目錄有尚未提交的變更（含 public/markdownFiles、prompt_engineering 下的新檔案）。"
  echo "   請先 git commit 後再執行部署。"
  git status --short --untracked-files=no
  git ls-files --others --exclude-standard -- public/markdownFiles prompt_engineering
  exit 1
fi

echo "🚀 開始部署流程..."

# 1. 執行測試
echo "🧪 執行測試..."
pnpm test

# 2. 打包建置（prebuild 會先執行 makeDirectory.js 生成文章索引）
echo "📦 開始打包 (Build)..."
pnpm run build

# 3. 部署至 GitHub Pages
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