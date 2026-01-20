# Satellite Project Agent Guidelines

> 本文件為 AI Agent 提供專案結構、開發指令與編碼規範的指引。

---

## 專案概述

**Satellite** 是基於 Laravel 9.x 的後端系統，運行於 **Podman 容器** 中 (容器名稱: `stars`)。

- **Container**: Podman (`stars`)
- **Language**: PHP 8.0+
- **Database**: MySQL/MariaDB (Connection: `satellite`)
- **Cache**: Redis (`predis/predis`)
- **Storage**: Google Cloud Storage

---

## 建置與測試指令

> **重要**: 所有 PHP 指令必須透過 `podman exec` 在容器內執行。

```sh
# 啟動開發伺服器 (前景執行，禁止背景 &)
podman exec -it stars sh -c "cd /var/www/html/satellite && php -S 0.0.0.0:8081 -t public/"

# Horizon 佇列處理 (獨立終端)
podman exec -it stars sh -c "cd /var/www/html/satellite && php artisan horizon"

# 快取清除
podman exec -it stars sh -c "cd /var/www/html/satellite && php artisan optimize:clear"

# 資料庫遷移
podman exec -it stars sh -c "cd /var/www/html/satellite && php artisan migrate"
podman exec -it stars sh -c "cd /var/www/html/satellite && php artisan migrate:status"

# Seed
podman exec -it stars sh -c "cd /var/www/html/satellite && php artisan db:seed"

# 自動載入更新
podman exec -it stars sh -c "cd /var/www/html/satellite && composer dump-autoload"
```

---

## 領域術語 (DDD Glossary)

| 英文術語 | 中文術語 | 定義 |
|:---|:---|:---|
| **Provider** | 站台 | 系統的租戶/客戶端 |
| **Platform** | 遊戲供應商 | 提供遊戲內容的供應商 (如 PG, TP) |
| **Admin** | 控端 | 最高權限管理者 |
| **Provider User** | 管端 | 站台管理者 |
| **Feature** | 菜單/功能 | 系統的功能模組與選單 |

---

## 架構規範

### Service Pattern
- 調用方式：`app('Service')::init('ServiceName')` 或靜態方法
- 事務控制：明確使用 `DB::beginTransaction()` / `commit()` / `rollback()`

### Model Conventions
- **Table Naming**: 單數形式 (`user` 非 `users`)
- **Primary Key**: 部分表使用非自增 ID
- **Soft Delete**: 普遍使用 `SoftDeletes`

### 權限控制
- 透過 `Feature` Service 控制選單顯示
- 區分 `Admin` (控端) 與 `Provider` (管端) 權限

---

## 程式碼風格

- 遵循 **PSR-12** 規範
- 變數命名：`camelCase`
- 資料庫欄位：`snake_case`
- 註解說明「為什麼」而非「做什麼」

### SOLID 原則
- **SRP**: Service 專注於單一業務領域
- **DIP**: 透過依賴注入或 Service Container 獲取實例

---

## 操作安全

### 敏感資訊
讀取 `.env` 時，自動遮蔽含有 `_PASSWORD`, `_SECRET`, `_KEY`, `_TOKEN` 的值。

### 破壞性操作
執行前必須確認：
- `migrate:fresh` / `migrate:reset`
- 刪除資料庫或大量檔案
- 修改 `config/` 核心配置

---

## 錯誤排查

1. 檢查 `storage/logs/laravel.log`
2. 確認 `storage/` 與 `bootstrap/cache/` 權限
3. 驗證 `.env` 配置 (參考 `.env.example`)
4. 執行 `composer dump-autoload`

---

## 回應規範

- **語言**: 繁體中文
- **語調**: 專業、簡潔、技術導向
- 需要啟動服務時，指示用戶「請開啟新終端執行」

---

## 相關文件

See @.gemini/GEMINI.md for additional context.
