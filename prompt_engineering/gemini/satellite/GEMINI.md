# Gemini 專案策略

> 本文件定義 `satellite` 專案的策略、架構規範與業務術語。

---

## 0. 執行環境 (Execution Environment)

- **Container**: Podman (容器名稱: `stars`)
- **OS**: Alpine Linux (容器內)
- **Shell**: `/bin/sh` (注意：非 bash，避免使用 bash 特有語法)
- **Project Root**: `/var/www/html/satellite` (容器內路徑)
- **IDE**: Cursor

> **重要**: 所有 PHP 指令必須透過 `podman exec -it stars` 在容器內執行。

## 1. 專案技術棧 (Tech Stack)

### 核心框架

- **Framework**: Laravel 9.x
- **Language**: PHP 8.0+
- **OS**: Alpine Linux
- **Database**: MySQL/MariaDB (Connection: `satellite`)
- **Cache**: Redis (`predis/predis`)
- **Storage**: Google Cloud Storage (`google/cloud-storage`)

### 關鍵依賴

- **Excel**: `phpoffice/phpspreadsheet`
- **JWT**: `firebase/php-jwt`
- **Image**: `intervention/image` (v2)

---

## 2. 領域驅動設計 (DDD) & 術語表

本專案嚴格區分以下業務實體，請勿混用術語：

| 英文術語          | 中文術語       | 定義/職責                        | 備註                            |
| :---------------- | :------------- | :------------------------------- | :------------------------------ |
| **Provider**      | **站台**       | 系統的租戶/客戶端                | `provider_id` 通常關聯至此      |
| **Platform**      | **遊戲供應商** | 提供遊戲內容的供應商 (如 PG, TP) | 與 Provider 為多對多關係        |
| **Admin**         | **控端**       | 最高權限管理者                   | 可管理所有 Provider 與 Platform |
| **Provider User** | **管端**       | 站台管理者                       | 僅能管理所屬 Provider 的設定    |
| **Feature**       | **菜單/功能**  | 系統的功能模組與選單             | 用於權限控制與選單顯示          |

---

## 3. 架構規範 (Architecture)

### 3.1 服務層模式 (Service Pattern)

本專案採用特殊的 Service Factory 模式：

- **調用方式**：使用 `app('Service')::init('ServiceName')` 或靜態方法調用。
- **職責**：
  - `Feature` Service: 負責菜單建立、權限綁定。
  - `User` Service: 處理用戶邏輯。
- **事務控制**：明確使用 `DB::beginTransaction()` / `commit()` / `rollback()`。

### 3.2 資料庫模型 (Models)

- **Table Naming**: 單數形式 (如 `user` 而非 `users`)。
- **Primary Key**: 部分表使用非自增 ID (`incrementing = false`)。
- **Soft Delete**: 普遍使用 `SoftDeletes`。

### 3.3 權限控制

- 透過 `Feature` Service 控制 Menu 的顯示與隱藏。
- 區分 `Admin` (控端) 與 `Provider` (管端) 權限範圍。
- **Feature 定義**：`Feature` 代表後台的「功能選單」與「操作權限」，定義於 `database/seeders/Feature.php`，透過 `is_menu` 與 `is_ctl` 進行細項控制。

### 3.4 BFF / Proxy 模式

- **角色**：`satellite` 主要作為 Backend for Frontend (後台管理介面) 的 API Gateway。
- **資料權責**：核心業務資料（如 Game, Tag, Platform）通常位於外部核心系統，`satellite` 透過 `App\Services\Internal` 呼叫外部 API 進行 CRUD，而不直接操作本地 DB。
- **實作慣例**：Controller 負責 `Request Validation`，並使用 `HttpClient` 轉發請求，直接透傳外部服務的 Response。

---

## 4. 開發規範 (Development Standards)

### SOLID 原則

- **SRP**: Service 類別應專注於單一業務領域。
- **DIP**: 盡量透過依賴注入或 Service Container 獲取實例。

### 程式碼風格

- 遵循 PSR-12 規範。
- 註解需清晰說明「為什麼」而非「做什麼」。
- 變數命名使用 `camelCase`，資料庫欄位使用 `snake_case`。

---

## 5. 專案記憶 (Project Memory)

> 此區塊記錄專案特定資訊，由 Gemini 在互動過程中累積。

<!-- 範例格式：
- 專案 X 的錯誤碼定義於 `resources/lang/error.json`
- API 版本控制使用 `/api/v1/` 前綴
- 快取 key 命名規則：`{module}:{entity}:{id}`
-->

- **Service 調用**: 專案傾向使用 `app('Service')::init(...)` 的動態加載模式。
- **User 表**: 表名為 `user`，非 Laravel 預設的 `users`。
- **權限關聯**: 建立 Feature 時會自動綁定 Admin 權限 (`addAdminPermission`)。
- **Proxy 實作**: 轉發請求時慣例於 Controller 進行驗證，再透過 `HttpClient` 調用 `Internal` Service 生成的路徑。
- **Feature 管理**: 新增後台功能選單需修改 `database/seeders/Feature.php` 並執行 seeder。

### 5.1 API 實作與回傳規範

> 基於 Tag/GameTag 功能實作的最新最佳實務。

- **Service 封裝**: 對於 Proxy 類型的操作，建議將 `HttpClient` 呼叫封裝至獨立的 Service（如 `Tag` Service），Controller 僅負責驗證與調用。
- **Controller 命名**: 使用簡潔動詞，如 `get`, `create`, `update`, `getList`。
- **回傳格式 (Mutation)**:
  - 新增 (Create): 回傳 `{ 'after' => $newData }`。
  - 修改 (Update/Enable/Disable): 回傳 `{ 'before' => $oldData, 'after' => $newData }`，以便前端或 Log 記錄變更前後狀態。
- **權限驗證**: Controller 中應建立 `validateCtlUser()` 或類似私有方法，統一處理控端/管端權限檢查。
