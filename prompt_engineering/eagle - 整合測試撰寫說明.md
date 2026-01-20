# eagle - 整合測試撰寫說明

## **原則**

- **禁用 PHPUnit**：此整合測試方法不依賴 PHPUnit 框架。腳本應直接執行，透過 `exit(1)` 或 `exit(0)` 來指示成功或失敗。
- **尊重規劃**：測試階段應尊重商業邏輯與需求規劃，不可以為了通過測試而修改。
- **禁止造輪子**：撰寫測試遇到問題，首先查看**參考文件**，再來查看 [整合測試目錄](https://www.notion.so/tests/api/) 底下過去撰寫的測試碼，尋找解決方案

## 測試環境

- **serve port**：8083
- **容器環境**：所有測試命令必須在 `backend838` Podman 容器內執行。請使用以下格式：

  ```bash
  podman exec backend838 sh -c "cd /var/www/html/eagle && php tests/api/你的測試腳本.php"
  ```

- **Laravel 載入**：測試腳本需自行載入 Laravel 核心，以使用其 Service、Model 及配置。請確保腳本開頭包含：

  ```php
  require __DIR__ . '/../../vendor/autoload.php';
  $app = require_once __DIR__ . '/../../bootstrap/app.php';
  $app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();
  ```

## 本地快速測試 (Bypass Token)

為加速本地開發流程，專案支援繞過標準 Token 驗證機制。詳細設定請參考 [本地 API 測試指南](https://www.notion.so/docs/development/local-api-testing-guide.md)。

**適用範圍**：

- 適用於 `backend.api` (後台) 與 `client.api` (前台) 中間件保護的 API。
- **注意**：不適用於需要 `auth.member` (會員身份) 的 API，此類請求仍需 `id-token`。

**啟用條件** (.env)：

```bash
APP_ENV=local
API_TOKEN_BYPASS=true
```

**Bypass 必要 Headers**：

| Header          | 值                 | 說明                    |
| --------------- | ------------------ | ----------------------- |
| `X-Dev-Bypass`  | `true`             | 啟用 bypass 模式 (必填) |
| `X-Tenant-Code` | `7qne0rjed7`       | 目標租戶代碼            |
| `Content-Type`  | `application/json` | 內容類型                |

**CURL 範例**：

```bash
  curl -s -X GET "<http://localhost:8085/api/admin/operators>" \\
    -H "X-Dev-Bypass: true" \\
    -H "X-Tenant-Code: 7qne0rjed7" \\
    -H "Content-Type: application/json"
```

## 身份驗證詳解

本專案的 API 依據端點類型（Client 端、Admin 端、Agent 端）採用不同的認證機制。

### Admin/Agent 端認證 (Operator 認證)

Admin/Agent 端 API 採用兩層 Token 驗證：

1. **Backend API Token**：
   - **用途**：用於驗證請求的「合法性」和「意圖」，防止 API 被隨意呼叫。它相當於請求的「簽名」。
   - **生成方式**：必須為**每次 API 呼叫**獨立生成。透過 `generateBackendToken` 輔助函式，根據當前請求的 `payload` (GET 請求為空)、`tenantCode`、`apiPath` 和 `httpMethod` 參數動態產生。
   - **痛點與避免**：
     - **痛點**：錯誤的 `apiPath`、`httpMethod` 或 `payload` 與實際請求不符，會導致 `1003 Token Format Error` 或 `Token 驗證失敗`。
     - **避免**：確保 `generateBackendToken` 的參數與 `callApi` 的參數嚴格匹配。
   - **位置**：放入 HTTP `Authorization: Bearer <Backend API Token>` Header。
2. **Operator Session Token (JWT)**：
   - **用途**：驗證當前操作員的「身份」和「權限」。
   - **獲取方式**：透過呼叫 Admin/Agent 登入 API (`/api/auth/operator/login`) 成功後獲取。
   - **痛點與避免**：
     - **痛點**：使用模擬 Token 字串會導致 `OperatorAuthMiddleware` 驗證失敗。
     - **避免**：必須執行**真實的登入請求**，從 API 回應中提取有效的 JWT。
     - **痛點**：登入時使用的帳號密碼錯誤。
     - **避免**：參考 `OperatorSeeder.php` 確定預設的 Admin/Agent 帳號及密碼（例如 `admin`/`qwer1234`）。
   - **位置**：放入 HTTP `id-token: <Operator Session Token>` Header。
   - **控端/管端差異**：
     - **控端 (Admin)** 登入時使用控端租戶代碼（例如 `OperatorService::getControlTenantCode()` 獲取）。
     - **管端 (Agent)** 登入時使用其所屬的特定租戶代碼（例如 `ucbb6eenl2`）。

### Client 端認證 (Member 認證)

Client 端 API 認證方式與 Admin/Agent 端不同，通常只需 Member 的 Access Token。

- **參考文件**：[會員追蹤系統 API CURL 測試命令參考](https://www.notion.so/tests/api/CURL-COMMANDS-REFERENCE.md) 提供了 Client 端會員登入範例。
- **獲取方式**：會員透過 `POST /api/client/auth/login` 登入後獲取 `access_token`。
- **位置**：放入 HTTP `Authorization: Bearer <Access Token>` Header。

## 問題排查與避免

本節列出在實作過程中遇到的典型問題及其解決方案，以幫助 AI 代理高效排查。

### 請求參數與 Payload 結構

- **問題**：API 返回 `422 資料驗證失敗`，錯誤訊息指出參數缺失或格式錯誤。
  - **案例**：Admin 創建遊戲時，`name` 應為字串而非多語系陣列，且 `category_type` 和 `category` 為必填。Admin 同步遊戲時，API 僅接受 `tenant_id` 和 `platform_id`，而非 `tenant_ids` 或 `game_ids` 列表。
  - **避免**：
    - **優先閱讀 `FormRequest` 類別**：針對每個 API 端點，務必仔細閱讀其對應的 Laravel `App\\Http\\Requests\\...` 類別（例如 `App\\Http\\Requests\\Admin\\Game\\CreateGameRequest.php`），確認所有必填欄位、資料類型、參數名稱與驗證規則。
    - **參照 API 文檔**：查閱相關的 [API 文檔撰寫標準](https://www.notion.so/docs/standards/api-documentation-standard.md) 中定義的 Request 參數。
- **本次任務新問題**：更新遊戲 API (`/api/admin/games/update`) 的 `languages` 參數導致 `Cannot access offset of type array on array` 錯誤。
  - **原因**：通常是 Model 處理多語系內容時期望特定格式，而傳入的陣列格式不符。在測試時，如果 `languages` 參數不是必要的，或不確定其正確格式，建議先移除該參數，確保其他核心欄位更新成功。
  - **避免**：仔細檢查對應的 `FormRequest` 或 `Service` 層如何處理該參數，確保 payload 結構完全匹配 API 預期。

### API 返回數據結構解析

- **問題**：API 查詢列表時，儘管後端資料庫有數據且 Repository 層也返回了 Paginator，但測試腳本解析到的列表卻為空（例如 `本頁筆數: 0`）。
  - **案例**：`TenantGameService::getTenantGameList` 返回的結構是 `['data' => [...], 'pagination' => [...]]`。
  - **避免**：
    - **正確解析回應**：在測試腳本中，請確保正確地從 `response['body']['data']['data']` 中提取實際的數據列表，而不是錯誤地使用 `response['body']['data']['items']` 或其他路徑。
    - **檢查 API Doc**：查閱 API 文件中關於回應數據結構的說明。

### 複合主鍵 Model 列表數據問題

- **問題**：針對像 `TenantGame` 這樣沒有單一 `id` 主鍵的複合主鍵 Model，即使 `Repository` 層的 `Paginator` 顯示 `total` 數量正確，但 `Paginator::items()` 在某些情況下可能返回空的 Collection，導致最終 API 返回的數據列表為空。

  - **根本原因**：Laravel 的 Eloquent 和 Paginator 默認高度依賴單一 `id` 主鍵。當 Model 設定 `public $incrementing = false;` 但未明確設定 `$primaryKey` 時，其內部行為可能不穩定。
  - **避免**：

    - **診斷工具**：利用獨立的 PHP 腳本（例如 `debug_tg.php` 範例）直接使用 `Model::where(...)->get()->toArray()` 驗證資料庫中是否存在數據，以排除 API 或 Service 層的問題。
    - **暫時解決方案 (Service 層)**：如果遇到此類問題，且確認 Repository 層有數據，可考慮在 Service 層手動遍歷 `Paginator::items()` 並呼叫每個 Model 的 `toArray()` 方法，確保數據被正確轉換成陣列後再返回。

      ```php
        // 範例：TenantGameService::getTenantGameList 方法內
        $paginator = $this->tenantGameRepository->getTenantGameList(...);
        $data = [];
        foreach ($paginator->items() as $item) {
            $data[] = $item->toArray(); // 強制轉換為陣列
        }
        return [
            'data' => $data,
            'pagination' => [ /* ... */ ],
        ];
      ```

    - **長遠建議**：若此問題頻繁發生，建議通知開發團隊，考慮為複合主鍵的表添加一個 `UUID` 或自增 `id` 作為主鍵，以簡化 Eloquent 和 Paginator 的處理。

### 日誌調試

- **問題**：`Log::info()` 語句無法顯示在 `storage/logs/laravel.log` 中。

  - **根本原因**：專案預設的日誌通道 `gcp` 可能將日誌輸出到 `php://stderr` 而非檔案。
  - **避免**：

    - **使用 `emergency` 通道**：在服務層或 Repository 層添加日誌時，明確指定 `emergency` 通道，該通道會將日誌寫入 `storage/logs/laravel.log`。

      ```php
        \\Illuminate\\Support\\Facades\\Log::channel('emergency')->info("你的調試訊息", ['參數' => $value]);
      ```

    - **檢查 `config/logging.php`**：了解日誌通道的配置，確認日誌的實際輸出位置。
    - **清除日誌**：在運行測試前，清空 `storage/logs/laravel.log`，以便集中查看最新日誌。

      ```bash
        podman exec backend838 sh -c "cd /var/www/html/eagle && echo '' > storage/logs/laravel.log"
      ```

### 外部環境變數與配置

- **問題**：測試腳本中的 `LOG_CHANNEL` 等環境變數設置無效。

  - **根本原因**：`podman exec sh -c` 中的命令是在一個新的 Shell 環境中執行，除非明確傳遞，否則外部環境變數不會自動繼承。
  - **避免**：在執行命令時，直接在 `sh -c` 的命令前設定環境變數。

    ```bash
        podman exec backend838 sh -c "cd /var/www/html/eagle && LOG_CHANNEL=stack php tests/api/你的測試腳本.php"
    ```

### 浮點數比較問題

- **問題**：在驗證 API 返回的浮點數值時，即使視覺上數值相同，程式碼比較結果卻顯示不符 (例如 `98.88 !== 98.88`)。

  - **根本原因**：浮點數在電腦內部以二進制儲存時可能存在精度問題，導致看似相同的浮點數在直接比較時被認為不相等。
  - **避免**：

    - **設定誤差範圍**：在比較浮點數時，應設定一個可接受的誤差範圍 (epsilon)，判斷兩個數的絕對差是否小於此誤差。

      ```php
        // 判斷 $value 與 $expectedValue 是否足夠接近
        if (abs($value - $expectedValue) > 0.001) { // 0.001 為可接受的誤差範圍
            // 處理錯誤
        }
      ```

    - **轉換為字串比較 (高精度)**：對於需要極高精度的浮點數比較，可以考慮將其轉換為字串後再進行比較，但這通常用於金融計算等特殊場景。

## 參考文件

- [API 測試技術文檔](https://www.notion.so/docs/ai-prompts/SUMMARY.md)
- [Eagle Laravel API 測試指南](https://www.notion.so/docs/ai-prompts/eagle-api-testing-guide.md)
- [本地 API 測試指南](https://www.notion.so/docs/development/local-api-testing-guide.md)
- [整合測試目錄](https://www.notion.so/tests/api/)

## 最近遇到的問題與解決方案 (2025-12-26 更新)

### 1. Token 驗證與 GET 請求參數類型問題

- **問題**：在測試 GET 請求時，若 Payload 包含整數 (如 `tenant_id=1`)，Token 生成與驗證可能因 PHP `$_GET` 自動將參數轉為字串而導致型別不符，進而驗證失敗。
- **解決方案**：
  - **方法 A (推薦)**：在測試 GET 請求時，使用 `X-Dev-Bypass: true` Header 繞過繁瑣的 Token 簽名檢查 (前提是環境變數允許)。
  - **方法 B**：若必須使用 Token，請確保 Payload 中的整數在傳入 `generateBackendToken` 時已明確轉型為字串 (String Casting)，以匹配 Middleware 的處理邏輯。

### 2. 複合主鍵 Model 無法使用 `refresh()`

- **問題**：針對如 `TenantPlatform` 這種使用複合主鍵的 Model，調用 `$model->refresh()` 會導致 SQL 錯誤 `Unknown column 'id'`，因為 Laravel 預設依賴單一 `id` 主鍵進行刷新。
- **解決方案**：禁止使用 `refresh()`。應手動使用 `Model::where(...)->first()` 重新查詢最新資料。

### 3. Agent 端 Controller 取不到 `$request->user()`

- **問題**：在自定義的 `OperatorAuthMiddleware` 架構下，操作員資訊被儲存在 `current_operator` 屬性中。直接在 Controller 使用 `$request->user()` 可能會因為 Guard 配置不同而返回 null，導致 "User not authenticated" 錯誤。
- **解決方案**：使用 `$request->attributes->get('current_operator')` 來獲取當前登入的操作員實例。
