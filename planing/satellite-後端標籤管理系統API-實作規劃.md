# satellite - 後端標籤管理系統 API - 實作規劃 (Proxy Mode)

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.1 | 2026-01-30 | 調整規劃：確認為 Proxy 架構，新增 Feature Seeder (Menu) 規劃 |
| v1.0 | 2026-01-30 | 初次規劃 |

---

## 0. 專案現況分析摘要

### 0.1 關鍵發現
根據使用者釐清與程式碼分析：
- **架構模式**：`satellite` 作為 **BFF (Backend for Frontend)** 或 **Proxy** 角色。
- **資料流向**：前端 (Backend Panel) → `satellite` (Validation/Auth) → **External Service** (Core Logic/DB)。
- **資料庫權責**：`satellite` **不持有** 標籤或遊戲的資料庫，所有資料儲存與關聯邏輯皆由外部服務處理。
- **權限管理 (Feature)**：專案使用本地 `feature` 資料表管理後台選單與權限，需透過 Seeder 進行配置。
- **API 文件定位**：提供的《遊戲標籤API文件》為 **外部服務 (Internal/Stars)** 提供的規格。`satellite` 需實作對應的接口並轉發請求。

### 0.2 既有實作參考
- `GameController`: 透過 `HttpClient` 呼叫 `app('Service')::init('Internal')::generateApiUrl(...)` 轉發請求。
- `Internal` Service: 負責生成外部服務的 URL。
- `Database\Seeders\Feature.php`: 定義後台選單結構與權限。

### 0.3 必須遵循的慣例
- **Service 調用**：使用 `app('Service')::init('Internal')` 進行外部呼叫。
- **驗證**：在 Controller 層使用 `$this->validate()` 進行參數驗證，攔截無效請求。
- **選單新增**：必須修改 `Database\Seeders\Feature.php` 並執行 seeder 才能顯示於後台。

---

## 1. 需求概述

### 1.1 背景與目標
- **背景**：核心系統已提供標籤管理 API，`satellite` 需作為後台入口，提供對應的管理介面。
- **目標**：
  1. 在 `satellite` 實作標籤 (Tag)、群組 (Tag Group) 及遊戲標籤 (Game Tag) 的 Proxy API。
  2. 在後台選單新增「標籤管理」與「標籤群組管理」功能入口。
- **影響範圍**：新增 Controller、Route 與 Seeder 設定，不涉及本地 Schema 變更。

### 1.2 範圍界定
- **包含**：
    - 轉發標籤 CRUD 請求。
    - 轉發標籤群組 CRUD 請求。
    - 轉發遊戲標籤關聯請求。
    - 請求參數驗證 (Validation)。
    - **新增後台選單 (Feature Seeder)**。
- **不包含**：
    - 資料庫 Schema 變更 (Migration)。
    - 本地 Eloquent Model (Feature 除外)。

---

## 2. 系統架構變更

### 2.1 資料庫變更
- **無 Schema 變更**：本專案不操作資料庫結構。
- **資料變更 (Data)**：更新 `feature` 表 (透過 Seeder)。

### 2.2 程式碼結構

#### 新增檔案

| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| `app/Http/Controllers/TagController.php` | Controller | 處理標籤與標籤群組的請求轉發 |
| `app/Http/Controllers/GameTagController.php` | Controller | 處理遊戲標籤關聯的請求轉發 |

#### 修改檔案

| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `routes/api.php` | 註冊 Tag 相關路由 |
| `database/seeders/Feature.php` | 新增「標籤管理」與「標籤群組管理」選單設定 |

---

## 3. API 規格設計 (Proxy)

本專案 API 規格與外部服務文件一致，此處僅列出需實作的路由與對應轉發路徑。

### 3.1 路由規劃

| Method | Satellite Path | External Path (Internal Service) | 權限 |
|--------|----------------|----------------------------------|-----|
| **Tag** | | | |
| POST | `/api/backend/tag` | `/api/backend/tag` | backend |
| GET | `/api/backend/tag` | `/api/backend/tag` | backend |
| PUT | `/api/backend/tag` | `/api/backend/tag` | backend |
| GET | `/api/backend/tag/list` | `/api/backend/tag/list` | backend |
| PUT | `/api/backend/tag/enable` | `/api/backend/tag/enable` | backend |
| PUT | `/api/backend/tag/disable` | `/api/backend/tag/disable` | backend |
| GET | `/api/backend/tag/type/list` | `/api/backend/tag/type/list` | backend |
| **Tag Group** | | | |
| POST | `/api/backend/tag_group` | `/api/backend/tag_group` | backend |
| GET | `/api/backend/tag_group` | `/api/backend/tag_group` | backend |
| PUT | `/api/backend/tag_group` | `/api/backend/tag_group` | backend |
| GET | `/api/backend/tag_group/list` | `/api/backend/tag_group/list` | backend |
| PUT | `/api/backend/tag_group/enable` | `/api/backend/tag_group/enable` | backend |
| PUT | `/api/backend/tag_group/disable` | `/api/backend/tag_group/disable` | backend |
| GET | `/api/backend/tag_group/tags` | `/api/backend/tag_group/tags` | backend |
| PUT | `/api/backend/tag_group/tags` | `/api/backend/tag_group/tags` | backend |
| **Game Tag** | | | |
| GET | `/api/backend/game/tags` | `/api/backend/game/tags` | backend |
| PUT | `/api/backend/game/tags` | `/api/backend/game/tags` | backend |

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 建立 `TagController`：實作 Tag 與 TagGroup 所有方法的參數驗證與轉發 | - |
| 2 | 建立 `GameTagController`：實作 GameTag 相關方法的參數驗證與轉發 | - |
| 3 | 設定 `routes/api.php`：註冊上述路由至 `auth:backend` 群組 | 1, 2 |
| 4 | 修改 `database/seeders/Feature.php`：新增選單節點 | - |

### 4.2 Feature Seeder 規劃

預計將新功能加入至 **「遊戲」 (ID: 4)** 分類下。

**ID 分配規劃** (暫定，需確認無衝突)：
- **標籤管理** (ID: 300)
    - 查看 (ID: 301)
    - 新增 (ID: 302, is_ctl: true)
    - 修改 (ID: 303, is_ctl: true)
    - 啟/停用 (ID: 304, is_ctl: true)
- **標籤群組管理** (ID: 310)
    - 查看 (ID: 311)
    - 新增 (ID: 312, is_ctl: true)
    - 修改 (ID: 313, is_ctl: true)
    - 啟/停用 (ID: 314, is_ctl: true)
    - 設定群組標籤 (ID: 315, is_ctl: true)

### 4.3 關鍵邏輯範例

#### TagController::create

```php
public function create(Request $request)
{
    // 1. 本地驗證 (減少無效請求)
    $validated = $this->validate($request, [
        'type' => ['required', 'integer'],
        'name_tw' => ['required', 'string', 'max:20'],
        'name_cn' => ['string', 'max:20'],
        'name_en' => ['string', 'max:20'],
        'description' => ['string', 'max:50'],
    ]);

    // 2. 轉發請求
    $response = HttpClient::post(
        app('Service')::init('Internal')::generateApiUrl('/api/backend/tag'),
        [
            'header' => ['Content-Type' => 'application/json'],
            'timeout' => 30,
            'retryTimes' => 2,
            'data' => $validated,
        ]
    );

    // 3. 回傳
    return $response;
}
```

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署前 | Seeder | 執行 `php artisan db:seed --class=Feature` 更新選單 |
| 部署後 | Route Cache | 執行 `php artisan route:cache` |

### 5.2 驗證項目
- **Feature Check**：登入後台，確認「遊戲」分類下出現「標籤管理」與「標籤群組管理」選單。
- **Proxy Success**：測試新增標籤，確認請求成功轉發至外部服務並回傳正確結果。
- **Permission Check**：確認非控端 (CTL) 帳號無法執行 `is_ctl: true` 的功能 (如新增/修改)。

---

## 附錄：GEMINI.md 更新建議

> 建議將以下內容補充至專案 `GEMINI.md`，以記錄專案特性。

```markdown
## 專案架構特性 (Satellite)

### 1. BFF / Proxy 模式
- **角色**：`satellite` 主要作為 Backend for Frontend (後台管理介面) 的 API Gateway。
- **資料權責**：
  - 核心業務資料（如 Game, Tag, Platform）位於外部核心系統 (Core/Stars)。
  - `satellite` 通常不直接操作這些實體的資料庫表。
  - 透過 `App\Services\Internal` 呼叫外部 API 進行 CRUD。
- **實作慣例**：
  - Controller 負責 `Request Validation`。
  - 使用 `HttpClient` 轉發請求至 `Internal` Service 生成的 URL。
  - 直接回傳外部服務的 Response。

### 2. Feature (選單與權限)
- **定義**：`Feature` 代表後台的「功能選單」與「操作權限」。
- **管理方式**：
  - 定義於 `database/seeders/Feature.php`。
  - 透過 `php artisan db:seed --class=Feature` 寫入本地 `feature` 資料表。
  - `is_menu`: 控制是否顯示於側邊欄。
  - `is_ctl`: 控制是否僅限控端 (Control/Admin) 使用。
```
