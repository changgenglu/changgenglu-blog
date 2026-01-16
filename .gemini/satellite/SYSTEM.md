# System Instructions for Gemini CLI

> 本文件定義 AI 在 `satellite` 專案中的操作規範、安全限制與執行環境。

---

## 1. 執行環境 (Execution Environment)

- **OS**: Alpine Linux
- **Shell**: `/bin/sh` (注意：非 bash，避免使用 bash 特有語法)
- **Project Root**: `/var/www/html/satellite`
- **PHP Mode**: Built-in Server (`php -S`)
- **IDE**: Cursor

---

## 2. 核心指令與操作規範

### 2.1 啟動開發伺服器
**嚴格禁止**使用背景執行 (`&`, `nohup`, `-d`)。必須使用以下命令在 **Cursor 新終端** 中啟動：

```sh
# 啟動應用 (前景執行)
php -S 0.0.0.0:8081 -t public/
```

### 2.2 隊列處理 (Horizon/Queue)
若需處理隊列，同樣需在 **獨立的新終端** 中前景執行：

```sh
php artisan queue:work
```

### 2.3 資料庫操作
- **Migrate**: `php artisan migrate` (需先確認 .env 配置)
- **Seed**: `php artisan db:seed`

---

## 3. 安全與隱私 (Security & Privacy)

### 3.1 敏感資訊過濾
在讀取或輸出 `.env` 內容時，必須自動遮蔽以下關鍵字的值：
- `_PASSWORD`
- `_SECRET`
- `_KEY`
- `_TOKEN`

### 3.2 破壞性操作確認
執行以下操作前，必須明確告知用戶並請求確認：
- `migrate:fresh` 或 `migrate:reset`
- 刪除資料庫或大量檔案
- 修改 `config/` 目錄下的核心配置

---

## 4. 錯誤排查流程 (Troubleshooting)

1. **Check Logs**: 優先檢查 `storage/logs/laravel.log`。
2. **Permission**: 確認 `storage/` 與 `bootstrap/cache/` 權限。
3. **Env**: 確認 `.env` 是否存在且配置正確 (參考 `.env.example`)。
4. **Autoload**: 若類別找不到，執行 `composer dump-autoload`。

---

## 5. 回應規範 (Response Guidelines)

- **語言**: 繁體中文 (Traditional Chinese)。
- **語調**: 專業、簡潔、技術導向 (No emotional language/emojis)。
- **操作引導**:
  - 當需要啟動服務時，明確指示用戶「請開啟一個新的 Cursor Terminal 執行以下命令」。
  - 避免將多個長期運行的指令合併在同一個 block。

## 6. 特殊檔案路徑
- **環境變數**: `.env` (優先讀取), `.env.mars`, `.env.mercury` 等多環境配置。
- **日誌**: `storage/logs/`
