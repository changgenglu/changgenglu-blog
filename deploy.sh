# !/usr/bin/env sh
GITHUB_URL="https://github.com/changgenglu/changgenglu-blog.git"
# 當發生錯誤時終止腳本運行
set -e
# 清理舊打包檔
rm -rf dist
# 製作目錄
node makeDirectory.js
# 編譯 markdown
node markdownCompiler.js
# 打包
npm run build
# 移動至到打包後的dist目錄
cd dist
# 因為dist資料夾預設是被ignore的，因此在進入dist資料夾後初始化git
git init
git add -A
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"
# 部署到 https://github.com/<user-name>/<repo-name>.git 分支為 gh-pages
# 若遠端分支存在 gh-pages，先刪除並重新建立分支
git fetch --prune origin
git branch -D gh-pages
# 將dist資料夾中的內容推送至遠端eric-project的gh-pages分支中，並強制無條件將舊有的內容取代成目前的內容（指令 git push -f)
git push -f $GITHUB_URL main:gh-pages
# 判斷是否部署成功
if [ $? -eq 0 ]; then
  echo "部署成功！"
else
  echo "部署失敗。請檢查錯誤信息。"
  exit 1
fi
cd -