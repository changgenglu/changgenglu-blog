# 檔案上傳重構與 Storage Service 優化規劃

## 1. 需求概述

### 1.1 背景與目標
- **背景**：目前 `StickerController` 與 `ActivityPopupController` 等控制器中，檔案上傳的商業邏輯（如檔案類型檢查、備圖生成、路徑組裝）直接暴露在 Controller 層，違反 SOLID 原則（SRP 單一職責）。此外，`Storage` Service 內部可能直接依賴 `GoogleStorage` 實作，缺乏依賴注入（DI）的彈性。
- **目標**：
  1. 將檔案上傳相關的商業邏輯封裝至 `Storage` Service 中。
  2. 重構 `Storage` Service，改用依賴注入（Dependency Injection）方式引入 `GoogleStorage`。
  3. 確保重構過程不影響現有的 API IO 與前端功能。
- **影響範圍**：
  - `app/Http/Controllers/StickerController.php`
  - `app/Http/Controllers/ActivityPopupController.php`
  - `app/Services/Storage.php`
  - `app/Library/GoogleStorage.php` (視情況調整介面)

### 1.2 範圍界定
- **包含**：
  - 提取 Controller 中的檔案驗證、備圖轉換 (`webp` <-> `jpg`)、路徑生成邏輯。
  - 修改 `Storage` Service 以支援依賴注入。
  - 統一處理圖片與 JSON 檔案的上傳流程。
- **不包含**：
  - 修改前端上傳介面。
  - 變更現有的資料庫結構。
  - 變更 API 回傳格式（Response Structure）。
- **假設條件**：
  - `app('Service')::init('Storage')` 機制允許或可相容 Laravel 的 Service Container 注入，或需在 Service 建構子中手動解析依賴。

---

## 2. 系統架構變更

### 2.1 資料庫變更
*本次重構不涉及資料庫變更。*

### 2.2 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Services/Storage.php` | 1. 引入 `GoogleStorage` 依賴注入。<br>2. 新增 `processUpload` 與 `processImageUploadWithBackup` 封裝方法。 |
| `app/Http/Controllers/ActivityPopupController.php` | 移除上傳邏輯，改呼叫 `Storage` Service 的高階方法。 |
| `app/Http/Controllers/StickerController.php` | 移除上傳邏輯，改呼叫 `Storage` Service 的高階方法。 |

---

## 3. API 規格設計

*本次為內部重構，對外的 API Request/Response 格式維持不變。*
*僅列出受影響的 API 端點供測試驗證參考。*

### 3.1 驗證端點
| Method | Path | 說明 |
|--------|------|-----|
| POST | `/api/activity_popup/upload` | 活動彈窗 JSON 上傳 |
| POST | `/api/activity_popup/image_upload` | 活動彈窗圖片上傳（含備圖） |
| POST | `/api/sticker/upload` | 貼圖 JSON 上傳 |
| POST | `/api/sticker/image_upload` | 貼圖圖片上傳（含備圖） |

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | **Refactor Storage Service (DI)**<br>修改 `app/Services/Storage.php`，在建構子中注入 `App\Library\GoogleStorage`。 | - |
| 2 | **Implement General Upload Logic**<br>在 `Storage` Service 新增 `uploadJson(UploadedFile $file, string $pathKey, string $fileName, array $params)` 方法，封裝路徑生成與上傳。 | 1 |
| 3 | **Implement Image Upload Logic**<br>在 `Storage` Service 新增 `uploadImageWithBackup(UploadedFile $image, string $pathKey, string $subPath, array $params)` 方法，封裝格式轉換、備圖生成與雙重上傳邏輯。 | 1 |
| 4 | **Refactor ActivityPopupController**<br>替換 `upload` 與 `imageUpload` 方法內容，改用上述 Service 方法。 | 2, 3 |
| 5 | **Refactor StickerController**<br>替換 `upload` 與 `imageUpload` 方法內容，改用上述 Service 方法。 | 2, 3 |
| 6 | **Verification**<br>執行單元測試或手動測試上傳功能。 | 4, 5 |

### 4.2 關鍵邏輯（Pseudo Code）

#### Storage Service 依賴注入與新方法
```php
namespace App\Services;

use App\Library\GoogleStorage;
use Illuminate\Http\UploadedFile;

class Storage
{
    protected $googleStorage;

    // 透過 Laravel Container 解析，或由 Service Factory 傳入
    public function __construct(GoogleStorage $googleStorage)
    {
        $this->googleStorage = $googleStorage;
    }

    /**
     * 處理一般檔案上傳 (如 JSON)
     */
    public function uploadFile(UploadedFile $file, string $pathKey, string $fileName, array $pathParams = []): bool
    {
        // 1. Check File Type (Basic)
        // 2. Generate Path using getPath($pathKey, $fileName, $pathParams)
        // 3. Upload using $this->googleStorage or internal upload method
    }

    /**
     * 處理圖片上傳並自動生成備圖 (WebP <-> JPG)
     */
    public function uploadImageWithBackup(UploadedFile $image, string $pathKey, string $relativePath, array $pathParams = []): bool
    {
        // 1. 取得原檔名與類型
        // 2. 上傳原圖
        // 3. 判斷是否需要備圖 (jpg/jpeg <-> webp)
        // 4. 呼叫 Utils::imgBackup 生成備圖
        // 5. 上傳備圖
        // 6. 回傳結果
    }
}
```

#### Controller 重構後樣貌
```php
public function imageUpload(Request $request)
{
    // ... 驗證與權限檢查 ...

    // 取得 Provider 資訊 (維持在 Controller 或移至 Service 視 Internal 依賴而定，建議維持 Controller 傳入 ID)
    $providerResponse = ...; 

    $storageService = app('Service')::init('Storage');
    
    // 呼叫封裝後的方法
    $result = $storageService->uploadImageWithBackup(
        $validated['image'],
        self::IMG_PATH, // 'base_image'
        self::ACTIVITY_POPUP_PATH . '/' . $validated['image']->getClientOriginalName(),
        ['client_id' => $providerResponse['client_id']]
    );

    if (!$result) {
        throw new \App\Exceptions\RuntimeException('upload_image_failed');
    }

    return ['result' => true];
}
```

### 4.3 錯誤處理設計
| Exception | 錯誤碼 | 觸發條件 |
|-----------|-------|---------|
| RuntimeException | `invalid_file_type` | 檔案類型不符合預期 (由 Service 拋出) |
| RuntimeException | `upload_file_failed` | 上傳至 Google Storage 失敗 |
| RuntimeException | `upload_image_failed` | 圖片或備圖上傳失敗 |

---

## 5. 部署與驗證

### 5.1 部署注意事項
- 本次變更主要為 PHP 程式碼邏輯重構，不需執行 Migration。
- 需確認 `composer dump-autoload` 是否需要執行（若有新增類別）。

### 5.2 驗證項目
#### 手動驗證流程
1. **活動彈窗上傳**：
   - 上傳 JSON：確認路徑正確且內容可讀取。
   - 上傳圖片 (JPG)：確認 Google Storage 存在 JPG 原圖與 WebP 備圖。
   - 上傳圖片 (WebP)：確認 Google Storage 存在 WebP 原圖與 JPG 備圖。
2. **貼圖上傳**：
   - 執行相同測試，確保功能未回歸。

### 5.3 自我檢查點
- [ ] `Storage` Service 是否正確使用依賴注入（或 `app()` 解析）。
- [ ] 備圖邏輯 (`jpg` vs `webp`) 是否與原 Controller 邏輯一致（特別是 `jpeg` 轉 `jpg` 的處理）。
- [ ] 權限檢查是否保留在 Controller 層（`isCtl`）。
- [ ] API 回傳結構維持不變。
