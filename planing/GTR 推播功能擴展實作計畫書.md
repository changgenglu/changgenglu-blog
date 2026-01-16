# GTR 推播功能擴展實作計畫書

## 1. 現有架構分析

### 1.1 GTR/Pusher 服務的運作方式

現有的推播服務位於 `app/Services/Pusher.php`，使用 Redis 作為訊息中介：

```php
<?php
namespace App\Services;

use Illuminate\Support\Facades\Redis;

class Pusher
{
    protected $redis;

    public function __construct()
    {
        $this->redis = Redis::connection('gtr');
    }

    // 控端推播：發布到所有營運平台
    public function publish(string $channel, string $command, array $data = [])
    {
        $message = [
            'command' => $command,
            'timestamp' => now()->timestamp,
            'list' => $data,
        ];
        $this->redis->publish($channel, json_encode($message));
    }

    // 管端推播：發布到特定營運平台
    public function publishProvider(array $provider, string $channel, string $command, array $data = [])
    {
        $message = [
            'command' => $command,
            'timestamp' => now()->timestamp,
            'client_id' => $provider['client_id'],
            'list' => $data,
        ];
        $this->redis->publish($channel, json_encode($message));
    }
}

```

### 1.2 IPusher 介面定義

現有的推播事件類型定義於 `app/Interfaces/IPusher.php`：

```php
<?php
namespace App\Interfaces;

interface IPusher
{
    const CHANNEL_GAME = 'game';
    const CHANNEL_MAINTENANCE = 'maintenance';

    const EVENT_MAINTENANCE_LIST = 'server_list';
    const EVENT_MAINTENANCE_SYSTEM = 'server_system';
    const EVENT_MAINTENANCE_PLATFORM = 'server_platform';
    const EVENT_MAINTENANCE_GAME = 'server_game';
}

```

### 1.3 現有維護推播的完整流程

### 1.3.1 控端遊戲維護推播 (GameMaintainController::setMaintain)

```php
// 取得遊戲維護狀態
$maintenanceStatus = $utilsService->getGameMaintenanceStatus($game['id']);

// GTR推播
app('Service')->init('Pusher')->publish(
    \App\Interfaces\IPusher::CHANNEL_MAINTENANCE,
    \App\Interfaces\IPusher::EVENT_MAINTENANCE_GAME,
    [
        [
            'id' => $game['id'],
            'maintain_begin_at' => $maintenanceStatus['maintain_begin_at'],
            'maintain_end_at' => $maintenanceStatus['maintain_end_at'],
            'maintaining' => $maintenanceStatus['maintaining'],
        ],
    ],
);

```

### 1.3.2 管端遊戲維護推播 (GameMaintainController::setMaintainByAgent)

```php
// GTR推播
app('Service')->init('Pusher')->publishProvider(
    $backend,
    \App\Interfaces\IPusher::CHANNEL_MAINTENANCE,
    \App\Interfaces\IPusher::EVENT_MAINTENANCE_GAME,
    [
        [
            'id' => $providerGame['id'],
            'maintain_begin_at' => $maintenanceStatus['maintain_begin_at'],
            'maintain_end_at' => $maintenanceStatus['maintain_end_at'],
            'maintaining' => $maintenanceStatus['maintaining'],
        ],
    ],
);

```

### 1.3.3 控端供應商維護推播 (PlatformController::setMaintain)

```php
// GTR推播
app('Service')->init('Pusher')->publish(
    \App\Interfaces\IPusher::CHANNEL_MAINTENANCE,
    \App\Interfaces\IPusher::EVENT_MAINTENANCE_PLATFORM,
    [
        [
            'id' => $maintain['id'],
            'maintain_begin_at' => $maintenanceStatus['maintain_begin_at'],
            'maintain_end_at' => $maintenanceStatus['maintain_end_at'],
            'maintaining' => $maintenanceStatus['maintaining'],
        ],
    ],
);

```

### 1.4 目前的推播 Payload 格式範例

維護推播 Payload 結構：

```json
{
    "command": "server_game",
    "timestamp": 1705388400,
    "list": [
        {
            "id": 123,
            "maintain_begin_at": "2024-01-16T10:00:00+08:00",
            "maintain_end_at": "2024-01-16T12:00:00+08:00",
            "maintaining": true
        }
    ]
}

```

管端推播 Payload 結構（含 client_id）：

```json
{
    "command": "server_game",
    "timestamp": 1705388400,
    "client_id": "ab08031e",
    "list": [
        {
            "id": 123,
            "maintain_begin_at": "2024-01-16T10:00:00+08:00",
            "maintain_end_at": "2024-01-16T12:00:00+08:00",
            "maintaining": true
        }
    ]
}

```

---

## 2. 完整影響範圍

### 2.1 需修改的檔案清單

### 2.1.1 介面檔案

| 檔案路徑 | 修改說明 |
| --- | --- |
| `app/Interfaces/IPusher.php` | 新增遊戲狀態變更、供應商狀態變更、地區白名單變更的事件常數 |

### 2.1.2 Controller 檔案

| 檔案路徑 | 需修改的方法 | 行數估計 |
| --- | --- | --- |
| `app/Http/Controllers/GameStatusController.php` | `disable()`, `release()`, `multiDisable()`, `multiRelease()` | ~60 行 |
| `app/Http/Controllers/AgentGameStatusController.php` | `enable()`, `disable()`, `release()`, `multiEnable()`, `multiDisable()`, `multiRelease()` | ~90 行 |
| `app/Http/Controllers/ProviderGameController.php` | `releaseGames()`, `multiReleaseGames()`, `enableGames()`, `multiEnableGames()`, `disableGames()`, `multiDisableGames()` | ~90 行 |
| `app/Http/Controllers/PlatformController.php` | `enable()`, `disable()` | ~30 行 |
| `app/Http/Controllers/AgentPlatformController.php` | `enable()`, `disable()` | ~30 行 |
| `app/Http/Controllers/PlatformCountryController.php` | `update()` | ~15 行 |

### 2.2 各 Controller 方法詳細說明

### 2.2.1 GameStatusController (控端遊戲狀態)

- **`disable(Request $request)`** - 單一遊戲停用
    - 目前回傳格式：單一遊戲物件
    - 需在 commit 後新增推播
- **`release(Request $request)`** - 單一遊戲上架
    - 目前回傳格式：單一遊戲物件
    - 需在 commit 後新增推播
- **`multiDisable(Request $request)`** - 批次遊戲停用
    - 目前回傳格式：`{ count, list }`
    - 需在 commit 後新增推播（一次推播所有變更）
- **`multiRelease(Request $request)`** - 批次遊戲上架
    - 目前回傳格式：`{ count, list }`
    - 需在 commit 後新增推播（一次推播所有變更）

### 2.2.2 AgentGameStatusController (管端遊戲狀態)

- **`enable(Request $request)`** - 單一遊戲內測
- **`disable(Request $request)`** - 單一遊戲停用
- **`release(Request $request)`** - 單一遊戲上架
- **`multiEnable(Request $request)`** - 批次遊戲內測
- **`multiDisable(Request $request)`** - 批次遊戲停用
- **`multiRelease(Request $request)`** - 批次遊戲上架

### 2.2.3 ProviderGameController (控端營運平台遊戲狀態)

- **`releaseGames(Request $request)`** - 單一遊戲上架
- **`multiReleaseGames(Request $request)`** - 批次遊戲上架
- **`enableGames(Request $request)`** - 單一遊戲內測
- **`multiEnableGames(Request $request)`** - 批次遊戲內測
- **`disableGames(Request $request)`** - 單一遊戲停用
- **`multiDisableGames(Request $request)`** - 批次遊戲停用

### 2.2.4 PlatformController (控端供應商狀態)

- **`enable(Request $request)`** - 啟用供應商
- **`disable(Request $request)`** - 停用供應商

### 2.2.5 AgentPlatformController (管端供應商狀態)

- **`enable(Request $request)`** - 營運平台啟用供應商
- **`disable(Request $request)`** - 營運平台停用供應商

### 2.2.6 PlatformCountryController (地區白名單)

- **`update(Request $request)`** - 更新供應商國家黑/白名單

### 2.3 需修改的 Service 檔案

目前不需要修改 Service 層，推播邏輯直接在 Controller 中處理（與現有實作模式一致）。

### 2.4 需新增的檔案

無需新增檔案，所有功能可在現有架構中實現。

### 2.5 需修改的測試檔案

目前專案中沒有針對這些 Controller 的測試檔案（tests/ 目錄下僅有 Example 測試）。

### 2.6 設定檔檢查

GTR Redis 設定已存在於 `config/database.php:312-316`：

```php
'gtr' => [
    'host' => env('REDIS_GTR_HOST', '127.0.0.1'),
    'password' => env('REDIS_GTR_PASSWORD', null),
    'port' => env('REDIS_GTR_PORT', 6379),
    'database' => env('REDIS_GTR_DB', 0),
],

```

**結論：不需要新增環境變數或設定檔。**

---

## 3. 技術設計

### 3.1 推播事件類型定義

需在 `app/Interfaces/IPusher.php` 新增以下常數：

```php
<?php
namespace App\Interfaces;

interface IPusher
{
    // 現有的頻道定義
    const CHANNEL_GAME = 'game';
    const CHANNEL_MAINTENANCE = 'maintenance';

    // 現有的維護事件
    const EVENT_MAINTENANCE_LIST = 'server_list';
    const EVENT_MAINTENANCE_SYSTEM = 'server_system';
    const EVENT_MAINTENANCE_PLATFORM = 'server_platform';
    const EVENT_MAINTENANCE_GAME = 'server_game';

    // 新增：遊戲狀態變更事件
    const EVENT_GAME_STATUS_CHANGE = 'game_status_change';

    // 新增：供應商狀態變更事件
    const EVENT_PLATFORM_STATUS_CHANGE = 'platform_status_change';

    // 新增：地區白名單變更事件
    const EVENT_PLATFORM_COUNTRY_CHANGE = 'platform_country_change';
}

```

### 3.2 每種操作的 Payload 結構設計

### 3.2.1 遊戲狀態變更推播 Payload

**控端推播（影響所有營運平台）：**

```json
{
    "command": "game_status_change",
    "timestamp": 1705388400,
    "list": [
        {
            "id": 123,
            "platform_id": 1,
            "enable": 0,
            "code": "game_code"
        }
    ]
}

```

**管端推播（僅影響特定營運平台）：**

```json
{
    "command": "game_status_change",
    "timestamp": 1705388400,
    "client_id": "ab08031e",
    "list": [
        {
            "id": 123,
            "platform_id": 1,
            "enable": 2,
            "code": "game_code"
        }
    ]
}

```

### 3.2.2 供應商狀態變更推播 Payload

**控端推播：**

```json
{
    "command": "platform_status_change",
    "timestamp": 1705388400,
    "list": [
        {
            "id": 1,
            "code": "platform_code",
            "enable": true
        }
    ]
}

```

**管端推播：**

```json
{
    "command": "platform_status_change",
    "timestamp": 1705388400,
    "client_id": "ab08031e",
    "list": [
        {
            "id": 1,
            "code": "platform_code",
            "enable": true
        }
    ]
}

```

### 3.2.3 地區白名單變更推播 Payload

**控端推播（地區白名單為全域設定，影響所有營運平台）：**

```json
{
    "command": "platform_country_change",
    "timestamp": 1705388400,
    "list": [
        {
            "platform_id": 1,
            "type": 1,
            "countries": ["TW", "JP", "KR"]
        }
    ]
}

```

### 3.3 批次操作的推播策略

採用**一次推播**策略（與現有維護推播一致）：

- 批次操作完成後，將所有變更的項目組成陣列
- 透過單次 `publish()` 或 `publishProvider()` 呼叫發送
- 前端收到後一次處理所有變更

**理由：**

1. 減少網路請求次數
2. 前端可以批次處理更新，避免多次 DOM 操作
3. 與現有的批次維護推播模式一致

### 3.4 錯誤處理機制

1. **推播在 DB Transaction 之外執行**：確保資料已經成功提交後才進行推播
2. **推播失敗不影響主流程**：推播失敗時應記錄錯誤日誌，但不拋出例外影響 API 回應
3. **推播使用 try-catch 包裝**（建議，但保持與現有實作一致）

現有程式碼模式（維持一致）：

```php
$db->commit();

// 推播在 commit 後執行
app('Service')->init('Pusher')->publish(
    \App\Interfaces\IPusher::CHANNEL_MAINTENANCE,
    \App\Interfaces\IPusher::EVENT_GAME_STATUS_CHANGE,
    $gtrPusherData,
);

```

---

## 4. 詳細實作步驟

### 4.1 實作順序（依賴關係排序）

```
Step 1: 修改 IPusher 介面
    ↓
Step 2: 實作控端遊戲狀態推播 (GameStatusController)
    ↓
Step 3: 實作管端遊戲狀態推播 (AgentGameStatusController)
    ↓
Step 4: 實作控端營運平台遊戲狀態推播 (ProviderGameController)
    ↓
Step 5: 實作控端供應商狀態推播 (PlatformController)
    ↓
Step 6: 實作管端供應商狀態推播 (AgentPlatformController)
    ↓
Step 7: 實作地區白名單推播 (PlatformCountryController)

```

### 4.2 各步驟詳細程式碼修改

### Step 1: 修改 IPusher 介面 (~6 行)

**檔案：** `app/Interfaces/IPusher.php`

```php
// 在現有常數後新增
const EVENT_GAME_STATUS_CHANGE = 'game_status_change';
const EVENT_PLATFORM_STATUS_CHANGE = 'platform_status_change';
const EVENT_PLATFORM_COUNTRY_CHANGE = 'platform_country_change';

```

### Step 2: GameStatusController (~60 行)

**檔案：** `app/Http/Controllers/GameStatusController.php`

**修改 `disable()` 方法，在 return 前新增：**

```php
// GTR推播 - 遊戲狀態變更
app('Service')->init('Pusher')->publish(
    \App\Interfaces\IPusher::CHANNEL_GAME,
    \App\Interfaces\IPusher::EVENT_GAME_STATUS_CHANGE,
    [
        [
            'id' => $game['id'],
            'platform_id' => $game['platform_id'],
            'enable' => $game['enable'],
            'code' => $game['code'],
        ],
    ],
);

```

**修改 `release()` 方法，在 return 前新增：**（同上）

**修改 `multiDisable()` 方法，在 return 前新增：**

```php
// GTR推播 - 遊戲狀態變更
$gtrPusherData = [];
foreach ($games['list'] as $game) {
    $gtrPusherData[] = [
        'id' => $game['id'],
        'platform_id' => $game['platform_id'],
        'enable' => $game['enable'],
        'code' => $game['code'],
    ];
}

app('Service')->init('Pusher')->publish(
    \App\Interfaces\IPusher::CHANNEL_GAME,
    \App\Interfaces\IPusher::EVENT_GAME_STATUS_CHANGE,
    $gtrPusherData,
);

```

**修改 `multiRelease()` 方法：**（同上）

### Step 3: AgentGameStatusController (~90 行)

**檔案：** `app/Http/Controllers/AgentGameStatusController.php`

**修改 `enable()` 方法，在 return 前新增：**

```php
// GTR推播 - 遊戲狀態變更
app('Service')->init('Pusher')->publishProvider(
    $backend,
    \App\Interfaces\IPusher::CHANNEL_GAME,
    \App\Interfaces\IPusher::EVENT_GAME_STATUS_CHANGE,
    [
        [
            'id' => $game['id'],
            'platform_id' => $game['platform_id'],
            'enable' => $game['enable'],
            'code' => $game['code'],
        ],
    ],
);

```

**修改 `disable()`, `release()` 方法：**（同上）

**修改 `multiEnable()`, `multiDisable()`, `multiRelease()` 方法：**

```php
// GTR推播 - 遊戲狀態變更
$gtrPusherData = [];
foreach ($games['list'] as $game) {
    $gtrPusherData[] = [
        'id' => $game['id'],
        'platform_id' => $game['platform_id'],
        'enable' => $game['enable'],
        'code' => $game['code'],
    ];
}

app('Service')->init('Pusher')->publishProvider(
    $backend,
    \App\Interfaces\IPusher::CHANNEL_GAME,
    \App\Interfaces\IPusher::EVENT_GAME_STATUS_CHANGE,
    $gtrPusherData,
);

```

### Step 4: ProviderGameController (~90 行)

**檔案：** `app/Http/Controllers/ProviderGameController.php`

**修改 `releaseGames()`, `enableGames()`, `disableGames()` 方法：**

```php
// GTR推播 - 遊戲狀態變更
app('Service')->init('Pusher')->publish(
    \App\Interfaces\IPusher::CHANNEL_GAME,
    \App\Interfaces\IPusher::EVENT_GAME_STATUS_CHANGE,
    [
        [
            'id' => $game['id'],
            'platform_id' => $game['platform_id'],
            'enable' => $game['enable'],
            'code' => $game['code'],
            'provider_id' => $provider['id'],
        ],
    ],
);

```

**修改 `multiReleaseGames()`, `multiEnableGames()`, `multiDisableGames()` 方法：**

```php
// GTR推播 - 遊戲狀態變更
$gtrPusherData = [];
foreach ($games['list'] as $game) {
    $gtrPusherData[] = [
        'id' => $game['id'],
        'platform_id' => $game['platform_id'],
        'enable' => $game['enable'],
        'code' => $game['code'],
        'provider_id' => $provider['id'],
    ];
}

app('Service')->init('Pusher')->publish(
    \App\Interfaces\IPusher::CHANNEL_GAME,
    \App\Interfaces\IPusher::EVENT_GAME_STATUS_CHANGE,
    $gtrPusherData,
);

```

### Step 5: PlatformController (~30 行)

**檔案：** `app/Http/Controllers/PlatformController.php`

**修改 `enable()` 方法，在 return 前新增：**

```php
// GTR推播 - 供應商狀態變更
app('Service')->init('Pusher')->publish(
    \App\Interfaces\IPusher::CHANNEL_GAME,
    \App\Interfaces\IPusher::EVENT_PLATFORM_STATUS_CHANGE,
    [
        [
            'id' => $platform['id'],
            'code' => $platform['code'],
            'enable' => $platform['enable'],
        ],
    ],
);

```

**修改 `disable()` 方法：**（同上）

### Step 6: AgentPlatformController (~30 行)

**檔案：** `app/Http/Controllers/AgentPlatformController.php`

**修改 `enable()` 方法，在 return 前新增：**

```php
// GTR推播 - 供應商狀態變更
app('Service')->init('Pusher')->publishProvider(
    $backend,
    \App\Interfaces\IPusher::CHANNEL_GAME,
    \App\Interfaces\IPusher::EVENT_PLATFORM_STATUS_CHANGE,
    [
        [
            'id' => $driver->getId(),
            'code' => $driver->getCode(),
            'enable' => $providerPlatform['enable'],
        ],
    ],
);

```

**修改 `disable()` 方法：**（同上）

### Step 7: PlatformCountryController (~15 行)

**檔案：** `app/Http/Controllers/PlatformCountryController.php`

**修改 `update()` 方法，在 return 前新增：**

```php
// GTR推播 - 地區白名單變更
app('Service')->init('Pusher')->publish(
    \App\Interfaces\IPusher::CHANNEL_GAME,
    \App\Interfaces\IPusher::EVENT_PLATFORM_COUNTRY_CHANGE,
    [
        [
            'platform_id' => $platform['id'],
            'type' => $validated['type'],
            'countries' => $countries,
        ],
    ],
);

```

---

## 5. 測試計畫

### 5.1 需修改的現有測試

目前專案中沒有針對這些 Controller 的單元測試或功能測試。(但測試分支有整合測試，需確認)

### 5.2 需要測試的場景

### 5.2.1 遊戲狀態推播測試

| 測試場景 | 預期行為 |
| --- | --- |
| 控端停用單一遊戲 | 發送全域遊戲狀態變更推播 |
| 控端上架單一遊戲 | 發送全域遊戲狀態變更推播 |
| 控端批量停用遊戲 | 發送包含多筆遊戲的全域推播 |
| 控端批量上架遊戲 | 發送包含多筆遊戲的全域推播 |
| 管端內測遊戲 | 發送平台專屬遊戲狀態變更推播 |
| 管端停用遊戲 | 發送平台專屬遊戲狀態變更推播 |
| 管端上架遊戲 | 發送平台專屬遊戲狀態變更推播 |
| 管端批量內測遊戲 | 發送包含多筆遊戲的平台專屬推播 |
| 管端批量停用遊戲 | 發送包含多筆遊戲的平台專屬推播 |
| 管端批量上架遊戲 | 發送包含多筆遊戲的平台專屬推播 |

### 5.2.2 供應商狀態推播測試

| 測試場景 | 預期行為 |
| --- | --- |
| 控端啟用供應商 | 發送全域供應商狀態變更推播 |
| 控端停用供應商 | 發送全域供應商狀態變更推播 |
| 管端啟用供應商 | 發送平台專屬供應商狀態變更推播 |
| 管端停用供應商 | 發送平台專屬供應商狀態變更推播 |

### 5.2.3 地區白名單推播測試

| 測試場景 | 預期行為 |
| --- | --- |
| 更新供應商黑名單 | 發送全域地區白名單更新推播 |
| 更新供應商白名單 | 發送全域地區白名單更新推播 |
| 清空供應商黑名單 | 發送空陣列的全域推播 |
| 清空供應商白名單 | 發送空陣列的全域推播 |

### 5.3 驗證方式

1. **~~單元測試~~**
    - ~~Mock Pusher Service 驗證推播是否被正確呼叫~~
    - ~~驗證推播參數（頻道、事件、payload）是否正確~~
2. **整合測試**
    - 訂閱 Redis 頻道，驗證實際推播內容
    - 使用測試環境的 Redis 進行端對端測試
    - 修改整合測試的測試碼
3. **手動測試**
    - 使用 Redis CLI 的 `SUBSCRIBE` 命令監聽頻道
    - 透過 Postman 或 curl 觸發 API，驗證推播訊息

**Redis CLI 監聽範例：**

```bash
redis-cli -h <redis-host> SUBSCRIBE game platform country

```

---

## 6. 風險評估與注意事項

### 6.1 對現有功能的潛在影響

| 風險項目 | 影響程度 | 緩解措施 |
| --- | --- | --- |
| 推播頻道變更影響前端 | 高 | 與前端團隊確認新事件類型的處理方式 |
| Redis 連線問題導致 API 變慢 | 中 | 推播失敗不應影響主流程，考慮加入超時機制 |
| 批次操作推播資料量過大 | 低 | 單次推播資料量預計在合理範圍內 |

### 6.2 需要協調的其他團隊

1. **前端團隊**
    - 需協調新增的推播事件類型
    - 需確認前端如何處理遊戲/供應商狀態變更推播
    - 需確認前端收到推播後的 UI 更新邏輯
2. **GTR 服務團隊**（如適用）
    - 確認新的事件類型是否需要在 GTR 服務端做對應處理

### 6.3 部署注意事項

1. **部署順序**
    - 先部署後端變更
    - 再部署前端變更（如需要）
    - 確保 GTR 服務穩定運行
2. **環境檢查**
    - 確認 Redis GTR 連線正常
    - 確認環境變數 `REDIS_GTR_HOST`, `REDIS_GTR_PORT`, `REDIS_GTR_DB` 已設定
3. **回滾計畫**
    - 推播功能不影響主流程，如有問題可暫時移除推播程式碼
    - 建議使用功能開關控制推播是否啟用（可選）

### 6.4 效能影響評估

| 項目 | 影響評估 |
| --- | --- |
| API 回應時間 | 影響極小，Redis publish 為非同步操作 |
| Redis 負載 | 推播訊息量較小，影響可忽略 |
| 前端處理 | 前端需處理新的推播事件，但邏輯簡單 |

### 6.5 需要注意的事項

1. **推播時機**
    - 確保推播在資料庫交易提交後才執行
    - 避免在 try-catch 區塊內發送推播，防止交易回滾後仍發送推播
2. **錯誤處理**
    - 推播失敗不應影響主要業務流程
    - 考慮加入推播失敗的 logging 機制
3. **效能考量**
    - 批量操作時避免逐筆推播，應合併為單一推播
    - 評估大量推播對 Redis 的影響
4. **前端協調**
    - 需與前端團隊確認推播格式
    - 需確認前端是否需要新的頻道訂閱
5. **向後相容**
    - 新增的推播不應影響現有維護推播功能
    - 確保現有的 `CHANNEL_MAINTENANCE` 功能正常運作
6. **測試環境**
    - 建議先在測試環境驗證推播功能
    - 確認 Redis 連線配置正確

---

## 7. 自我審查清單

- [x]  是否列出了所有需修改的 Controller 檔案？
- [x]  是否列出了所有需修改的 Service 檔案？（不需要修改 Service）
- [x]  是否列出了所有需修改的測試檔案？（目前沒有相關測試）
- [x]  是否列出了所有需新增的測試案例？
- [x]  是否分析了現有推播的 payload 格式？
- [x]  是否設計了新的推播 payload 結構？
- [x]  是否考慮了錯誤處理機制？
- [x]  是否考慮了批次操作 (multi\_\*) 的推播方式？
- [x]  是否評估了效能影響？
- [x]  是否列出了實作的先後順序和依賴關係？

---

## 8. 總結

本計畫書詳細說明了 GTR 推播功能擴展的實作方案，包括：

1. **影響範圍**：6 個 Controller，共 21 個 API 端點
2. **新增事件**：3 個新的推播事件類型
3. **預估修改行數**：約 320 行

實作遵循現有的推播模式，確保一致性和可維護性。