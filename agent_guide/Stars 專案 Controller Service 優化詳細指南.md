# Stars 專案 Controller Service 優化詳細指南

## 問題概述

當前專案使用自訂 Service Manager 模式，導致測試時 Mock 複雜、高耦合、維護困難。同時存在已經透過 Laravel 服務容器正確註冊的服務呼叫，需要正確識別和處理。

## 當前實現方式與問題分析

### 自訂 Service Manager 問題
```php
// 當前問題程式碼
$gameSortService = app('Service')->init('GameSort');
```

**問題分析**:
- **高耦合**: Mock 時需模擬整個 Service container，所有相關 service 均受影響
- **維護成本高**: 新增 service 呼叫需額外補上 Mock，否則報錯
- **Mock 冗長**: 每個方法都要明確定義 Mock 行為

### 已註冊服務呼叫（正確實作）
```php
// 已經正確的服務呼叫方式
$provider = app('Star')->provider();
```

## 建議解決方案

### 1. 依賴注入模式（推薦）

#### 建構子依賴注入
```php
<?php

namespace App\Http\Controllers;

use App\Services\GameSort;
use Illuminate\Http\Request;

class GameController extends Controller
{
    private GameSort $gameSortService;

    public function __construct(GameSort $gameSortService)
    {
        $this->gameSortService = $gameSortService;
    }

    public function index(Request $request)
    {
        // 直接使用注入的服務
        $games = $this->gameSortService->getSortedGames($request->get('category'));
        return response()->json($games);
    }
}
```

#### Laravel Container 解析
```php
public function someMethod()
{
    // 使用 Laravel 服務容器解析
    $gameSortService = app(GameSort::class);

    // 或使用特定介面
    $gameService = app(\App\Contracts\GameServiceInterface::class);

    return $gameSortService->processGames();
}
```

### 2. 例外情況處理：Star 服務特殊情況

#### 服務註冊確認
```php
<?php
// app/Providers/StarService.php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Star;

class StarService extends ServiceProvider
{
    public function register()
    {
        // Star 服務已正確註冊為 Laravel 服務容器管理的 singleton
        $this->app->singleton('Star', function ($app) {
            return new Star;
        });
    }
}
```

#### Star 服務使用範例
```php
<?php
// app/Http/Controllers/QcController.php
class QcController extends Controller
{
    public function platformCategoryList(Request $request)
    {
        // Star 服務已經透過服務容器註冊，不需要改為依賴注入
        $provider = app('Star')->provider();

        // 繼續使用 provider 資料
        $providerPlatformsWhere = [
            'provider_id' => $provider['id'],
            'provider_platforms.enable' => true,
            'platforms.enable' => true,
            'platforms.is_seamless' => true,
        ];

        // ... 其他處理邏輯
    }
}
```

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

## 優缺點對比表

| 方式                  | 優點                              | 缺點                              | 適用情境                          |
| -------------------- | --------------------------------- | --------------------------------- | --------------------------------- |
| 自訂 Service Manager | 動態取得 service，彈性高         | Mock 複雜，高耦合，維護困難      | 舊有系統過渡期                    |
| 依賴注入（推薦）     | Mock 簡單，低耦合，維護性高      | 需調整程式結構，初期成本         | 新開發功能、長期維護              |
| 已註冊服務呼叫       | 支援標準 Laravel 測試方法        | 需仔細識別服務註冊方式           | 已經透過服務容器正確註冊的服務   |

## 最佳實踐建議

### 開發階段建議
1. **優先採用依賴注入**: 對於新開發功能，優先採用建構子依賴注入模式
2. **識別現有服務**: 在重構現有程式碼時，先仔細識別服務的實際註冊方式
3. **維持已註冊服務**: 對於已經透過 Laravel 服務容器正確註冊的服務，維持現有呼叫方式
4. **避免自訂 Service Manager**: 識別並逐步替換真正的自訂 Service Manager 呼叫

### 重構執行建議
5. **服務檢查流程**:
   - 檢查 `app/Providers/` 目錄下的服務提供者檔案
   - 確認服務是否使用 `$this->app->singleton()` 或 `$this->app->bind()` 註冊
   - 測試服務是否支援標準 Laravel 服務容器操作

6. **測試標準化**: 統一使用 Laravel 標準測試方法進行服務 mock
7. **漸進式重構**: 逐步替換真正的自訂 Service Manager 呼叫，不強求全面改動

### 程式碼範例總結

#### 建構子依賴注入範例
```php
public function __construct(
    Qc $qcService,
    ProviderPlatforms $providerPlatformsService,
    ProviderGames $providerGameService,
    Category $categoryService,
    Platform $platformService,
    Language $languageService,
    GameLanguage $gameLanguageService,
    Encryption $encryptionService,
    Utils $utilsService
) {
    $this->qcService = $qcService;
    $this->providerPlatformsService = $providerPlatformsService;
    $this->providerGameService = $providerGameService;
    $this->categoryService = $categoryService;
    $this->platformService = $platformService;
    $this->languageService = $languageService;
    $this->gameLanguageService = $gameLanguageService;
    $this->encryptionService = $encryptionService;
    $this->utilsService = $utilsService;
}
```

#### 已註冊服務呼叫範例（維持不變）
```php
public function someMethod()
{
    // Star 服務已經透過服務容器註冊，直接使用
    $provider = app('Star')->provider();

    // 其他處理邏輯
    $policyName = $this->qcService->getPolicyName($provider['server_country']);
    $companyIps = $this->qcService->getCompanyIpRanges($policyName);

    return $companyIps;
}
```

## 技術原則總結

### 服務呼叫優化原則
1. **優先依賴注入**: 對於新開發功能，優先採用建構子依賴注入模式
2. **識別服務類型**: 仔細識別服務的實際註冊和管理方式，避免誤判
3. **維持已註冊服務**: 對於已經透過 Laravel 服務容器正確註冊的服務，維持現有呼叫方式
4. **漸進式重構**: 逐步替換真正的自訂 Service Manager 呼叫，不強求全面改動

### 技術規範原則
- **官方文件確認**: `partialMock` 僅對 container 解析或依賴注入有效
- **直接實例化處理**: 需使用 `Mockery::mock('overload:ClassName')` 機制
- **服務識別原則**: 透過檢查服務提供者檔案確認服務註冊方式
- **測試一致性**: 統一使用 Laravel 標準測試方法進行服務 mock

### 團隊開發原則
- **架構一致性**: 確保所有團隊成員理解服務呼叫的正確識別方法
- **測試標準化**: 統一依賴注入與服務容器測試模式
- **程式碼品質**: 透過正確的服務管理提升程式品質與可維護性
- **知識傳承**: 確保新進團隊成員理解服務呼叫的識別和處理原則
