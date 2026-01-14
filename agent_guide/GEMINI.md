# Gemini CLI 策略指引 (GEMINI.md)

> 這是專案策略與上下文層，針對 PHP/Laravel 後端開發進行優化。
> 依賴 SYSTEM.md 確保安全執行。

---

## 開發者概況

- **角色：** 後端工程師
- **主要語言：** PHP 8.x
- **主要框架：** Laravel
- **資料庫：** MySQL、Redis
- **開發環境：** WSL (Ubuntu)

---

## 技術棧偏好

### 後端 API

| 類別 | 偏好技術 |
|------|----------|
| **框架** | Laravel（PHP） |
| **ORM** | Eloquent |
| **快取** | Redis（Laravel Cache Facade） |
| **佇列** | Laravel Queue（Redis Driver） |
| **資料庫** | MySQL 8.x |
| **API 風格** | RESTful API |
| **認證** | Laravel Sanctum / Passport |
| **測試** | PHPUnit、Pest |

### 設定檔檢查優先順序

確認函式庫或框架可用時，優先檢查：

1. `composer.json` / `composer.lock`
2. `config/*.php`（Laravel 設定）
3. `.env` / `.env.example`
4. `routes/*.php`
5. 鄰近檔案的 `use` 語句

---

## 主要工作流程

### 軟體工程任務

修正錯誤、新增功能、重構或說明程式碼時，依序執行：

1. **理解：** 分析使用者請求與程式碼上下文。大量使用 `search_file_content` 和 `glob` 平行搜尋檔案結構、既有慣例和程式碼模式。用 `read_file` 和 `read_many_files` 驗證假設與理解。
2. **計畫：** 建立一個根據步驟 1 理解的明確且合理的解決方案。必要時以簡短清晰的方式告知使用者計畫。若相關，嘗試透過撰寫單元測試建立自我驗證循環。可用輸出日誌或除錯訊息協助驗證。
3. **實作：** 遵守核心規範，運用可用工具（如 `replace`、`write_file`、`run_shell_command`）執行計畫。
4. **驗證（測試）：** 如可行，透過專案既有測試程序驗證變更。Laravel 專案優先使用 `php artisan test` 或 `./vendor/bin/phpunit`。絕不假設標準測試指令。
5. **驗證（標準）：** 非常重要：程式碼變更後，執行專案特定的檢查指令（如 `./vendor/bin/pint`、`./vendor/bin/phpstan`、`composer run lint`）以確保程式碼品質及標準遵守。若不確定指令，可詢問使用者是否需執行及如何執行。

### 新功能開發（Laravel）

**目標：** 自主實作並交付符合 Laravel 最佳實務的功能模組。

1. **理解需求：** 分析使用者請求，明確核心功能、API 端點設計、資料模型及業務邏輯。若缺關鍵資訊，提出明確且精準的詢問。
2. **提案計畫：** 制定開發計畫，向使用者簡潔說明，包含：
   - 資料表設計（Migration）
   - Model 與關聯
   - Controller / Service 層級
   - 路由設計
   - 必要的驗證規則（FormRequest）
   - 測試策略
3. **使用者同意：** 取得使用者對計畫的認可。
4. **實作：** 按核准計畫自主開發，遵循專案既有架構模式。
   - 使用 `php artisan make:*` 指令生成骨架（如 `make:model -mfs`）
   - 遵循 Service / Repository 模式（若專案採用）
   - 確保 IDE helper 相容（`@property` PHPDoc）
5. **驗證：** 執行測試與靜態分析，確保無錯誤。
6. **收集回饋：** 提供相關 API 文件或測試指令，請求使用者回饋。

---

## Laravel 特定指引

### 程式碼風格

- 遵循 PSR-12（或專案的 `pint.json` / `.php-cs-fixer.php` 設定）
- 使用 Laravel 慣用的命名方式：
  - Model：單數形（`User`、`Order`）
  - Controller：資源名+Controller（`UserController`）
  - Migration：描述性名稱（`create_users_table`）
  - 路由：複數形資源名（`/users`、`/orders`）

### 資料庫操作

- 使用 Eloquent ORM，避免原始 SQL（除非效能必要）
- 善用 Eager Loading 避免 N+1 查詢問題
- 使用 Migration 管理資料表結構
- Redis 操作優先使用 Laravel Cache/Session Facade

### 錯誤處理

- 使用 Laravel 內建 Exception 處理機制
- 自訂 Exception 放在 `app/Exceptions/`
- API 回應使用一致的錯誤格式

### 依賴注入

- 透過 Constructor Injection 注入依賴
- 善用 Service Container 和 Service Provider
- 避免在 Controller 中直接 new 物件

---

## 專案記憶區

> 此區塊記錄專案特定資訊，由 Gemini 在互動過程中累積。

<!-- 範例格式：
- 專案 X 的錯誤碼定義於 `resources/lang/zh-TW/error.php`
- API 版本控制使用 `/api/v1/` 前綴
- 快取 key 命名規則：`{module}:{entity}:{id}`
-->
