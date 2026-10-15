# Laravel 測試碼 mock 方法撰寫指南

> 整理在 Laravel 測試中，依 Service 的註冊方式選擇 mock 做法的範例：建構子注入、已註冊別名、部分 mock。整理於 2026 年。

## 測試實作指南

### 1. 依賴注入測試範例

#### 測試檔案結構

```php
<?php
// tests/Feature/GameControllerTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Services\GameSort;
use Mockery;

class GameControllerTest extends TestCase
{
    public function test_game_sorting()
    {
        // 準備測試資料
        $requestData = ['category' => 'slot'];

        // Mock GameSort 服務
        $mockGameSort = Mockery::mock(GameSort::class);
        $mockGameSort->shouldReceive('getSortedGames')
                    ->with('slot')
                    ->andReturn([
                        ['id' => 1, 'name' => 'Game 1'],
                        ['id' => 2, 'name' => 'Game 2']
                    ]);

        // 綁定 mock 到服務容器
        $this->app->instance(GameSort::class, $mockGameSort);

        // 執行測試
        $response = $this->postJson('/api/games/sort', $requestData);

        // 驗證結果
        $response->assertStatus(200)
                ->assertJsonCount(2);
    }
}
```

#### 部分 Mock 測試

```php
public function test_partial_mock()
{
    // 使用 partialMock 只模擬特定方法
    $mockService = $this->partialMock(\App\Services\GameSort::class, function ($mock) {
        $mock->shouldReceive('getSortedGames')->andReturn([
            ['id' => 1, 'name' => 'Mocked Game']
        ]);
    });

    // 其他方法維持原有行為
    $realService = app(GameSort::class);
    $this->assertInstanceOf(GameSort::class, $realService);
}
```

### 2. 已註冊別名服務的測試範例

以容器別名 `Site` 為例（服務以 `singleton('Site', ...)` 註冊）。

#### 方法一：使用 app()->instance() 替換服務

```php
<?php
// tests/Feature/ReportControllerTest.php
public function test_platform_category_list()
{
    // 準備測試資料
    $expectedProvider = [
        'id' => 1,
        'name' => 'Test Provider',
        'region' => 1
    ];

    // Mock Site 服務
    $mockSite = Mockery::mock(\App\Services\Site::class);
    $mockSite->shouldReceive('provider')->andReturn($expectedProvider);

    // 替換服務容器中的實例
    app()->instance('Site', $mockSite);

    // Mock 其他依賴服務
    $this->mock(\App\Services\Policy::class, function ($mock) {
        $mock->shouldReceive('getPolicyName')->andReturn('default');
        $mock->shouldReceive('getAllowedIpRanges')->andReturn(['127.0.0.1']);
    });

    // 執行測試
    $response = $this->getJson('/api/platform/category/list');

    $response->assertStatus(200);
}
```

#### 方法二：使用服務綁定

```php
public function test_game_sort_list()
{
    // 準備 mock 資料
    $mockProvider = ['id' => 1, 'name' => 'Test Provider'];

    // 綁定測試服務
    $this->app->bind('Site', function () use ($mockProvider) {
        $mock = Mockery::mock(\App\Services\Site::class);
        $mock->shouldReceive('provider')->andReturn($mockProvider);
        return $mock;
    });

    // Mock 其他服務
    $this->mock(\App\Services\ProviderPlatforms::class, function ($mock) {
        $mock->shouldReceive('platformLists')->andReturn([
            'count' => 1,
            'list' => collect([['id' => 1, 'platform_id' => 1]])
        ]);
    });

    // 執行測試
    $response = $this->getJson('/api/game/sort_list?category_type=1&sort_type=1');

    $response->assertStatus(200);
}
```

### 3. 完整測試案例範例

#### 測試類別結構

```php
<?php
namespace Tests\Feature\Http\Controllers;

use Tests\TestCase;
use Mockery;

class ReportControllerTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_platform_category_list_with_ip_filtering()
    {
        // 準備測試資料
        $provider = [
            'id' => 1,
            'name' => 'Test Provider',
            'region' => 1
        ];

        // Mock Site 服務
        app()->instance('Site', Mockery::mock(\App\Services\Site::class, function ($mock) use ($provider) {
            $mock->shouldReceive('provider')->andReturn($provider);
        }));

        // Mock Policy 服務
        $this->mock(\App\Services\Policy::class, function ($mock) {
            $mock->shouldReceive('getPolicyName')->andReturn('default');
            $mock->shouldReceive('getAllowedIpRanges')->andReturn(['192.168.1.100']);
            $mock->shouldReceive('getPlatformByIp')->andReturn('platform_001');
        });

        // Mock Platform 服務
        $this->mock(\App\Services\Platform::class, function ($mock) {
            $mock->shouldReceive('getByCode')->andReturn(['id' => 1, 'name' => 'Test Platform']);
        });

        // Mock ProviderPlatforms 服務
        $this->mock(\App\Services\ProviderPlatforms::class, function ($mock) {
            $mock->shouldReceive('platformLists')->andReturn([
                'count' => 1,
                'list' => collect([
                    [
                        'id' => 1,
                        'fullname' => 'Test Platform',
                        'brand' => 'TP',
                        'has_rtp' => true
                    ]
                ])
            ]);
        });

        // 執行測試
        $response = $this->getJson('/api/platform/category/list', [
            'station_name' => 'test_station'
        ]);

        // 驗證回應
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'count',
                    'list' => [
                        '*' => ['id', 'fullname', 'brand', 'category_types', 'has_rtp']
                    ]
                ]);
    }
}
```
