# Gemini 專案策略

> 本文件定義專案的策略、方法論與上下文（strategy），隨任務演進。
> 依賴 `SYSTEM.md` 進行安全執行。

---

## 1. 開發者概況

- **角色：** 後端工程師
- **主要語言：** PHP 8.x
- **主要框架：** Laravel
- **資料庫：** MySQL、Redis
- **開發環境：** WSL (Ubuntu)

---

## 2. 技術棧偏好

### 2.1 後端 API

| 類別 | 偏好技術 |
|------|----------|
| **框架** | Laravel（PHP） |
| **ORM** | Eloquent |
| **快取** | Redis（Laravel Cache Facade） |
| **佇列** | Laravel Queue（Redis Driver） |
| **資料庫** | MySQL 8.x |
| **API 風格** | RESTful API |
| **認證** | Laravel Sanctum / Passport |
| **測試** | PHPUnit、Pest |

### 2.2 設定檔檢查優先順序

確認函式庫或框架可用時，優先檢查：

1. `composer.json` / `composer.lock`
2. `config/*.php`（Laravel 設定）
3. `.env` / `.env.example`
4. `routes/*.php`
5. 鄰近檔案的 `use` 語句

---

## 3. 專案規範優先（Source of Truth）

### 3.1 規範層級
- 專案規範 > 通用原則
- 若專案規範與通用原則衝突，**以專案規範為準**

### 3.2 術語一致性（DDD）
- 嚴格使用專案中既有的業務術語（如 `Account` vs `User`）
- 禁止自行創造新術語

---

## 4. 主要工作流程

### 4.1 軟體工程任務

修正錯誤、新增功能、重構或說明程式碼時，依序執行：

1. **理解：** 分析使用者請求與程式碼上下文。大量使用 `search_file_content` 和 `glob` 平行搜尋檔案結構、既有慣例和程式碼模式。用 `read_file` 和 `read_many_files` 驗證假設與理解。
2. **計畫：** 建立一個根據步驟 1 理解的明確且合理的解決方案。必要時以簡短清晰的方式告知使用者計畫。若相關，嘗試透過撰寫單元測試建立自我驗證循環。可用輸出日誌或除錯訊息協助驗證。
3. **實作：** 遵守核心規範，運用可用工具（如 `replace`、`write_file`、`run_shell_command`）執行計畫。
4. **驗證（測試）：** 如可行，透過專案既有測試程序驗證變更。Laravel 專案優先使用 `php artisan test` 或 `./vendor/bin/phpunit`。絕不假設標準測試指令。
5. **驗證（標準）：** 非常重要：程式碼變更後，執行專案特定的檢查指令（如 `./vendor/bin/pint`、`./vendor/bin/phpstan`、`composer run lint`）以確保程式碼品質及標準遵守。若不確定指令，可詢問使用者是否需執行及如何執行。

### 4.2 新功能開發（Laravel）

**目標：** 自主實作並交付符合 Laravel 最佳實務的功能模組。

1. **理解需求：** 分析使用者請求，明確核心功能、API 端點設計、資料模型及業務邏輯。若缺關鍵資訊，提出明確且精準的詢問。
2. **提案計畫：** 制定開發計畫，向使用者簡潔說明，包含：
   - 資料表設計（Migration）
   - Model 與關聯
   - Controller / Service 層級
   - 路由設計
   - 必要的驗證規則（FormRequest）
   - 測試策略
3. **使用者同意：** 取得使用者對計畫的認可。
4. **實作：** 按核准計畫自主開發，遵循專案既有架構模式。
   - 使用 `php artisan make:*` 指令生成骨架（如 `make:model -mfs`）
   - 遵循 Service / Repository 模式（若專案採用）
   - 確保 IDE helper 相容（`@property` PHPDoc）
5. **驗證：** 執行測試與靜態分析，確保無錯誤。
6. **收集回饋：** 提供相關 API 文件或測試指令，請求使用者回饋。

---

## 5. Laravel 特定指引

### 5.1 程式碼風格

- 遵循 PSR-12（或專案的 `pint.json` / `.php-cs-fixer.php` 設定）
- 使用 Laravel 慣用的命名方式：
  - Model：單數形（`User`、`Order`）
  - Controller：資源名+Controller（`UserController`）
  - Migration：描述性名稱（`create_users_table`）
  - 路由：複數形資源名（`/users`、`/orders`）

### 5.2 資料庫操作

- 使用 Eloquent ORM，避免原始 SQL（除非效能必要）
- 善用 Eager Loading 避免 N+1 查詢問題
- 使用 Migration 管理資料表結構
- Redis 操作優先使用 Laravel Cache/Session Facade

### 5.3 錯誤處理

- 使用 Laravel 內建 Exception 處理機制
- 自訂 Exception 放在 `app/Exceptions/`
- API 回應使用一致的錯誤格式

### 5.4 依賴注入

- 透過 Constructor Injection 注入依賴
- 善用 Service Container 和 Service Provider
- 避免在 Controller 中直接 new 物件

---

## 6. SOLID 原則遵循

執行任何程式碼生成或審查時，必須遵循 SOLID 原則：

### 6.1 SRP（Single Responsibility Principle，單一職責原則）
**定義**：每個 class/method 只有單一職責。

**檢查要點**：
- class 名稱是否清楚表達單一職責
- method 是否只做一件事
- class 的依賴數量是否合理

**紅旗標誌**：
- ❌ class 名稱包含 `And`、`Or`、`Manager`、`Handler` 但職責不明確
- ❌ method 超過 3 個主要動作
- ❌ 一個 class 依賴超過 7 個其他 class

**範例**：
```php
// ❌ 違反 SRP
class UserService {
    public function createUser() { ... }
    public function sendEmail() { ... }      // 應由 EmailService 處理
    public function generateReport() { ... } // 應由 ReportService 處理
}

// ✅ 符合 SRP
class UserService { /* 只處理用戶邏輯 */ }
class EmailService { /* 只處理郵件 */ }
class ReportService { /* 只處理報表 */ }
```

---

### 6.2 OCP（Open/Closed Principle，開放封閉原則）
**定義**：新功能透過擴展而非修改實現。

**檢查要點**：
- 新增功能是否需要修改現有 class
- 是否使用 Interface 或抽象類別來支援擴展

**紅旗標誌**：
- ❌ 使用 `switch/case` 或 `if-else` 鏈處理類型判斷
- ❌ 修改現有 class 以支援新功能

**範例**：
```php
// ❌ 違反 OCP
if ($type == 'A') { ... }
elseif ($type == 'B') { ... }
elseif ($type == 'C') { ... }

// ✅ 符合 OCP
interface IPaymentProcessor {
    public function process(): void;
}

class CreditCardProcessor implements IPaymentProcessor { ... }
class PayPalProcessor implements IPaymentProcessor { ... }
```

---

### 6.3 LSP（Liskov Substitution Principle，里氏替換原則）
**定義**：子類別能完全替代父類別。

**檢查要點**：
- 子類別是否改變父類別方法的預期行為
- 子類別是否拋出父類別未定義的例外

**紅旗標誌**：
- ❌ 子類別覆寫方法拋出 `NotImplementedException`
- ❌ 子類別改變父類別方法的預期行為

---

### 6.4 ISP（Interface Segregation Principle，介面隔離原則）
**定義**：介面精簡且專注。

**檢查要點**：
- 介面方法數量是否合理
- 實作類別是否需要實作所有方法

**紅旗標誌**：
- ❌ 介面方法超過 5 個
- ❌ 實作類別有空方法或拋出 `NotSupported`

---

### 6.5 DIP（Dependency Inversion Principle，依賴反轉原則）
**定義**：依賴抽象而非具體實作。

**檢查要點**：
- 是否使用依賴注入
- 是否依賴 Interface 而非具體類別

**紅旗標誌**：
- ❌ 直接 `new` 具體類別（非 DTO/Entity）
- ❌ 高層模組 import 低層模組具體類別
- ❌ 未使用依賴注入

**範例**：
```php
// ❌ 違反 DIP
class UserService {
    private $repository;
    
    public function __construct() {
        $this->repository = new UserRepository(); // 直接依賴具體類別
    }
}

// ✅ 符合 DIP
class UserService {
    private IUserRepository $repository;
    
    public function __construct(IUserRepository $repository) {
        $this->repository = $repository; // 依賴抽象 Interface
    }
}
```

---

## 7. 多層架構規範

執行任何程式碼生成或審查時，必須遵循多層架構規範：

| 層級 | 允許 | 禁止 |
|-----|-----|-----|
| **Controller** | Request → Service → Response | 業務邏輯、狀態判斷、Repository/Model 直呼 |
| **FormRequest** | 格式與型別驗證 | exists/unique 等 DB 查詢、業務判斷 |
| **Service** | 業務規則、狀態檢核、交易 | - |
| **Repository** | CRUD 資料存取 | 業務邏輯 |

### Service 層要求
- 必須透過 Interface 依賴 Repository（DIP）
- 驗證失敗需拋出具體 Exception（含錯誤語意）

---

## 8. 架構精神

執行任何程式碼生成或審查時，必須理解並遵循以下架構精神：

### 8.1 領域驅動設計（DDD, Domain-Driven Design）

**核心理念**：以業務領域為核心，建立通用語言（Ubiquitous Language），確保程式碼反映業務概念。

#### 8.1.1 Bounded Context（限界上下文）
**定義**：明確的業務邊界，每個上下文內部有獨立的模型與術語。

**檢查要點**：
- 上下文邊界是否明確定義
- 不同上下文之間的溝通是否透過 Anti-Corruption Layer 或 Domain Event

**紅旗標誌**：
- ❌ 跨上下文直接引用 Entity 或 Value Object
- ❌ 同一術語在不同上下文中有不同含義但未區分

#### 8.1.2 Aggregate（聚合）
**定義**：一組相關物件的集合，有一個 Aggregate Root 作為唯一入口。

**檢查要點**：
- 外部是否只透過 Aggregate Root 存取內部物件
- 交易邊界是否等同於 Aggregate 邊界

**紅旗標誌**：
- ❌ 外部直接存取非 Root 的內部 Entity
- ❌ 單一交易跨越多個 Aggregate
- ❌ Aggregate 過大（超過 5 個 Entity）

**範例**：
```php
// ✅ 符合 Aggregate 模式
class Order { // Aggregate Root
    private array $orderItems; // 內部 Entity
    
    public function addItem(Product $product, int $quantity): void {
        $this->orderItems[] = new OrderItem($product, $quantity);
    }
}

// ❌ 違反 Aggregate 模式
$orderItem = $orderItemRepository->find($id); // 直接存取內部 Entity
```

#### 8.1.3 Entity vs Value Object
**定義**：
- **Entity**：具有唯一識別（ID），生命週期內可變
- **Value Object**：無識別，不可變，由其屬性值定義

**檢查要點**：
- 是否正確區分 Entity 與 Value Object
- Value Object 是否為不可變（Immutable）

**紅旗標誌**：
- ❌ Value Object 有 setter 方法
- ❌ 比較 Value Object 時使用 ID 而非屬性值

**範例**：
```php
// ✅ Value Object（不可變）
class Money {
    public function __construct(
        public readonly int $amount,
        public readonly string $currency
    ) {}
    
    public function add(Money $other): Money {
        return new Money($this->amount + $other->amount, $this->currency);
    }
}

// ✅ Entity（有 ID）
class Account {
    private AccountId $id;
    private Money $balance;
    
    public function deposit(Money $amount): void {
        $this->balance = $this->balance->add($amount);
    }
}
```

#### 8.1.4 Domain Event（領域事件）
**定義**：表達領域中已發生的重要事實。

**檢查要點**：
- 事件名稱是否使用過去式（e.g., `OrderPlaced`）
- 事件是否為不可變

**紅旗標誌**：
- ❌ 事件名稱使用現在式或命令式（e.g., `PlaceOrder`）
- ❌ 事件包含領域邏輯
- ❌ 事件有 setter 方法

---

### 8.2 Clean Architecture（整潔架構）

**核心理念**：依賴方向由外向內，內層不知道外層的存在。

#### 8.2.1 同心圓依賴規則

| 層級 | 包含內容 | 可依賴 |
|-----|---------|-------|
| **Domain（核心）** | Entity, Value Object, Domain Event, Repository Interface | 無（最內層） |
| **Application** | Use Case, Application Service, DTO | Domain |
| **Infrastructure** | Repository Impl, External Service, Framework | Application, Domain |
| **Presentation** | Controller, API, UI | Application, Domain |

**檢查要點**：
- 依賴方向是否由外向內
- Domain 層是否有 Framework 依賴

**紅旗標誌**：
- ❌ Domain 層 import Framework 類別（如 Laravel Model、Eloquent）
- ❌ Application 層直接依賴 Infrastructure 實作
- ❌ Entity 繼承 Framework 的 Base Class

**範例**：
```php
// ❌ 違反 Clean Architecture（Domain 依賴 Framework）
namespace Domain\Entities;

use Illuminate\Database\Eloquent\Model;

class User extends Model { ... } // Domain 不應依賴 Eloquent

// ✅ 符合 Clean Architecture
namespace Domain\Entities;

class User { // Pure Domain Entity
    public function __construct(
        private UserId $id,
        private Email $email,
        private UserName $name
    ) {}
}

namespace Infrastructure\Persistence;

use Domain\Entities\User;

class EloquentUserRepository implements IUserRepository {
    public function findById(UserId $id): ?User { ... }
}
```

---

### 8.3 CQRS（Command Query Responsibility Segregation）

**核心理念**：將讀取（Query）與寫入（Command）操作分離，各自優化。

#### 8.3.1 Command（命令）
**定義**：表達意圖改變系統狀態的操作，無回傳值（或僅回傳 ID）。

**檢查要點**：
- Command 是否只表達意圖，不包含邏輯
- Command Handler 是否只處理一個 Command

**紅旗標誌**：
- ❌ Command 方法回傳複雜查詢結果
- ❌ 一個 Handler 處理多種 Command

**範例**：
```php
// ✅ Command 設計
class CreateOrderCommand {
    public function __construct(
        public readonly string $customerId,
        public readonly array $items
    ) {}
}

class CreateOrderCommandHandler {
    public function handle(CreateOrderCommand $command): OrderId {
        // 建立 Order Aggregate
        // 發送 Domain Event
        // 回傳 ID
    }
}
```

#### 8.3.2 Query（查詢）
**定義**：讀取資料，不改變系統狀態。

**檢查要點**：
- Query 是否為純讀取，無副作用
- Query 模型是否可針對讀取優化（可不同於寫入模型）

**紅旗標誌**：
- ❌ Query 方法改變系統狀態
- ❌ 強制使用相同模型進行讀寫

---

### 8.4 Event Sourcing（事件溯源）

**核心理念**：不儲存當前狀態，而是儲存所有狀態變更事件，透過重播事件重建狀態。

#### 8.4.1 Event Store（事件儲存）
**定義**：以 append-only 方式儲存所有 Domain Event。

**檢查要點**：
- 事件是否為不可變
- 是否支援事件版本控制
- 是否有 Snapshot 機制優化重播效能

**紅旗標誌**：
- ❌ 修改或刪除已儲存的事件
- ❌ 事件缺少時間戳或版本號
- ❌ 事件缺少足夠資訊重建狀態

#### 8.4.2 Aggregate 重建
**定義**：透過重播事件序列重建 Aggregate 當前狀態。

**範例**：
```php
// ✅ Event Sourcing 設計
class Account {
    private AccountId $id;
    private Money $balance;
    private array $pendingEvents = [];
    
    public static function reconstitute(array $events): self {
        $account = new self();
        foreach ($events as $event) {
            $account->apply($event);
        }
        return $account;
    }
    
    public function deposit(Money $amount): void {
        $event = new MoneyDeposited($this->id, $amount, new DateTimeImmutable());
        $this->apply($event);
        $this->pendingEvents[] = $event;
    }
    
    private function apply(DomainEvent $event): void {
        match (get_class($event)) {
            MoneyDeposited::class => $this->balance = $this->balance->add($event->amount),
            MoneyWithdrawn::class => $this->balance = $this->balance->subtract($event->amount),
        };
    }
}
```

#### 8.4.3 Projection（投影）
**定義**：根據事件建立的讀取模型，用於 Query 優化。

**檢查要點**：
- Projection 是否可從事件重建
- 是否支援多種 Projection 滿足不同查詢需求

**紅旗標誌**：
- ❌ Projection 作為唯一資料來源（應以事件為主）
- ❌ Projection 無法從事件重建

---

### 8.5 架構選擇指南

| 場景 | 建議架構 |
|-----|---------|
| 簡單 CRUD 應用 | 多層架構 + SOLID |
| 複雜業務邏輯 | DDD + Clean Architecture |
| 高讀寫比差異 | CQRS |
| 需要審計追蹤、時間旅行 | Event Sourcing |
| 複雜領域 + 高效能需求 | DDD + CQRS + Event Sourcing |

**注意**：架構複雜度應與業務複雜度相匹配，避免過度設計。

---

## 9. 專案記憶

> 此區塊記錄專案特定資訊，由 Gemini 在互動過程中累積。

<!-- 範例格式：
- 專案 X 的錯誤碼定義於 `resources/lang/zh-TW/error.php`
- API 版本控制使用 `/api/v1/` 前綴
- 快取 key 命名規則：`{module}:{entity}:{id}`
-->
