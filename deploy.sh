# !/usr/bin/env sh
GITHUB_URL="https://github.com/changgenglu/changgenglu-blog.git"
# 當發生錯誤時終止腳本運行
set -e
# 執行測試
npm run test
# 製作目錄
node makeDirectory.js
# 編譯 markdown
node markdownCompiler.js
# 打包
npm run build
# 移動至到打包後的 dist 目錄
cd dist
# dist 資料夾預設是 ignore 的，因此在進入 dist 資料夾後初始化 git
git init
git add -A
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"
# 將 dist 資料夾中的當前分支 (HEAD)，強制推送至 remote 的 gh-pages 分支中，取代原始內容
git push -f $GITHUB_URL HEAD:gh-pages
# 判斷是否部署成功
if [ $? -eq 0 ]; then
  clear
  echo "部署成功！"
else
  echo "部署失敗。請檢查錯誤信息。"
  exit 1
fi
cd -