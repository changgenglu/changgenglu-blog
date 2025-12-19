# Eagle 後台遊戲供應商環境設定 (PlatformConfig Backend CRUD) 規劃

## 1. 目標理解 (Understanding the Goal)
*   **目標**：在 Eagle 專案中規劃並實作「遊戲供應商環境設定 (PlatformConfig)」的後台 CRUD 功能。
*   **範圍**：
    *   僅包含 `PlatformConfig` 模型本身的增刪改查。
    *   **排除** `Tenant` 和 `Platform` 的關聯。
*   **參考**：參考 Stars 專案的架構，但需遵循 Eagle 的 Clean Architecture 和 Coding Style。
*   **實作階段**：分為三階段 (核心層 -> Admin API -> Agent API)。

## 2. 調查與分析 (Investigation & Analysis)

### 2.1 現有架構檢查
*   **Model**: `App\Models\PlatformConfig` 已存在，包含 `platform_id`, `domain`, `secret_key` 等欄位，且定義了隱藏敏感欄位 (`hidden = ['secret_key']`)。
*   **Repository**: `App\Repositories\Platform\PlatformConfigRepository` 已存在，包含基礎 CRUD (`create`, `update`, `delete`, `findById`, `getByPlatformId`)。
*   **缺口**：
    *   `PlatformConfigRepository` 的 `findById` 方法尚未支援 Eager Loading (`with` 參數)。
    *   缺少 `PlatformConfigService` 來封裝業務邏輯（如唯一性檢查、資料驗證）。
    *   缺少 Admin 和 Agent 端的 Controller、Request、Resource。

### 2.2 架構對齊 (Architecture Alignment)
*   **分層**：Controller -> Service -> Repository -> Model。
*   **規範**：
    *   **API 設計**：Action-Based Routing (e.g., `/create`, `/update`)，ID 透過 Body/Query 傳遞。
    *   **Response**：使用 Resource 類別統一輸出格式，特別注意敏感欄位過濾。
    *   **Validation**：使用 Form Request 進行驗證。

## 3. 策略規劃 (Proposed Strategic Approach)

### 階段一：Model, Repository, Service 核心層實作

此階段專注於資料存取與業務邏輯的封裝，確保底層穩固。

*   **1.1 Repository 優化 (`App\Repositories\Platform\PlatformConfigRepository`)**
    *   修改 `findById` 和 `getByPlatformId` 方法，增加 `$with` 參數以支援關聯載入。
    *   確保 `update` 方法的彈性（支援傳入 ID 或 Model）。

*   **1.2 Service 實作 (`App\Services\PlatformConfigService`)**
    *   **`createConfig(array $data)`**:
        *   驗證 `platform_id` 是否存在。
        *   可選：檢查同一平台下是否有重複的 `name` 或 `currency` 配置。
        *   處理 `meta` JSON 欄位（若有特殊邏輯）。
    *   **`updateConfig(int $id, array $data)`**:
        *   檢查配置是否存在。
        *   若更新 `secret_key`，需確保加密或安全處理。
    *   **`deleteConfig(int $id)`**:
        *   檢查是否被使用（如 `TenantPlatform` 引用，雖然本需求不含關聯管理，但需預留檢查點）。
        *   執行刪除。
    *   **`getConfigList(int $platformId)`**:
        *   封裝 Repo 查詢，支援快取。

### 階段二：後台 Admin 端 API 接口

此階段實作總控端的管理介面，擁有完整權限。

*   **2.1 Request 驗證 (`App\Http\Requests\Admin\PlatformConfig\...`)**
    *   `StoreConfigRequest`: `platform_id` (required, exists), `name` (required), `domain` (required)。
    *   `UpdateConfigRequest`: `id` (required, exists)。
    *   `ConfigListRequest`: `platform_id` (required)。

*   **2.2 Resource (`App\Http\Resources\PlatformConfigResource`)**
    *   統一輸出格式。
    *   **注意**：Admin 端可能需要看到部分敏感資訊（如部分遮罩的 Key），需謹慎處理。

*   **2.3 Controller (`App\Http\Controllers\Admin\PlatformConfigController`)**
    *   `list` (GET): 取得特定平台的配置列表。
    *   `detail` (GET): 取得單一配置詳情。
    *   `create` (POST): 新增配置。
    *   `update` (POST/PUT): 更新配置。
    *   `delete` (DELETE): 刪除配置。

### 階段三：後台 Agent 端 API 接口

此階段實作代理端的查詢介面，權限受限。通常 Agent 端不需要管理 `PlatformConfig`（這是技術底層設定），但可能需要讀取部分資訊（如 API Domain）。

*   **3.1 權限考量**：
    *   Agent 通常**不應該**有權限增刪改 `PlatformConfig`。
    *   Agent 可能僅需讀取分配給它的 Config 資訊。
    *   **本規劃假設**：Agent 端僅提供 `Read-Only` 接口，且經過嚴格過濾。

*   **3.2 Resource (`App\Http\Resources\Agent\PlatformConfigResource`)**
    *   **嚴格過濾**：絕對隱藏 `secret_key`, `auth_config` 等敏感欄位。僅回傳 `name`, `domain`, `currency` 等必要資訊。

*   **3.3 Controller (`App\Http\Controllers\Agent\PlatformConfigController`)**
    *   `detail` (GET): 查詢單一配置（需驗證權限）。

## 4. 驗證策略 (Verification Strategy)

### 結構設計檢查
- [ ] Repository 是否依賴 Interface？
- [ ] Service 是否只依賴 Repository 而非 Model？
- [ ] Controller 是否只依賴 Service？

### 商業邏輯檢查
- [ ] 敏感欄位（如 `secret_key`）在 API 回傳中是否已隱藏或遮罩？
- [ ] 刪除配置時是否有防呆檢查？

### 安全性檢查
- [ ] Admin API 是否有 Middleware 保護？
- [ ] Agent API 是否嚴格限制了可見欄位？

## 5. 風險評估 (Anticipated Challenges)
*   **敏感資料洩漏**：`PlatformConfig` 包含 API Key，若 Resource 設計不當可能導致洩漏。需在 Resource 層強制 `makeHidden` 或白名單輸出。
*   **關聯影響**：修改配置可能影響正在使用該配置的租戶。雖不在本需求範圍，但 Service 層應預留 Event 或 Hook 機制。
