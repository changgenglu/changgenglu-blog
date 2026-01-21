# 檔案上傳重構與 Storage Service 優化 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-20 14:30 | 初次規劃：根據批判報告與專案現狀修正，移除 UUID 命名，維持原有檔名共識，優化同步處理與 DI 結構。 |

---

## 1. 需求概述

### 1.1 背景與目標
- **需求背景**：目前檔案上傳邏輯（路徑組裝、圖片轉檔、格式驗證）散佈於多個 Controller（如 `ActivityPopupController`, `StickerController` 等 40 餘處），違反 SRP（單一職責原則）。`Storage` Service 內部直接 `new` 實例，缺乏彈性。
- **功能目標**：
  1. 將核心上傳與圖片備份邏輯封裝至 `Storage` Service。
  2. 透過 `AppServiceProvider` 實現 `GoogleStorage` 的依賴注入（DI）。
  3. 統一專案內 40+ 處 `app('Service')::init('Storage')` 的調用邏輯。
- **影響範圍**：
  - `app/Services/Storage.php`
  - `app/Providers/AppServiceProvider.php`
  - 所有調用 `Storage` Service 的 Controllers（約 16 個檔案，40 處調用）。

### 1.2 範圍界定
- **包含**：
  - `GoogleStorage` 的單例註冊與設定管理。
  - `Storage` Service 新增 `uploadFile` 與 `uploadImageWithBackup` 方法。
  - 專案內所有相關 Controller 的重構。
- **不包含**：
  - 非同步隊列（Queue）處理（維持同步處理）。
  - 修改檔案命名規則（維持前後端既有檔名共識，不使用 UUID）。
- **假設條件**：
  - 前端與 Nginx 已確實限制圖片尺寸，轉檔效能風險受控。
  - 團隊維持使用自定義 `GoogleStorage` Library 的慣例。

---

## 2. 系統架構變更

### 2.1 資料庫變更
*本次不涉及資料庫變更。*

### 2.2 設定變更
| 設定檔 | 變更內容 | 說明 |
|-------|---------|-----|
| `app/Providers/AppServiceProvider.php` | 註冊 `GoogleStorage` 單例綁定 | 統一管理 `config('storage')` 注入邏輯。 |

### 2.3 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Services/Storage.php` | 1. 支援建構子注入 `GoogleStorage`。<br>2. 實作 `uploadFile` 與 `uploadImageWithBackup` 方法。 |
| `app/Providers/AppServiceProvider.php` | 註冊 `App\Library\GoogleStorage` 到 Service Container。 |
| `app/Http/Controllers/*.php` | 替換手動上傳邏輯為 Service 高階方法呼叫。 |

---

## 3. API 規格設計

*API 對外合約維持不變，僅內部實作重構。*

### 3.1 端點總覽
| Method | Path | 說明 | 權限 |
|--------|------|-----|-----|
| POST | `/api/activity_popup/upload` | 活動彈窗 JSON 上傳 | admin |
| POST | `/api/activity_popup/image_upload` | 活動彈窗圖片上傳 (含同步備圖) | admin |
| POST | `/api/sticker/image_upload` | 貼圖圖片上傳 (含同步備圖) | admin |

### 3.2 詳細規格
*無變更，略。*

### 3.3 權限設計
*維持既有的 Controller 層權限檢查 (`isCtl`)。*

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | **Config Binding**：在 `AppServiceProvider` 註冊 `GoogleStorage` 綁定。 | - |
| 2 | **Storage Service Refactor**：重構 `app/Services/Storage.php`，增加 DI 支援。 | 1 |
| 3 | **Implement Upload Logic**：在 `Storage` 中實作 `uploadFile` (維持原檔名)。 | 2 |
| 4 | **Implement Backup Logic**：在 `Storage` 中實作 `uploadImageWithBackup` (含 JPG/WebP 互轉)。 | 2 |
| 5 | **Controller Batch Refactor**：全面替換 Controllers 中的舊有上傳邏輯。 | 3, 4 |

### 4.2 關鍵邏輯（偽代碼）

#### Storage Service 核心邏輯
```pseudo
class Storage
    protected googleStorage

    constructor(GoogleStorage googleStorage = null)
        this.googleStorage = googleStorage ?? app(GoogleStorage::class)

    function uploadFile(UploadedFile file, string pathKey, array params, string customName = null)
        fileName = customName ?? file.getClientOriginalName()
        storagePath = this.getPath(pathKey, fileName, params)
        return this.googleStorage.upload(file.path(), storagePath)

    function uploadImageWithBackup(UploadedFile file, string pathKey, string subPath, array params)
        fileName = file.getClientOriginalName()
        storagePath = this.getPath(pathKey, (subPath ? subPath + '/' : '') + fileName, params)
        
        // 1. 上傳原圖
        this.googleStorage.upload(file.path(), storagePath)

        // 2. 同步生成備圖 (JPG <-> WebP)
        targetType = (file.extension == 'webp') ? 'jpg' : 'webp'
        backupData = Utils::imgBackup(targetType, file.path())
        backupName = fileName.removeExtension() + '.' + targetType
        backupPath = this.getPath(pathKey, (subPath ? subPath + '/' : '') + backupName, params)
        
        // 3. 上傳備圖
        return this.googleStorage.upload(backupData, backupPath)
```

### 4.3 錯誤處理設計
| Exception | 錯誤碼 | 觸發條件 |
|-----------|-------|---------|
| RuntimeException | `upload_failed` | Google Cloud Storage 網路或權限錯誤 |
| RuntimeException | `invalid_image` | 圖片轉檔過程發生異常 |

### 4.4 Design Patterns
| Pattern | 用途 | 應用位置 |
|---------|-----|---------|
| Dependency Injection | 解耦 Storage Library 實作 | Storage Service |
| Facade/Service | 封裝複雜業務邏輯 | Storage Service |

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署前 | Config | 確認 `.env` 中的 `GOOGLE_STORAGE_BUCKET` 已設定。 |
| 部署中 | Migration | N/A |
| 部署後 | Cache | 執行 `php artisan config:cache` 確保 Provider 生效。 |

### 5.2 驗證項目
#### 整合測試
| 測試類別 | 測試情境 | 預期結果 |
|---------|---------|---------|
| ControllerTest | 上傳貼圖 WebP | Storage 應出現 WebP 與轉檔後的 JPG，檔名與上傳時一致。 |
| ControllerTest | 上傳活動 JSON | Storage 應出現指定路徑的 JSON，內容正確。 |
| ServiceTest | DI 驗證 | `app(Storage::class)` 應能正確取得包含 GoogleStorage 的實例。 |

### 5.3 自我檢查點
- [ ] 檔名是否維持原樣（不使用 UUID）？
- [ ] 所有 `app('Service')::init('Storage')` 的調用處是否都已涵蓋？
- [ ] `AppServiceProvider` 的綁定是否正確讀取 `config/storage.php`？
