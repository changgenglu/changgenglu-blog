## 整合測試撰寫規則

### 概述

- 需遵守整合測試的精神。
- 若撰寫的 api 中有嚴重違反 SOLID 原則時，可以簡單提出，讓我評估後續的優化方向。
- 需遵守 coding style 的規範

### 撰寫風格內容總結

#### 撰寫標準

1. **檔案結構**：每個 API 方法獨立檔案，命名 `{MethodName}Test.php`
2. **檔案命名**：使用 `Test.php`（非 `IntegrationTest.php`）
3. **方法命名**：snake_case（非 camelCase）
4. **常數定義**：定義 `METHOD`、`URL`，使用 Laravel HTTP 狀態碼常數
5. **錯誤處理**：使用 `resources/lang/en/error.php` 定義的錯誤碼
6. **屬性類型**：使用 PHP 8 屬性類型聲明
7. **Mock 初始化**：在 `setUp()` 中初始化 Mock 服務實例
8. **測試行為設定**：在測試方法中設定 Mock 行為和斷言
9. **Redis 清理**：僅在測試實際使用 Redis 時操作
10. **測試覆蓋**：確保 input/output 正確，涵蓋所有商業邏輯
11. **測試資料**：優先使用 factory 建立
12. **資料修改**：優先修改現有資料而非新建

#### 測試覆蓋範圍

每個測試檔案須包含：
- **基本驗證**：缺少 header、無效 header
- **參數驗證**：必要參數、類型驗證、null 值
- **業務邏輯**：存在性驗證、狀態驗證
- **成功案例**：正常操作流程

#### 檔案結構範例

```
tests/Integration/ControllerName/
├── MethodNameTest.php    # 專注單一 API 方法測試
```

**結構原則**：每個檔案專注單一 API 方法，提高可維護性

#### 測試結構模板

**測試常數**：定義 `METHOD`、`URL` 常數，使用 Laravel HTTP 狀態碼常數

**屬性類型**：使用 PHP 8 屬性類型聲明（如 `private Providers $provider`）

**測試方法**：使用 `void` 返回類型，遵循 snake_case 命名規則

**測試常數與屬性宣告**

```php
private const METHOD = 'post';
private const URL = '/api/backend/qc/ips';

private Providers $provider;
private Platforms $platform;
private ProviderPlatforms $providerPlatform;
```

**生命週期**：
```php
public function setUp(): void
{
    parent::setUp();
    $this->setUpSQLiteForTesting();
    Redis::flushdb();
    $this->setLaravelStart();
    $this->setupTestData();
    $this->setupMockServices(); // 初始化 Mock 服務
}

public function tearDown(): void
{
    Mockery::close();
    Redis::flushdb();
    parent::tearDown();
}
```

**參數組織及斷言模式**：
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
$response->assertStatus(Response::HTTP_OK)
    ->assertJson($expectedResult);
```

#### 服務測試模板

**依賴注入測試**：
```php
protected function setupMockServices(): void
{
    $this->mockServices['gameSort'] = Mockery::mock(\App\Services\GameSort::class);
    $this->app->instance(\App\Services\GameSort::class, $this->mockServices['gameSort']);
}

public function test_dependency_injection(): void {
    $this->mockServices['gameSort']->shouldReceive('getSortedGames')
                                  ->with('slot')
                                  ->andReturn($expectedGames);

    $response = $this->postJson('/api/games/sort', ['category' => 'slot']);
    $response->assertStatus(200);
}
```

**Star 服務測試**：
```php
protected function setupMockServices(): void
{
    $this->mockServices['star'] = Mockery::mock(\App\Services\Star::class);
    app()->instance('Star', $this->mockServices['star']);
}

public function test_star_service_replacement(): void {
    $this->mockServices['star']->shouldReceive('provider')->andReturn($providerData);

    $response = $this->getJson('/api/qc/platform/category/list');
    $response->assertStatus(200);
}
```

**部分 Mock 測試**：
```php
public function test_partial_mock(): void {
    $mock = $this->partialMock(Service::class, function ($mock) {
        $mock->shouldReceive('method')->andReturn($expected);
    });
}
```

****測試類別結構**：
```php
class ExampleTest extends TestCase {
    private $mockServices = [];

    protected function tearDown(): void {
        Mockery::close();
        parent::tearDown();
    }

    protected function setupMockServices(): void
    {
        // 初始化常用 Mock 服務
        $this->mockServices['star'] = Mockery::mock(\App\Services\Star::class);
        $this->mockServices['qc'] = Mockery::mock(\App\Services\Qc::class);
        $this->mockServices['platform'] = Mockery::mock(\App\Services\Platform::class);

        // 綁定到服務容器
        app()->instance('Star', $this->mockServices['star']);
        app()->instance(\App\Services\Qc::class, $this->mockServices['qc']);
        app()->instance(\App\Services\Platform::class, $this->mockServices['platform']);
    }

    public function test_example(): void {
        // 在測試方法中設定 Mock 行為
        $this->mockServices['star']->shouldReceive('provider')->andReturn($providerData);
        $this->mockServices['qc']->shouldReceive('getPolicyName')->andReturn('taiwan');

        $response = $this->getJson('/api/test');
        $response->assertStatus(200)->assertJsonStructure($structure);
    }
}
```**

#### 測試原則

1. **環境設定**：在 `setUp()` 中初始化 Mock 服務實例，測試方法中設定行為
2. **服務識別**：優先依賴注入，減少 `app()` 直接調用
3. **Mock 策略**：依賴注入用 `$this->app->instance()`，註冊服務用 `app()->instance()`
4. **測試資料**：優先修改現有資料而非新建，測試後恢復原狀
5. **錯誤處理**：使用專案定義錯誤碼驗證
6. **資源清理**：測試結束清理 Mock，避免記憶體洩漏
