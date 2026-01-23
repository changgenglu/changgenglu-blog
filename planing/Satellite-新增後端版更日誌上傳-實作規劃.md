# Satellite - 新增後端版更日誌上傳 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-22 | 初次規劃 |
| v1.1 | 2026-01-22 | 移除 Env/Config 設定，改採常數定義路徑 |
| v1.2 | 2026-01-23 | 修正 GCP 儲存路徑為固定路徑（無須 provider_id），移除 API 中的站台參數 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：現有版更日誌管理僅涵蓋「前台 (Client)」與「後台/宇宙 (Universe)」日誌。因應營運需求，需新增「後端 (Backend)」專用的版更日誌上傳與查詢功能。
- **功能目標**：
  - 在現有 `VersionLogController` 中擴充支援後端日誌。
  - **路徑優化**：後端日誌為全局共用，儲存路徑固定為 `common/backend/version.json`，不依站台（client_id）區分。
  - **操作簡化**：移除上傳與查詢時必須傳入 `provider_id` 的限制。
- **影響範圍**：API 規格變更、Controller 邏輯簡化、Feature Seeder 註冊。

### 1.2 範圍界定
- **包含**：
  - 新增後端日誌的 Upload 與 Get URL API（不含 provider_id）。
  - 新增對應的 Feature 權限（ID 255, 256）。
- **不包含**：
  - 既有前台與宇宙日誌的邏輯變更（維持原樣）。
  - 前端介面開發。
- **假設條件**：
  - GCS Bucket 根目錄配置正確，目標完整路徑為 `.../common/backend/version.json`。

---

## 2. 系統架構變更

### 2.1 資料庫變更
#### Data Seeding (Feature)
註冊後端日誌專用的功能權限：

| ID | 名稱 | 類型 | 備註 |
|----|-----|-----|-----|
| 250 | 版更日誌管理 | Menu (Parent) | 既有 |
| 255 | 取得後端版更日誌連結 | Function | 新增 |
| 256 | 上傳後端版更日誌檔案 | Function | 新增 |

### 2.2 設定變更
**N/A**

### 2.3 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Http/Controllers/VersionLogController.php` | 更新 `BACKEND_FILENAME` 常數，移除方法中的 `provider_id` 驗證與處理邏輯 |
| `routes/api.php` | 註冊 `backend` 路由 |
| `database/seeders/Feature.php` | 註冊 Feature ID 255, 256 |

---

## 3. API 規格設計

### 3.1 端點總覽
| Method | Path | 說明 | 權限 |
|--------|------|-----|-----|
| GET | `/api/version_log/backend/file_url` | 取得後端版更日誌 URL | Admin (Ctl) |
| POST | `/api/version_log/backend/upload` | 上傳後端版更日誌 JSON | Admin (Ctl) |

### 3.2 詳細規格

#### [POST] /api/version_log/backend/upload
**說明**：上傳後端版更日誌 JSON 檔。

**Request**
```json
{
  "file": (binary)
}
```

**Validation Rules**
| 欄位 | 規則 | 說明 |
|-----|-----|-----|
| file | required, file, mimes:json | JSON 檔案 |

**Response - Success (200)**
```json
{
  "result": true
}
```

#### [GET] /api/version_log/backend/file_url
**說明**：取得後端版更日誌下載連結。

**Request**
(None)

**Response - Success (200)**
```json
{
  "url": "https://storage.googleapis.com/.../common/backend/version.json"
}
```

### 3.3 權限設計
- **角色**：僅限控端管理員 (`is_ctl=true`)。
- **Feature Check**：需擁有 ID 250 (Parent) 及對應子權限 (255/256)。

---

## 4. 實作細節

### 4.1 實作任務清單
| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | 更新 `VersionLogController`：修正 `BACKEND_FILENAME` 為 `backend/version.json` | - |
| 2 | 更新 `VersionLogController`：移除 `getBackendFileUrl` 與 `uploadBackend` 的 `provider_id` 邏輯 | 1 |
| 3 | 設定 Routes：`api.php` 增加 Backend 路由 | 2 |
| 4 | 修改 Seeder：`Feature.php` 新增 ID 255, 256 | - |
| 5 | 執行 Seeder：`php artisan db:seed --class=Feature` | 4 |

### 4.2 關鍵邏輯 (Pseudo Code)

#### VersionLogController
```php
class VersionLogController extends Controller
{
    const GCS_PATH = 'common';
    // 修正路徑：不包含 {client_id} 佔位符
    const BACKEND_FILENAME = 'backend/version.json';

    public function getBackendFileUrl(Request $request)
    {
        // 1. 僅驗證權限，不需驗證 provider_id
        $this->validateCtlUser();

        $storageService = app('Service')::init('Storage');
        // 2. 取得路徑，不傳入 client_id 參數
        $url = $storageService->getPath(self::GCS_PATH, self::BACKEND_FILENAME);

        if (!$storageService->get($url)) {
            throw new NotFoundException('not_found_file');
        }

        return [
            'url' => env('IMAGE_DOMAIN_NAME') . '/' . $url,
        ];
    }

    public function uploadBackend(Request $request)
    {
        // 1. 驗證檔案與權限
        $validated = $this->validate($request, [
            'file' => [ 'required', 'file', 'mimes:json' ],
        ]);
        $this->validateCtlUser();

        $storageService = app('Service')::init('Storage');
        // 2. 取得固定上傳路徑
        $storageUrl = $storageService->getPath(self::GCS_PATH, self::BACKEND_FILENAME);

        $uploadedUrl = $storageService->upload($validated['file']->getRealPath(), $storageUrl);
        
        return ['result' => true];
    }
}
```

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署後 | Seeder | 執行 `db:seed --class=Feature` |

### 5.2 驗證項目
| 測試類別 | 測試情境 | 預期結果 |
|---------|---------|---------|
| 整合測試 | 呼叫 upload API (無 provider_id) | 成功上傳至 `common/backend/version.json` |
| 整合測試 | 呼叫 file_url API (無 provider_id) | 回傳不含 client_id 的固定 URL |

### 5.3 自我檢查點
- [ ] 確認 `BACKEND_FILENAME` 常數不包含舊有的 `version/` 前綴（若 user 指定完整路徑為 `common/backend/...`）
- [ ] 確認 API 請求不再強制要求 `provider_id`
