# Stars Laravel 專案上下文（Strategy）

> 此文件定義專案目標、方法論和領域上下文

## 專案架構

- **專案類型**: Laravel 9.x 遊戲平台管理系統
- **容器名稱**: `stars`
- **容器系統**: Alpine Linux
- **Shell**: `/bin/sh` (不是 bash)
- **專案路徑**: `/var/www/html/stars` (容器內)
- **開發命令**: `php -S 0.0.0.0:8082 -t public/`
- **端口配置**: 讀取 `/var/www/html/stars/.env` 檔案
- **主要端口**: 8082 (應用端口)
- **佇列端口**: 監聽 Horizon 配置
- **文檔位置**: 檢查 `/var/www/html/stars/README*` 和 `/var/www/html/stars/docs/`

## 自動文檔讀取規則

當用戶首次提到 Stars 專案時，自動執行：

### 1. 讀取專案 README

```bash
podman exec stars sh -c "
    cd /var/www/html/stars &&
    find . -maxdepth 2 -name 'README*' -o -name 'readme*' | head -1 | xargs cat 2>/dev/null
"
```

### 2. 掃描 DOCS 資料夾內容

```bash
podman exec stars sh -c "
    cd /var/www/html/stars &&
    if [ -d docs ] || [ -d DOCS ]; then
        find docs/ DOCS/ -name '*.md' 2>/dev/null | head -10 | while read file; do
            echo '=== $file ===' && cat \"$file\" && echo
        done
    fi
"
```

### 3. 讀取 composer.json 了解技術棧

```bash
podman exec stars sh -c "
    cd /var/www/html/stars &&
    if [ -f composer.json ]; then
        echo '專案資訊:' &&
        cat composer.json | jq '.name, .description, .require | keys[0:10]' 2>/dev/null ||
        grep -E '\"name\"|\"description\"|\"php\"|\"laravel\"' composer.json | head -10
    fi
"
```

### 4. 讀取環境配置

```bash
podman exec stars sh -c "
    cd /var/www/html/stars &&
    if [ -f .env ]; then
        echo '=== 環境配置 ===' &&
        grep -E '^[A-Z_]+=.*' .env 2>/dev/null | grep -v '_PASSWORD\|_TOKEN\|_SECRET\|_KEY' | head -15
    fi
"
```

## 核心操作系統

### 智能狀態檢查

```bash
podman exec stars sh -c "
    cd /var/www/html/stars &&
    echo '=== Stars Laravel 專案狀態檢查 ===' &&

    # 檢查容器狀態
    echo '容器狀態: 運行中' &&

    # 檢查 Laravel 開發服務
    if ps aux | grep -E 'php.*-S.*8082|php.*artisan.*serve' | grep -v grep >/dev/null; then
        echo '✅ Laravel 開發服務運行中'
        PHP_PID=\$(ps aux | grep -E 'php.*-S.*8082|php.*artisan.*serve' | grep -v grep | awk '{print \$2}' | head -1)
        PHP_TIME=\$(ps aux | grep -E 'php.*-S.*8082|php.*artisan.*serve' | grep -v grep | awk '{print \$10}' | head -1)
        echo \"   進程 ID: \$PHP_PID (運行時間: \$PHP_TIME)\"
    else
        echo '❌ Laravel 開發服務未運行'
    fi

    # 檢查 Horizon 佇列服務
    if ps aux | grep -E 'artisan.*horizon|horizon:work' | grep -v grep >/dev/null; then
        echo '✅ Horizon 佇列服務運行中'
        HORIZON_PID=\$(ps aux | grep -E 'artisan.*horizon|horizon:work' | grep -v grep | awk '{print \$2}' | head -1)
        echo \"   進程 ID: \$HORIZON_PID\"
    else
        echo '❌ Horizon 佇列服務未運行'
    fi

    # 檢查資料庫連接
    if php artisan tinker --execute=\"DB::connection()->getPdo(); echo 'DB Connected';\" 2>/dev/null | grep -q 'DB Connected'; then
        echo '✅ 資料庫連接正常'
    else
        echo '❌ 資料庫連接失敗'
    fi

    # 檢查 Redis 連接
    if php artisan tinker --execute=\"Redis::ping(); echo 'Redis Connected';\" 2>/dev/null | grep -q 'Redis Connected'; then
        echo '✅ Redis 連接正常'
    else
        echo '❌ Redis 連接失敗'
    fi
"
```

### 開發環境管理

#### 直接重啟邏輯 (砍掉重開)

```bash
echo "重啟 Stars Laravel 開發環境..."
podman exec stars pkill -f "php.*-S.*8082|artisan.*serve|artisan.*horizon" 2>/dev/null || true
sleep 2
echo "✅ 舊進程已清理，準備在新終端分頁啟動開發服務"
```

#### Cursor IDE 新終端啟動方式

**方法 1: Cursor IDE 手動開新終端 (推薦)**

1. 在 Cursor IDE 中按 `Ctrl + Shift + ` (反引號) 開新終端
2. 或從選單 Terminal → New Terminal
3. 在新終端中執行：`podman exec -it stars sh -c 'cd /var/www/html/stars && php -S 0.0.0.0:8082 -t public/'`

**方法 2: Windows Terminal (如果有安裝)**

```bash
wt -w 0 nt powershell -Command "podman exec -it stars sh -c 'cd /var/www/html/stars && php -S 0.0.0.0:8082 -t public/'"
```

### 程式碼品質檢查

```bash
podman exec -it stars sh -c "
    cd /var/www/html/stars &&
    if [ -f './vendor/bin/pint' ]; then
        ./vendor/bin/pint
    elif [ -f './vendor/bin/php-cs-fixer' ]; then
        ./vendor/bin/php-cs-fixer fix
    else
        echo '無可用的程式碼格式化工具'
        echo '建議安裝: composer require laravel/pint --dev'
    fi
"
```

## 智能互動規則

### 關鍵詞觸發邏輯

| 觸發詞 | 執行動作 |
|--------|----------|
| `專案是什麼`、`專案用途`、`專案介紹`、`讀取文檔` | 自動執行文檔讀取命令，解析並總結專案 |
| `檢查狀態`、`專案狀態`、`dev status`、`服務狀態` | 執行智能狀態檢查，顯示容器/進程/端口狀態 |
| `啟動開發`、`重啟開發`、`start dev`、`restart` | 直接砍掉重開，指引用戶開新終端啟動服務 |
| `啟動佇列`、`horizon`、`queue`、`背景任務` | 指引在新終端啟動 Horizon |
| `查看日誌`、`logs`、`日誌輸出` | 說明日誌位置和查看方式 |
| `資料庫遷移`、`migrate`、`DB連接` | 檢查多資料庫連接狀態，提供遷移命令 |
| `清除快取`、`cache clear`、`Redis快取` | 執行 Laravel 快取清除命令 |
| `程式碼檢查`、`code style`、`格式化`、`pint` | 執行程式碼格式化 |
| `進入容器`、`container shell`、`進入專案` | 執行容器 shell 進入命令 |

## Laravel 開發特性

### 技術棧配置

- **熱重載**: 開發模式支援自動重新載入
- **多資料庫**: 支援 stars, report, entry, platform_1, platform_2
- **佇列系統**: Horizon 管理背景任務
- **快取系統**: Redis 多層級快取
- **API路由**: 豐富的 RESTful API 端點

### 技術棧配置檢查

```bash
podman exec stars sh -c "
    cd /var/www/html/stars &&
    echo '=== Laravel 資訊 ===' &&
    php artisan --version &&
    echo && echo '=== 可用命令 ===' &&
    php artisan list | grep -E 'migrate|cache|queue|horizon' | head -10 &&
    echo && echo '=== 環境變數 ===' &&
    grep -E '^[A-Z_]+=.*' .env 2>/dev/null | grep -v '_PASSWORD\|_TOKEN\|_SECRET\|_KEY' | head -8
"
```

## 快速指令參考

### 常用開發指令

```bash
# 狀態檢查
podman exec stars ps aux | grep -E "php.*-S|artisan|horizon"

# 直接重啟開發環境 (砍掉重開)
podman exec stars pkill -f "php.*-S.*8082|artisan.*serve|artisan.*horizon" 2>/dev/null || true

# Laravel 快取清除
podman exec -it stars sh -c "cd /var/www/html/stars && php artisan optimize:clear"

# 資料庫遷移檢查
podman exec -it stars sh -c "cd /var/www/html/stars && php artisan migrate:status"

# 佇列狀態檢查
podman exec -it stars sh -c "cd /var/www/html/stars && php artisan horizon:status"

# 進入容器
podman exec -it stars sh

# 檢查容器狀態
podman ps --format "{{.Names}}" | grep "^stars$"
```

### Cursor IDE 新終端啟動開發服務

```bash
# 在 Cursor IDE 新終端中執行 (手動)
podman exec -it stars sh -c "cd /var/www/html/stars && php -S 0.0.0.0:8082 -t public/"

# 佇列處理 (另一個新終端)
podman exec -it stars sh -c "cd /var/www/html/stars && php artisan horizon"

# 開新終端的方式:
# 快捷鍵: Ctrl + Shift + `
# 選單: Terminal → New Terminal
```

### Laravel Artisan 命令

```bash
# 快取管理
podman exec stars sh -c "cd /var/www/html/stars && php artisan cache:clear"
podman exec stars sh -c "cd /var/www/html/stars && php artisan config:clear"
podman exec stars sh -c "cd /var/www/html/stars && php artisan route:clear"

# 資料庫操作
podman exec stars sh -c "cd /var/www/html/stars && php artisan migrate"
podman exec stars sh -c "cd /var/www/html/stars && php artisan migrate:status"
podman exec stars sh -c "cd /var/www/html/stars && php artisan migrate --database=report"

# 佇列管理
podman exec stars sh -c "cd /var/www/html/stars && php artisan queue:work"
podman exec stars sh -c "cd /var/www/html/stars && php artisan queue:restart"
podman exec stars sh -c "cd /var/www/html/stars && php artisan queue:failed"
```

### 多資料庫連接測試

```bash
podman exec stars sh -c "
    cd /var/www/html/stars &&
    echo '測試資料庫連接:' &&
    php artisan tinker --execute=\"
        try { DB::connection('stars')->getPdo(); echo 'Stars DB: ✅'; } catch(Exception \\\$e) { echo 'Stars DB: ❌'; }
        try { DB::connection('report')->getPdo(); echo 'Report DB: ✅'; } catch(Exception \\\$e) { echo 'Report DB: ❌'; }
        try { DB::connection('entry')->getPdo(); echo 'Entry DB: ✅'; } catch(Exception \\\$e) { echo 'Entry DB: ❌'; }
        try { DB::connection('platform_1')->getPdo(); echo 'Platform1 DB: ✅'; } catch(Exception \\\$e) { echo 'Platform1 DB: ❌'; }
        try { DB::connection('platform_2')->getPdo(); echo 'Platform2 DB: ✅'; } catch(Exception \\\$e) { echo 'Platform2 DB: ❌'; }
    \"
"
```

---

**核心原則**: 基於用戶需求直接執行，提供清楚的 Cursor IDE 新終端啟動指引，專注於 Laravel 開發工作流程
