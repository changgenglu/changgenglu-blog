# 2026-01-20_refactor_file_upload_plan.md - 檔案上傳重構與 Storage Service 優化實作規劃

## 1. 需求概述

### 1.1 背景與目標
- **背景**：目前檔案上傳邏輯（驗證、備圖、路徑處理）散落在 `StickerController` 與 `ActivityPopupController`，違反單一職責原則。且 `Storage` Service 缺乏依賴注入，難以測試與替換。
- **目標**：
  1. **邏輯封裝**：將上傳、檔名生成、圖片轉檔（JPG/WebP）邏輯移至 `Storage` Service。
  2. **架構解耦**：保留自定義 `App\Library\GoogleStorage`，但透過 Laravel Service Container 進行綁定與注入，解決配置散落問題。
  3. **安全性提升**：強制使用 UUID 或安全雜湊生成檔名，杜絕路徑遍歷風險。
- **影響範圍**：
  - `app/Services/Storage.php`
  - `app/Providers/AppServiceProvider.php`
  - `app/Http/Controllers/StickerController.php`
  - `app/Http/Controllers/ActivityPopupController.php`

### 1.2 範圍界定
- **包含**：
  - 在 `AppServiceProvider` 註冊 `GoogleStorage` 單例。
  - 重構 `Storage` Service 實作 `uploadFile` 與 `uploadImageWithBackup`。
  - 修正 Controller 改用 Service 方法。
  - **同步處理**：圖片轉檔與備圖生成維持同步執行（依照需求，不使用 Queue）。
- **不包含**：
  - 非同步隊列（Queue）實作。
  - 更換底層 Storage Library（維持使用 `GoogleStorage.php`）。
- **假設條件**：
  - `config/google/storage.php` 或類似設定檔包含 `keyFilePath` 與 `bucketName`。
  - 專案的 `app('Service')::init('Storage')` 機制若不支援自動依賴注入，將改用 `app(Storage::class)` 或在 Service 內部 `resolve()`。

---

## 2. 系統架構變更

### 2.1 資料庫變更
*本次不涉及資料庫變更*

### 2.2 設定變更
| 設定檔 | 變更內容 | 說明 |
|-------|---------|-----|
| `app/Providers/AppServiceProvider.php` | 註冊 `GoogleStorage` 綁定 | 透過 `app(GoogleStorage::class)` 統一管理實例化與 Config |

### 2.3 程式碼結構
#### 修改檔案
| 檔案路徑 | 修改內容摘要 |
|---------|-------------|
| `app/Services/Storage.php` | 1. 引入 `GoogleStorage`。<br>2. 實作安全檔名生成 (UUID)。<br>3. 封裝圖片轉檔邏輯。 |
| `app/Http/Controllers/StickerController.php` | 移除上傳邏輯，呼叫 Service。 |
| `app/Http/Controllers/ActivityPopupController.php` | 移除上傳邏輯，呼叫 Service。 |

---

## 3. API 規格設計

*API 對外介面 (Contract) 維持不變，僅內部實作重構。*

### 3.1 驗證端點 (參考用)
| Method | Path | 說明 |
|--------|------|-----|
| POST | `/api/activity_popup/upload` | 活動彈窗 JSON 上傳 |
| POST | `/api/activity_popup/image_upload` | 活動彈窗圖片上傳 (同步產生 WebP/JPG 備圖) |
| POST | `/api/sticker/upload` | 貼圖 JSON 上傳 |
| POST | `/api/sticker/image_upload` | 貼圖圖片上傳 (同步產生 WebP/JPG 備圖) |

---

## 4. 實作細節

### 4.1 實作任務清單

| # | 任務 | 依賴 |
|---|-----|-----|
| 1 | **Config Binding**<br>在 `AppServiceProvider` 中綁定 `App\Library\GoogleStorage`，注入設定參數。 | - |
| 2 | **Refactor Storage Service (Base)**<br>在 `Storage` Service 中引入 `GoogleStorage` (透過 Constructor 或 resolve)，並實作 `generateSecureFilename()`。 | 1 |
| 3 | **Implement General Upload**<br>實作 `uploadFile(UploadedFile $file, string $pathKey, array $params)`，使用安全檔名。 | 2 |
| 4 | **Implement Image Logic (Sync)**<br>實作 `uploadImageWithBackup(...)`。<br>**注意**：需在記憶體內完成 `Intervention/Image` 轉檔並同步上傳。 | 2 |
| 5 | **Refactor ActivityPopupController**<br>替換原上傳程式碼。 | 3, 4 |
| 6 | **Refactor StickerController**<br>替換原上傳程式碼。 | 3, 4 |

### 4.2 關鍵邏輯

#### AppServiceProvider Binding
```php
$this->app->singleton(\App\Library\GoogleStorage::class, function ($app) {
    // 假設設定位於 config('google.storage')
    // 或讀取既有寫死的設定方式，但集中於此處
    $config = config('google.storage') ?? [
        'keyFilePath' => base_path('config/google/key.json'), // 範例路徑
        'bucketName'  => env('GOOGLE_CLOUD_STORAGE_BUCKET'),
    ];
    return new \App\Library\GoogleStorage($config);
});
```

#### Storage Service 核心邏輯
```php
namespace App\Services;

use App\Library\GoogleStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Intervention\Image\Facades\Image;

class Storage
{
    protected $googleStorage;

    public function __construct()
    {
        // 若 Service Factory 不支援 DI，則手動解析
        $this->googleStorage = app(GoogleStorage::class);
    }

    /**
     * 生成安全路徑 (UUID)
     */
    protected function generateSecurePath(string $basePath, string $extension): string
    {
        $uuid = (string) Str::uuid();
        // 確保路徑結尾無多餘斜線
        return rtrim($basePath, '/') . '/' . $uuid . '.' . $extension;
    }

    /**
     * 圖片同步上傳與備圖 (WebP <-> JPG)
     */
    public function uploadImageWithBackup(UploadedFile $file, string $pathKey, array $params = []): bool
    {
        // 1. 取得基本資訊
        $originalExt = strtolower($file->getClientOriginalExtension());
        $realPath = $file->getRealPath();

        // 2. 定義路徑 (使用 UUID，不信任 ClientOriginalName)
        $basePath = $this->getPathByKey($pathKey, $params); // 假設已有此方法解析路徑 Key
        $mainStoragePath = $this->generateSecurePath($basePath, $originalExt);

        // 3. 上傳主圖
        $this->googleStorage->upload(fopen($realPath, 'r'), $mainStoragePath);

        // 4. 處理備圖 (同步處理)
        // 邏輯：若上傳 JPG -> 轉 WebP；若上傳 WebP -> 轉 JPG
        $backupExt = ($originalExt === 'webp') ? 'jpg' : 'webp';
        $backupStoragePath = str_replace(".{$originalExt}", ".{$backupExt}", $mainStoragePath);

        // 使用 Intervention Image 轉換格式
        $img = Image::make($realPath);
        $encodedImg = $img->encode($backupExt, 80); // 品質 80

        // 因 GoogleStorage::upload 預期檔案路徑或 Resource，需使用 temp file 或 stream
        $tempPath = tempnam(sys_get_temp_dir(), 'img_backup');
        file_put_contents($tempPath, (string)$encodedImg);

        try {
            $this->googleStorage->upload(fopen($tempPath, 'r'), $backupStoragePath);
        } finally {
            @unlink($tempPath); // 清理暫存
        }

        return true;
    }
}
```

### 4.3 錯誤處理設計
| Exception | 錯誤碼 | 觸發條件 |
|-----------|-------|---------|
| RuntimeException | `file_upload_error` | Google Storage 上傳失敗 |
| RuntimeException | `image_process_error` | 圖片格式不支援或轉檔失敗 (如記憶體不足) |

---

## 5. 部署與驗證

### 5.1 部署注意事項
| 階段 | 項目 | 說明 |
|-----|-----|-----|
| 部署前 | Config | 確認 Google Cloud Key File 路徑與權限正確 |
| 部署後 | Autoload | 執行 `composer dump-autoload` 確保 ServiceProvider 載入 |

### 5.2 驗證項目
#### 單元/整合測試
| 測試類別 | 測試項目 | 預期結果 |
|---------|---------|---------|
| ActivityPopupUpload | 上傳 JPG 圖片 | Google Storage 出現 UUID 命名的 .jpg 與對應 .webp |
| StickerUpload | 上傳惡意檔名 (../../hack.jpg) | 檔案儲存為 UUID 檔名，未發生路徑遍歷 |
| ServiceTest | 依賴解析 | `app(GoogleStorage::class)` 能成功回傳實例 |

### 5.3 自我檢查點
- [ ] 是否已移除 Controller 中所有 `getClientOriginalName` 的路徑組裝用法？
- [ ] `GoogleStorage` 的實例化是否已透過 `AppServiceProvider` 統一管理？
- [ ] 圖片轉檔是否正確處理了暫存檔清理 (`unlink`)？
