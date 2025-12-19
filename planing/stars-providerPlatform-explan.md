## Stars 專案 Provider 與 Platform 架構分析報告 (v2.1 - 整合 `limit` 欄位澄清)

## 1. 目標理解 (Understanding the Goal)
*   **目標**：詳細分析 `stars` 專案中 `Providers`、`Platforms` 與 `PlatformConfig` 之間的關聯模型、資料流向及 API 設計。
*   **關鍵澄清**：特別聚焦於 **`ProviderPlatforms` 表的 `limit` 欄位為「遊戲供應商遊戲上架數量限制」** 的商業邏輯。
*   **應用場景**：作為 Eagle 專案實作 `Tenant` (對應 Stars 的 Provider) 與 `Platform` 關聯功能的設計藍圖。

## 2. 調查與分析 (Investigation & Analysis)

### 2.1 資料模型分析 (Model Analysis)

*   **`Providers` (對應 Eagle 的 `Tenant`)**
    *   **定義**：代表營運站點或代理商，是最高層級的業務實體。
    *   **關鍵屬性**：`id`, `name`, `currency`, `secret_key` 等站點層級的配置。
    *   **關聯**：`platforms()`: 多對多關聯 `Platforms`，透過中間表 `provider_platforms`。

*   **`Platforms` (對應 Eagle 的 `Platform`)**
    *   **定義**：代表遊戲原廠供應商（例如：PGSoft, Evolution Gaming）。這是全域性的遊戲供應來源。
    *   **關鍵屬性**：`id`, `code`, `name`, `enable` (全域啟用/停用開關), `is_seamless` (錢包模式), `thumb_url` (縮圖)。
    *   **關聯**：`configs()`: 一對多關聯 `PlatformConfig`。

*   **`PlatformConfig`**
    *   **定義**：儲存特定 `Platforms` 的技術性配置，例如不同線路或站點對接該平台所需的 API Key、網域等。
    *   **關鍵屬性**：`id`, `platform_id` (FK), `domain`, `secret_key`, `meta` (JSON，用於彈性擴充配置)。
    *   **觀察與結論**：一個 `Platforms` 可以有多組 `PlatformConfig`，這增加了系統的彈性，允許不同的 `Provider` (Tenant) 使用同一 `Platforms` 但透過不同的 `PlatformConfig` 進行對接。

*   **`ProviderPlatforms` (中間表)**
    *   **定義**：這是 `Provider` 與 `Platforms` 之間的多對多關聯表，詳細定義了**每個代理商/租戶**對**每個遊戲供應商**的客製化管理規則和狀態。
    *   **關鍵屬性**：
        *   `provider_id`, `platform_id`: 複合主鍵，唯一識別一個 `Provider` 對一個 `Platforms` 的設定。
        *   `enable`: **租戶級別的開關**。若全域 `Platforms.enable=true` 但此處 `enable=false`，則該租戶無法使用該平台。反之，若全域 `Platforms.enable=false`，即使此處 `enable=true` 也無效。
        *   `has_rtp`: 租戶是否啟用該平台的 RTP (Return To Player) 功能 (可獨立設置)。
        *   `pid`: 對應總部系統的平台 ID (若有上級系統)。
        *   **`limit`**: **此欄位代表「遊戲供應商遊戲上架數量限制」**。即該 `Provider` (租戶) 從該 `Platforms` (遊戲供應商) 最多可以上架或顯示多少款遊戲。這是控制代理商遊戲庫規模的重要商業控制點。
        *   `platform_config_id`: 指定該租戶使用哪一組 `PlatformConfig` (技術配置)。
    *   **資料建立流程 (根據 `ProviderPlatformController::update` 方法分析)**：
        *   當 Admin 呼叫 `PUT api/backend/provider/platform` 時，會傳入 `provider_id` 和一個 `platforms` 陣列。
        *   每個 `platforms` 陣列元素包含 `id` (platform_id), `pid`, `config_id` (platform_config_id)。
        *   系統會根據這些資料執行 `ProviderPlatforms` 的 **`updatePlatforms`** 服務方法，這個方法負責：
            *   **批次更新**：依據傳入的 `platform_id` 和 `config_id` 更新現有的 `ProviderPlatforms` 記錄。
            *   **批次創建**：如果 `ProviderPlatforms` 記錄不存在，則會創建新記錄。
            *   **批次刪除**：對於 Request 中未提供的 `platform_id` 但在資料庫中存在的 `ProviderPlatforms` 記錄，則執行軟刪除 (`deletePlatforms`)。
        *   **核心邏輯**：這個 `update` 方法實際執行的是一個 **Upsert 或 Sync** 操作，即根據傳入的 `platforms` 列表，決定哪些關聯需要新增、更新或刪除。此處的 `limit` 欄位在 `update` 時並未直接處理，而是由 `edit` 方法單獨處理。

### 2.3 API 路由架構分析 (Route Analysis)

Stars 的 API 設計清晰地劃分了不同角色的職責。

1.  **Admin 端 (`Route::prefix('backend')->middleware(['auth:back'])`)**
    *   **職責**：總控端，擁有最高權限，負責管理全域性的平台設定 (`Platforms`, `PlatformConfig`) 以及**所有租戶**的平台關聯設定 (`ProviderPlatforms`)。
    *   **關鍵 API (管理 `ProviderPlatforms`)**：
        *   `PUT api/backend/provider/platform` (`ProviderPlatformController::update`):
            *   **功能**：用於 Admin **批次同步或更新**特定 `provider_id` 下，所有 `Platforms` 的關聯。包含設定 `platform_config_id`。這個 API 能夠新增、更新或軟刪除 `ProviderPlatforms` 記錄。
        *   `PUT api/backend/provider/platform/enable/disable` (`ProviderPlatformController::enable/disable`):
            *   **功能**：Admin 可以**強制啟用/停用特定租戶**的特定遊戲供應商。
        *   `PUT api/backend/provider/platform/maintain` (`ProviderPlatformController::setMaintain`):
            *   **功能**：Admin 可以**強制設定特定租戶**的特定遊戲供應商的維護時間。
        *   `PUT api/backend/provider/platform/edit` (`ProviderPlatformController::edit`):
            *   **功能**：Admin **單獨編輯** `ProviderPlatforms` 中的特定欄位，例如 **`limit`** (上架數量限制) 或 `has_rtp`。
        *   `GET api/backend/provider/platform/list`: Admin 查詢所有租戶的平台關聯狀態及配置。

2.  **Agent 端 (對應 Eagle 的 `Agent` 端，Stars 的 `backend` 路由組內部的 `agent` 相關路由)**
    *   **職責**：代理商/租戶後台，管理**自身站點**的平台設定，但其操作會受到 Admin 端全域設定的制約。
    *   **關鍵 API (由 `AgentPlatformController` 處理)**：
        *   `GET api/backend/agent/platform/list`: 取得**自身**可用的平台列表，包含 Agent 級別的開關狀態。
        *   `PUT api/backend/agent/platform/enable/disable`: **代理商自行開關**自身平台的啟用/停用狀態。此操作需檢查全域 `Platforms` 狀態，若全域停用，代理商則無法開啟。
        *   `PUT api/backend/agent/platform/maintain`: 代理商自行設定自身平台的維護狀態。

### 2.3 資料流向與控制邏輯總結

1.  **全域平台管理 (`Platforms`)**：由 Admin 負責全域的建立、編輯、啟用/停用、維護等。這是最上層的控制。
2.  **平台技術配置 (`PlatformConfig`)**：由 Admin 負責為每個全域平台建立和管理多組技術配置。
3.  **租戶平台關聯 (`ProviderPlatforms`)**：
    *   **Admin 介入**：Admin 可以隨時對任何 `Provider` 的任何 `Platform` 進行批次關聯 (`update`)、強制開關 (`enable/disable`)、設定維護 (`setMaintain`)、以及 **設定 `limit` (上架數量限制)** (`edit`)。
    *   **Agent 自主管理**：在 Admin 允許的前提下，Agent 可以對自身站點的平台進行開關或設定維護。
    *   **`limit` 欄位的管理**：`limit` 是一個商業控制點，Admin 可以透過 `ProviderPlatformController::edit` 方法精準設定特定 `Provider` 對特定 `Platform` 的遊戲上架數量。

## 3. 策略規劃 (Proposed Strategic Approach)

基於對 Stars 專案的詳細分析，建議 Eagle 專案採取以下**模組化設計**，並納入 `game_limit` 的管理：

### 階段一：資料庫與模型建置 (含 `TenantPlatform` 模組化)

*   **1.1 資料庫遷移 (Migration)**
    *   [ ] 建立 `platform_configs` 資料表。
    *   [ ] 建立 `tenant_platforms` 資料表 (對應 Stars 的 `provider_platforms`)，包含 `game_limit` 欄位。

*   **1.2 模型建置 (Model)**
    *   [ ] 建立 `App\Models\PlatformConfig`。
    *   [ ] 建立 `App\Models\TenantPlatform`，並定義 `platform_config_id` 關聯。
    *   [ ] 更新 `Platform` 模型：新增 `hasMany(PlatformConfig::class)`。
    *   [ ] 更新 `Tenant` 模型：新增 `belongsToMany(Platform::class, 'tenant_platforms')`。
    *   [ ] 更新 `Platform` 模型：新增 `belongsToMany(Tenant::class, 'tenant_platforms')`。

### 階段二：Admin 端 API 設計 (`routes/api/admin.php`)

#### 2.1 全域 Platform 管理 (`Admin\PlatformController`)
*   [ ] **API**: `GET /platforms/list`, `GET /platforms/detail`, `POST /platforms/create`, `POST /platforms/update`, `DELETE /platforms/delete`, `PUT /platforms/status`, `PUT /platforms/maintain`。
*   **功能**：管理 `platforms` 表，包含全域平台名稱、圖片、全域啟用/停用、全域維護。

#### 2.2 PlatformConfig 管理 (`Admin\PlatformConfigController`)
*   [ ] **API**: `GET /platform-configs/list`, `GET /platform-configs/detail`, `POST /platform-configs/create`, `POST /platform-configs/update`, `DELETE /platform-configs/delete`。
*   **功能**：管理 `platform_configs` 表，允許 Admin 為特定 `Platform` 建立、編輯、刪除不同的技術配置。

#### 2.3 租戶平台關聯管理 (`Admin\TenantPlatformController`)
*   [ ] **API**: `GET /tenant-platforms/list`, `POST /tenant-platforms/sync`, `PUT /tenant-platforms/config`, `PUT /tenant-platforms/status`, `PUT /tenant-platforms/maintenance`。
*   **功能**：管理 `tenant_platforms` 表。
    *   **list**： Admin 可以查詢**所有租戶**的平台關聯狀態及配置。
    *   **sync**：Admin 可以為**特定租戶**批次指派 `Platform`，並設定初始 `platform_config_id`、`is_enabled`、`is_maintenance` 及 **`game_limit`**。
    *   **config**：Admin 可以單獨更新特定租戶的特定平台所使用的 `platform_config_id` 或 **`game_limit`**。
    *   **status/maintenance**：Admin 可以強制開關或維護**任何租戶**的特定平台。

### 階段三：Agent 端 API 設計 (`routes/api/agent.php`)

#### 3.1 代理商平台管理 (`Agent\TenantPlatformController`)
*   [ ] **API**: `GET /platforms/list`, `PUT /platforms/status`, `PUT /platforms/maintenance`。
*   **功能**：代理商只能管理**自身**的 `tenant_platforms` 表。
    *   **list**：代理商可以取得**自身**可用的平台列表，並顯示**自身**的 `is_enabled`, `is_maintenance` 狀態。列表結果需綜合判斷全域 `Platform` 狀態。**`game_limit` 欄位應可讀取**。
    *   **status**：代理商可以自行切換**自身平台**的啟用/停用狀態。其操作受全域 `Platform` 狀態和 Admin 設定 (`TenantPlatform.is_enabled`) 的限制。
    *   **maintenance**：代理商可以自行設定**自身平台**的維護狀態。其操作受全域 `Platform` 狀態和 Admin 設定 (`TenantPlatform.is_maintenance`) 的限制。

## 4. 驗證策略 (Verification Strategy)
*   **數據一致性**：確保 `Platform`、`PlatformConfig` 和 `TenantPlatform` 之間的數據引用完整性。
*   **業務邏輯驗證**：
    *   Admin 關閉全域 Platform 後，Agent 無法自行啟用。
    *   Agent 設定的維護狀態，不應影響其他 Agent 或 Admin 視圖。
*   **`game_limit` 邏輯驗證**：
    *   Admin 設定 `game_limit`，Agent 在遊戲列表 API 中應正確應用此限制。
*   **權限隔離**：Agent 端 API 僅能操作其自身 `tenant_id` 相關的數據，無法跨租戶操作。

## 5. 風險評估 (Anticipated Challenges)
*   **`game_limit` 應用**：`game_limit` 需要在獲取遊戲列表時，在 `GameService` 或 `GameRepository` 層面進行處理，這可能需要修改現有的遊戲查詢邏輯。
*   **快取失效**：多層級配置的變更，容易導致快取失效問題，需仔細規劃快取策略（例如：`TenantPlatform` 變更時，清理相關 `Tenant` 的遊戲列表快取）。
*   **UI/UX 複雜度**：Admin 介面管理多層級配置（Platform, PlatformConfig, TenantPlatform）會比單純 CRUD 複雜，前端設計需明確區分。

