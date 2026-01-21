# 檔案上傳重構與 Storage Service 優化 - 實作規劃

## 版本記錄

| 版本 | 更新時間 | 變更摘要 |
|------|---------|----------|
| v1.0 | 2026-01-20 14:30 | 初次規劃：根據批判報告與專案現狀修正，移除 UUID 命名，維持原有檔名共識，優化同步處理與 DI 結構。 |
| v1.1 | 2026-01-20 14:40 | 修正規劃：針對資安風險（路徑遍歷）與實作細節（臨時檔案清理、Utils 返回值）進行補強。 |
| v1.2 | 2026-01-21 11:30 | 更新規劃：補全受影響的 API 端點總覽，明確化 40+ 處調用的實際影響範圍。 |

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
  - **資安補強**：在 Service 層實作檔名消毒（Sanitization），防禦路徑遍歷攻擊。
- **不包含**：
  - 非同步隊列（Queue）處理（維持同步處理）。
  - 修改檔案命名規則（維持前後端既有檔名共識，不使用 UUID）。
- **假設條件**：
  - 前端與 Nginx 已確實限制圖片尺寸，轉檔效能風險受控。
  - 團隊維持使用自定義 `GoogleStorage` Library 的慣例。
  - `Utils::imgBackup` 返回的是臨時檔案路徑（而非二進位資料）。

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
| `app/Services/Storage.php` | 1. 支援建構子注入 `GoogleStorage`。<br>2. 實作 `uploadFile` 與 `uploadImageWithBackup` 方法。<br>3. 新增檔名消毒邏輯。 |
| `app/Providers/AppServiceProvider.php` | 註冊 `App\Library\GoogleStorage` 到 Service Container。 |
| `app/Http/Controllers/*.php` | 替換手動上傳邏輯為 Service 高階方法呼叫。 |

---

## 3. API 規格設計

*API 對外合約維持不變，僅內部實作重構。*

### 3.1 端點總覽

本次重構將影響以下 40+ 處檔案上傳相關端點：

| 模組 | Method | Path | 說明 | 權限 |
|------|--------|------|-----|-----|
| 活動彈窗 | POST | `/api/activity_popup/upload` | JSON 上傳 | admin |
| 活動彈窗 | POST | `/api/activity_popup/image_upload` | 圖片上傳 (含備圖) | admin |
| 貼圖管理 | POST | `/api/sticker/upload` | JSON 上傳 | admin |
| 貼圖管理 | POST | `/api/sticker/image_upload` | 圖片上傳 (含備圖) | admin |
| 禮包管理 | POST | `/api/gift_pack/upload` | JSON 上傳 | admin |
| 禮包管理 | POST | `/api/gift_pack/image_upload` | 圖片上傳 | admin |
| 精選管理 | POST | `/api/featured/upload` | JSON 上傳 | admin |
| 精選管理 | POST | `/api/featured/image_upload` | 圖片上傳 | admin |
| 精選管理 | POST | `/api/featured/cover_upload` | 封面上傳 | admin |
| 庫存管理 | POST | `/api/inventory_items/upload` | JSON 上傳 | admin |
| 庫存管理 | POST | `/api/inventory_items/image_upload` | 圖片上傳 | admin |
| 音樂管理 | POST | `/api/bgm/upload` | 音訊 JSON 上傳 | admin |
| 魚機管理 | POST | `/api/fish/upload` | JSON 上傳 | admin |
| 遊戲管理 | POST | `/api/app_game/upload` | JSON 上傳 | admin |
| 遊戲管理 | POST | `/api/game/image_upload` | 圖片上傳 | admin |
| 大獎管理 | POST | `/api/grand_prize/upload` | JSON 上傳 | admin |
| 代碼管理 | POST | `/api/platform/game_code/upload` | JSON 上傳 | admin |
| 文字管理 | POST | `/api/literal_word/upload` | JSON 上傳 | admin |
| 認證管理 | POST | `/api/client_auth/upload` | JSON 上傳 | admin |

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
| 3 | **Implement Upload Logic**：在 `Storage` 中實作 `uploadFile` (含 `sanitizeFilename` 邏輯)。 | 2 |
| 4 | **Implement Backup Logic**：在 `Storage` 中實作 `uploadImageWithBackup` (含臨時檔案清理與錯誤處理)。 | 2 |
| 5 | **Controller Batch Refactor**：全面替換 Controllers 中的舊有上傳邏輯。 | 3, 4 |

### 4.2 關鍵邏輯（偽代碼）

#### Storage Service 核心邏輯
```pseudo
class Storage
    protected googleStorage

    // 建構子注入，AppServiceProvider 負責解析
    constructor(GoogleStorage googleStorage)
        this.googleStorage = googleStorage

    // 檔名消毒：防禦路徑遍歷
    private function sanitizeFilename(string filename): string
        // 移除路徑分隔符與非法字元，僅保留檔名
        return basename(filename)

    function uploadFile(UploadedFile file, string pathKey, array params, string customName = null)
        rawName = customName ?? file.getClientOriginalName()
        fileName = this.sanitizeFilename(rawName)
        
        storagePath = this.getPath(pathKey, fileName, params)
        return this.googleStorage.upload(file.path(), storagePath)

    function uploadImageWithBackup(UploadedFile file, string pathKey, string subPath, array params)
        rawName = file.getClientOriginalName()
        fileName = this.sanitizeFilename(rawName)
        
        // 組裝路徑
        fullFileName = (subPath ? rtrim(subPath, '/') . '/' : '') + fileName
        storagePath = this.getPath(pathKey, fullFileName, params)
        
        // 1. 上傳原圖
        this.googleStorage.upload(file.path(), storagePath)

        // 2. 同步生成備圖 (JPG <-> WebP)
        targetType = (file.extension == 'webp') ? 'jpg' : 'webp'
        backupPathTemp = null
        
        try {
            // Utils::imgBackup 預期返回臨時檔案路徑
            backupPathTemp = Utils::imgBackup(targetType, file.path())
            
            // 組裝備圖路徑
            backupName = pathinfo(fileName, PATHINFO_FILENAME) + '.' + targetType
            fullBackupName = (subPath ? rtrim(subPath, '/') . '/' : '') + backupName
            backupStoragePath = this.getPath(pathKey, fullBackupName, params)
            
            // 3. 上傳備圖
            this.googleStorage.upload(backupPathTemp, backupStoragePath)
        } catch (Exception e) {
            // 記錄錯誤，依據業務需求決定是否拋出例外（部分失敗策略）
            // 目前策略：若備圖失敗，視為整體失敗
            throw e
        } finally {
            // 4. 清理臨時檔案
            if (backupPathTemp && file_exists(backupPathTemp)) {
                unlink(backupPathTemp)
            }
        }
```

### 4.3 錯誤處理設計
| Exception | 錯誤碼 | 觸發條件 |
|-----------|-------|---------|
| RuntimeException | `upload_failed` | Google Cloud Storage 網路或權限錯誤 |
| RuntimeException | `invalid_image` | 圖片轉檔過程發生異常 |

### 4.4 Design Patterns
| Pattern | 用途 | 應用位置 |
|---------|-----|---------|
| Dependency Injection | 解耦 Storage Library 實作 | Storage Service (透過 Constructor) |
| Adapter/Wrapper | 封裝 GCS 操作 | App\Library\GoogleStorage (既有) |

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
| ControllerTest | 上傳惡意檔名 (e.g., `../../hack.jpg`) | 應儲存為 `hack.jpg`，且位於正確 bucket 路徑下，無路徑遍歷。 |
| ServiceTest | DI 驗證 | `app(Storage::class)`應能正確取得包含 GoogleStorage 的實例。 |
| ServiceTest | 臨時檔案清理 | 驗證 `uploadImageWithBackup` 執行後，`/tmp` 下無殘留圖片。 |

### 5.3 自我檢查點
- [ ] 檔名消毒邏輯是否正確實作（`sanitizeFilename`）？
- [ ] 臨時檔案是否有 `try-finally` 確保清理？
- [ ] `AppServiceProvider` 的綁定是否正確讀取 `config/storage.php`？
