# PHP 屬性型別宣告指南

## 概述

在 PHP 7.4+ 中，類別屬性支援型別宣告（Type Declaration），這是一個重要的語言特性，用於提升程式碼的型別安全性和可讀性。

## 基本語法比較

### 傳統宣告方式（無型別）

```php
class Example {
    private $dailyRankCache;
    private $weeklyRankCache;
    private $redis;
    private $cacheTime;
}
```

### 現代宣告方式（有型別）

```php
class Example {
    private RankCache $dailyRankCache;
    private RankCache $weeklyRankCache;
    private Redis $redis;
    private int $cacheTime;
}
```

## 型別宣告的意義與好處

### 1. 型別安全性（Type Safety）

**無型別宣告：**

```php
class RankReport {
    private $dailyRankCache;

    public function setDailyCache($cache) {
        $this->dailyRankCache = $cache; // 可以傳入任何型別
    }
}

// 使用時可能出錯
$report = new RankReport();
$report->setDailyCache("string"); // 錯誤的型別，但不會立即發現
$report->setDailyCache(123);      // 錯誤的型別，但不會立即發現
```

**有型別宣告：**

```php
class RankReport {
    private RankCache $dailyRankCache;

    public function setDailyCache(RankCache $cache) {
        $this->dailyRankCache = $cache; // 只能傳入 RankCache 型別
    }
}

// 使用時會立即發現錯誤
$report = new RankReport();
$report->setDailyCache("string"); // Fatal Error: 型別不匹配
$report->setDailyCache(123);      // Fatal Error: 型別不匹配
```

### 2. 程式碼可讀性

**無型別宣告：**

```php
class UserService {
    private $cache;
    private $repository;
    private $logger;

    public function __construct($cache, $repository, $logger) {
        $this->cache = $cache;        // 不知道是什麼型別
        $this->repository = $repository; // 不知道是什麼型別
        $this->logger = $logger;      // 不知道是什麼型別
    }
}
```

**有型別宣告：**

```php
class UserService {
    private CacheInterface $cache;
    private UserRepository $repository;
    private LoggerInterface $logger;

    public function __construct(
        CacheInterface $cache,
        UserRepository $repository,
        LoggerInterface $logger
    ) {
        $this->cache = $cache;        // 明確知道是 CacheInterface
        $this->repository = $repository; // 明確知道是 UserRepository
        $this->logger = $logger;      // 明確知道是 LoggerInterface
    }
}
```

### 3. IDE 支援與自動完成

**無型別宣告：**

```php
class Example {
    private $dailyRankCache;

    public function someMethod() {
        $this->dailyRankCache-> // IDE 不知道這是什麼型別，無法提供自動完成
    }
}
```

**有型別宣告：**

```php
class Example {
    private RankCache $dailyRankCache;

    public function someMethod() {
        $this->dailyRankCache-> // IDE 知道這是 RankCache，可以提供完整的自動完成
    }
}
```

### 4. 文件化與維護性

**無型別宣告：**

```php
/**
 * 設定快取
 * @param mixed $cache 快取物件
 */
public function setCache($cache) {
    $this->cache = $cache;
}
```

**有型別宣告：**

```php
/**
 * 設定快取
 */
public function setCache(RankCache $cache) {
    $this->cache = $cache;
}
```

型別宣告本身就是最好的文件，不需要額外的 PHPDoc 註解。

## 支援的型別

### 基本型別

```php
class Example {
    private string $name;
    private int $age;
    private float $score;
    private bool $isActive;
    private array $data;
    private ?string $nullableName; // 可為 null
}
```

### 類別型別

```php
class Example {
    private RankCache $rankCache;
    private UserCache $userCache;
    private Redis $redis;
    private DateTime $createdAt;
}
```

### 介面型別

```php
class Example {
    private CacheInterface $cache;
    private LoggerInterface $logger;
    private RepositoryInterface $repository;
}
```

### 聯合型別（PHP 8.0+）

```php
class Example {
    private string|int $id;
    private RankCache|UserCache $cache;
    private null|string $optionalField;
}
```

## 實際應用範例

### RankReport 類別中的應用

```php
class RankReport {
    // 明確宣告快取物件的型別
    private RankCache $dailyRankCache;
    private RankCache $weeklyRankCache;
    private UserCache $dailyUserCache;
    private UserCache $weeklyUserCache;

    // 明確宣告 Redis 連接的型別
    private Redis $redis;

    // 明確宣告常數的型別
    private const int DAILY_CACHE_TIME = 60 * 60 * 24 * 8;
    private const int WEEKLY_CACHE_TIME = 60 * 60 * 24 * 7 * 5;

    public function __construct() {
        $this->redis = Redis::connection('report');
    }

    public function dailyRank(): RankCache {
        if (!isset($this->dailyRankCache)) {
            $this->dailyRankCache = new RankCache(
                $this->redis,
                self::CACHE_PREFIX_DAILY_RANK,
                self::DAILY_CACHE_TIME
            );
        }
        return $this->dailyRankCache;
    }
}
```

## 最佳實踐

### 1. 總是使用型別宣告

```php
// 好的做法
class User {
    private string $name;
    private int $age;
    private DateTime $createdAt;
    private ?string $email;
}

// 避免的做法
class User {
    private $name;
    private $age;
    private $createdAt;
    private $email;
}
```

### 2. 使用介面而非具體類別（依賴反轉）

```php
// 好的做法
class UserService {
    private UserRepositoryInterface $repository;
    private CacheInterface $cache;
}

// 避免的做法
class UserService {
    private UserRepository $repository;
    private Redis $cache;
}
```

### 3. 使用可空型別處理可選屬性

```php
class User {
    private string $name;
    private ?string $email = null; // 可為 null
    private ?DateTime $lastLoginAt = null;
}
```

### 4. 在建構子中初始化

```php
class UserService {
    private UserRepositoryInterface $repository;
    private CacheInterface $cache;

    public function __construct(
        UserRepositoryInterface $repository,
        CacheInterface $cache
    ) {
        $this->repository = $repository;
        $this->cache = $cache;
    }
}
```

## 效能考量

### 編譯時檢查

- 型別宣告在編譯時就會被檢查，不會影響執行時效能
- 實際上可能提升效能，因為 PHP 引擎可以進行更好的優化

### 記憶體使用

- 型別宣告本身不增加記憶體使用
- 反而可能減少記憶體使用，因為引擎可以進行更精確的記憶體分配

## 相容性考量

### PHP 版本支援

- PHP 7.4+：支援屬性型別宣告
- PHP 8.0+：支援聯合型別
- PHP 8.1+：支援唯讀屬性

### 向後相容性

```php
// 如果需要在舊版本 PHP 中運行，可以使用 PHPDoc
/**
 * @var RankCache
 */
private $dailyRankCache;
```

## 總結

屬性型別宣告的主要意義：

1. **型別安全**：在編譯時捕獲型別錯誤
2. **可讀性**：程式碼自文件化
3. **IDE 支援**：更好的自動完成和錯誤檢查
4. **維護性**：減少錯誤，提升程式碼品質
5. **文件化**：型別本身就是最好的文件

在現代 PHP 開發中，建議總是使用型別宣告，這是提升程式碼品質的重要實踐。
