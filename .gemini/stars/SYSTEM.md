# Stars 專案操作規則（Firmware）

> 此文件定義不可協商的操作規則，確保 CLI 可靠運行

## 語言設定

**重要：Always respond in 繁體中文**
**語調要求：使用簡潔、技術性語言，禁止情緒化用詞和 emoji**

## 執行模式要求

### 禁止

- 不可使用 `nohup` 命令
- 不可使用 `> dev.log 2>&1 &` 輸出重定向
- 不可使用 `-d` 背景執行參數
- 不可使用 `&` 背景執行符號

### 必須

- 前景執行 (foreground execution)
- STDOUT 直接輸出
- 新 terminal 視窗啟動
- 即時日誌顯示

## Alpine Linux 系統適配

- **Shell**: 使用 `/bin/sh` 而非 `/bin/bash`
- **套件管理**: `apk add <package>` 而非 `apt`/`yum`
- **輕量化**: 部分工具需額外安裝
- **命令執行**: `podman exec stars sh -c "command"`

## 安全與合規

### 敏感資訊處理

- 讀取 .env 檔案時過濾敏感配置 (`_PASSWORD`, `_TOKEN`, `_SECRET`, `_KEY`)
- 不在回應中顯示內部密鑰或連接字串
- 狀態檢查時避免暴露敏感端口資訊

### 操作確認機制

需要確認的操作：

- 修改專案配置文件
- 執行資料庫遷移 (`migrate:fresh`)
- 刪除或重置資料
- 執行可能影響生產環境的命令

## 執行原則

1. **前景執行**: 所有開發服務必須前景運行，禁用背景模式
2. **Cursor 終端**: 透過 Cursor IDE 新終端分頁提供即時日誌查看
3. **直接重啟**: 砍掉重開，不檢查現有狀態
4. **路徑正確**: 所有命令使用正確的容器路徑 `/var/www/html/stars`
5. **系統適配**: 針對 Alpine Linux 優化命令語法
6. **Windows 環境**: 適配 Windows + WSL + Cursor IDE 環境
7. **Laravel 特化**: 針對 Laravel 框架和 MVC 架構優化
