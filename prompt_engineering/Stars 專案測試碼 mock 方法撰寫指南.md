# Stars 專案測試碼 mock 方法撰寫指南

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

### 2. Star 服務測試範例

#### 方法一：使用 app()->instance() 進行服務替換

```php
<?php
// tests/Feature/QcControllerTest.php
public function test_qc_platform_category_list()
{
    // 準備測試資料
    $expectedProvider = [
        'id' => 1,
        'name' => 'Test Provider',
        'server_country' => 1
    ];

    // Mock Star 服務
    $mockStar = Mockery::mock(\App\Services\Star::class);
    $mockStar->shouldReceive('provider')->andReturn($expectedProvider);

    // 替換服務容器中的實例
    app()->instance('Star', $mockStar);

    // Mock 其他依賴服務
    $this->mock(\App\Services\Qc::class, function ($mock) use ($expectedProvider) {
        $mock->shouldReceive('getPolicyName')->andReturn('taiwan');
        $mock->shouldReceive('getCompanyIpRanges')->andReturn(['127.0.0.1']);
    });

    // 執行測試
    $response = $this->getJson('/api/qc/platform/category/list');

    $response->assertStatus(200);
}
```

#### 方法二：使用服務綁定進行測試

```php
public function test_qc_game_sort_list()
{
    // 準備 mock 資料
    $mockProvider = ['id' => 1, 'name' => 'Test Provider'];

    // 綁定測試服務
    $this->app->bind('Star', function () use ($mockProvider) {
        $mock = Mockery::mock(\App\Services\Star::class);
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
    $response = $this->getJson('/api/qc/game/sort_list?category_type=1&sort_type=1');

    $response->assertStatus(200);
}
```

### 3. 完整測試案例範例

#### 測試類別結構

```php
<?php
namespace Tests\Feature\Http\Controllers;

use Tests\TestCase;
use App\Http\Controllers\QcController;
use Illuminate\Http\Request;
use Mockery;

class QcControllerTest extends TestCase
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
            'server_country' => 1
        ];

        // Mock Star 服務
        app()->instance('Star', Mockery::mock(\App\Services\Star::class, function ($mock) use ($provider) {
            $mock->shouldReceive('provider')->andReturn($provider);
        }));

        // Mock Qc 服務
        $mockQc = $this->mock(\App\Services\Qc::class, function ($mock) {
            $mock->shouldReceive('getPolicyName')->andReturn('taiwan');
            $mock->shouldReceive('getCompanyIpRanges')->andReturn(['192.168.1.100']);
            $mock->shouldReceive('getPlatformByIp')->andReturn('platform_001');
        });

        // Mock Platform 服務
        $mockPlatform = $this->mock(\App\Services\Platform::class, function ($mock) {
            $mock->shouldReceive('getByCode')->andReturn(['id' => 1, 'name' => 'Test Platform']);
        });

        // Mock ProviderPlatforms 服務
        $mockProviderPlatforms = $this->mock(\App\Services\ProviderPlatforms::class, function ($mock) {
            $mock->shouldReceive('platformLists')->andReturn([
                'count' => 1,
                'list' => collect([
                    [
                        'id' => 1,
                        'fullname' => 'Test Platform',
                        'brand' => 'TP',
                        'ctl_has_rtp' => true,
                        'has_rtp' => true
                    ]
                ])
            ]);
        });

        // 執行測試
        $response = $this->getJson('/api/qc/platform/category/list', [
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

