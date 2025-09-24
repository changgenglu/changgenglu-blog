# Laravel Test

> Laravel 預設支援 PHPUnit 來進行測試
>
> 設定文件 phpunit.xml
>
> 在 test 資料夾中有兩個子資料夾
>
> Feature 功能測試是針對大面積的程式碼進行測試
>
> Unit 單元測試是針對單一方法單獨進行測試

## 啟動測試

建立測試文件

```bash
// 在 feature 資料夾下建立一個測試的 class
php artisan make:test UserTest

// 在 unit 資料夾底下鍵立一個測試 class
php artisan make:test UserTest --unit
```

```php
namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExampleTest extends TestCase
{
    public function testBasicTest()
    {
        $this->assertTrue(true);
    }
}
```

啟動測試

```bash
php artisan test

// 指定要運行的特定測試類別
php artisan test --filter ExampleTest

// 運定特定的測試方法
php artisan test --filter ExampleTest::testExample

// 傳遞參數
php artisan test --testsuite=Feature --stop-on-failure
```

## Laravel PHPUnit 測試指令

### 🔹 1. 執行全部測試

```bash
./vendor/bin/phpunit
```

---

### 🔹 2. 執行特定資料夾的測試

```bash
./vendor/bin/phpunit tests/Integration/AgentGameController
```

---

### 🔹 3. 執行特定檔案

```bash
./vendor/bin/phpunit tests/Integration/AgentGameController/AgentGameControllerTest.php
```

---

### 🔹 4. 執行特定 class

```bash
./vendor/bin/phpunit --filter Tests\\Integration\\AgentGameController\\AgentGameControllerTest
```

---

### 🔹 5. 執行特定測試方法

（例如 `test_store_api`）

```bash
./vendor/bin/phpunit --filter test_store_api
```

或搭配檔案：

```bash
./vendor/bin/phpunit tests/Integration/AgentGameController/AgentGameControllerTest.php --filter test_store_api
```

---

### 🔹 6. 顯示更乾淨的輸出（加 `-testdox`）

```bash
./vendor/bin/phpunit --testdox tests/Integration/AgentGameController
```

輸出會變成比較可讀的格式，例如：

```
Agent Game Controller
 ✔ store api
 ✔ index api
 ✘ update api
```

---

### 🔹 7. 只跑失敗過的測試

```bash
./vendor/bin/phpunit --rerun
```

（需要 `phpunit.xml` 設定 cache，Laravel 預設就有）


### 🔹 8. 執行測試覆蓋率報告

```bash
./vendor/bin/phpunit --coverage-html coverage
```

- ✅ 成功產出 `coverage/index.html`
- ✅ 可使用 `php -S 0.0.0.0:8082 -t coverage/` 架簡易伺服器觀看

## 整合測試撰寫規則

### 概述

寫整合測試，資料目錄結構以及撰寫風格參考 `tests/Integration/PlatformConfigController/`，並且需遵守整合測試的精神。若撰寫的 api 中有嚴重違反 SOLID 原則時，可以簡單提出，讓我評估後續的優化方向。

### 撰寫風格內容總結

#### 撰寫標準

1. **檔案結構**：每個 API 方法建立獨立的測試檔案，檔案命名格式為 `{MethodName}Test.php`
2. **檔案命名**：使用 `Test.php` 而非 `IntegrationTest.php`
3. **方法命名**：使用 snake_case 而非 camelCase
4. **常數定義**：定義 METHOD、URL 常數，建議使用 Laravel 內建的 Response::HTTP_OK 等常數
5. **屬性類型**：使用 PHP 8 屬性類型聲明
6. **Redis 清理**：在 setUp/tearDown 中清理 Redis，需確認該測試的 api 是否有使用 redis，否則不應操作 redis
7. **測試撰寫**：重點需確保 input, output 的正確，以及測試涵蓋所有商業邏輯
8. **測試資料建立**：setupTestData 時建立資料原則：應優先使用 factory 中定義的 function。
9. **測試資料使用**：撰寫測試方法時，建議優先以現有的測試資料進行修改以符合當前至測試情境，並在斷言後復原其數據，而非建立新的測試資料

#### 測試覆蓋範圍

每個測試文件包含：

- 基本驗證測試（缺少 header、無效 header）
- 參數驗證測試（必要參數、類型驗證、null 值）
- 業務邏輯測試（存在性驗證、狀態驗證）
- 成功案例測試（正常操作流程）

#### 檔案結構範例

以 `PlatformCountryController` 為例：

```
tests/Integration/PlatformCountryController/
├── ListsTest.php      # 測試 lists API
├── GetTest.php        # 測試 get API
└── UpdateTest.php     # 測試 update API
```

每個測試檔案專注於單一 API 方法的測試，提高測試的可維護性和可讀性。

#### 測試結構範例

##### 添加測試常數

```php
const METHOD = 'get';
const URL = '/api/backend/provider/platform';
```

##### 使用 PHP 8 屬性類型聲明

```php
private Providers $provider;
private Platforms $platform;
private ProviderPlatforms $providerPlatform;
```

##### 測試方法格式

- 測試方法需使用 void 類型聲明

```php
/**
 * 缺少 x-pid header
 */
public function test_missing_pid_header(): void
{
    $params = [
        'provider_id' => $this->provider->id,
        'platform_id' => $this->platform->id,
    ];

    $expectedResult = [
        'error_code' => 40001,
        'error_msg' => 'permission_denied',
    ];

    $this->assertMissingHeader(
        self::METHOD,
        self::URL,
        $params,
        'x-pid',
        self::HTTP_STATUS_UNAUTHORIZED,
        $expectedResult
    );
}
```

##### setUp/tearDown 方法

- 需確認該測試的 api 是否有使用 redis，否則不應操作 redis

```php
public function setUp(): void
{
    parent::setUp();
    Redis::flushdb();
    $this->setLaravelStart();
    $this->setupTestData();
}

public function tearDown(): void
{
    Redis::flushdb();
    parent::tearDown();
}
```

#### 測試風格統一

##### 參數組織方式與斷言方式

```php
$params = [
    'provider_id' => $this->provider->id,
    'platform_id' => $this->platform->id,
];

$expectedResult = [
    'error_code' => 20001,
    'error_msg' => [
        'provider_id' => [
            'The provider id field is required.'
        ]
    ]
];

$response = $this->apiRequest(self::METHOD, self::URL, $params);
$response->assertStatus(self::HTTP_STATUS_OK)
    ->assertJson($expectedResult);
```
