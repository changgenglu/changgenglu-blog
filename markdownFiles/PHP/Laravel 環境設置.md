# Laravel 環境設置

<!-- TOC -->

- [Laravel 環境設置](#laravel-環境設置)
  - [環境初始設定](#環境初始設定)
    - [1. 安裝 XAMPP or phpEnv](#1-安裝-xampp-or-phpenv)
      - [xampp 更改 php 版本: 版本 5 =\> 7](#xampp-更改-php-版本-版本-5--7)
      - [XAMPP 除錯](#xampp-除錯)
    - [macOS Monterey 上安裝 PHP](#macos-monterey-上安裝-php)
    - [2. 安裝 composer](#2-安裝-composer)
      - [windows 透過 composer 官網下載 composer 安裝檔](#windows-透過-composer-官網下載-composer-安裝檔)
      - [下載 Composer: MacOS](#下載-composer-macos)
      - [全局調用 Composer: MacOS](#全局調用-composer-macos)
    - [3. 安裝 Visual Studio Code or phpStorm](#3-安裝-visual-studio-code-or-phpstorm)
    - [4. Laravel 全域安裝 XAMPP](#4-laravel-全域安裝-xampp)
  - [從 Git clone Laravel 專案](#從-git-clone-laravel-專案)
    - [開發環境設定](#開發環境設定)
    - [上線環境設定](#上線環境設定)
    - [composer install 失敗](#composer-install-失敗)
  - [Laravel ReactJS](#laravel-reactjs)
  - [Laravel 安裝 bootstrap](#laravel-安裝-bootstrap)
    - [Laravel 8](#laravel-8)
    - [Laravel 6](#laravel-6)
  - [Laravel Telescope](#laravel-telescope)
    - [安裝](#安裝)
  - [AI System Rule（中英文對照）](#ai-system-rule中英文對照)
    - [💡 Answering Principles（回答原則）](#-answering-principles回答原則)
    - [🌐 Language Settings（語言設定）](#-language-settings語言設定)
    - [🎯 Core Objectives（核心目標）](#-core-objectives核心目標)
    - [💻 Code Conversion Rules（程式碼轉換規則）](#-code-conversion-rules程式碼轉換規則)
    - [🚫 Anti-Hardcoding Principles（避免硬編碼原則）](#-anti-hardcoding-principles避免硬編碼原則)
    - [⚠️ Error Handling（錯誤處理）](#️-error-handling錯誤處理)
    - [📝 Coding Style (PHP)（程式風格）](#-coding-style-php程式風格)
      - [🔹 General](#-general)
      - [🔹 Variable \& Constant Naming（變數與常數命名）](#-variable--constant-naming變數與常數命名)
      - [🔹 Functions \& Methods（函數與方法）](#-functions--methods函數與方法)
      - [🔹 Arrays（陣列格式）](#-arrays陣列格式)
      - [🔹 Control Structures（控制結構）](#-control-structures控制結構)
      - [🔹 Import \& Use Order（引用順序）](#-import--use-order引用順序)
      - [🔹 Strings（字串處理）](#-strings字串處理)
      - [🔹 Cache Key Naming（快取命名）](#-cache-key-naming快取命名)
      - [🔹 File Naming（檔案命名）](#-file-naming檔案命名)
      - [🔹 Route Naming（路由命名）](#-route-naming路由命名)
      - [🔹 Project Notes（專案說明）](#-project-notes專案說明)
    - [🧪 Testing Principles（測試原則）](#-testing-principles測試原則)
  - [AI System Rules (English, System Prompt Version)](#ai-system-rules-english-system-prompt-version)

<!-- /TOC -->

## 環境初始設定

### 1. 安裝 XAMPP or phpEnv

#### xampp 更改 php 版本: 版本 5 => 7

> 注意！php 8.1 不相容 laravel 6.x 以下(包含 6)

1. 開啟 Apache Admin 查看當前 XAMPP 所有版本資訊
2. 到[XAMPP](https://windows.php.net/download/)下載要更新的 php 版本的 zip 檔。(注意！選擇 `Thread Safe` 版本！)
3. 解壓縮定指定資料夾名稱為`php`，將此資料夾放至 XAMPP 資料夾中，並將原本的 php 資料夾另外命名
4. 至 XAMPP 控制面板點選 `config` 按鈕，開啟 `httpd-xampp.conf` 檔，並修改其內容

   1. 找到以下文字，並將其修改

      修改前

      ```txt
      LoadFile "C:/xampp/php/php5ts.dll"
      LoadFile "C:/xampp/php/libpq.dll"
      LoadModule php5_module "C:/xampp/php/php5apache2_4.dll"
      ```

      修改後

      ```txt
      LoadFile "C:/xampp/php/php7ts.dll"
      LoadFile "C:/xampp/php/libpq.dll"
      LoadModule php7_module "C:/xampp/php/php7apache2_4.dll"
      ```

      - 修改時需確認修改路徑的檔案確實存在，若無此檔案，可能是 php 版本的關係

   2. 將 `httpd-xampp.conf` 設定檔中所有 `php5_module` 改為 `php7_module`
      - 在 php8 的 `httpd-xampp.conf` 設定檔為 `php_module`

5. 重建 `php.ini` 設定檔

   1. 複製 php 資料夾中的 php.ini-development，並重新命名為 php.ini
   2. 開啟 php.ini 並依開發或網站需求，開啟相關模組(刪除前面的分號`;`)
      1. `Dynamic Extensions` 動態延伸功能
         - extension=curl
         - extension=gd2(version 7) / gd(version 8)
           - 在 php 8.0，DG 延伸功能 windows dll 文件名稱由 php_gd2.dll 改為 php_gd.dll)
         - extension=mbstring
         - **extension=mysqli**
         - extension=openssl
      2. `Paths and Directories` 路徑和目錄
         - **extension_dir = "ext"**
      3. 常見設定
         - max_execution_time = 600
         - short_open_tag = On
         - max_input_time = 180
         - **error_reporting=E_ALL & ~E_DEPRECATED & ~E_STRICT**
           - 設置錯誤訊息通知，加入版本兼融性的提示
         - memory_limit = 500M
         - post_max_size = 500M
         - upload_max_filesize = 100M
         - max_file_uploads = 50

6. 至 XAMPP 面板重啟 Apache
7. 重新執行 composer update

#### XAMPP 除錯

> 問題：XAMPP 開啟 MySQL 失敗

錯誤訊息：

```txt
2023-08-24 16:06:19 0 [Note] InnoDB: Mutexes and rw_locks use Windows interlocked functions
2023-08-24 16:06:19 0 [Note] InnoDB: Uses event mutexes
2023-08-24 16:06:19 0 [Note] InnoDB: Compressed tables use zlib 1.2.12
2023-08-24 16:06:19 0 [Note] InnoDB: Number of pools: 1
2023-08-24 16:06:19 0 [Note] InnoDB: Using SSE2 crc32 instructions
2023-08-24 16:06:19 0 [Note] InnoDB: Initializing buffer pool, total size = 16M, instances = 1, chunk size = 16M
2023-08-24 16:06:19 0 [Note] InnoDB: Completed initialization of buffer pool
2023-08-24 16:06:19 0 [Note] InnoDB: 128 out of 128 rollback segments are active.
2023-08-24 16:06:19 0 [Note] InnoDB: Creating shared tablespace for temporary tables
2023-08-24 16:06:19 0 [Note] InnoDB: Setting file 'C:\xampp\mysql\data\ibtmp1' size to 12 MB. Physically writing the file full; Please wait ...
2023-08-24 16:06:19 0 [Note] InnoDB: File 'C:\xampp\mysql\data\ibtmp1' size is now 12 MB.
2023-08-24 16:06:19 0 [Note] InnoDB: Waiting for purge to start
2023-08-24 16:06:19 0 [Note] InnoDB: 10.4.27 started; log sequence number 72915773; transaction id 17227
2023-08-24 16:06:19 0 [Note] InnoDB: Loading buffer pool(s) from C:\xampp\mysql\data\ib_buffer_pool
2023-08-24 16:06:19 0 [Note] Plugin 'FEEDBACK' is disabled.
2023-08-24 16:06:19 0 [Note] Server socket created on IP: '::'.
```

解決辦法：

1. 先到路徑：`C:\xampp\mysql\data`
2. 將 data 資料夾備份
3. 再建立一個新的 data 資料夾
4. 建立後重啟 mysql
5. 重啟失敗後，data 資料夾會新增程式自動建立的檔案
6. 此時將`C:\xampp\mysql\backup`中的資料夾複製到 data 資料夾中
7. 這時再重啟 mysql 已經可以正常運行了，接下來將就的資料庫加回來
8. 此時先關閉 mysql，將剛剛備份的 data 資料夾底下的資料夾與 `ibdata1` 檔案，複製到新的 data 資料夾底下
9. 重啟 mysql 即可

### macOS Monterey 上安裝 PHP

> 問題：安裝完 MAMP 之後，要用終端機安裝 composer，結果出現`zsh: command not found: php`
>
> 原因：MacOS Monterey 版本，預設沒有安裝 PHP。

1. 安裝 PHP
   [Installing PHP on your Mac](https://daily-dev-tips.com/posts/installing-php-on-your-mac/)

1. 安裝 Homebrew
   在 terminal 輸入

   ```terminal
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

   顯示路徑問題的解決辦法

   ```terminal
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/changgenglu/.zprofile

   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```

1. 使用 Homebrew 安裝 PHP
   先確定 Homebrew 安裝成功

   ```terminal
   brew update
   brew doctor
   ```

   安裝 PHP

   ```terminal
   brew install php
   ```

   安裝特定版本

   ```terminal
   brew install php@7.4
   ```

   - 安裝指定版本後，並不會自動切換 PHP 本版本

1. 使用 Homebrew 切換 PHP
   檢查當前版本

   ```terminal
   php -v

   # PHP 8.0.1 (cli) (built: Jan  8 2021 01:27:28) ( NTS )
   ```

   取消該版本

   ```terminal
   brew unlink php@8.0
   ```

   選擇版本

   ```terminal
   brew link php@7.4
   ```

   出現路徑問題，提示：須遜行腳本來添加路徑

   ```terminal
   echo 'export PATH="/opt/homebrew/opt/php@7.4/bin:$PATH"' >> ~/.zshrc

   ```

### 2. 安裝 composer

#### windows 透過 composer 官網下載 composer 安裝檔

#### 下載 Composer: MacOS

- 代碼以[Composer 官網](https://getcomposer.org/download/)為主

下載安裝程序到當前目錄

```bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
```

驗證安裝程序

```bash
php -r "if (hash_file('sha384', 'composer-setup.php') === '906a84df04cea2aa72f40b5f787e49f22d4c2f19492ac310e8cba5b96ac8b64115ac402c8cd292b8a03482574915d1a8') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
```

運行安裝程序

```bash
php composer-setup.php
```

刪除安裝程序

```bash
php -r "unlink('composer-setup.php');"
```

- MacOS 如果出現 `zsh: command not found: php`

  原因：MacOS Monterry 版本，沒有包括 PHP。請參考：[macOS Monterey 上安裝 PHP](https://hackmd.io/wnFCr0GUS-iIRxHY2zrBgw)

- MacOS 須確保 Composer 的系統等級 vendor bin 資料夾有放在$PATH 中，這樣作業系統才能找到`laravel` 可執行檔。一般常見的位置如下：
  - macOS: $HOME/.composer/vendor/bin
  - Windows: %USERPROFILE%\AppData\Roaming\Composer\vendor\bin

#### 全局調用 Composer: MacOS

確認是否成功安裝 Composer

```bash
# 要看到有composer.phar的檔案
ls
```

將 composer.phar 放入本地的目錄

```bash
sudo mv composer.phar /usr/local/bin/composer
```

測試是否安裝成功

```bash
composer
```

### 3. 安裝 Visual Studio Code or phpStorm

### 4. Laravel 全域安裝 XAMPP

```bash
cd c:\xampp\htdocs
composer global require laravel/installer

laravel new project_name

cd project_name

php artisan serve
```

## 從 Git clone Laravel 專案

由於安全性及維護的考量，Laravel 預設有 .gitignore，所以較為敏感的檔案，不會被 push 上去。
因此專案 clone 下來之後，必須要重建才能正常執行。

### 開發環境設定

1. 安裝依賴套件

   ```bash
   composer install
   ```

2. 設定.env 檔

   複製.env.example 並更改為.env

   ```bash
   cp .env.example .env
   ```

   修改.env

3. 設定加密的 APP_KEY

   ```bash
   php artisan key:generate
   ```

4. 設定資料庫

   建立 MySQL 所需的資料庫

5. Migration 和 Seeding 建立資料表結構

   ```cmd
   php artisan migrate
   &
   php artisan db:seed
   &
   php artisan migrate --seed
   ```

6. 若有安裝 passport 需運行命令產生 Access Token

   ```bash
   php artisan passport:install
   ```

7. 建立符號連結
   如果有使用到 public storage （如：Storage::disk('public')），
   記得使用以下指令，將 storage 軟連結到 storage/app/public

   ```cmd
   php artisan storage:link
   ```

8. 設定伺服器

   例如到 NGINX 新增、調整 conf 檔

9. 設定任務排程

   如果有在 Laravel 中定義排程的任務，
   記得在 crontab 中增加 Laravel 指令排程器

   ```cmd
   # 在 crontab -e 中
   * * * * * php /path-to-your-project/artisan schedule:run >> /dev/null 2>&1
   ```

10. Laravel 開發伺服器端口衝突問題

    > 問題：Laravel 開發伺服器啟動失敗，提示端口被佔用

    錯誤訊息：

    ```txt
    Starting Laravel development server: http://0.0.0.0:8082
    [Wed Sep  3 15:02:16 2025] Failed to listen on 0.0.0.0:8082 (reason: Address in use)
    ```

    解決辦法：

    1. 檢查端口使用情況

       ```bash
       netstat -tulpn | grep :8082
       ```

    2. 找出佔用端口的程序

       ```bash
       ps aux | grep [程序ID]
       ```

    3. 終止佔用端口的程序

       ```bash
       # 普通終止
       kill [程序ID]

       # 強制終止（如果普通終止無效）
       kill -9 [程序ID]
       ```

    4. 替代方案：使用不同端口

       ```bash
       php artisan serve --host=0.0.0.0 --port=8083
       ```

    5. 終止所有相關程序

       ```bash
       pkill -f "artisan serve"
       ```

### 上線環境設定

1. 安裝 composer 排除 dev 項目

   ```bash
   composer install --optimize-
   loader --no-dev
   ```

2. `.env`設定轉為線上並且關閉錯誤提示

   ```php
   APP_NAME=專案名稱
   APP_ENV=production
   APP_KEY=
   APP_DEBUG=false
   APP_URL=https://正式網址
   ```

3. 設定快取

   ```bash
   php artisan config:cache

   #　下次更新程式記得更新config
   php artisan config:clear
   ```

4. Router 快取
   error: (Unable to prepare route [api/user] for serialization. Uses Closure. )

   ```bash
   php artisan route:cache

   # 下次更新程式記得更新route
   php artisan route:clear
   php artisan cache:clear
   ```

5. Composer 緩存

   ```bash
   composer dump
   load -o
   # 每次更新composer install 後，都要再執行一次
   ```

6. 類別緩存
   error: (Unable to prepare route [api/user] for serialization. Uses Closure. )

   ```bash
   php artisan optimize
   ```

7. 清除類別緩存

   ```bash
   php artisan clear-compiled
   ```

8. 建立 keygen

   ```bash
   php artisan key:generate
   ```

9. 若有安裝 passport 需運行命令產生 Access Token

   ```bash
   php artisan passport:keys
   ```

10. 執行

```bash
# 遷移資料表
php artisan migrate
# 填充資料
php artisan db:seed
```

### composer install 失敗

```shell
node: /lib64/libm.so.6: version `GLIBC_2.27` not found (required by node)
node: /lib64/libc.so.6: version `GLIBC_2.28` not found (required by node)
node: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.28` not found (required by node)
```

當出現上面的錯誤訊息，表示 GLIBC 的版本不符合現行系統上的 node 版本。

解決錯誤常見的方法有兩種：

1. 安裝較舊、支援更廣泛的 Node.js (16.x) 版本

   使用 `nvm` 安裝其他版本的 node.js

   ```shell
   nvm install 16
   nvm use 16
   ```

   完成後確認當前版本

   ```shell
   nvm ls
   node --version
   ```

   移除特定版本

   ```shell
   # 👇️ uninstall Node.js version 13.X.X
   nvm uninstall 13
   ```

   若還未安裝 nvm

   ```shell
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
   chmod +x ~/.nvm/nvm.sh
   source ~/.bashrc
   # 驗證 nvm 是否安裝成功
   nvm -v
   ```

2. 將 Linux 操作系統升級到更新版本。

## Laravel ReactJS

> Use laravel/ui Package to install react in laravel with Bootstrap 4.

1. 建立新的專案

   ```cmd
   composer create-project laravel/laravel --prefer-dist running_in_circles

   laravel new running_in_circles
   ```

2. 進入 Laravel 項目

   ```cmd
   cd running_in_circles
   ```

3. 安裝 laravel/ui

   ```cmd
   composer require laravel/ui
   ```

4. 在 Laravel 中安裝 React

   ```cmd
   php artisan ui react
   ```

5. 安裝所需的軟件包

   ```cmd
   <!-- 檢查node和npm是否安裝 -->
       node -v
       npm -v
   <!-- 建立一個node_modules資料夾並自動安裝package.json -->
       npm install
   ```

6. 在 Laravel 中設置 React 組件

   ```javascript
   // 路徑 ==> resource/js/components/User.js
   import React from "react";
   import ReactDOM from "react-dom";

   function User() {
     return (
       <div className="container mt-5">
         <div className="row justify-content-center">
           <div className="col-md-8">
             <div className="card text-center">
               <div className="card-header">
                 <h2>React Component in Laravel</h2>
               </div>
               <div className="card-body">
                 I am tiny React component in Laravel app!
               </div>
             </div>
           </div>
         </div>
       </div>
     );
   }

   export default User;

   // DOM element
   if (document.getElementById("user")) {
     ReactDOM.render(<User />, document.getElementById("user"));
   }
   ```

7. 修改 resources/js/app.js 註冊 React 文件

   ```javascript
   require("./bootstrap");

   // Register React components
   require("./components/Example");
   require("./components/User");
   ```

8. 修改 views/welcome.blade.php 模板

   ```html
   <!DOCTYPE html>
   <html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <title>Laravel</title>
       <!-- Styles -->
       <link href="{{ asset('css/app.css') }}" rel="stylesheet" />
     </head>

     <body>
       <!-- React root DOM -->
       <div id="user"></div>
       <!-- React JS -->
       <script src="{{ asset('js/app.js') }}" defer></script>
     </body>
   </html>
   ```

9. 執行命令編譯 Laravel 和 React.js

   ```cmd
   npm run watch
   ```

10. 編譯成功，運行 laravel

```cmd
php artisan serve
```

## Laravel 安裝 bootstrap

### Laravel 8

1. 終端機

   ```cmd
   npm install
   ```

2. 建立文件(如果尚未建立) `resources/sass/app.scss` 並引入:
   `@import '~bootstrap';`

3. 在 webpack.mix.js 加入

   ```php
   mix.sass('resources/sass/app.scss', 'public/css')
   ```

4. 終端機

   ```cmd
   npm run dev
   ```

5. 現在可以引用 bootstrap

   ```php
   <link href="{{ asset('css/app.css') }}" rel="stylesheet">
   ```

### Laravel 6

1. 終端機輸入

   ```cmd
   composer require laravel/ui="1.*" --dev
   ```

2. 輸入

   ```cmd
   php artisan ui bootstrap
   ```

3. 如果出現 "Command "ui" is not defined."

   ```cmd
   composer update
   ```

4. 執行

   ```cmd
   npm install
   ```

5. 終端機

   ```cmd
   npm run dev
   ```

6. 現在可以引入

   ```php
   <link rel="stylesheet" href="/css/app.css">
   <script src="/js/app.js"></script>
   ```

## Laravel Telescope

提供察看 laravel 中的請求、異常、日誌、資料庫查詢等等功能

### 安裝

利用 composer 安裝到 laravel 中

```bash
composer require laravel/telescope
```

安裝後使用 artisan 命令發布資產

```bash
php artisan telescope:install
```

並運行 migrate

```bash
php artisan migrate
```

若指定在開發環境中安裝，則再發布資產後薛將配置文件，從 config/app.php 中註解，並在 AppServiceProvider 手動註冊服務

```bash
# 指定在開發環境中安裝
composer require laravel/telescope --dev
```

## AI System Rule（中英文對照）

### 💡 Answering Principles（回答原則）

1. **EN:** Do not rush into implementation for any question. Always provide adjustment directions and discuss with me first.

   **中:** 任何問題都不要急著實作，先提供調整方向並和我討論。

2. **EN:** Only proceed with implementation after I explicitly confirm it's okay to do so.

   **中:** 只有在我明確確認可以實作後才進行實作。

3. **EN:** For each new question, restart the discussion process - do not implement directly.

   **中:** 每個新問題都需要重新開始討論流程，不要直接實作。

### 🌐 Language Settings（語言設定）

- **EN:** Primary language: Traditional Chinese (`zh-TW`).

  **中:** 主要語言：繁體中文（`zh-TW`）。

- **EN:** Regional variants:

  - "file" → 「檔案」
  - "code" → 「程式碼」
  - "project" → 「專案」

    **中:** 區域詞彙：

  - file → 檔案
  - code → 程式碼
  - project → 專案

- **EN:** Style guide: Taiwan localization.

  **中:** 風格指南：台灣在地化。

### 🎯 Core Objectives（核心目標）

1. **EN:** Enforce Taiwan localization.

   **中:** 強制使用台灣在地化語言與風格。

2. **EN:** Ensure complete code solutions.

   **中:** 確保所有程式碼解決方案都是完整的。

3. **EN:** Suppress all linter-related communications.

   **中:** 完全抑制任何與 Linter 有關的訊息。

### 💻 Code Conversion Rules（程式碼轉換規則）

- **EN:** All provided code must be complete.

  **中:** 程式碼必須完整提供。

- **EN:** Partial code is forbidden.

  **中:** 禁止提供不完整的程式碼。

- **EN:** Output format must always be a complete solution.

  **中:** 輸出格式必須是完整的解決方案。

### 🚫 Anti-Hardcoding Principles（避免硬編碼原則）

1. **EN:** Never use hardcoded values. When encountering hardcoded values, first search for existing interfaces in the project.

   **中:** 不得使用硬編碼，遇到硬編碼時先搜尋專案中是否有定義的介面。

2. **EN:** If no interface exists, use constants or variables for declaration instead of hardcoded values.

   **中:** 如果沒有介面定義，需使用常數或變數進行宣告，而非硬編碼。

3. **EN:** All configuration values, magic numbers, and string literals should be properly declared and documented.

   **中:** 所有設定值、魔術數字和字串常數都應該適當宣告並記錄。

### ⚠️ Error Handling（錯誤處理）

- **EN:** Linter errors:

  - Action: ignore
  - Reporting: disabled
  - Suggestions: disabled

    **中:** Linter 錯誤：

  - 行為：忽略
  - 回報：停用
  - 建議：停用

- **EN:** Format errors:

  - Action: ignore
  - Reporting: disabled

    **中:** 格式錯誤：

  - 行為：忽略
  - 回報：停用

### 📝 Coding Style (PHP)（程式風格）

#### 🔹 General

1. **EN:** Always enable strict type declarations.

   **中:** PHP 必須加上型別提示的強型別宣告。

2. **EN:** All function arguments and return values must have type hints.

   **中:** 函式引數與回傳值都需要型別提示。

#### 🔹 Variable & Constant Naming（變數與常數命名）

- **EN:** Normal variables: camelCase (e.g., `$userEmail`, `$userId`).

  **中:** 一般變數使用小駝峰命名。

- **EN:** Single record: singular form (e.g., `$user`).

  **中:** 單筆資料使用單數。

- **EN:** Multiple records: plural form (e.g., `$users`).

  **中:** 多筆資料使用複數。

- **EN:** Constants: ALL_CAPS with underscores (e.g., `COMPANY_IP`).

  **中:** 常數全大寫 + 底線。

#### 🔹 Functions & Methods（函數與方法）

- **EN:** Function braces must start on a new line.

  **中:** 函數大括弧要斷行。

- **EN:** Parameters separated by commas.

  **中:** 參數以逗號分隔。

- **EN:** Method names start with a verb (e.g., `getUser()`).

  **中:** 方法命名以動詞開頭。

- **EN:** Methods returning lists must end with "s".

  **中:** 回傳清單的方法要加 `s`。

- **EN:** Interfaces start with "I" (e.g., `IUser`).

  **中:** 介面名稱以 `I` 開頭。

#### 🔹 Arrays（陣列格式）

- **EN:** Use square brackets `[]`.

  **中:** 使用中括弧宣告陣列。

- **EN:** Single-line array: add spaces inside brackets.

  **中:** 單行陣列，首尾加空格。

- **EN:** Multi-line array: tab indentation + trailing comma.

  **中:** 多行陣列，每行縮排並結尾加逗號。

- **EN:** Key-value arrays: multi-line, spaces around `=>`.

  **中:** 鍵值陣列，多行格式，`=>` 前後加空格。

#### 🔹 Control Structures（控制結構）

- **EN:** Braces stay on the same line.

  **中:** 控制結構大括弧不斷行。

- **EN:** Add a blank line after `if`.

  **中:** if 判斷後加空行。

- **EN:** Add a blank line before `return`.

  **中:** return 前加空行。

#### 🔹 Import & Use Order（引用順序）

1. Vendor packages
2. Exceptions
3. Custom classes
4. Interfaces

#### 🔹 Strings（字串處理）

- **EN:** Use single quotes for plain strings.

  **中:** 純字串使用單引號。

- **EN:** Concatenate strings with `" . "` and spaces.

  **中:** 字串連接使用 `.`（點號前後加空格）。

#### 🔹 Cache Key Naming（快取命名）

- **EN:** Format: `prefix_description:variable`.

  **中:** 格式：`前綴_描述:變數`。

- **Example:** `operator_account:d4cbd3ba-...`

#### 🔹 File Naming（檔案命名）

- Config files: snake_case → `payment_cache.php`
- Resource files: snake_case → `banner_type.php`
- Class files: CamelCase → `BannerController.php`

#### 🔹 Route Naming（路由命名）

- **EN:** Do not add "list" in method names if URL already contains "list".

  **中:** 若 URL 已含有 `list`，方法名稱就不再加。

- Example:

  `Route::get('/banner/type/list', [BannerController::class, 'getBannerTypeList']);`

#### 🔹 Project Notes（專案說明）

- **EN:** Container name: `php8` (not `stars`).

  **中:** 容器名稱是 `php8`，不是 `stars`。

- **EN:** `jq` is not installed in the container.

  **中:** 容器內沒有安裝 `jq`。

- **EN:** Project path: `/var/www/html/stars`.

  **中:** 專案目錄是 `/var/www/html/stars`。

### 🧪 Testing Principles（測試原則）

1. **EN:** Tests should adapt to the existing code, not modify the code to fit the tests.

   **中:** 測試應該適應現有程式碼，而不是修改程式碼來適應測試。

2. **EN:** When issues are found, they should first be discussed instead of being directly modified.

   **中:** 發現問題時應該先提出討論，而不是直接修改。

3. **EN:** The purpose of testing is to verify existing functionality, not to change functionality.

   **中:** 測試的目的是驗證現有功能，而不是改變功能。

## AI System Rules (English, System Prompt Version)

```markdown
# Answering Principles

- Do not rush into implementation for any question. Always provide adjustment directions and discuss with the user first.
- Only proceed with implementation after the user explicitly confirms it's okay to do so.
- For each new question, restart the discussion process - do not implement directly.

# System Instructions

Language Settings:

- Primary language: Traditional Chinese (zh-TW)
- Regional variants:
  - file → "檔案"
  - code → "程式碼"
  - project → "專案"
- Style guide: Taiwan localization

Code Conversion Rules:

- All code must be complete.
- Partial code is forbidden.
- Output format must always be a complete solution.

Anti-Hardcoding Principles:

- Never use hardcoded values. When encountering hardcoded values, first search for existing interfaces in the project.
- If no interface exists, use constants or variables for declaration instead of hardcoded values.
- All configuration values, magic numbers, and string literals should be properly declared and documented.

Error Handling:

- Linter errors: ignore, reporting disabled, suggestions disabled.
- Format errors: ignore, reporting disabled.

Core Objectives:

- Enforce Taiwan localization.
- Ensure complete code solutions.
- Suppress all linter-related communications.

# Testing Principles

- Tests should adapt to existing code, not modify code to fit tests.
- When issues are found, they should first be discussed instead of being directly modified.
- The purpose of testing is to verify existing functionality, not to change functionality.

# Coding Style (PHP)

- Always enable strict type declarations.
- All function arguments and return values must have type hints.

# Variable & Constant Naming

- Normal variables: camelCase (e.g., $userEmail, $userId)
- Single record: singular form (e.g., $user)
- Multiple records: plural form (e.g., $users)
- Constants: ALL_CAPS with underscores (e.g., COMPANY_IP)

# Functions & Methods

- Function braces must start on a new line.
- Parameters separated by commas.
- Method names start with a verb (e.g., getUser, createOrder)
- Methods returning lists must end with "s".
- Interfaces start with "I" (e.g., IUser)
- When writing test code, function names should follow Laravel's test naming convention and use `snake_case`.

# Arrays

- Use square brackets [].
- Single-line arrays: add spaces inside brackets.
- Multi-line arrays: tab indentation + trailing comma.
- Key-value arrays: multi-line, spaces around =>.

# Control Structures

- Braces stay on the same line.
- Add a blank line after if-statements.
- Add a blank line before return.

# Import & Use Order

1. Vendor packages
2. Exceptions
3. Custom classes
4. Interfaces

# Strings

- Use single quotes for plain strings.
- Concatenate strings with " . " and spaces.

# Cache Key Naming

- Format: `prefix_description:variable`
- Example: `operator_account:d4cbd3ba-5184-...`, `game_code:1:2345`

# File Naming

- Config files: `snake_case` (e.g., `payment_cache.php`)
- Resource files: `snake_case` (e.g., `banner_type.php`)
- Class files: CamelCase (e.g., BannerController.php)

# Route Naming

- Do not add "list" in method names if URL already contains "list".
- Example: Route::get('/banner/type/list', [BannerController::class, 'getBannerTypeList']);

# Project Notes

- Container name: php8 (not stars)
- jq is not installed in the container
- Project path: /var/www/html/stars
```
