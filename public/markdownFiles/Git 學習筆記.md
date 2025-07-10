# Git 學習筆記

<!-- TOC -->

- [Git 學習筆記](#git-學習筆記)
  - [常用指令](#常用指令)
    - [Git 常用指令](#git-常用指令)
  - [Git Flow 開發流程觀念](#git-flow-開發流程觀念)
    - [分支介紹](#分支介紹)
      - [長期分支](#長期分支)
      - [Topic 任務分支](#topic-任務分支)
    - [Git Commit 規範](#git-commit-規範)
      - [Commit Message 格式](#commit-message-格式)
      - [標題](#標題)
      - [正文](#正文)
      - [Footer](#footer)
      - [commit 模板](#commit-模板)
  - [Git 本地操作情境](#git-本地操作情境)
    - [將 git 預設的編輯器改為 vim](#將-git-預設的編輯器改為-vim)
    - [取消 commit：git reset](#取消-commitgit-reset)
    - [git commit 打錯字](#git-commit-打錯字)
    - [將未完成的工作暫存：git stash](#將未完成的工作暫存git-stash)
    - [解決合併衝突](#解決合併衝突)
    - [Git 別名](#git-別名)
      - [設定 git reset --hard 的 alias](#設定-git-reset---hard-的-alias)
      - [.gitconfig 檔案的使用注意事項](#gitconfig-檔案的使用注意事項)
    - [Git rebase](#git-rebase)
      - [修改歷史訊息](#修改歷史訊息)
      - [取消 merge 清除合併紀錄](#取消-merge-清除合併紀錄)
    - [ORIG\_HEAD](#orig_head)
  - [git 遠端操作](#git-遠端操作)
    - [更改 git remote 位置](#更改-git-remote-位置)
    - [在 git server 建立新儲存庫](#在-git-server-建立新儲存庫)
    - [將本地專案新增至遠端儲存庫](#將本地專案新增至遠端儲存庫)
    - [轉移資料庫：git mirror](#轉移資料庫git-mirror)
    - [git push fail](#git-push-fail)
      - [暫存空間不足](#暫存空間不足)
      - [欲提交的分支受保護](#欲提交的分支受保護)
      - [遠端儲存庫板本和本地不一樣](#遠端儲存庫板本和本地不一樣)
  - [開發流程實例](#開發流程實例)
    - [從首功能分支繼續開發後續分支](#從首功能分支繼續開發後續分支)
      - [解決方案](#解決方案)
        - [從目前的分支建立新分支繼續開發](#從目前的分支建立新分支繼續開發)
        - [基於目前的功能分支開發，等完成後再重構](#基於目前的功能分支開發等完成後再重構)
  - [Git 管理](#git-管理)
    - [使用 VSCode 管理 Git](#使用-vscode-管理-git)
  - [GitHub 操作](#github-操作)
    - [將本地專案上傳到 github](#將本地專案上傳到-github)
    - [Https 設定 Token](#https-設定-token)
    - [設定 SSH](#設定-ssh)
    - [部署靜態頁面到 github](#部署靜態頁面到-github)

<!-- /TOC -->

## 常用指令

### Git 常用指令

- `git init` 將目前的目錄初始化為 Git 目錄, 建立本地儲存庫
- `git config` 設定或檢視 Git 設定檔資訊
- `git add` 將檔案加入 Git 暫存區
- `git rm` 將檔案移出 Git 暫存區
- `git status` 顯示 Git 狀態
- `git commit` 將暫存區的檔案提交至儲存庫納入版本控制
- `git log` 顯示過去歷次的版本異動
- `git reflog` 顯示完整的版本異動歷史紀錄
- `git show` 顯示指定版本的異動內容
- `git branch` 建立一個新分支 (branch)
- `git checkout` 取出分支內容還原為工作目錄
- `git merge` 合併分支
- `git reset` 重設某一版本
- `git clone` 從遠端儲存庫 (GitHub 或 Bitbucket) 複製副本至本地儲存庫
- `git push` 將本地儲存庫內容推送到遠端儲存庫
- `git pull` 將遠端儲存庫拉回合併更新到本地儲存庫

## Git Flow 開發流程觀念

> [參考資料：Git Flow 是什麼？為什麼需要這種東西？](https://gitbook.tw/chapters/gitflow/why-need-git-flow)
>
> [參考資料：Git flow 分支策略](https://git-tutorial.readthedocs.io/zh/latest/branchingmodel.html)

### 分支介紹

#### 長期分支

- **main**(原為 master, 於 2020/10 變更)
  主要為穩定，上線的版本。不該允許開發者直接 commit 到此分支。
  一般在專案初期，環境建置好就會拉 develop 分支出去，以維持 main 獨立性。
- **develop**
  所有開發分支的基礎，當新增/修改功能時，會從此分支切出去，完成後再合併回來。

#### Topic 任務分支

- **feature**

  開發新功能時，會從 develop 切出 feature 分支，其命名方式採`feature/功能名稱`。只要新功能未完成，功 能分支就會持續存在，直到開發完成並合併回開發分支，或直到放棄此新功能。

  此分支通常只會存在於該功能的開發者的本機端 repository，不會出現在遠端的庫中。

  - 原則：
    - 從 develop 分支分離
    - 合併回 develop 分支
    - 分支命名原則：除了 master, develop, release-\*, hotfix 之外的功能名稱都可以

  詳細步驟：

  1. 開新功能分支

     ```bash
     # 從 develop 分支開一個命為 new-feature 的分支
     $ git checkout -b feature/new-feature develop
     ```

  2. 將已開發完成之功能合併回 develop 分支

     ```bash
     # 切換至開發分支
     $ git checkout develop

     # 將 new-feature 分支合併到開發分支
     $ git merge --no-ff feature/new-feature

     # 刪除 new-feature 分支
     $ git branch -d feature/new-feature

     # 將開發分支push到遠端的origin
     $ git push origin develop
     ```

  `--no-ff` 可保存 feature 上面的歷史資訊，讓開發者可以更瞭解開發的來龍去脈(No Fast Forward)。

- **release**

  由 develop 切出來，正式上線前的最終測試分支，通過後會將 release 合併到 main 以及 develop 確保在 release 時修正的一些問題能同步到 main 與 develop。

  制訂版本號碼的最佳時機是在發布分支時。

  - 原則
    - 從 develop 分離
    - 合併回 develop 與 main 分支
    - 分支命名規則：release-\*(版本號)

  詳細步驟：

  1. 開發佈分支

     ```bash
     # 從開發分支開一支名為「release-1.2」的分支，開完後切換到release-1.2分支。
     $ git checkout -b release-1.2 develop
     ```

  2. 制訂版本號

     ```bash
     # commit 一個版本，commmit 訊息為「版本跳躍至1.2]
     $ git commit -a -m "Bump version number to 1.2"
     ```

  3. 將已制訂好的 metadata 或已修復錯誤的發佈分支，合併到主分支

     ```bash
     # 切換至主要分支
     $ git checkout master

     # 將release-1.2分支合併到主要分支
     $ git merge --no-ff release-1.2

     # 上tag
     $ git tag -a 1.2
     ```

  4. 將已制訂好 metadata 或已修復錯誤的發佈分支，合併回開發分支

     ```bash
     # 切換至開發分支
     $ git checkout develop

     # 將release-1.2分支合併回開發分支
     $ git merge --no-ff release-1.2
     ```

  5. 刪除 release-1.2 分支

     ```bash
     # 刪除分支
     $ git branch -d release-1.2
     ```

- **hotfix**

  上線版本需緊急修復時，由 main 直接切出的 hotfix 分支，修復完成也會合併至 main 分支。

  由於 develop 在開發中，若從 develop 切 hotfix 分支，再合併至 main 分支時可能會出現更嚴重的問題。

  當 bug 修復後，可合併到開發分支，或是合併回主分支，並標上另一版本號的 tag。

  - 原則：
    - 從主分支分離
    - 合併回開發分支或主分支
    - 分支命名規則為：hotfix-\*

  詳細步驟：

  1. 開修復分支

     ```bash
     # 從主要分支開一支名為「hotfix-1.2.1」的分支，開完後切換到hotfix-1.2.1分支。
     $ git checkout -b hotfix-1.2.1 master
     ```

  2. 制訂版本號

     ```bash
     # commit 一個版本，commit 訊息為「版本號跳躍至1.2.1」
     $ git commit -a -m "Bumped version number to 1.2.1"
     ```

  3. 修正 bug 並 commit 一版

     ```bash
     # commit 修正版
     $ git commit -m "Fixed severe production problem"
     ```

  4. 將修好的分支合併回主分支

     ```bash
     # 切換至主要分支
     $ git checkout master

     # 將hotfix-1.2.1分支合併到主要分支
     $ git merge --no-ff hotfix-1.2.1

     # 上tag
     $ git tag -a 1.2.1
     ```

  5. 將修好的分支合併回 develop 分支

     ```bash
     # 切換至開發分支
     $ git checkout develop

     # 將hotfix-1.2.1分支合併回開發分支
     $ git merge --no-ff hotfix-1.2.1
     ```

     **特別注意** 若修復分支與發佈分支同時存在，則當 bug 修正後，就不是合併回開發分支而是發佈分支。修 補程式就會在從未來發布分支合併回開發分支時，一併將 bug 修補完。

  6. 刪除 hotfix 分支

     ```bash
     # 刪除分支
     $ git branch -d hotfix-1.2.1
     ```

### Git Commit 規範

> [Git Commit Message 這樣寫會更好，替專案引入規範與範例](https://ithelp.ithome.com.tw/articles/10228738)

#### Commit Message 格式

```bash

# 標題: <type>(<scope>): <subject>
# - type: feat, fix, docs, style, refactor, test, chore
# - scope: 如果修改範圍為全局修改或難以分配給單個組件，可略
# - subject: 以動詞開頭的簡短描述
#
# 正文: 內文需包含:
# * 程式碼更訂的原因(問題、原因、需求)
# * 調整項目
# * 與先前行為的對比
#
# 結尾:
# - 任務編號(如果有)
# - 重大變化(紀錄不兼容的更動)，
#   以 BREAKING CHANGE: 開頭，後面是對變動的描述、以及變動原因和遷移方法。
#
```

#### 標題

- Type 類型
  - **feat** - 新增/修改功能 (Feature)
  - **fix** - 修正 Bug (bug fix)
  - **docs** - 修改內容/新增文件 (documentation)
  - **style** - 修改程式碼格式或風格，不影響原有運作，包含修改縮排、新增縮排...等等
  - **refactor** - 重構程式碼，不屬於 bug 修正，也不屬於新功能
  - **perf** - 改善效能 (A code change that improves performance)
  - **test** - 增加/修改測試功能 (when adding missing tests)
  - **chore** - 增加或修改第三方套件(輔助工具)等 (maintain)
  - **revert** - 撤銷回覆先前的 commit 例如：revert: type(scope): subject (回覆版本：xxxx)。
  - **build** - 改變打包流程
- scope 範圍
  - 任何可以劃分程式碼改變的範圍，例如：page, router, compile, component...等等。
- subject 主題
  - 對程式碼修改做簡單描述

#### 正文

描述測次程式碼變更的動機，並說出這個提交與改變前的對比。

1. 為什麼這個提交是必要的？
2. 他如何解決問題？
3. 這個提交會對專案產生什麼副作用？
   - 可以有效辨認次提交是做了太多改變。若有一兩個副作用尚可接受，但若五、六個以上，則表示改變幅度太大。

#### Footer

結尾通常會有兩種：

1. 標註 Breaking Changes 應以單詞 BREAKING CHANGE 開頭：用空格或兩個換行符。後面是對變動的描述和變動的理由。

```bash
BREAKING CHANGE: isolate scope bindings definition has changed.

    To migrate the code follow the example below:

    Before:

    scope: {
      myAttr: 'attribute',
    }

    After:

    scope: {
      myAttr: '@',
    }

    "The removed `inject` wasn't generally useful for directives so there should be no code using it."
```

如果當前 commit 還原了先前的 commit，則應以 revert：開頭，後跟還原的 commit 的 header。在 body 中必須寫成：This reverts commit \<hash>。其中 hash 是要還原的 commit 的 SHA 標識。

```bash
revert: feat(pencil): add 'delete' option

This reverts commit 667ecc1654a317a13331b17617d973392f415f02.
```

#### commit 模板

在~/.gitconfig 新增

```config
[commit]
template = ~/.gitmessage
```

新建 ~/.gitmessage

```vim

# 標題: <type>(<scope>): <subject>
# - type: feat, fix, docs, style, refactor, test, chore
# - scope: 如果修改範圍為全局修改或難以分配給單個組件，可略
# - subject: 以動詞開頭的簡短描述
#
# 正文: 內文需包含:
# * 程式碼更訂的原因(問題、原因、需求)
# * 調整項目
# * 與先前行為的對比
#
# 結尾:
# - 任務編號(如果有)
# - 重大變化(紀錄不兼容的更動)，
#   以 BREAKING CHANGE: 開頭，後面是對變動的描述、以及變動原因和遷移方法。
#
```

## Git 本地操作情境

### 將 git 預設的編輯器改為 vim

```bash
git config --global core.editor "vim"
```

### 取消 commit：git reset

Git 的 `reset`指令，比較像是「前往」或是「變成」，並不會真的重新設定。

`reset`後的東西都還可以撿的回來。

- 確認 git 紀錄

  ```bash
  git log --oneline
  af75a42 (HEAD -> develop) 0327
  1baa403 (origin/develop) no message
  13fd2dc 0223
  a640c49 0222新增
  e09ecae init commit
  ```

- 利用相對位置取消 commit

  ```bash
  git reset af75a42^
  ```

  `^`符號表示「前一次」的意思，`af75a42^`是指`af75a42`這個 commit 的「前一次」，`af75a42^^`則是往前 兩次，以此類推。

  如果要倒退五次可以寫成`af75a42~5`。

  另外`HEAD`和`develop`也都指向`af75a42`這個 commit，所以也可以寫成

  ```bash
  git reset develop^
  &
  git reset HEAD^
  ```

- 利用絕對位置取消 commit

  ```bash
  git reset 1baa403
  ```

  他會切會到`1baa403`這個 commit，剛好是`af75a42`的前一個 commit，和取消最後一次 commit 的效果一 樣。

### git commit 打錯字

```bash
git commit --amend
```

編輯最後一個提交的 commit

### 將未完成的工作暫存：git stash

工作做到一半，需要切換到別的分支進行其他任務。
先看一下目前的狀態：

```bash
git status
On branch feature/admin_controller
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   app/Http/Controllers/RegionController.php
        modified:   app/Models/Room.php
        modified:   app/Models/User.php

no changes added to commit (use "git add" and/or "git commit -a")
```

- 將現階段工作暫存

  目前正在修改 `app/Http/Controllers/RegionController.php` `app/Models/Room.php` `app/Models/   User.php`，使用 `git stash` 把他們存起來。

  ```bash
  git stash
  Saved working directory and index state WIP on feature/admin_controller: c745ccb style    (MemberController): 修改response的資料與取消註解
  ```

  > **注意**
  >
  > Untracked 狀態的檔案無法被 stash，需要額外使用 `-u` 參數

  看一下目前的狀態

  ```bash
  git status
  On branch cat
  nothing to commit, working tree clean
  ```

  `git stash list` 可以查看暫存檔案

  ```bash
  git stash list
  stash@{0}: WIP on cat: b174a5a add cat 2
  ```

- 取出暫存

  當任務完成，要把剛剛暫存的東西拿回來

  ```bash
  git stash pop stash@{0}
  On branch feature/add_new_api_route
  Changes not staged for commit:
    (use "git add <file>..." to update what will be committed)
    (use "git restore <file>..." to discard changes in working directory)
          modified:   app/Http/Controllers/RegionController.php
          modified:   app/Models/Room.php
          modified:   app/Models/User.php

  no changes added to commit (use "git add" and/or "git commit -a")
  Dropped stash@{0} (8810ecbe89e1c1412c0c47d7fb7ded9f3e29aa53)
  ```

  使用 `pop` 指令，可以將某個 `stash` 拿出來並套到目前的分支上。套用成功之後，套用過的 `stash` 就會 被刪除。
  如果沒有指定 `pop` 哪一個 `stash`，將會從編號小的也就是 `stash@{0}` 開始使用，也就是最後存進來的。

  要刪除 `stash` 可以用 `drop` 指令

  ```bash
  git stash drop stash@{0}
  Dropped stash@{0} (87390c02bbfc8cf7a38fb42f6f3a357e51ce6cd1)
  ```

  如果要把 `stash` 撿回來，但不想刪除，可以使用 `apply`

  ```bash
  git stash apply stash@{0}
  ```

- 主要指令

  - git stash 將當前分支的修改內容加入暫存
  - git stash -u 將 untracked 檔案加入暫存
  - git stash save -u "" 將 untracked 檔案加入暫存並撰寫註解
  - git stash push 將修改內容加入暫存(完整指令)
  - git stash push -m 將修改內容加入暫存，並加入註解
  - git stash list 瀏覽所有暫存項目
  - git stash pop 將最新暫存套用至當前分支，成功後刪除暫存
  - git stash pop stash@{1} 將指定暫存套用至當前分支，成功後刪除暫存
  - git stash apply 套用最新暫存，成功後保留暫存
  - git stash apply stash@{1} 套用指定暫存，成功後保留暫存
  - git stash drop 清除最新暫存
  - git stash drop stash@{1} 清除指定暫存
  - git stash clear 清除全部暫存

### 解決合併衝突

當在不同分支中，修改同一檔案的不同行，此時合併不會發生問題。
倘若修改的是同一行，就會發生合併衝突。

```bash
git merge feature/create_device_model
Auto-merging app-src/app/Http/Controllers/UserController.php
CONFLICT (content): Merge conflict in app-src/app/Http/Controllers/UserController.php
Auto-merging app-src/app/Models/Room.php
Auto-merging app-src/app/Models/User.php
CONFLICT (content): Merge conflict in app-src/app/Models/User.php
Automatic merge failed; fix conflicts and then commit the result.
```

有出現 CONFLICT (content)提示的檔案，為發生合併衝突的檔案。
此時在檔案中，Git 會將衝突位置標示出來。

```php
<<<<<<< HEAD
當前內容。
=======
要合併的目標分支上歧異的內容。
>>>>>>> feature/i_am_old_branch
```

修正衝突點後，將修改的檔案暫存，最後進行提交。

```bash
git add --all
git commit
```

### Git 別名

修改 `~/.gitconfig`

```vim
[alias]
st = status
ptlg = log --color --graph --pretty=format:'%C(yellow)%h%Creset %C(bold brightred)%d%Creset %C()%s%Creset \n %C(blue italic dim)-- %an%Creset %C(green italic dim)(%cr)%Creset'
# 若出現錯誤訊息：
#   error: 無效的顏色值：bold brightred
#   fatal: 不能解析 --pretty 格式
# 則修改為下面指令
ptlg = log --color --graph --pretty=format:'%C(yellow)%h%Creset %C(bold red)%d%Creset %C(reset)%s%Creset \n %C(blue italic dim)-- %an%Creset %C(green italic dim)(%cr)%Creset'
adal = add --all
```

#### 設定 git reset --hard 的 alias

將本地分支更新到和遠端分支的節點，經常會使用 `git reset --hard` 指令。可以透過以下方式設定 alias：

**方法 1：基本的 Git alias**

```bash
git config --global alias.reset-to 'reset --hard'
```

使用方式：
```bash
git reset-to origin/master
git reset-to origin/develop
```

**方法 2：帶有默認值的進階 alias**

```bash
git config --global alias.reset-to '!f(){ git reset --hard ${1:-origin/master}; }; f'
```

使用方式：
```bash
git reset-to                    # 默認重置到 origin/master
git reset-to origin/develop     # 指定分支
```

**方法 3：更短的 alias 名稱**

```bash
git config --global alias.rh 'reset --hard'
```

使用方式：
```bash
git rh origin/master
git rh origin/develop
```

**方法 4：Shell alias（在 ~/.zshrc 或 ~/.bashrc 中）**

```bash
alias greset='git reset --hard'
alias grh='git reset --hard'
```

**方法 5：更進階的 Shell function**

在您的 `~/.zshrc` 檔案中加入：

```bash
# Git reset to remote branch
greset() {
    local branch=${1:-origin/master}
    git reset --hard $branch
}
```

#### .gitconfig 檔案的使用注意事項

**重要：**.gitconfig 檔案修改後無需使用 `source` 指令

`.gitconfig` 是 Git 的配置檔案，使用 INI 格式，不是 Shell 腳本檔案。修改後 Git 會自動讀取新的配置。

**錯誤示例：**
```bash
source .gitconfig  # ❌ 錯誤：會出現 "no matches found: [core]" 錯誤
```

**正確做法：**
```bash
# 直接修改 .gitconfig 檔案後，無需額外操作
# 可以用以下指令驗證配置是否正確載入：

# 查看所有配置
git config --list

# 查看特定的 alias
git config --get-regexp alias

# 測試 alias 是否有效
git config --get alias.reset-to
```

### Git rebase

從字面上來看 rebase 可以理解為：重新定義分支的參考基準

使用 rebase 指令等於是修改歷史，他會使分支移動到不同的 commit 重新定義基準點。

#### 修改歷史訊息

1. 進入互動模式

   ```shell
   git rebase -i 1de2076
   ```

   `-i` 進入互動模式

   `1de2076` 此次互動的應用範圍為，從現在到`1de2076`這個 commit

2. 編輯訊息

   此時會跳出 Vim 編輯器

   ```shell
   pick 382a2a5 add database settings
   pick cd82f29 add cat 1
   pick 1de2076 add cat 2

   # Rebase bb0c9c2..27f6ed6 onto bb0c9c2 (6 commands)
   #
   # Commands:
   # p, pick = use commit
   # r, reword = use commit, but edit the commit message
   # e, edit = use commit, but stop for amending
   # s, squash = use commit, but meld into previous commit
   # f, fixup = like "squash", but discard this commit's log message
   # x, exec = run command (the rest of the line) using shell
   # d, drop = remove commit
   #
   # These lines can be re-ordered; they are executed from top to bottom.
   #
   # If you remove a line here THAT COMMIT WILL BE LOST.
   #
   # However, if you remove everything, the rebase will be aborted.
   #
   # Note that empty commits are commented out
   ```

   此順序和 git log 的順序相反

   - 將要編輯的 commit 修改前面的指令

     - `p, pick` 使用提交，不進行修改
     - `r, reword` 使用提交，但編輯提交訊息
     - `e, edit` 使用提交，但停止修改
     - `s, squash` 使用提交，但合併到先前的提交中
     - `f, fixup` 就像“squash”，但丟棄此提交的日誌訊息
     - `x, exec` 使用 shell 執行指令（該行的其餘部分）
     - `d, drop` 刪除提交

   若要修改`1de2076`的提交內容錯字，則將 `pick 1de2076 add cat 2`修改成 `r 1de2076 add cat 2`。

   存檔並離開後，就會再跳出另一個 vim 編輯器，此為欲修改的 commit 內容。

#### 取消 merge 清除合併紀錄

> [Git 實戰技巧 - 取消合併](https://blog.darkthread.net/blog/git-undo-merge/)

當 feature 與 develop 分支的合併位置有誤，想要拆掉重做

```bash
    ~/project > git log --oneline
    db7915e (HEAD -> dev, feature/mqtt_test) feat: 測試mqtt連線
    b65d2d2 (tag: release_v2.0.0, origin/dev) no message
    0a198be refactor: 優化firmware前端頁面
    539942f (origin/master, origin/HEAD, master) Merge branch 'feature/fix_firmware_download' into dev
    1a4515a fix: 修復firmware下載問題
    d1e204f docs: 修改上線環境設定
```

1. `git rebase -i` ：重整目標 commit 之後的 commit：重整清單中不會有下指令的 commit 而是顯示其後所有的 commit。

   ```bash
      git rebase -i 0a198be
   ```

   輸入指令之後會進入編輯器

   ```vim
      pick db7915e feat: 測試mqtt連線
      pick b65d2d2 no message

      # Rebase 539942f..879c462 onto 539942f (3 commands)
      #
      # Commands:
      # p, pick <commit> = use commit
      # r, reword <commit> = use commit, but edit the commit message
      # e, edit <commit> = use commit, but stop for amending
      # s, squash <commit> = use commit, but meld into previous commit
      # f, fixup [-C | -c] <commit> = like "squash" but keep only the previous
      #                    commit's log message, unless -C is used, in which case
      #                    keep only this commit's message; -c is same as -C but
      #                    opens the editor
   ```

2. 將要取消的 commit 改為 drop

   ```vim
      drip db7915e feat: 測試mqtt連線
      pick b65d2d2 no message
   ```

   ```bash
      b65d2d2 (HEAD -> dev, tag: release_v2.0.0, origin/dev) no message
      0a198be refactor: 優化firmware前端頁面
      539942f (origin/master, origin/HEAD, master) Merge branch 'feature/fix_firmware_download' into dev
      1a4515a fix: 修復firmware下載問題
   ```

### ORIG_HEAD

.git 目錄中除了有 HEAD 檔案外，還有一個叫做 ORIG_HEAD 的檔案。這個檔案會記錄「危險操作」之前 HEAD 的位置。舉凡 merge, rebase, reset，這些可能會造成歷史紀錄變動的行為，都會被紀錄在 ORIG_HEAD 中，讓你隨時可以調回危險動作之前的狀態。

回到危險操作之前的位置：

```bash
git reset ORIG_HEAD --hard
```

### Git 檔案忽略設定指南

#### 問題背景

在團隊開發中，有時候需要讓某些檔案：
- 保持在遠端 repository 中（其他人可以修改）
- 但本地的修改不會被追蹤或同步到遠端
- 切換分支時本地修改不會丟失
- 不影響其他團隊成員的工作

#### 常見的錯誤方案：使用 .gitignore

##### 為什麼 .gitignore 不適合

```bash
# 錯誤的做法
echo "Backend.php" >> .gitignore
echo ".env" >> .gitignore
```

**問題：**
- `.gitignore` 是用來忽略**未被追蹤**的檔案
- 如果檔案已經在 repository 中，`.gitignore` 不會生效
- 需要使用 `git rm --cached` 移除追蹤，但這會影響其他人
- `.gitignore` 本身會被提交，影響整個團隊

#### 正確的解決方案：使用 skip-worktree

##### 什麼是 skip-worktree

`skip-worktree` 是 Git 的一個功能，用於標記某些檔案：
- 檔案仍然在 repository 中
- 本地修改不會被 Git 追蹤
- 其他人可以正常修改和推送這些檔案

##### 操作步驟

**1. 設定 skip-worktree**

```bash
# 對指定檔案設定 skip-worktree
git update-index --skip-worktree app/Services/Backend.php
git update-index --skip-worktree .env
```

**2. 檢查設定**

```bash
# 查看所有檔案的狀態，S 開頭的表示 skip-worktree
git ls-files -v

# 只查看被 skip-worktree 的檔案
git ls-files -v | grep ^S

# 只查看被 assume-unchanged 的檔案（類似功能）
git ls-files -v | grep ^h
```

**3. 取消設定（如果需要）**

```bash
# 取消 skip-worktree 設定
git update-index --no-skip-worktree app/Services/Backend.php
git update-index --no-skip-worktree .env
```

##### 檔案狀態標記說明

- **H** - 正常追蹤的檔案
- **S** - skip-worktree 的檔案
- **h** - assume-unchanged 的檔案

#### 設定存儲位置

##### 主要存儲位置

**`.git/index` 檔案** - Git 的索引檔案（二進位檔案）
- 儲存檔案的狀態和元資料
- 記錄 skip-worktree 和 assume-unchanged 的標記
- 包含暫存區的內容

##### 特性

1. **本地設定** - 只存在於你的本地 repository 中
2. **不會被推送** - 其他人不會看到你的 skip-worktree 設定
3. **不會被拉取** - 其他人的設定不會影響你
4. **Binary 檔案** - 無法直接編輯

#### 管理和注意事項

##### 日常管理

```bash
# 查看目前所有被忽略的檔案
git ls-files -v | grep ^S

# 暫時恢復追蹤（用於推送重要更新）
git update-index --no-skip-worktree 檔案名稱
# 進行修改和提交
git add 檔案名稱
git commit -m "更新重要檔案"
git push
# 重新設定忽略
git update-index --skip-worktree 檔案名稱
```

##### 處理衝突

當其他人修改了被 skip-worktree 的檔案時：

```bash
# 1. 遇到衝突時，先取消 skip-worktree
git update-index --no-skip-worktree 檔案名稱

# 2. 拉取最新變更
git pull

# 3. 解決衝突（如果有）
# 編輯檔案，解決衝突

# 4. 提交解決方案（如果有衝突）
git add 檔案名稱
git commit -m "解決衝突"

# 5. 重新設定 skip-worktree
git update-index --skip-worktree 檔案名稱
```

##### 重要限制

1. **Clone 時會重置** - 重新 clone repository 時，所有 skip-worktree 設定都會消失
2. **無法備份** - 這些設定無法透過 Git 本身備份或同步
3. **本地環境特有** - 每個開發者都需要在自己的環境中重新設定

#### 團隊協作建議

##### 建立 Setup 腳本

```bash
#!/bin/bash
# setup-local-ignore.sh

echo "設定本地檔案忽略..."
git update-index --skip-worktree app/Services/Backend.php
git update-index --skip-worktree .env

echo "已設定以下檔案為 skip-worktree："
git ls-files -v | grep ^S
```

##### 文件化

在專案的 README.md 中說明：

```markdown
## 本地開發設定

某些檔案需要設定為 skip-worktree 以避免本地修改被推送：

```bash
git update-index --skip-worktree app/Services/Backend.php
git update-index --skip-worktree .env
```

或執行 setup 腳本：
```bash
./setup-local-ignore.sh
```
```

#### 替代方案比較

| 方案 | 適用場景 | 優點 | 缺點 |
|------|----------|------|------|
| `.gitignore` | 未被追蹤的檔案 | 團隊共享、簡單 | 不適用於已追蹤的檔案 |
| `skip-worktree` | 已追蹤但不想同步本地修改 | 不影響其他人、保持檔案在 repo 中 | 需要每個人單獨設定 |
| `assume-unchanged` | 性能優化用途 | 類似 skip-worktree | 主要用於性能，不是為了忽略修改 |

#### 最佳實踐

1. **明確區分用途** - 使用 `.gitignore` 處理未追蹤檔案，使用 `skip-worktree` 處理已追蹤但不想同步的檔案
2. **團隊溝通** - 在 README 中明確說明哪些檔案需要設定 skip-worktree
3. **建立腳本** - 為新團隊成員提供自動設定腳本
4. **定期檢查** - 定期檢查 `git ls-files -v | grep ^S` 確認設定正確
5. **衝突處理** - 建立標準流程處理 skip-worktree 檔案的衝突

---

#### 總結

對於需要「檔案存在於遠端但不想追蹤本地修改」的需求，`git update-index --skip-worktree` 是最佳解決方案。它能夠：

- ✅ 保持檔案在 repository 中
- ✅ 不追蹤本地修改
- ✅ 不影響其他團隊成員
- ✅ 切換分支時保持本地修改
- ✅ 允許其他人推送修改

記住，這是一個本地設定，需要每個開發者在自己的環境中配置。

## git 遠端操作

### 更改 git remote 位置

當修改 git repo 的名稱或是路徑時，若要在本機進行 push 或是 pull 的指令時，會出現：remote: This repository moved. Please use the new location [new location]

- 解決辦法：重新設定 remote url

  ```bash
  git remote set-url origin https://XXX.git
  ```

  檢查 remote url 是否修改成功

  ```bash
  git remote -v
  ```

### 在 git server 建立新儲存庫

> 主機架設 ssh server
>
> 主機安裝好 git

1. 在要建立遠端 repository 的資料夾底下，新增專案資料夾 `<project-name>.git`
2. 切換到新建的資要夾底下，初始化遠端倉庫

   ```shell
    git init --bare
   ```

3. 確認資料夾中以建立的檔案

   ```shell
   $ ls
   HEAD  config  description  hooks/  info/  objects/  refs/
   ```

4. 提交本地專案或將本地專案的遠端指向此 repository

### 將本地專案新增至遠端儲存庫

```bash
git init

git add .

git commit -m "First commit"
```

添加遠端儲存庫的路徑

```bash
## git remote add origin "remote repository URL"
git remote add origin //fishbone/研發部/軟體區/GitServer/V5/*.git
```

將遠端儲存庫初始化

```bash
## git init --bare "remote repository URL"
git init --bare //fishbone/研發部/韌體區/GitServer/V5/*.git
```

將本地儲存庫內容推送到遠端

```bash
git push --set-upstream origin main
```

### 轉移資料庫：git mirror

可以轉移整個 repository 的資訊，包括 branch, tags

將 repo clone --mirror 到本地

```bash
git clone --mirror gitolite@git.lab317.org:dinos80152/Authentication
```

接著在 github 建立新的 repository

進到專案資料夾，設定新的遠端 git repo 位置

```bash
cd your_project.git/
git remote set-url --push origin https://github.com/your_name/your_project.git
```

local 更新 remote branch ,最後將整包 push 上去

```bash
git push --mirror
```

或者一個指令直接指向遠端 repo

```bash
git push --mirror https://github.com/your_name/your_project.git
```

### git push fail

> 錯誤訊息：
>
> error: RPC 失敗。HTTP 400 curl 22 The requested URL returned error: 400
>
> send-pack: unexpected disconnect while reading sideband packet

當 push 到遠端儲存庫時，錯誤通常會在上傳的途中，被伺服器端切斷連線。因此很難判斷錯誤發生原因。
造成錯誤的可能原因如下：

#### 暫存空間不足

git 有兩種通訊協定，ssh 和 http。若是使用 HTTP 協定，其底層基於 TCP 可能會因為暫存不足導致連接已經關閉，但仍有未處理完的資料。

1. 察看 git config

```shell
  git config -l
  # http.postBuffer => 緩衝區大小
```

2. 加大緩衝區

```shell
  # 524288000 為 500MB，此緩衝值大小需斟酌設定。
  # http.postbuffer=260000000
  git config --global http.postBuffer 524288000

  # 察看是否設定成功
  git config -l | grep postbuffer
```

#### 欲提交的分支受保護

> 錯誤訊息：
>
> Push rejected
>
> Push master to changgenglu/master was rejected by remote

提交權限不足，需由管理員授權或另外拉 dev 分支後再合併到 master

#### 遠端儲存庫板本和本地不一樣

將遠端同步到本地：

```git
git pull --rebase origin master
```

## 開發流程實例

### 從首功能分支繼續開發後續分支

一專案需開發較大的新功能，此功能預計會開多個分支。在第一個功能分支完成後送 code review 後，需立即著手進行後續功能開發。而後續功能會接續前面的功能進行開發。
但若從 master 開新功能分支，便需要重寫與前面功能共用的程式碼。

#### 解決方案

##### 從目前的分支建立新分支繼續開發

1. 在目前的功能分支（正在 code review 的分支）上建立新分支。
2. 在此新分支上接續開發新功能。
3. 待前面分支完成 code review 且合併回 qa 分支後，將 qa 的變更合併回這個新分支，確保最新程式碼同步。

- 優點：
  - 可以立即接續開發，不用等到前面的功能合併入 master。
  - 減少重複開發或複製程式碼的風險
- 缺點：
  - 需注意版本同步與合併衝突。

操作範例：

```bash
# 確認目前所在分支為正在進行 code review 的分支
git branch
# 建立新分支
git switch -c feature-new-branch
# 接續開發新功能
# 當舊分支完成 code review 且合併入 qa 分支，此時需同步更新 qa 的變更到新分支中
# 更新本地 qa 分支
git remote update
git switch qa
git reset --hard origin/qa
# 切換到新分支
git switch feature-new-branch
git merge qa
# 解決可能的衝突後，提交合併結果
# 最後完成開發新功能後，提交新功能
git push feature-new-branch
```

##### 基於目前的功能分支開發，等完成後再重構

1. 在新的分支中基於目前功能分支開發新功能。
2. 等到前面的功能合併到 qa 或 master 再進行重構和程式碼整理。

- 優點：
  - 快速啟動新功能開發
- 缺點：
  - 臨時重複的程式碼，可能增加短期技術債，但若控制得宜，則影響不大。

## Git 管理

### 使用 VSCode 管理 Git

> [Visual Studio Code 無需輸入 Git 指令，透過界面按鈕就可輕鬆管理 Github 中的專案檔案](https://www.minwt.com/webdesign-dev/22926.html)

## GitHub 操作

### 將本地專案上傳到 github

1. git init
2. git add .
3. git commit -m "init commit"
4. git remote add origin `https://github.com/<username>/<repo>.git`
5. git push -u origin master

### Https 設定 Token

- 問題：

  當使用推送，輸入 github 密碼會出現錯誤。

  ```bash
  changgenglu@masenyuandeMacBook-Air ~ % git push -u origin master
  remote: Support for password authentication was removed on August 13, 2021. Please use a  personal access token instead.
  remote: Please see https://github.blog/ 2020-12-15-token-authentication-requirements-for-git-operations/ for more information.
  fatal: unable to access 'https://github.com/changgenglu/your_project.git/': The requested   URL returned error: 403
  ```

  大致意思是，密碼驗證於 2021 年 8 月 13 日不再支援，也就是今天不能再用密碼方式去提交程式碼。請用使 用 **personal access token** 替代。

- 解決方法：設定 personal access token

  - 開啟 GitHub.com -> Setting -> Developer settings -> Personal access tokens
  - 按下`Generate new token`
  - Note 欄位填入 token 的備註
  - Expiration 設定 token 的時效
  - Select scopes 設定權限（基本全部開啟）
  - 按下`Generate token`
  - 複製 token 代碼

  再次使用終端機推送

  ```bash
  git push -u origin master
  ```

  輸入 github 密碼的地方，貼上 token 代碼

### 設定 SSH

1. 輸入指令產生 SHH

```bash
ssh-keygen
```

產生

```bash
$ Enter file in which to save the key (/Users/changgenglu/.ssh/id_rsa):
# 這行只是確定存在哪
$ Overwrite (y/n)?
# 如果原本就有金鑰會跳出此問題，覆蓋嗎？ (是)
$ Enter passphrase (empty for no passphrase):
$ Enter same passphrase again:
# 輸入密碼，再次確認輸入密碼
```

此處的輸入密碼為使用至個金鑰的密碼，可以選擇不輸入。

2. 產生 SSH 連線所需的公鑰內容

```bash
cat ~/.ssh/id_rsa.pub
```

輸出實例

```bash
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDFp+A3qe4qm1Dkw66LN/  vNGlufX5iC9VERfuUiXHNM5L3hQuz6wO8WuzFv+zDIHRPGUl616oLXTHTqommuO0GZavDo+lbUIRkSBM9j/9tr  +hlF4LPTT4ggjOgzLCHTrSyzcmcdykgBfnDgX3aYfZbhCEcWdERUxWFNnDf +YYlNd8L6LMKSIce61nhqiSLNbugDCrE0IH+/1hoS3LNoag9V05Qwo5yZ6srLNJT8uISoqvJv5BwSpBL9ImnePx  +LzDiVXlJMisKf1GSXdVuWmVWlKrZOsadk4ZkSNH2cL1wgkNvAUbydWKG9Ag4TfI/khKwUXyhT  +7V4jWsJusDXZxafylZma4qeOsaLAN4ScSStnOoSm1CxeNqmPsQpAGbtvx49yB2 +c4HFsa68VzcwV1oejhh2E67iqqKK53IFN/  qQmYYfhUukY6rgLLHlLkmjLqdVpVcULCP0mMzn4xacFWLwDgOtZK1i97vWaLPyG6hYQQ108zK9i/Cg13p0Z+CUTCs=  changgenglu@masenyuandeMacBook-Air.local
```

3. 上傳公鑰

到 Github > Settings > SSH and GPG keys 的設定頁面，選擇 New SSH Key。

### 部署靜態頁面到 github

> 參考資料：
>
> [[Vue] 將 Vue 專案部署至 Github Pages](https://dean34520.medium.com/vue%E7%B3%BB%E5%88%97%E6%96%87-%E5%B0%87vue%E6%AA%94%E6%A1%88%E9%83%A8%E7%BD%B2%E8%87%B3github-334951cadede)

1. 建立與本地專案相同名稱的 repository
2. 在專案資料夾中新增 vue.config.js，設定 publishPath

   ```javascript
   //vue.config.js
   module.exports = {
     publicPath: process.env.NODE_ENV === "production" ? "/eric-project/" : "/",
   };
   ```

3. 將本地專案推送至雲端
4. 在專案目錄下新增 deploy.sh 自動化腳本

   ```sh
    #!/usr/bin/env sh
    # 當發生錯誤時終止腳本運行
    set -e
    # 打包
    npm run build
    # 移動至到打包後的dist目錄
    cd dist
    # 因為dist資料夾預設是被ignore的，因此在進入dist資料夾後初始化git
    git init
    git add -A
    git commit -m 'deploy'
    # 部署到 https://github.com/<user-name>/<repo-name>.git 分支為 gh-pages
    git push -f https://github.com/<user-name>/<repo-name>.git master:gh-pages
    # 將dist資料夾中的內容推送至遠端eric-project的gh-pages分支中，並強制無條件將舊有的內容取代成目前的內容（指令 git push -f)
    cd -
   ```

   github 在部署時只允許三種來源：

   1. master
   2. gh-pages
   3. master/docs

5. 執行腳本

   ```shell
   sh ./deploy.sh
   ```

   完成後，此時 github 上的 gh-pages 分支會和 vue 專案中的 /dist 資料夾內一樣

6. 進入 setting 頁面的 pages，將 Source 改為 gh-pages
7. 待部署完成，頁面上方會出現專案頁面的連結
