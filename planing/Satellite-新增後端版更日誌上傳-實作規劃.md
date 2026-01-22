# Satellite-新增後端版更日誌上傳-實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-22 | 初次規劃 |
| v1.1 | 2026-01-22 | 移除 Env/Config 設定，改採常數定義路徑 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：現有版更日誌管理僅涵蓋「前台 (Client)」與「後台/宇宙 (Universe)」日誌。因應營運需求，需新增「後端 (Backend)」專用的版更日誌上傳與查詢功能。
- **功能目標**：
  - 在現有 `VersionLogController` 中擴充支援後端日誌。
  - 上傳路徑遵循專案慣例，於程式碼中定義。
  - 權限比照現有控端管理規範。
- **影響範圍**：API 擴充、Feature Seeder 更新。

### 1.2 範圍界定
- **包含**：
  - 新增後端日誌的 Upload 與 Get URL API。
  - 新增對應的 Feature 權限（ID 255, 256）。
- **不包含**：
  - 前端介面開發。
  - 日誌內容驗證（僅驗證 JSON 格式）。
  - `.env` 或 `config` 設定檔修改。
- **假設條件**：
  - 基礎路徑結構仍維持 `common/{client_id}/`。
  - 若 `Feature` ID 250~254 尚未建立，需一併補齊。

---

## 2. 系統架構變更

### 2.1 資料庫變更
#### Data Seeding (Feature)
檢查並確保 `features` 表包含以下結構（若 ID 250 已存在則僅新增子項目）：

| ID | 名稱 | 類型 | 備註 |
|----|-----|-----|-----|
| 250 | 版更日誌管理 | Menu (Parent) | 既有或新增 |
| 255 | 取得後端版更日誌連結 | Function | 新增 |
| 256 | 上傳後端版更日誌檔案 | Function | 新增 |

### 2.2 設定變更
**N/A**

### 2.3 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Http/Controllers/VersionLogController.php` | 新增 `BACKEND_FILENAME` 常數與相關方法 |
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
  "provider_id": 1,
  "file": (binary)
}
```

**Validation Rules**
| 欄位 | 規則 | 說明 |
|-----|-----|-----|
| provider_id | required, integer | 站台 ID |
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
```json
{
  "provider_id": 1
}
```

**Response - Success (200)**
```json
{
  "url": "https://storage.googleapis.com/.../common/123/version/backend-release.json"
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
| 1 | 修改 Controller：`VersionLogController` 新增 `BACKEND_FILENAME` 常數與方法 | - |
| 2 | 設定 Routes：`api.php` 增加 Backend 路由 | 1 |
| 3 | 修改 Seeder：`Feature.php` 新增 ID 255, 256 | - |
| 4 | 執行 Seeder：`php artisan db:seed --class=Feature` | 3 |
| 5 | 驗證測試：使用 Postman 測試上傳與下載 | 4 |

### 4.2 關鍵邏輯 (Pseudo Code)

#### VersionLogController
```php
class VersionLogController extends Controller
{
    // ... existing constants
    const BACKEND_FILENAME = 'version/backend-release.json';

    /**
     * @GET("/api/version_log/backend/file_url")
     */
    public function getBackendFileUrl(Request $request)
    {
        // 1. 驗證與權限 (同 existing)
        $this->validateCtlUser();
        // ... get provider ...

        // 2. 取得路徑 (使用常數)
        $url = $storageService->getPath(self::GCS_PATH, self::BACKEND_FILENAME, ['client_id' => $clientId]);

        // ... return url ...
    }

    /**
     * @POST("/api/version_log/backend/upload")
     */
    public function uploadBackend(Request $request)
    {
        // 1. 驗證與權限 (同 existing)
        
        // 2. 上傳 (使用常數)
        $storageUrl = $storageService->getPath(self::GCS_PATH, self::BACKEND_FILENAME, ['client_id' => $clientId]);
        
        $storageService->upload($file, $storageUrl);
        
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
| 部署後 | Cache | 執行 `route:cache` |

### 5.2 驗證項目
| 測試類別 | 測試情境 | 預期結果 |
|---------|---------|---------|
| 整合測試 | 呼叫 upload API (Backend) | 回傳 true，GCS 產生檔案 |
| 整合測試 | 呼叫 file_url API (Backend) | 回傳正確 URL |
| 權限測試 | 非控端帳號存取 | 回傳 403 |

### 5.3 自我檢查點
- [ ] 確認 `BACKEND_FILENAME` 常數定義正確
- [ ] 確認 Feature ID 未與其他功能衝突
