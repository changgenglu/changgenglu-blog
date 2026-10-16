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
