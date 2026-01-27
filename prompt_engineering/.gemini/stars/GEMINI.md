# Project Context: Stars Laravel 遊戲平台管理系統

## Tech Stack

| 項目 | 說明 |
|------|------|
| **Framework** | Laravel 9.x |
| **Container** | `stars` (Alpine Linux) |
| **Shell** | `/bin/sh` (非 bash) |
| **專案路徑** | `/var/www/html/stars` (容器內) |
| **主要端口** | 8082 (應用端口) |
| **資料庫** | MySQL (多資料庫架構) |
| **快取** | Redis |
| **佇列** | Horizon |

### 多資料庫連接
- `management` - 主資料庫
- `report` - 報表資料庫
- `record` - 記錄資料庫
- `platform_1` - 平台1資料庫
- `platform_2` - 平台2資料庫

## 🚀 Development Commands

### 容器操作
```bash
# 進入容器
podman exec -it stars sh

# 檢查容器狀態
podman ps --format "{{.Names}}" | grep "^stars$"

# 容器資源使用情況
podman stats stars --no-stream
```

### Laravel 開發服務
```bash
# 啟動開發服務 (在 Cursor IDE 新終端執行)
podman exec -it stars sh -c "cd /var/www/html/stars && php -S 0.0.0.0:8082 -t public/"

# 啟動 Horizon 佇列 (另一個新終端)
podman exec -it stars sh -c "cd /var/www/html/stars && php artisan horizon"

# 重啟開發環境 (砍掉重開)
podman exec stars pkill -f "php.*-S.*8082|artisan.*serve|artisan.*horizon" 2>/dev/null || true
```

### 快取管理
```bash
podman exec stars sh -c "cd /var/www/html/stars && php artisan optimize:clear"
podman exec stars sh -c "cd /var/www/html/stars && php artisan cache:clear"
podman exec stars sh -c "cd /var/www/html/stars && php artisan config:clear"
podman exec stars sh -c "cd /var/www/html/stars && php artisan route:clear"
```

### 資料庫操作
```bash
podman exec stars sh -c "cd /var/www/html/stars && php artisan migrate"
podman exec stars sh -c "cd /var/www/html/stars && php artisan migrate:status"
podman exec stars sh -c "cd /var/www/html/stars && php artisan migrate --database=report"
```

### 佇列管理
```bash
podman exec stars sh -c "cd /var/www/html/stars && php artisan queue:work"
podman exec stars sh -c "cd /var/www/html/stars && php artisan queue:restart"
podman exec stars sh -c "cd /var/www/html/stars && php artisan queue:failed"
podman exec stars sh -c "cd /var/www/html/stars && php artisan horizon:status"
```

### 程式碼品質
```bash
# Laravel Pint 或 PHP-CS-Fixer
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

## 📜 Coding Guidelines

### Alpine Linux 適配
- **Shell**: 使用 `/bin/sh` 而非 `/bin/bash`
- **套件管理**: `apk add <package>` 而非 `apt`/`yum`
- **命令執行**: `podman exec stars sh -c "command"`

### Laravel 開發特性
- **熱重載**: 開發模式支援自動重新載入
- **多資料庫**: 支援 management, report, record, platform_1, platform_2
- **佇列系統**: Horizon 管理背景任務
- **快取系統**: Redis 多層級快取
- **API路由**: 豐富的 RESTful API 端點

### IDE 整合 (Cursor)
開啟新終端的方式：
- **快捷鍵**: `Ctrl + Shift + `` (反引號)
- **選單**: Terminal → New Terminal
- **Windows Terminal**: `wt -w 0 nt powershell -Command "..."`

## 🔍 Status Check

### 智能狀態檢查
```bash
podman exec stars sh -c "
    cd /var/www/html/stars &&
    echo '=== Stars Laravel 專案狀態檢查 ===' &&

    # 檢查 Laravel 開發服務
    if ps aux | grep -E 'php.*-S.*8082|php.*artisan.*serve' | grep -v grep >/dev/null; then
        echo '✅ Laravel 開發服務運行中'
    else
        echo '❌ Laravel 開發服務未運行'
    fi

    # 檢查 Horizon 佇列服務
    if ps aux | grep -E 'artisan.*horizon|horizon:work' | grep -v grep >/dev/null; then
        echo '✅ Horizon 佇列服務運行中'
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

### 網路檢查
```bash
podman exec stars sh -c "
    if command -v netstat >/dev/null 2>&1; then
        netstat -tlnp 2>/dev/null | grep -E ':8082|:3306|:6379'
    elif command -v ss >/dev/null 2>&1; then
        ss -tlnp 2>/dev/null | grep -E ':8082|:3306|:6379'
    else
        echo '安裝網路工具: apk add net-tools'
    fi
"
```

### 多資料庫連接測試
```bash
podman exec stars sh -c "
    cd /var/www/html/stars &&
    echo '測試資料庫連接:' &&
    php artisan tinker --execute=\"
        try { DB::connection('management')->getPdo(); echo 'Stars DB: ✅'; } catch(Exception \\\$e) { echo 'Stars DB: ❌'; }
        try { DB::connection('report')->getPdo(); echo 'Report DB: ✅'; } catch(Exception \\\$e) { echo 'Report DB: ❌'; }
        try { DB::connection('record')->getPdo(); echo 'Record DB: ✅'; } catch(Exception \\\$e) { echo 'Record DB: ❌'; }
        try { DB::connection('platform_1')->getPdo(); echo 'Platform1 DB: ✅'; } catch(Exception \\\$e) { echo 'Platform1 DB: ❌'; }
        try { DB::connection('platform_2')->getPdo(); echo 'Platform2 DB: ✅'; } catch(Exception \\\$e) { echo 'Platform2 DB: ❌'; }
    \"
"
```

## 📂 Documentation

首次使用時，請執行以下命令讀取專案文檔：

```bash
# 讀取 README
podman exec stars sh -c "
    cd /var/www/html/stars &&
    find . -maxdepth 2 -name 'README*' -o -name 'readme*' | head -1 | xargs cat 2>/dev/null
"

# 讀取 composer.json 了解專案資訊
podman exec stars sh -c "
    cd /var/www/html/stars &&
    if [ -f composer.json ]; then
        cat composer.json | jq '.name, .description, .require | keys[0:10]' 2>/dev/null ||
        grep -E '\"name\"|\"description\"|\"php\"|\"laravel\"' composer.json | head -10
    fi
"

# 掃描文檔資料夾
podman exec stars sh -c "
    cd /var/www/html/stars &&
    if [ -d docs ] || [ -d DOCS ]; then
        find docs/ DOCS/ -name '*.md' 2>/dev/null | head -10 | while read file; do
            echo \"=== \$file ===\" && cat \"\$file\" && echo
        done
    fi
"
```

## 專案記憶 (Project Memory)

> 此區塊記錄專案特定資訊與潛在問題，由 Gemini 在互動過程中累積。

