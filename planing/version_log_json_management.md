# Task B: Implementation Plan

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：目前系統缺乏管理版更日誌（Version Log）的 API，無法透過控端上傳與查詢前後台的版本資訊檔案。
- **功能目標**：實作一組僅供控端（Admin）使用的 API，用於上傳與取得「前台（Client）」與「後台（Universe）」的 JSON 版更日誌檔案 URL，並將相應的功能權限註冊至系統中。
- **影響範圍**：新增 API 端點及 `Feature` 權限設定，不影響現有業務邏輯。

### 1.2 範圍界定
- **包含**：
  - 新增 `VersionLogController`。
  - 實作 4 支 API（Client/Universe 之 URL 取得與上傳）。
  - Google Cloud Storage (GCS) 檔案路徑邏輯實作。
  - 控端權限驗證與 Feature Seeder 設定。
- **不包含**：
  - 前端頁面實作。
  - JSON 檔案內容的結構驗證（僅驗證檔案類型為 JSON）。
- **假設條件**：
  - `client_id` 可透過 `provider_id` 從內部服務查詢取得。
  - `Storage` Service 的 `getPath` 方法支援 `common/{client_id}/version/...` 的路徑組合方式。
  - Feature ID `250` ~ `254` 目前未被使用。

---

## 2. 系統架構變更

### 2.1 資料庫變更
#### Data Seeding (Feature)
| 資料表 | 變更類型 | 說明 |
|-------|---------|-----|
| `features` | Insert | 新增「版更日誌管理」功能及其子權限節點 |
| `user_features` | Insert | 自動綁定控端管理員權限 |

**新增 Feature 結構預覽**：
- **ID 250**: 版更日誌管理 (Parent, Menu) - 歸類於「站台」類別下
    - **ID 251**: 取得前台版更日誌連結
    - **ID 252**: 上傳前台版更日誌檔案
    - **ID 253**: 取得後台版更日誌連結
    - **ID 254**: 上傳後台版更日誌檔案

### 2.2 設定變更
**N/A**

### 2.3 程式碼結構

#### 新增檔案
| 檔案路徑 | 類型 | 職責說明 |
|---------|-----|---------|
| `app/Http/Controllers/VersionLogController.php` | Controller | 處理版更日誌的上傳與查詢請求 |

#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `routes/api.php` | 註冊 Version Log 相關路由 |
| `database/seeders/Feature.php` | 新增 Feature ID 設定，參考「客端第三方登入管理」結構 |

---

## 3. API 規格設計

### 3.1 端點總覽
| Method | Path | 說明 | 權限 (Feature) |
|--------|------|-----|-----|
| GET | `/api/version_log/client/file_url` | 取得前台版更日誌 URL | Admin (Ctl) |
| POST | `/api/version_log/client/upload` | 上傳前台版更日誌 JSON | Admin (Ctl) |
| GET | `/api/version_log/universe/file_url` | 取得後台版更日誌 URL | Admin (Ctl) |
| POST | `/api/version_log/universe/upload` | 上傳後台版更日誌 JSON | Admin (Ctl) |

### 3.2 詳細規格

#### 共用 Request 參數 (GET/POST)
| 欄位 | 規則 | 說明 |
|-----|-----|-----|
| provider_id | required, integer | 站台 ID，用於查詢對應的 client_id |

#### [POST] Upload 額外參數
| 欄位 | 規則 | 說明 |
|-----|-----|-----|
| file | required, file, mimes:json | 版更日誌檔案 |

#### Response - Success (200) - GET file_url
```json
{
  "url": "https://storage.googleapis.com/.../common/123/version/version-master.json"
}
```

#### Response - Success (200) - POST upload
```json
{
  "result": true
}
```

#### Response - Error
| HTTP Code | Error Code | 說明 |
|-----------|-----------|-----|
| 403 | permission_denied | 非控端人員操作或無權限 |
| 404 | no_such_provider | 找不到指定的站台 |
| 404 | not_found_file | 檔案不存在 (GET) |
| 500 | upload_file_failed | 上傳失敗 |
| 500 | invalid_file_type | 檔案類型錯誤 |

### 3.3 權限設計
| 操作 | 允許角色 | 特殊條件 |
|-----|---------|---------|
| 所有 Version Log API | Admin (控端) | 需具備 `is_ctl=true` 且擁有對應 Feature ID 權限 |

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 建立 Controller：`VersionLogController` | - |
| 2 | 實作 `VersionLogController` 中的 `getClientFileUrl`, `uploadClient` 方法 | 1 |
| 3 | 實作 `VersionLogController` 中的 `getUniverseFileUrl`, `uploadUniverse` 方法 | 1 |
| 4 | 修改 Seeder：`database/seeders/Feature.php`，加入 ID 250~254 權限設定 | - |
| 5 | 設定 Routes：於 `api.php` 的 `auth:backend` 群組中註冊路由 | 2,3 |
| 6 | 執行 Seeder 驗證資料庫變更 (`php artisan db:seed --class=Feature`) | 4 |

### 4.2 關鍵邏輯偽代碼

#### Path Generation Strategy
利用 `Storage` Service 的 `getPath` 方法組合路徑：
- **Client**: `common/{client_id}/version/version-master.json`
  - `service`: "common"
  - `fileName`: "version/version-master.json"
  - `opts`: `['client_id' => $clientId]`
- **Universe**: `common/{client_id}/version/version-universe.json`
  - `service`: "common"
  - `fileName`: "version/version-universe.json"
  - `opts`: `['client_id' => $clientId]`

#### Feature Seeder Logic
```php
// In database/seeders/Feature.php under '站台' (ID 6)
[
    'id' => 250,
    'name' => '版更日誌管理',
    'description' => '版更日誌管理',
    'is_menu' => true,
    'is_ctl' => true,
    'children' => [
        [
            'id' => 251,
            'name' => '取得前台版更日誌連結',
            'description' => '取得前台版更日誌連結',
            'is_ctl' => true,
        ],
        [
            'id' => 252,
            'name' => '上傳前台版更日誌檔案',
            'description' => '上傳前台版更日誌檔案',
            'is_ctl' => true,
        ],
        [
            'id' => 253,
            'name' => '取得後台版更日誌連結',
            'description' => '取得後台版更日誌連結',
            'is_ctl' => true,
        ],
        [
            'id' => 254,
            'name' => '上傳後台版更日誌檔案',
            'description' => '上傳後台版更日誌檔案',
            'is_ctl' => true,
        ],
    ],
]
```

#### Controller Logic (以 upload 為例)
```pseudo
class VersionLogController extends Controller
    function uploadClient(Request $request):
        // 1. 驗證
        validate(provider_id, file:json)
        check Permission (isCtl)

        // 2. 取得 Provider info
        provider = InternalService::call('/api/backend/provider', ['id' => provider_id])
        if !provider: throw NotFoundException

        // 3. 上傳檔案
        storage = Service::init('Storage')
        path = storage.getPath('common', 'version/version-master.json', ['client_id' => provider.client_id])
        
        result = storage.upload(file.path, path)
        if !result: throw RuntimeException

        return ['result' => true]
```

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署後 | DB Seed | 執行 `php artisan db:seed --class=Feature` 更新權限表 |
| 部署後 | Route Cache | 執行 `php artisan route:cache` 確保路由生效 |

### 5.2 驗證項目
#### 整合測試 (Manual/Postman)
| 測試情境 | 步驟 | 預期結果 |
|---------|-----|---------|
| **權限驗證** | 使用控端帳號登入並檢查選單 | 應看到「版更日誌管理」選單 |
| **Admin 上傳 Client 日誌** | 帶 `provider_id` 與 `json` 檔案呼叫 `upload` | 回傳 `result: true`，GCS 對應路徑有檔案 |
| **Admin 取得 Client URL** | 帶 `provider_id` 呼叫 `file_url` | 回傳正確的 GCS URL |
| **非 Admin 操作** | 使用非控端 Token 呼叫 | 回傳 403 Forbidden |
| **Provider ID 不存在** | 帶入錯誤 ID | 回傳 404 |

### 5.3 自我檢查點
- [ ] Controller 是否繼承 `App\Http\Controllers\Controller`
- [ ] Feature ID 是否無衝突 (250-254)
- [ ] 權限僅限控端 (`is_ctl => true`)
