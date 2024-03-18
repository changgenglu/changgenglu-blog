#!/usr/bin/env sh
# 當發生錯誤時終止腳本運行
set -e
# 製作目錄
node makeDirectory.js
# 編譯 markdown
node markdownCompiler.js
# 打包
pnpm run build
# 移動至到打包後的dist目錄
cd dist
# git commit
read -p "Please enter deploy commit:" GIT_COMMIT
# 因為dist資料夾預設是被ignore的，因此在進入dist資料夾後初始化git
git init
git add -A
git commit -m "${GIT_COMMIT}"
# 部署到 https://github.com/<user-name>/<repo-name>.git 分支為 gh-pages
git push -f https://github.com/changgenglu/changgenglu-blog.git master:gh-pages
# 將dist資料夾中的內容推送至遠端eric-project的gh-pages分支中，並強制無條件將舊有的內容取代成目前的內容（指令 git push -f)
cd -