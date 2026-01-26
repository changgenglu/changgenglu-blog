# PHP 方法可見度（Visibility）指南

## 目錄
- [概述](#概述)
- [三種可見度等級](#三種可見度等級)
- [基礎範例](#基礎範例)
- [實際應用情境](#實際應用情境)
- [繼承中的可見度](#繼承中的可見度)
- [介面與可見度](#介面與可見度)
- [最佳實踐](#最佳實踐)
- [常見問題](#常見問題)

---

## 概述

### 可見度（Visibility）的概念
可見度決定了類別成員（屬性和方法）的可訪問性。PHP 提供三種可見度等級：
- **public**: 公開的，任何地方都可以訪問
- **protected**: 保護的，只有類別內部及其子類別可以訪問
- **private**: 私有的，只有類別內部可以訪問

### 為什麼需要可見度？
- **封裝**：隱藏內部實作細節，只暴露必要的介面
- **安全性**：防止外部程式碼直接修改內部狀態
- **維護性**：明確哪些方法應該被外部調用，哪些是內部實作
- **測試**：容易區分公共 API 和內部實作

---

## 三種可見度等級

### 1. public（公開方法）

#### 定義
- 任何地方都可以訪問
- 類別外部可以呼叫
- 子類別可以覆寫

#### 情境
- **對外介面**：提供給外部使用的方法
- **API 方法**：需要在 Controller 或 Route 中呼叫
- **被測試的方法**：單元測試需要訪問的方法
- **介面實作**：介面要求的方法必須是 public

#### 範例
```php
class UserService
{
    /**
     * 取得使用者資料
     * 這是公開方法，Controller 或 Route 可以呼叫
     */
    public function getUser(int $userId): User
    {
        // 邏輯實作
        return new User();
    }

    /**
     * 建立使用者
     * 外部可以呼叫此方法
     */
    public function createUser(string $email, string $password): User
    {
        // 建立邏輯
        return new User();
    }
}

// 使用範例
$service = new UserService();
$user = $service->getUser(123);  // ✅ 可以呼叫
```

---

### 2. protected（保護方法）

#### 定義
- 只有類別**內部**可以訪問
- **子類別**可以訪問和覆寫
- **外部**無法訪問

#### 情境
- **內部輔助方法**：被公開方法呼叫的內部方法
- **繼承架構**：父類別希望子類別能使用，但不對外公開
- **模板方法模式**：定義骨架，讓子類別實作特定步驟
- **共通邏輯**：多個子類別共用的邏輯

#### 範例
```php
class PaymentProcessor
{
    /**
     * 公開方法：處理付款
     */
    public function processPayment(float $amount): bool
    {
        // 驗證金額
        if (!$this->validateAmount($amount)) {
            return false;
        }

        // 扣款
        if (!$this->deductFunds($amount)) {
            return false;
        }

        // 記錄日誌
        $this->logTransaction($amount);

        return true;
    }

    /**
     * 保護方法：驗證金額
     * 子類別可以使用此方法，但外部無法呼叫
     */
    protected function validateAmount(float $amount): bool
    {
        return $amount > 0 && $amount <= 1000000;
    }

    /**
     * 保護方法：扣款
     * 子類別可以覆寫此方法實作不同的扣款邏輯
     */
    protected function deductFunds(float $amount): bool
    {
        // 預設實作
        return true;
    }

    /**
     * 保護方法：記錄交易
     */
    protected function logTransaction(float $amount): void
    {
        // 記錄邏輯
    }
}

class CreditCardProcessor extends PaymentProcessor
{
    /**
     * 子類別可以覆寫保護方法
     */
    protected function deductFunds(float $amount): bool
    {
        // 信用卡扣款邏輯
        return true;
    }

    /**
     * 子類別可以使用父類別的保護方法
     */
    public function processCard(float $amount): bool
    {
        if (!$this->validateAmount($amount)) {  // ✅ 可以使用父類別的保護方法
            return false;
        }
        return $this->processPayment($amount);
    }
}

// 使用範例
$processor = new PaymentProcessor();
$processor->processPayment(1000);  // ✅ 可以呼叫公開方法

$processor->validateAmount(1000);  // ❌ 錯誤！無法訪問保護方法

$cardProcessor = new CreditCardProcessor();
$cardProcessor->processCard(1000);  // ✅ 子類別公開方法可以呼叫
```

---

### 3. private（私有方法）

#### 定義
- **只有類別內部**可以訪問
- **子類別無法訪問**
- **外部無法訪問**

#### 情境
- **內部實作細節**：類別內部使用的輔助方法
- **不應該被外部呼叫**：僅供類別內部使用
- **不期望被子類別覆寫**：固定實作，不想被改變
- **工具方法**：轉換、格式化等純內部使用的工具

#### 範例
```php
class EmailSender
{
    /**
     * 公開方法：發送郵件
     */
    public function send(string $to, string $subject, string $body): bool
    {
        // 驗證郵件地址
        if (!$this->isValidEmail($to)) {
            return false;
        }

        // 格式化內容
        $formattedBody = $this->formatBody($body);

        // 發送
        return $this->performSend($to, $subject, $formattedBody);
    }

    /**
     * 私有方法：驗證郵件地址
     * 只有此類別內部可以使用，外部和子類別都無法呼叫
     */
    private function isValidEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * 私有方法：格式化郵件內容
     */
    private function formatBody(string $body): string
    {
        return strip_tags($body);
    }

    /**
     * 私有方法：實際執行發送
     */
    private function performSend(string $to, string $subject, string $body): bool
    {
        // 實際發送邏輯
        return true;
    }
}

class EmailSenderWithTemplate extends EmailSender
{
    /**
     * 子類別無法訪問父類別的私有方法
     */
    public function sendTemplate(string $to, string $templateName): bool
    {
        // $this->isValidEmail($to);  // ❌ 錯誤！無法訪問父類別私有方法

        // 必須自己實作驗證邏輯
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            return false;
        }

        $body = $this->loadTemplate($templateName);
        return $this->send($to, 'Template Email', $body);
    }

    private function loadTemplate(string $name): string
    {
        return "Template content for {$name}";
    }
}

// 使用範例
$sender = new EmailSender();
$sender->send('user@example.com', 'Hello', 'Body');  // ✅ 可以呼叫公開方法

$sender->isValidEmail('test@test.com');  // ❌ 錯誤！無法訪問私有方法

$templateSender = new EmailSenderWithTemplate();
$templateSender->sendTemplate('user@example.com', 'welcome');  // ✅ 可以呼叫
```

---

## 基礎範例

### 完整範例：購物車類別

```php
class ShoppingCart
{
    private array $items = [];
    private float $taxRate = 0.05;

    /**
     * 公開方法：新增商品
     */
    public function addItem(string $productName, float $price, int $quantity = 1): void
    {
        $this->validateItem($productName, $price, $quantity);
        $this->items[] = [
            'name' => $productName,
            'price' => $price,
            'quantity' => $quantity,
        ];
    }

    /**
     * 公開方法：取得總額
     */
    public function getTotal(): float
    {
        $subtotal = $this->calculateSubtotal();
        $tax = $this->calculateTax($subtotal);

        return $subtotal + $tax;
    }

    /**
     * 公開方法：清空購物車
     */
    public function clear(): void
    {
        $this->items = [];
    }

    /**
     * 保護方法：計算小計
     * 子類別可能需要覆寫此方法（例如：VIP 折扣）
     */
    protected function calculateSubtotal(): float
    {
        $subtotal = 0;
        foreach ($this->items as $item) {
            $subtotal += $item['price'] * $item['quantity'];
        }
        return $subtotal;
    }

    /**
     * 保護方法：計算稅金
     * 子類別可以覆寫（例如：免稅商品）
     */
    protected function calculateTax(float $amount): float
    {
        return $amount * $this->taxRate;
    }

    /**
     * 私有方法：驗證商品資料
     * 內部實作細節，不希望被外部或子類別修改
     */
    private function validateItem(string $name, float $price, int $quantity): void
    {
        if (empty($name)) {
            throw new \InvalidArgumentException('商品名稱不能為空');
        }
        if ($price < 0) {
            throw new \InvalidArgumentException('價格不能為負數');
        }
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('數量必須大於 0');
        }
    }
}

class VIPShoppingCart extends ShoppingCart
{
    private float $discountRate = 0.1;

    /**
     * 覆寫保護方法，提供 VIP 折扣
     */
    protected function calculateSubtotal(): float
    {
        $subtotal = parent::calculateSubtotal();
        return $subtotal * (1 - $this->discountRate);
    }
}

// 使用範例
$cart = new ShoppingCart();
$cart->addItem('蘋果', 10.0, 3);
$cart->addItem('香蕉', 5.0, 2);
echo $cart->getTotal();  // ✅ 結果：40.75（33 + 1.65 稅金）

$cart->calculateSubtotal();  // ❌ 錯誤！無法訪問保護方法
$cart->validateItem('test', 10, 1);  // ❌ 錯誤！無法訪問私有方法

$vipCart = new VIPShoppingCart();
$vipCart->addItem('蘋果', 10.0, 3);
echo $vipCart->getTotal();  // ✅ VIP 折扣後的總額
```

---

## 實際應用情境

### 情境 1：Service 類別

```php
class UserService
{
    /**
     * 公開方法：供 Controller 呼叫
     */
    public function updateUser(int $userId, array $data): User
    {
        // 驗證資料
        $this->validateUserData($data);

        // 取得使用者
        $user = $this->findUserById($userId);

        // 更新使用者
        return $this->performUpdate($user, $data);
    }

    /**
     * 保護方法：驗證使用者資料
     * Service 的其他方法可能需要呼叫
     */
    protected function validateUserData(array $data): void
    {
        // 驗證邏輯
    }

    /**
     * 保護方法：查找使用者
     * 子類別可以覆寫（例如：使用快取）
     */
    protected function findUserById(int $userId): User
    {
        return User::find($userId);
    }

    /**
     * 私有方法：執行更新
     * 內部實作細節，不需要被外部或子類別了解
     */
    private function performUpdate(User $user, array $data): User
    {
        // 更新邏輯
        $user->fill($data);
        $user->save();

        return $user;
    }
}
```

### 情境 2：Repository 類別

```php
class UserRepository
{
    private \Illuminate\Database\Connection $connection;

    public function __construct(\Illuminate\Database\Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * 公開方法：取得使用者
     */
    public function find(int $id): ?User
    {
        $data = $this->connection->table('users')
            ->where('id', $id)
            ->first();

        return $data ? $this->mapToUser($data) : null;
    }

    /**
     * 保護方法：將資料庫資料對應到 User 物件
     * 子類別可能需要覆寫（例如：不同的對應邏輯）
     */
    protected function mapToUser(object $data): User
    {
        return new User($data);
    }

    /**
     * 私有方法：建立基礎查詢
     * 內部實作細節
     */
    private function buildBaseQuery(): \Illuminate\Database\Query\Builder
    {
        return $this->connection->table('users');
    }
}
```

### 情境 3：Controller 類別

```php
class ApiController
{
    private ApiService $service;
    private LoggerInterface $logger;

    public function __construct(ApiService $service, LoggerInterface $logger)
    {
        $this->service = $service;
        $this->logger = $logger;
    }

    /**
     * 公開方法：處理 API 請求
     */
    public function handle(Request $request): Response
    {
        try {
            $data = $this->parseRequest($request);
            $result = $this->service->process($data);

            return $this->buildSuccessResponse($result);
        } catch (\Exception $e) {
            $this->logError($e);
            return $this->buildErrorResponse($e);
        }
    }

    /**
     * 保護方法：解析請求
     * Controller 的其他方法可能需要
     */
    protected function parseRequest(Request $request): array
    {
        return $request->all();
    }

    /**
     * 保護方法：建立成功回應
     */
    protected function buildSuccessResponse($data): Response
    {
        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * 保護方法：建立錯誤回應
     */
    protected function buildErrorResponse(\Exception $e): Response
    {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }

    /**
     * 私有方法：記錄錯誤
     * 內部實作細節
     */
    private function logError(\Exception $e): void
    {
        $this->logger->error($e->getMessage(), [
            'exception' => $e,
            'trace' => $e->getTraceAsString(),
        ]);
    }
}
```

---

## 繼承中的可見度

### 可見度規則

```php
class Parent
{
    public function publicMethod() { }
    protected function protectedMethod() { }
    private function privateMethod() { }
}

class Child extends Parent
{
    public function callParentMethods(): void
    {
        $this->publicMethod();       // ✅ 可以
        $this->protectedMethod();    // ✅ 可以
        // $this->privateMethod();   // ❌ 錯誤！無法訪問
    }

    // 可以覆寫父類別的公開或保護方法
    public function publicMethod() { }
    protected function protectedMethod() { }

    // 但不能"覆寫"私有方法（實質上是新方法）
    // 因為私有方法在子類別中不可見
    private function privateMethod() { }  // 這是新方法，不是覆寫
}

class External
{
    public function callMethods(Parent $parent): void
    {
        $parent->publicMethod();       // ✅ 可以
        // $parent->protectedMethod(); // ❌ 錯誤！外部無法訪問
        // $parent->privateMethod();   // ❌ 錯誤！外部無法訪問
    }
}
```

---

## 介面與可見度

### 介面方法必須是 public

```php
interface IUserRepository
{
    /**
     * 介面方法隱含是 public
     * 不能聲明可見度（會報錯）
     */
    public function find(int $id): ?User;

    // ❌ 錯誤！介面不能有 protected 或 private 方法
    // protected function internalMethod();
}

class UserRepository implements IUserRepository
{
    /**
     * 實作介面方法必須是 public
     */
    public function find(int $id): ?User
    {
        return User::find($id);
    }

    /**
     * 實作類別可以有 protected 和 private 方法
     */
    protected function helperMethod(): void
    {
        // 內部方法
    }

    private function internalMethod(): void
    {
        // 私有方法
    }
}
```

---

## 最佳實踐

### 1. 預設使用 private，需要時再開放

```php
class OrderService
{
    // ✅ 正確：預設使用 private
    private function validateOrder(Order $order): bool
    {
        // 預設為私有，只有內部需要時再改成 protected
    }

    // ❌ 避免：一開始就用 public
    // public function validateOrder(Order $order): bool
    // {
    //     // 如果不需要外部呼叫，就不應該用 public
    // }
}
```

### 2. 公開方法應該簡潔

```php
class PaymentService
{
    /**
     * ✅ 公開方法：簡潔明瞭
     */
    public function processPayment(float $amount): bool
    {
        // 驗證
        if (!$this->validateAmount($amount)) {
            return false;
        }

        // 扣款
        if (!$this->deductFunds($amount)) {
            return false;
        }

        // 記錄
        $this->logTransaction($amount);

        return true;
    }

    /**
     * ✅ 複雜邏輯拆分成保護方法
     */
    protected function validateAmount(float $amount): bool
    {
        // 複雜的驗證邏輯
    }

    protected function deductFunds(float $amount): bool
    {
        // 複雜的扣款邏輯
    }

    /**
     * ✅ 內部實作細節用私有方法
     */
    private function logTransaction(float $amount): void
    {
        // 記錄邏輯
    }
}
```

### 3. 使用可見度實現封裝

```php
class BankAccount
{
    private float $balance = 0;

    /**
     * ✅ 公開方法：存款
     */
    public function deposit(float $amount): void
    {
        $this->validateAmount($amount);
        $this->balance += $amount;
        $this->logTransaction('deposit', $amount);
    }

    /**
     * ✅ 公開方法：提款
     */
    public function withdraw(float $amount): bool
    {
        if (!$this->hasSufficientFunds($amount)) {
            return false;
        }

        $this->validateAmount($amount);
        $this->balance -= $amount;
        $this->logTransaction('withdraw', $amount);

        return true;
    }

    /**
     * ✅ 公開方法：查詢餘額
     */
    public function getBalance(): float
    {
        return $this->balance;
    }

    /**
     * ✅ 私有方法：驗證金額
     */
    private function validateAmount(float $amount): void
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('金額必須大於 0');
        }
    }

    /**
     * ✅ 私有方法：檢查餘額是否足夠
     */
    private function hasSufficientFunds(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    /**
     * ✅ 私有方法：記錄交易
     */
    private function logTransaction(string $type, float $amount): void
    {
        // 記錄邏輯
    }

    // ❌ 避免：直接公開 balance 屬性
    // public $balance;  // 這樣就無法控制存取行為
}
```

---

## 常見問題

### 問題 1: 什麼時候用 protected，什麼時候用 private？

**原則**：
- **private**: 確定只有當前類別使用，不期望被子類別使用或覆寫
- **protected**: 子類別可能需要使用或覆寫的方法

```php
class BaseProcessor
{
    /**
     * ✅ private: 確信子類別不需要
     */
    private function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * ✅ protected: 子類別可能需要不同的驗證邏輯
     */
    protected function validateInput(array $data): bool
    {
        // 基礎驗證
    }
}

class AdminProcessor extends BaseProcessor
{
    /**
     * 子類別可以覆寫 protected 方法
     */
    protected function validateInput(array $data): bool
    {
        // 額外的管理員驗證
        if (!parent::validateInput($data)) {
            return false;
        }
        // 更多驗證...
        return true;
    }
}
```

### 問題 2: 測試時如何處理不同可見度的方法？

```php
class PaymentService
{
    public function processPayment(float $amount): bool
    {
        if (!$this->validateAmount($amount)) {
            return false;
        }
        // ...
    }

    protected function validateAmount(float $amount): bool
    {
        return $amount > 0;
    }
}

// 測試類別
class PaymentServiceTest extends TestCase
{
    public function test_process_payment(): void
    {
        $service = new PaymentService();

        // ✅ 測試公開方法
        $result = $service->processPayment(100);
        $this->assertTrue($result);

        // ❌ 無法直接測試保護或私有方法
        // $service->validateAmount(100);  // 錯誤！
    }
}

// 解決方案：使用 Reflection
use ReflectionMethod;

class PaymentServiceTest extends TestCase
{
    public function test_validate_amount(): void
    {
        $service = new PaymentService();

        // 使用反射訪問保護方法
        $method = new ReflectionMethod($service, 'validateAmount');
        $method->setAccessible(true);

        $result = $method->invoke($service, 100);
        $this->assertTrue($result);
    }
}
```

### 問題 3: 需要改變可見度時怎麼辦？

```php
// 情境：一開始設計為 private，後來發現子類別需要

// ❌ 原始設計
class BaseService
{
    private function validateData(array $data): bool
    {
        // ...
    }
}

// ✅ 改為 protected
class BaseService
{
    protected function validateData(array $data): bool
    {
        // ...
    }
}

class ExtendedService extends BaseService
{
    // 現在可以使用父類別的保護方法
    public function process(array $data): bool
    {
        if (!$this->validateData($data)) {  // ✅ 可以呼叫
            return false;
        }
        // ...
    }
}
```

---

## 總結

### 快速參考

| 可見度 | 類別內部 | 子類別 | 外部 | 使用情境 |
|--------|---------|--------|------|---------|
| **public** | ✅ | ✅ | ✅ | 公開 API、對外介面 |
| **protected** | ✅ | ✅ | ❌ | 內部方法、可被子類別覆寫 |
| **private** | ✅ | ❌ | ❌ | 內部實作細節 |

### 設計原則

1. **最小可見度原則**：預設使用 private，需要時再開放
2. **YAGNI 原則**：不要過度設計，只有真正需要時才使用 protected
3. **封裝優先**：隱藏內部實作，只暴露必要的介面
4. **測試友好**：確保 public 方法足夠測試類別行為

### 實務建議

- **Laravel Controller**: 所有方法用 public
- **Service 類別**: 對外 API 用 public，內部邏輯用 protected/private
- **Repository 類別**: 查詢方法用 public，輔助方法用 protected
- **Helper 類別**: 根據用途選擇，通常都是 public 或 private

---

## 版本資訊

- **建立日期**: 2024-12-19
- **適用專案**: Stars Laravel 專案
- **適用版本**: PHP 8.x, Laravel 9.x
- **維護者**: Stars Team
