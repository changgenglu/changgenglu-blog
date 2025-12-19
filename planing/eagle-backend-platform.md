# Eagle 後台遊戲供應商管理 (Platform Backend CRUD) 完整規劃書

## 1. 目標與範圍 (Goal & Scope)
*   **目標**：在 Eagle 專案中實作「遊戲供應商 (Platform)」的後台 CRUD 功能。
*   **範圍**：
    *   **Admin 端**：擁有完整的 CRUD 管理權限，包含軟刪除與恢復。
    *   **Agent 端**：**無權限** (無 CRUD，亦無讀取全域列表 API)。Agent 的相關設定將由 TenantPlatform 處理 (不在本需求範圍)。
    *   **資料隔離**：本需求僅處理 `Platform` 全域資料，不涉及 `Tenant` 關聯。
    *   **時間儲存規範**：所有 datetime 欄位（含維護時間、created_at/updated_at 等）統一以 +08:00 儲存，前端自行轉換其他時區。
*   **技術規範**：
    *   **Code**：強制大寫，唯一性 (Case Insensitive)，更新時不可變更。
    *   **Status**：使用 Int-backed Enum (`PlatformStatus`)。
    *   **Soft Delete**：支援軟刪除與恢復。
    *   **Routing**：Action-Based Routing (e.g., `/create`, `/list`)。

## 2. 實作階段 (Phases)

### 階段一：Model, Repository, Service 核心層實作

**1.1 Model & Enum**
*   **`App\Models\Platform`**: 確認已存在，需檢查 `SoftDeletes` Trait。
*   **`App\Enums\Platform\PlatformStatus`**: 確認為 Int-backed Enum (1=Active, 2=Maintenance, 3=Disabled)。

**1.2 Repository (`App\Repositories\Platform\PlatformRepository`)**
*   **`findById(int $id, array $with = [])`**: 支援 Eager Loading。
*   **`findByCode(string $code, array $with = [])`**: 呼叫前轉大寫，支援 `withTrashed()` 與 Eager Loading。
*   **`existsByCode(string $code)`**: 呼叫前轉大寫，支援 `withTrashed()`。
*   **`update(Platform $platform, array $data)`**: 依現有介面實作。
*   **`getPaginatedList(array $filters)`**:
    *   支援 `include_deleted` (使用 `withTrashed()`)。
    *   支援 `keyword` 搜尋：
        *   `code`: **精確搜尋** (`=`)。
        *   `name`: 模糊搜尋 (`LIKE %...%`)。
    *   預設排序：`sort_order` ASC, `id` DESC。

**1.3 Service (`App\Services\PlatformService`)**
*   **`createPlatform(array $data)`**:
    *   將 `code` 轉為 **大寫**；`findByCode/existsByCode` 也先轉大寫（DB 已大小寫不敏感）。
    *   檢查 Code 唯一性 (DB 層或 Repo 層)，若重複拋出 `ErrorCode::GAME_CODE_EXISTS` (或 `DUPLICATE_ENTRY`)。
    *   設定預設 `status` 為 `DISABLED`。
    *   處理圖片路徑儲存 (String)。
    *   逐筆具名快取清除（如 `platform:list`、`platform:detail:{id}`，命名採 `clear`），避免全域 flush。
*   **`updatePlatform(int $id, array $data)`**:
    *   **禁止** `$data` 中包含 `code`：由 Request 層阻擋，Service 層暫不重覆驗證（保留未來擴充）。
    *   更新圖片路徑 (若有)。
    *   逐筆具名快取清除。
*   **`toggleStatus(int $id, int $status, array $maintenanceData = [])`**:
    *   若 `$status == PlatformStatus::MAINTENANCE`：
        *   驗證 `maintenance_start_at` 與 `maintenance_end_at` 存在。
        *   驗證 `end > start` 且 `end > now`（時間欄位為 datetime，統一以 +08:00 儲存，前端自行轉換時區）。
        *   若失敗，拋出 `ErrorCode::MAINTENANCE_TIME_INVALID`。
*   **`deletePlatform(int $id)`**:
    *   執行 `delete()` (軟刪除)。
    *   清除快取。
*   **`restorePlatform(int $id)`**:
    *   執行 `restore()`。
    *   清除快取。

**✅ 階段一檢查清單 (Checkbox)**

- [ ] Repository 支援 `withTrashed` 查詢（含 `findByCode/existsByCode`）。
- [ ] Service `createPlatform` 強制將 Code 轉為大寫。
- [ ] `toggleStatus` 包含完整的維護時間邏輯驗證。
- [ ] 實作了 `restorePlatform` 方法。

---

### 階段二：後台 Admin 端 API 接口

**2.1 Request (`App\Http\Requests\Admin\Platform\...`)**
*   **`StorePlatformRequest`**:
    *   `code`: required, alpha_num, unique (platforms, code), uppercase cast (in logic)。
    *   `name`: required, string。
*   **`UpdatePlatformRequest`**:
    *   `code`: **prohibited**。
    *   `id`: required, exists (platforms, id)。
*   **`ToggleStatusRequest`**:
    *   `id`: required。
    *   `status`: required, enum (`PlatformStatus`)。
    *   `maintenance_start_at`: required_if:status,2, date。
    *   `maintenance_end_at`: required_if:status,2, date, after:maintenance_start_at, after:now（+08:00 基準）。
*   **`PlatformListRequest`**:
    *   `keyword`: string (nullable)。
    *   `status`: enum (nullable)。
    *   `include_deleted`: boolean (nullable)。

**2.2 Resource (`App\Http\Resources\PlatformResource`)**
*   回傳完整欄位，包含 `deleted_at` (若已軟刪除)。
*   `status` 轉換為 `{ value: 1, label: '正常' }` 格式。

**2.3 Controller (`App\Http\Controllers\Admin\PlatformController`)**
*   `list`: 支援篩選與分頁。
*   `create`: POST。
*   `update`: PUT。
*   `delete`: DELETE。
*   `restore`: POST（符合專案 Action-based Routing 命名與動詞）。
*   `status`: 拆成 `enable` 與 `disable` 兩個 API，行為明確。

**✅ 階段二檢查清單 (Checkbox)**

- [ ] 更新 API 禁止傳入 `code` (`prohibited`)。
- [ ] 列表 API 支援 `keyword` 精確搜尋 Code。
- [ ] 列表 API 支援 `include_deleted` 參數並回傳軟刪除資料。
- [ ] `enable/disable` 狀態切換符合專案路由風格與錯誤碼規範。
- [ ] 錯誤回應符合 Eagle `ErrorCode` 規範。

---

### 階段三：整合測試

**測試覆蓋 (Feature Test)**
- [ ] **權限測試**：非 Admin Token 存取回傳 403。
- [ ] **唯一性測試**：建立已存在的 Code (大小寫不同) 回傳 422/409。
- [ ] **欄位保護測試**：更新時帶入 `code` 回傳 422。
- [ ] **搜尋測試**：
    *   Keyword = "PG" (精確匹配 Code) -> 應找到。
    *   Keyword = "PGSoft" (Code 不完全匹配) -> 應找不到 (若採精確)。
    *   Keyword = "Soft" (Name 模糊) -> 應找到。
- [ ] **軟刪除測試**：刪除後列表預設不顯示，加參數後顯示，Restore 後恢復正常。
- [ ] **維護時間測試**：設定過去的時間或結束<開始，回傳 422。
- [ ] **狀態 API 測試**：`enable`/`disable` 路由行為與快取清理符合預期。
