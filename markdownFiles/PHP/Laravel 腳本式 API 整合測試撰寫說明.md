# Laravel 腳本式 API 整合測試撰寫說明

> 整理在容器內以獨立 PHP 腳本（不用 PHPUnit）對 Laravel API 做整合測試的原則、認證做法與常見問題。另一份以 PHPUnit 為基礎的做法見〈Laravel 整合測試撰寫規則〉。整理於 2026 年。

## 原則

- **不用 PHPUnit**：腳本直接執行，用 `exit(1)` 或 `exit(0)` 表示失敗或成功
- **尊重需求規劃**：測試階段不為了通過測試而修改商業邏輯
- **不重造輪子**：遇到問題先查參考文件，再看專案內過去寫過的整合測試，從中找解法

## 測試環境

- **容器環境**：所有測試命令在專案的 Podman 容器內執行：

  ```bash
  podman exec <容器名稱> sh -c "cd /var/www/html/<專案目錄> && php tests/api/<測試腳本>.php"
  ```

- **載入 Laravel**：腳本需要自行載入框架核心，才能使用 Service、Model 與設定。腳本開頭加上：

  ```php
  require __DIR__ . '/../../vendor/autoload.php';
  $app = require_once __DIR__ . '/../../bootstrap/app.php';
  $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
  ```

## 本地快速測試（繞過 Token）

為了加速本地開發，專案可以實作「開發環境繞過 Token 驗證」的機制。

**適用範圍**：

- 適用於受後台與前台 API 中介層（Middleware）保護的端點
- 不適用於需要會員身分驗證的 API，這類請求仍需要真實的身分憑證

**啟用條件**（`.env`，僅限本地）：

```bash
APP_ENV=local
API_TOKEN_BYPASS=true
```

**必要 Header**：

| Header          | 值                 | 說明                    |
| --------------- | ------------------ | ----------------------- |
| `X-Dev-Bypass`  | `true`             | 啟用繞過模式（必填）    |
| `X-Tenant-Code` | `<租戶代碼>`       | 目標租戶                |
| `Content-Type`  | `application/json` | 內容型別                |

**curl 範例**：

```bash
curl -s -X GET "http://localhost:<port>/api/admin/operators" \
  -H "X-Dev-Bypass: true" \
  -H "X-Tenant-Code: <租戶代碼>" \
  -H "Content-Type: application/json"
```

## 身分驗證詳解

API 依端點類型（客端、後台、代理端）採用不同的認證機制。

### 後台／代理端認證（操作員認證）

採用兩層 Token 驗證：

1. **請求簽章 Token（Backend API Token）**
   - **用途**：驗證請求的合法性與意圖，等同請求的簽章
   - **生成方式**：每次 API 呼叫都要獨立生成，根據該次請求的 payload（GET 請求為空）、租戶代碼、API 路徑與 HTTP 方法動態產生
   - **常見錯誤**：路徑、方法或 payload 與實際請求不符，會出現 Token 格式錯誤或驗證失敗
   - **避免**：產生 Token 的參數要和實際送出的請求嚴格一致
   - **位置**：`Authorization: Bearer <Token>`
2. **操作員 Session Token（JWT）**
   - **用途**：驗證當前操作員的身分與權限
   - **取得方式**：呼叫登入 API 成功後取得
   - **常見錯誤**：使用模擬的 Token 字串，會被驗證中介層擋下；登入帳密錯誤
   - **避免**：一定要執行真實的登入請求，從回應中取出有效的 JWT；預設帳號可從 Seeder 查得
   - **位置**：自訂 Header（例如 `id-token: <Token>`）
   - **控端與管端差異**：控端用控端租戶代碼登入；管端用其所屬的特定租戶代碼登入

### 客端認證（會員認證）

客端 API 通常只需要會員的 Access Token：

- 會員透過登入 API 取得 `access_token`
- 放入 `Authorization: Bearer <Access Token>`
- 建議把客端登入的 curl 範例集中放在測試目錄的參考文件裡

## 問題排查與避免

### 請求參數與 Payload 結構

- **問題**：API 回傳 422，指出參數缺失或格式錯誤
  - **案例**：建立遊戲時，`name` 應為字串而不是多語系陣列，且分類欄位為必填；同步遊戲的 API 只接受單一租戶與單一廠商的 ID，而不是 ID 陣列
  - **避免**：
    - **先讀 `FormRequest` 類別**：確認每個端點的必填欄位、資料型別、參數名稱與驗證規則
    - **對照 API 文件**：查閱專案的 API 文件撰寫標準中定義的 Request 參數
- **問題**：更新 API 的 `languages` 參數導致 `Cannot access offset of type array on array`
  - **原因**：Model 處理多語系內容時預期特定格式，傳入的陣列結構不符
  - **避免**：不確定格式或非必要時，先移除該參數，確認其他核心欄位更新成功；再檢查 `FormRequest` 或 Service 如何處理該參數

### API 回傳資料結構解析

- **問題**：列表 API 資料庫明明有資料，測試腳本解析出來卻是空的（例如本頁筆數為 0）
  - **案例**：Service 回傳的結構是 `['data' => [...], 'pagination' => [...]]`，測試腳本卻從錯的路徑取值
  - **避免**：
    - 從正確的巢狀路徑取出實際列表（例如 `response['body']['data']['data']`），不要猜 `items` 之類的鍵名
    - 查 API 文件中的回應結構說明

### 複合主鍵 Model 的列表資料問題

- **問題**：複合主鍵的 Model（沒有單一 `id`）即使 Repository 的 Paginator 顯示 `total` 正確，`Paginator::items()` 有時卻回傳空的 Collection
  - **根本原因**：Eloquent 與 Paginator 預設高度依賴單一 `id` 主鍵。Model 設定 `public $incrementing = false;` 但沒有明確指定 `$primaryKey` 時，內部行為可能不穩定
  - **避免**：
    - **診斷**：用獨立 PHP 腳本直接 `Model::where(...)->get()->toArray()`，確認資料庫是否真的有資料，排除 API 或 Service 層的問題
    - **暫時解法（Service 層）**：確認 Repository 有資料後，手動走訪 `Paginator::items()`，逐筆呼叫 `toArray()`：

      ```php
      $paginator = $this->repository->getList(...);
      $data = [];
      foreach ($paginator->items() as $item) {
          $data[] = $item->toArray(); // 強制轉為陣列
      }
      return [
          'data' => $data,
          'pagination' => [ /* ... */ ],
      ];
      ```

    - **長遠建議**：這類問題頻繁出現時，考慮替複合主鍵的資料表加上 UUID 或自增 `id`

### 日誌除錯

- **問題**：`Log::info()` 寫的訊息沒有出現在 `storage/logs/laravel.log`
  - **根本原因**：預設日誌通道可能把日誌輸出到 `php://stderr`，而不是檔案
  - **避免**：
    - 明確指定會寫入檔案的通道：

      ```php
      \Illuminate\Support\Facades\Log::channel('emergency')->info('除錯訊息', ['參數' => $value]);
      ```

    - 檢查 `config/logging.php`，確認日誌實際輸出位置
    - 跑測試前先清空日誌檔，方便集中看最新紀錄：

      ```bash
      podman exec <容器名稱> sh -c "cd /var/www/html/<專案目錄> && : > storage/logs/laravel.log"
      ```

### 環境變數沒有生效

- **問題**：測試腳本裡設定的 `LOG_CHANNEL` 等環境變數沒有作用
  - **根本原因**：`podman exec ... sh -c` 的指令在新的 Shell 環境執行，外部環境變數不會自動繼承
  - **避免**：把環境變數直接寫在 `sh -c` 的指令前面：

    ```bash
    podman exec <容器名稱> sh -c "cd /var/www/html/<專案目錄> && LOG_CHANNEL=stack php tests/api/<測試腳本>.php"
    ```

### 浮點數比較

- **問題**：驗證 API 回傳的浮點數時，數值看起來相同，比較結果卻不相等（例如 `98.88 !== 98.88`）
  - **根本原因**：浮點數以二進位儲存，存在精度誤差
  - **避免**：
    - **設定誤差範圍（epsilon）**：

      ```php
      if (abs($value - $expectedValue) > 0.001) {
          // 處理錯誤
      }
      ```

    - **轉成字串比較**：需要極高精度時（例如金額計算）才考慮

## 常見狀況與解法

### 1. Token 驗證與 GET 請求的參數型別

- **問題**：GET 請求的 payload 含整數（如 `tenant_id=1`）時，PHP 的 `$_GET` 會把參數自動轉成字串，導致產生 Token 時與驗證時的型別不一致，驗證失敗
- **解法**：
  - **方法 A（推薦）**：測試 GET 請求時，用繞過 Header 略過簽章檢查（前提是環境允許）
  - **方法 B**：一定要用 Token 時，傳進產生函式的整數先明確轉成字串

### 2. 複合主鍵 Model 不能用 `refresh()`

- **問題**：對複合主鍵 Model 呼叫 `$model->refresh()` 會出現 `Unknown column 'id'`，因為 Laravel 預設依賴單一 `id` 主鍵
- **解法**：不要用 `refresh()`，改用 `Model::where(...)->first()` 重新查詢

### 3. Controller 取不到 `$request->user()`

- **問題**：自訂的操作員驗證中介層把操作員資訊存在 request 的 attributes 裡，Guard 設定不同時，直接用 `$request->user()` 會得到 null，出現「使用者未驗證」錯誤
- **解法**：改用 `$request->attributes->get('current_operator')` 取得目前登入的操作員
