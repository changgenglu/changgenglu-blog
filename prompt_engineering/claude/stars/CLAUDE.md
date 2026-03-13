# 🌟 Stars 專案策略

> 本文件定義 Stars 專案的開發策略、技術架構與領域知識，供 AI Agent 在互動過程中參考。

---

## 1. 專案概覽 (Project Overview)

Stars 是一個 **遊戲平台後端系統**（中間層），基於 **Laravel 9** 開發。主要負責整合多個遊戲供應商 (Platforms)，並提供給不同營運站台 (Providers) 使用。

### 核心職責
- **遊戲供應商整合**：取得遊戲連結、RTP、報表等。
- **遊戲內容管理**：多站台的遊戲與供應商狀態控制。
- **後台報表**：數據統計、日報表、月報表。
- **中間層角色**：作為客端遊戲平台與各遊戲供應商之間的中間層。

---

## 2. 開發環境與容器指令 (Environment)

本專案於 **WSL** 環境下開發，並使用 **Podman** 進行容器化管理。

| 項目 | 值 |
|------|-----|
| 容器名稱 | `stars` |
| 容器內路徑 | `/var/www/html/stars` |
| 服務端口 | `8082` |

### 常用容器指令

| 操作 | 指令 |
|------|------|
| 進入容器 | `podman exec -it stars sh` |
| 查看狀態 | `podman ps` |
| 查看日誌 | `podman logs -f stars` |
| 重啟容器 | `podman restart stars` |
| 停止容器 | `podman stop stars` |

---

## 3. 技術規格 (Technical Stack)

| 類別 | 技術 |
|------|------|
| 後端框架 | Laravel 9.x (PHP 8.0+) |
| 資料庫 | MySQL (多資料庫架構) |
| 快取 | Redis (Predis 驅動) |
| 佇列 | Laravel Horizon |
| API 文檔 | HG ApiDoc (`hg/apidoc`) |
| 第三方套件 | Telegram Bot, Microsoft Teams, GCS, GeoIP2, Vertex AI, Recaptcha, Mantisbt |

---

## 4. 系統架構規範 (Architecture Norms)

專案遵循標準 MVC 模式並強化了 Service 層，確保業務邏輯與傳輸層分離。

### 4.1 分層職責

| 層級 | 職責 | 注意事項 |
|------|------|----------|
| **Controller** | 請求驗證與回應 | 複雜邏輯須委派 Service |
| **Service** | 核心業務邏輯 | 透過 `app('Service')->init('Name')` 初始化（ServiceFactory 單例模式，同類別重複呼叫回傳同一實例） |
| **Model** | 資料存取與關聯 | - |
| **Interface** | 常數與介面規範 | 如 `IAnnouncement`（多數為常數定義而非方法簽名） |
| **Enum** | 列舉定義 | 如 `RedisKey`（Redis Key 統一管理） |
| **Platform** | 遊戲廠商介接層 | `Seamless/` 為無縫錢包整合，`Wallet/` 已棄用 |
| **Job** | 佇列任務 | 報表生成、遊戲排序、日誌處理 |
| **Command** | 排程與手動指令 | 43 個指令，含廠商子目錄（BW/、FTG/、FC/、YGR/） |
| **Library** | 外部整合庫 | HttpClient、GoogleCloudArmorApi、VertexAIClient、Recaptcha |
| **Helper** | 輔助類別 | GeoIP、GoogleStorage |

### 4.2 多資料庫架構 (Multi-Database)

專案連接多個資料庫，開發時需注意 `DB::connection()` 的使用：

| 連接名稱 | 用途 |
|----------|------|
| `management` | 主要業務資料（預設連接） |
| `record` | 操作紀錄 |
| `report` | 統計報表 |
| `entry` | 錢包交易流水 |
| `stars` | 星城系統資料 |
| `platform_1` | FTG 廠商專用 |
| `platform_2` | BW 廠商專用 |
| `platform_mg` | MG 廠商專用 |

### 4.3 Redis 快取策略

- **Key 統一管理**：所有 Key 定義於 `app/Enums/RedisKey.php`（175+ keys），禁止在程式碼中硬編碼 Key 字串
- **Key 格式**：`{業務前綴}:{資源}:{識別碼}`（冒號分隔，系統自動加上 `stars:` 前綴）
- **使用方式**：`RedisKey::GAME->build($gameId)` → 產出 `game:{gameId}`

```php
// ✅ 正確：使用 RedisKey Enum
RedisKey::GAME_CODE->build($platformId, $code)

// ❌ 錯誤：硬編碼 Key
$redis->get("game_code:{$platformId}:{$code}")
```

**Redis 連接分層**（定義於 `config/database.php`）：

| 連接 | 用途 | Key 前綴範例 |
|------|------|-------------|
| `game` | 遊戲快取、排序、RTP | `game:*`, `game:rtp:*`, `game:sort:*` |
| `platform` | 平台快取、設定 | `platform:*`, `provider:platform:*` |
| `provider` | 供應商快取 | `provider:*` |
| `user` | 用戶資料、別名、喜好 | `user:*`, `customer:*`, `favorite:*` |
| `cache` | 維護、廣宣快取 | `maintain:*`, `banner:*`, `announce:*` |
| `session` | 會話管理 | `session:*` |
| `report` | 報表統計 | `report:*`, `rank:*` |
| `command_lock` | 指令鎖定 | 指令專用鎖 |

---

## 5. 系統組成與後台架構

### 5.1 後台服務分類

後台功能分為 **控端** 與 **管端**，透過 `Satellite` 系統與 `Stars` 通訊：

| 類型 | 路徑 | 權限範圍 |
|------|------|----------|
| 控端 (Control) | `api/backend` | 所有站台資料、狀態、權限、供應商總開關 |
| 管端 (Agent) | `api/backend/agent` | 僅所屬單一站台的開關與報表 |

### 5.2 路由群組與認證

路由定義於 `routes/api.php`（616 行），分為以下群組：

| 群組 | 路徑前綴 | 中介層 | 說明 |
|------|---------|--------|------|
| 公開 | 無 | 無 | 系統時間、在線用戶 |
| 內部公司 | 無 | `auth:company` | 平台列表、報表同步、RTP 更新 |
| 後台控端 | `/backend` | `auth:back` | 遊戲/供應商/報表/廣宣/標籤管理 |
| 後台管端 | `/backend/agent` | `auth:back` | 所屬站台的開關與報表 |
| 客端 | `/client` | `auth:provider:maintain` | 遊戲列表、連結、RTP、統計 |
| 廠商 QC | `/platform` | `auth:platform_user` | 廠商遊戲列表、RTP、問題追蹤 |
| QC 內部 | `/qc` | `auth:provider` | 分類列表、遊戲排序 |

**認證中介層對照**（定義於 `Authenticate.php`）：

| 中介層 | 用途 |
|--------|------|
| `auth:back` | 後台認證（控端/管端） |
| `auth:provider` | 廠商認證 |
| `auth:provider:maintain` | 廠商 + 維護模式檢查 |
| `auth:company` | 公司內部認證 |
| `auth:platform_user` | 廠商 QC 認證 |
| `auth:customer` | 客戶認證 |

### 5.3 外部系統關聯

| 系統 | 說明 |
|------|------|
| 客端 (Client FE) | 多個營運平台，請求遊戲列表與連結 |
| 總部 (HQ) | 負責會員、錢包、登入驗證 |
| Platform (廠商) | 提供遊戲與交易 API |
| Puppy (橋接器) | 我方主動串接 MG/AB 協議的代理層 |

---

## 6. 領域知識與業務邏輯 (Domain Knowledge)

### 6.1 術語定義

| 術語 | 定義 |
|------|------|
| Provider (站台) | 指營運平台、管端 |
| Platform (供應商) | 指遊戲廠商（如 MG, AB, FTG） |

### 6.2 金流邏輯

> ⚠️ **專案不處理金流**：所有錢包交易、餘額查詢、下注派彩均由 **總部** 與 **供應商** 直接對接，Stars 內的相關舊邏輯已棄用。

---

## 7. 架構圖 (Architecture)

```mermaid
flowchart LR
    classDef internal fill:#f0f9ff,stroke:#0369a1,stroke-width:1px
    classDef external fill:#fff7ed,stroke:#9a3412,stroke-width:1px

    class SatelliteFE,SatelliteBE,Stars,Cron internal
    class ClientFE,HQ,Vendor,Puppy,VendorMGAB external

    %% 前端
    ClientFE[客端前端 Web] -->|玩家登入| HQ[總部]
    HQ -->|回傳 xinkey| ClientFE
    ClientFE <-->|遊戲連結（xinkey）| Stars

    %% Satellite 後台
    SatelliteFE[後台（控/館端）] --> SatelliteBE[Satellite]
    SatelliteBE --> Stars
    
    %% 排程機
    Cron[Cron] -->|排程呼叫| Stars

    %% Stars 與廠商溝通
    Stars <-->|遊戲連結（xinkey）| Vendor[其他廠商]
    Stars <-->|遊戲連結（xinkey）| Puppy[Puppy 橋接器]
    VendorMGAB[MG/AB 廠商] <--> Puppy

    %% 廠商與總部溝通
    Vendor -->|登入/交易請求| HQ
    Puppy -->|登入/交易請求| HQ

    %% RTP 排程
    Stars -.->|每 10 秒取得 RTP| Vendor
    Stars -.->|每 10 秒取得 RTP| Puppy
    
    %% 報表請求
    Stars -->|報表請求| Vendor
```

---

## 8. 請求流程圖 (Request Flows)

### 8.1 客端取得遊戲連結 (先登入才給連結)

```mermaid
sequenceDiagram
  autonumber
  participant ClientFE as 客端
  participant HQ as 總部（會員/錢包）
  participant Stars as Stars
  participant Vendor as 遊戲供應商

  ClientFE->>HQ: 登入請求
  HQ-->>ClientFE: 回傳 xinkey
  ClientFE->>Stars: 攜帶 xinkey 請求遊戲連結
  Stars->>Vendor: 要求遊戲連結
  Vendor->>HQ: 登入
  HQ-->>Vendor: 玩家 info
  Vendor-->>Stars: 遊戲連結
  Stars-->>ClientFE: 遊戲連結
  ClientFE->>Vendor: 開啟遊戲
  Note over Vendor,HQ: 下注/派彩/餘額查詢均由 遊戲供應商 ↔ 總部 溝通
  Vendor->>ClientFE: 結束遊戲
```

### 8.2 後台請求流程

```mermaid
sequenceDiagram
  participant backstageFE as 後台（控/館端）
  participant Satellite as Satellite
  participant Stars as Stars

  backstageFE->>Satellite: 登入
  Satellite->>Satellite: 使用者權限驗證
  Satellite-->>backstageFE: 登入成功
  
  backstageFE->>Satellite: 控端請求
  backstageFE->>Satellite: 館端請求
  Satellite->>Satellite: 控/館端驗證
  
  Satellite->>Stars: 發送請求
  Stars-->>Satellite: 響應結果
  
  Satellite-->>backstageFE: 響應結果
```

---

## 9. 開發規範 (Conventions)

### 9.1 命名規範 (Naming)

| 項目 | 規範 | 範例 |
|------|------|------|
| 變數/方法 | 小駝峰，動詞開頭 | `getUser`, `calculateTotal` |
| 類別 | 大駝峰 | `GameService`, `PlayerModel` |
| 介面 | 大 `I` 開頭 | `IGame`, `IAnnouncement` |
| Controller/Model/Service 檔案 | PascalCase | `GameController.php` |
| Config/Lang/Resources 檔案 | snake_case | `game_config.php` |

### 9.2 程式碼風格

#### 大括弧規則

```php
// ✅ 正確：函數斷行
public function getUser()
{
    return $this->user;
}

// ✅ 正確：控制結構不斷行
if ($condition) {
    // ...
}

// ❌ 錯誤：函數不斷行
public function getUser() {
    return $this->user;
}

// ❌ 錯誤：控制結構斷行
if ($condition)
{
    // ...
}
```

#### Import 順序

```php
// ✅ 正確順序
use Illuminate\Support\Facades\DB;        // 1. Vendor 核心
use App\Exceptions\NotFoundException;     // 2. Exception
use App\Services\GameService;             // 3. 自定義 Class
use App\Interfaces\IGame;                 // 4. Interface
```

#### 字串使用

```php
// ✅ 正確：純字串使用單引號
$name = 'Stars';
$key = 'game_code';

// ✅ 正確：需要變數插值時使用雙引號
$message = "Welcome, {$name}!";

// ❌ 錯誤：純字串使用雙引號
$name = "Stars";
```

### 9.3 錯誤處理 (Error Handling)

```php
// ✅ 正確：使用具體語意的異常
throw new NotFoundException('Game not found');
throw new ParameterException('Invalid game ID');

// ❌ 錯誤：使用通用 Exception
throw new Exception('Error occurred');
```

**可用的異常類別**（皆繼承 `AbstractException`）：

| 類別 | 用途 |
|------|------|
| `NotFoundException` | 資源不存在 (404) |
| `ParameterException` | 參數錯誤 (422) |
| `RuntimeException` | 執行時錯誤 |
| `AuthException` | 認證錯誤 (401) |
| `ForbiddenException` | 禁止存取 (403) |
| `PermissionException` | 權限不足 |
| `ExternalException` | 外部系統錯誤 |
| `MaintainException` | 維護狀態異常 |

---

## 10. 測試規範 (Testing)

專案使用 **SQLite 記憶體資料庫** 進行測試，所有多資料庫連接在測試環境中統一導向 SQLite。

### 10.1 測試基類選擇

| 測試類型 | 基類 / Trait | 用途 |
|---------|-------------|------|
| 整合測試 | `TestCase` + `RefreshDatabaseUsingSQLite` | Controller 層端對端測試 |
| 單元測試 | `TestCase` + `SQLiteUnitTest` | Service / Model 層邏輯測試 |

```php
// 整合測試範例
use Tests\RefreshDatabaseUsingSQLite;

class GameListsIntegrationTest extends TestCase
{
    use RefreshDatabaseUsingSQLite;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpSQLiteForTesting();
    }
}
```

### 10.2 測試執行指令

```bash
# 須在容器內執行（podman exec -it stars sh）
php artisan test                          # 全部測試
php artisan test --testsuite=Unit         # 單元測試
php artisan test --testsuite=Integration  # 整合測試
php artisan test --filter=GameController  # 指定測試
```

### 10.3 測試目錄結構

```
tests/
├── Integration/          # 整合測試（按 Controller 分目錄）
│   ├── GameController/
│   ├── AgentGameController/
│   └── ...
├── Unit/                 # 單元測試
├── Support/              # 測試輔助 Trait
└── Mocks/                # Mock 物件
```

---

*本文件包含專案核心架構與環境設定，開發時請嚴格遵守。*
