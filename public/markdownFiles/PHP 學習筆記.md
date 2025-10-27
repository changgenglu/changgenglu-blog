# PHP 學習筆記

<!-- TOC -->

- [PHP 學習筆記](#php-%E5%AD%B8%E7%BF%92%E7%AD%86%E8%A8%98)
  - [運算子、判斷](#%E9%81%8B%E7%AE%97%E5%AD%90%E5%88%A4%E6%96%B7)
    - [isset、!!、empty 差異比較](#issetempty-%E5%B7%AE%E7%95%B0%E6%AF%94%E8%BC%83)
      - [差異比較](#%E5%B7%AE%E7%95%B0%E6%AF%94%E8%BC%83)
      - [範例對照](#%E7%AF%84%E4%BE%8B%E5%B0%8D%E7%85%A7)
      - [總結](#%E7%B8%BD%E7%B5%90)
      - [常見坑與誤區](#%E5%B8%B8%E8%A6%8B%E5%9D%91%E8%88%87%E8%AA%A4%E5%8D%80)
      - [實務建議](#%E5%AF%A6%E5%8B%99%E5%BB%BA%E8%AD%B0)
      - [總結](#%E7%B8%BD%E7%B5%90)
  - [Autoload 自動載入](#autoload-%E8%87%AA%E5%8B%95%E8%BC%89%E5%85%A5)
  - [魔術常數](#%E9%AD%94%E8%A1%93%E5%B8%B8%E6%95%B8)
    - [**LINE** 檔案中的當前行號](#__line__-%E6%AA%94%E6%A1%88%E4%B8%AD%E7%9A%84%E7%95%B6%E5%89%8D%E8%A1%8C%E8%99%9F)
    - [**FILE** 檔案的完整路徑和檔名](#__file__-%E6%AA%94%E6%A1%88%E7%9A%84%E5%AE%8C%E6%95%B4%E8%B7%AF%E5%BE%91%E5%92%8C%E6%AA%94%E5%90%8D)
    - [**DIR** 檔案所在的目錄](#__dir__-%E6%AA%94%E6%A1%88%E6%89%80%E5%9C%A8%E7%9A%84%E7%9B%AE%E9%8C%84)
    - [**FUNCTION** 返回該函數被定義時的名字](#__function__-%E8%BF%94%E5%9B%9E%E8%A9%B2%E5%87%BD%E6%95%B8%E8%A2%AB%E5%AE%9A%E7%BE%A9%E6%99%82%E7%9A%84%E5%90%8D%E5%AD%97)
    - [**CLASS** 返回類別名稱](#__class__-%E8%BF%94%E5%9B%9E%E9%A1%9E%E5%88%A5%E5%90%8D%E7%A8%B1)
    - [**TRAIT** Trait 的名字](#__trait__-trait-%E7%9A%84%E5%90%8D%E5%AD%97)
    - [**METHOD** 類別的方法名稱，返回該方法被定義時的名字](#__method__-%E9%A1%9E%E5%88%A5%E7%9A%84%E6%96%B9%E6%B3%95%E5%90%8D%E7%A8%B1%E8%BF%94%E5%9B%9E%E8%A9%B2%E6%96%B9%E6%B3%95%E8%A2%AB%E5%AE%9A%E7%BE%A9%E6%99%82%E7%9A%84%E5%90%8D%E5%AD%97)
    - [**NAMESPACE** 當前命名空間的名稱](#__namespace__-%E7%95%B6%E5%89%8D%E5%91%BD%E5%90%8D%E7%A9%BA%E9%96%93%E7%9A%84%E5%90%8D%E7%A8%B1)
  - [魔術方法](#%E9%AD%94%E8%A1%93%E6%96%B9%E6%B3%95)
    - [\_\_construct 類別的構造函數](#__construct-%E9%A1%9E%E5%88%A5%E7%9A%84%E6%A7%8B%E9%80%A0%E5%87%BD%E6%95%B8)
    - [\_\_destruct 類別的解構函數](#__destruct-%E9%A1%9E%E5%88%A5%E7%9A%84%E8%A7%A3%E6%A7%8B%E5%87%BD%E6%95%B8)
    - [\_\_call 在物件中呼叫一個不可訪問的方法時，呼叫此方法](#__call-%E5%9C%A8%E7%89%A9%E4%BB%B6%E4%B8%AD%E5%91%BC%E5%8F%AB%E4%B8%80%E5%80%8B%E4%B8%8D%E5%8F%AF%E8%A8%AA%E5%95%8F%E7%9A%84%E6%96%B9%E6%B3%95%E6%99%82%E5%91%BC%E5%8F%AB%E6%AD%A4%E6%96%B9%E6%B3%95)
    - [\_\_callStatic 用靜態方式呼叫一個不可訪問的方法時，呼叫此方法](#__callstatic-%E7%94%A8%E9%9D%9C%E6%85%8B%E6%96%B9%E5%BC%8F%E5%91%BC%E5%8F%AB%E4%B8%80%E5%80%8B%E4%B8%8D%E5%8F%AF%E8%A8%AA%E5%95%8F%E7%9A%84%E6%96%B9%E6%B3%95%E6%99%82%E5%91%BC%E5%8F%AB%E6%AD%A4%E6%96%B9%E6%B3%95)
    - [\_\_get 獲取一個類別的成員變數時呼叫](#__get-%E7%8D%B2%E5%8F%96%E4%B8%80%E5%80%8B%E9%A1%9E%E5%88%A5%E7%9A%84%E6%88%90%E5%93%A1%E8%AE%8A%E6%95%B8%E6%99%82%E5%91%BC%E5%8F%AB)
    - [\_\_set 設置一個類別的成員變數時呼叫](#__set-%E8%A8%AD%E7%BD%AE%E4%B8%80%E5%80%8B%E9%A1%9E%E5%88%A5%E7%9A%84%E6%88%90%E5%93%A1%E8%AE%8A%E6%95%B8%E6%99%82%E5%91%BC%E5%8F%AB)
    - [\_\_isset 當私有屬性呼叫 isset 或 empty 時呼叫此方法](#__isset-%E7%95%B6%E7%A7%81%E6%9C%89%E5%B1%AC%E6%80%A7%E5%91%BC%E5%8F%AB-isset-%E6%88%96-empty-%E6%99%82%E5%91%BC%E5%8F%AB%E6%AD%A4%E6%96%B9%E6%B3%95)
  - [方法](#%E6%96%B9%E6%B3%95)
    - [in_array 檢查陣列中是否包含特定的數值](#in_array-%E6%AA%A2%E6%9F%A5%E9%99%A3%E5%88%97%E4%B8%AD%E6%98%AF%E5%90%A6%E5%8C%85%E5%90%AB%E7%89%B9%E5%AE%9A%E7%9A%84%E6%95%B8%E5%80%BC)
    - [foreach](#foreach)
    - [scandir 掃描指定的目錄，並返回為陣列](#scandir-%E6%8E%83%E6%8F%8F%E6%8C%87%E5%AE%9A%E7%9A%84%E7%9B%AE%E9%8C%84%E4%B8%A6%E8%BF%94%E5%9B%9E%E7%82%BA%E9%99%A3%E5%88%97)
    - [list 宣告陣列中的值，使其成為變數](#list-%E5%AE%A3%E5%91%8A%E9%99%A3%E5%88%97%E4%B8%AD%E7%9A%84%E5%80%BC%E4%BD%BF%E5%85%B6%E6%88%90%E7%82%BA%E8%AE%8A%E6%95%B8)
    - [append 將傳入的值附加進陣列](#append-%E5%B0%87%E5%82%B3%E5%85%A5%E7%9A%84%E5%80%BC%E9%99%84%E5%8A%A0%E9%80%B2%E9%99%A3%E5%88%97)
    - [在陣列中新增元素](#%E5%9C%A8%E9%99%A3%E5%88%97%E4%B8%AD%E6%96%B0%E5%A2%9E%E5%85%83%E7%B4%A0)
      - [直接賦值](#%E7%9B%B4%E6%8E%A5%E8%B3%A6%E5%80%BC)
      - [array_push 在陣列最後新增元素](#array_push-%E5%9C%A8%E9%99%A3%E5%88%97%E6%9C%80%E5%BE%8C%E6%96%B0%E5%A2%9E%E5%85%83%E7%B4%A0)
      - [array_unshift 在陣列前端插入](#array_unshift-%E5%9C%A8%E9%99%A3%E5%88%97%E5%89%8D%E7%AB%AF%E6%8F%92%E5%85%A5)
    - [array_fill 以填充數值的方式，建立新陣列](#array_fill-%E4%BB%A5%E5%A1%AB%E5%85%85%E6%95%B8%E5%80%BC%E7%9A%84%E6%96%B9%E5%BC%8F%E5%BB%BA%E7%AB%8B%E6%96%B0%E9%99%A3%E5%88%97)
    - [array_combine 將傳入的參數合併為陣列](#array_combine-%E5%B0%87%E5%82%B3%E5%85%A5%E7%9A%84%E5%8F%83%E6%95%B8%E5%90%88%E4%BD%B5%E7%82%BA%E9%99%A3%E5%88%97)
    - [array_unique 從陣列中刪除重複的值](#array_unique-%E5%BE%9E%E9%99%A3%E5%88%97%E4%B8%AD%E5%88%AA%E9%99%A4%E9%87%8D%E8%A4%87%E7%9A%84%E5%80%BC)
    - [array_diff 判斷陣列之間差異](#array_diff-%E5%88%A4%E6%96%B7%E9%99%A3%E5%88%97%E4%B9%8B%E9%96%93%E5%B7%AE%E7%95%B0)
    - [array_slice 從陣列中取得一段連續的元素](#array_slice-%E5%BE%9E%E9%99%A3%E5%88%97%E4%B8%AD%E5%8F%96%E5%BE%97%E4%B8%80%E6%AE%B5%E9%80%A3%E7%BA%8C%E7%9A%84%E5%85%83%E7%B4%A0)
    - [日期/時間](#%E6%97%A5%E6%9C%9F%E6%99%82%E9%96%93)
      - [date 格式化 Unix timestamps](#date-%E6%A0%BC%E5%BC%8F%E5%8C%96-unix-timestamps)
      - [mktime 取得指定日期的時間戳](#mktime-%E5%8F%96%E5%BE%97%E6%8C%87%E5%AE%9A%E6%97%A5%E6%9C%9F%E7%9A%84%E6%99%82%E9%96%93%E6%88%B3)
      - [date_diff 獲取以分鐘為單位的時間差](#date_diff-%E7%8D%B2%E5%8F%96%E4%BB%A5%E5%88%86%E9%90%98%E7%82%BA%E5%96%AE%E4%BD%8D%E7%9A%84%E6%99%82%E9%96%93%E5%B7%AE)
    - [sort 陣列排序](#sort-%E9%99%A3%E5%88%97%E6%8E%92%E5%BA%8F)
      - [依 value 排序](#%E4%BE%9D-value-%E6%8E%92%E5%BA%8F)
      - [依 key 排序](#%E4%BE%9D-key-%E6%8E%92%E5%BA%8F)
      - [自訂排序](#%E8%87%AA%E8%A8%82%E6%8E%92%E5%BA%8F)
    - [分割字串](#%E5%88%86%E5%89%B2%E5%AD%97%E4%B8%B2)
      - [explode](#explode)
      - [str_split](#str_split)
      - [preg_split](#preg_split)
    - [array_slice 從陣列中取出想要的元素](#array_slice-%E5%BE%9E%E9%99%A3%E5%88%97%E4%B8%AD%E5%8F%96%E5%87%BA%E6%83%B3%E8%A6%81%E7%9A%84%E5%85%83%E7%B4%A0)
    - [implode 將陣列轉為字串](#implode-%E5%B0%87%E9%99%A3%E5%88%97%E8%BD%89%E7%82%BA%E5%AD%97%E4%B8%B2)
    - [array_filter 過濾陣列元素刪除陣列空值](#array_filter-%E9%81%8E%E6%BF%BE%E9%99%A3%E5%88%97%E5%85%83%E7%B4%A0%E5%88%AA%E9%99%A4%E9%99%A3%E5%88%97%E7%A9%BA%E5%80%BC)
    - [str_pad 填充字串為指定長度](#str_pad-%E5%A1%AB%E5%85%85%E5%AD%97%E4%B8%B2%E7%82%BA%E6%8C%87%E5%AE%9A%E9%95%B7%E5%BA%A6)
    - [資料序列化及反序列化](#%E8%B3%87%E6%96%99%E5%BA%8F%E5%88%97%E5%8C%96%E5%8F%8A%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96)
      - [string serialize 序列化](#string-serialize-%E5%BA%8F%E5%88%97%E5%8C%96)
      - [mixed unserialize 反序列化](#mixed-unserialize-%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96)
    - [file_get_contents 將本地文件存入一個變數中](#file_get_contents-%E5%B0%87%E6%9C%AC%E5%9C%B0%E6%96%87%E4%BB%B6%E5%AD%98%E5%85%A5%E4%B8%80%E5%80%8B%E8%AE%8A%E6%95%B8%E4%B8%AD)
    - [str_pad 補足字串](#str_pad-%E8%A3%9C%E8%B6%B3%E5%AD%97%E4%B8%B2)
    - [str_replace 替換字串](#str_replace-%E6%9B%BF%E6%8F%9B%E5%AD%97%E4%B8%B2)
    - [將字串轉換為數值](#%E5%B0%87%E5%AD%97%E4%B8%B2%E8%BD%89%E6%8F%9B%E7%82%BA%E6%95%B8%E5%80%BC)
    - [is_a 檢查物件是該類別，或該類別是此物件的父類別 boolean](#is_a-%E6%AA%A2%E6%9F%A5%E7%89%A9%E4%BB%B6%E6%98%AF%E8%A9%B2%E9%A1%9E%E5%88%A5%E6%88%96%E8%A9%B2%E9%A1%9E%E5%88%A5%E6%98%AF%E6%AD%A4%E7%89%A9%E4%BB%B6%E7%9A%84%E7%88%B6%E9%A1%9E%E5%88%A5boolean)
    - [substr 取得部分字串，可設定字串長度](#substr-%E5%8F%96%E5%BE%97%E9%83%A8%E5%88%86%E5%AD%97%E4%B8%B2%E5%8F%AF%E8%A8%AD%E5%AE%9A%E5%AD%97%E4%B8%B2%E9%95%B7%E5%BA%A6)
    - [轉換字母大小寫](#%E8%BD%89%E6%8F%9B%E5%AD%97%E6%AF%8D%E5%A4%A7%E5%B0%8F%E5%AF%AB)
      - [ucfirst 將字串的首字母轉為大寫](#ucfirst-%E5%B0%87%E5%AD%97%E4%B8%B2%E7%9A%84%E9%A6%96%E5%AD%97%E6%AF%8D%E8%BD%89%E7%82%BA%E5%A4%A7%E5%AF%AB)
      - [strtolower 將字串換為小寫](#strtolower-%E5%B0%87%E5%AD%97%E4%B8%B2%E6%8F%9B%E7%82%BA%E5%B0%8F%E5%AF%AB)
      - [strtoupper 將字串換為大寫](#strtoupper-%E5%B0%87%E5%AD%97%E4%B8%B2%E6%8F%9B%E7%82%BA%E5%A4%A7%E5%AF%AB)
    - [define 定義一個常數](#define-%E5%AE%9A%E7%BE%A9%E4%B8%80%E5%80%8B%E5%B8%B8%E6%95%B8)
  - [在 Linux 執行 php 檔](#%E5%9C%A8-linux-%E5%9F%B7%E8%A1%8C-php-%E6%AA%94)
    - [方法一](#%E6%96%B9%E6%B3%95%E4%B8%80)

<!-- /TOC -->

## 運算子、判斷

- `+`: 算術相加

- `.`: 字串相加

- `gettype()`: 判斷變數的型態

- `(int)($var1 + $var2)`: 只取商

- `isset($var)`: 檢查變數是否有設置

- `empty($var)`: 檢查變數是否為空值

- `is_null($var)`: 檢查變數是否為 null

  |                 | gettype() |   isset()   |   empty()   |  is_null()  |
  | :-------------: | :-------: | :---------: | :---------: | :---------: |
  | $x is undefined |   null    | **_false_** |  [true](#)  |  [true](#)  |
  |    $x = null    |   null    | **_false_** |  [true](#)  |  [true](#)  |
  |     $x = 0      |    int    |  [true](#)  |  [true](#)  | **_false_** |
  |    $x = "0"     |    str    |  [true](#)  |  [true](#)  | **_false_** |
  |     $x = 1      |    int    |  [true](#)  | **_false_** | **_false_** |
  |     $x = ""     |    str    |  [true](#)  |  [true](#)  | **_false_** |
  |   $x = "PHP"    |    str    |  [true](#)  | **_false_** | **_false_** |

- `var_dump($var);`: 將變數的訊息印出於螢幕上

- `instanceof` 型態運算子

- 用於確定一個 php 物件是否屬於某一類別

  ```php
  class MyClass
  {
  }
  class NotMyClass
  {
  }

  $a = new MyClass;
  var_dump($a instanceof MyClass);
  var_dump($a instanceof NotMyClass);
  ```

  ```php
  bool(true)
  bool(false)
  ```

- 也可以用來確定一個物件是不是繼承自某一父類別的子類別

  ```php
  class ParentClass
  {
  }
  class MyClass extends ParentClass
  {
  }

  $a = new MyClass;
  var_dump($a instanceof MyClass);
  var_dump($a instanceof ParentClass);
  ```

  ```php
  bool(true)
  bool(true)
  ```

- 也可以用於確定一個變數是不是實現了某個接口的物件實例

  ```php
  interface A
  {
  }
  class B implements A
  {
  }
  $obj = new B;

  var_dump($obj instanceof A);
  echo "<br>";
  var_dump($obj instanceof B);
  ```

  ```php
  bool(true)
  bool(true)
  ```

  雖然 instanceof 通常是直接與 class 名稱一起使用，但也可以使用字串來代替

  ```php
  interface A
  {
  }
  class B implements A
  {
  }
  $obj = new B;
  $str1 = 'A';
  $str2 = 'B';

  var_dump($obj instanceof A);
  echo "<br>";
  var_dump($obj instanceof B);
  echo "<br>";
  var_dump($obj instanceof $str1);
  echo "<br>";
  var_dump($obj instanceof $str2);
  ```

  ```php
  bool(true)
  bool(true)
  bool(true)
  bool(true)
  ```

  若被檢測的變數不是物件，instanceof 並不會報錯，而是直接返回 false。另外，不能使用 instanceof 來檢測常數

  ```php
  $a = 1;
  $b = NULL;
  $c = imagecreate(5, 5);
  var_dump($a instanceof stdClass);
  echo '<br>';
  var_dump($b instanceof stdClass);
  echo '<br>';
  var_dump($c instanceof stdClass);
  echo '<br>';
  var_dump(FALSE instanceof stdClass);
  ```

  ```php
  bool(false)
  bool(false)
  bool(false)
  bool(false)
  ```

### isset、!!、empty 差異比較

這三個在 PHP 常見，但用意和判斷邏輯都不一樣。以下是詳細的差異說明：

#### 差異比較

|     寫法      | 用途                        | 判斷邏輯                                                   | 特點                         |
| :-----------: | :-------------------------- | :--------------------------------------------------------- | :--------------------------- |
| `isset($var)` | 檢查變數是否存在且不為 null | 變數沒宣告 / 為 null → false，其他都 true                  | 不會理會值是否為 0、空字串等 |
|  `!!($var)`   | 把值強制轉成布林值          | 任何值轉換成 true 或 false（依 PHP 的「真值表」）          | 常用來判斷「是否有值」       |
| `empty($var)` | 判斷變數是否為空值          | 下列情況回傳 true：""、0、"0"、null、false、[]、未定義變數 | 判斷範圍最廣                 |

#### 範例對照

```php
<?php

$tests = [
    '未宣告變數' => null,     // 模擬未宣告
    'null' => null,
    '空字串' => '',
    '字串0' => '0',
    '整數0' => 0,
    '布林false' => false,
    '空陣列' => [],
    '正常字串' => 'hello',
    '正整數' => 123,
];

foreach ($tests as $label => $val) {
    echo "=== {$label} ===\n";

    // 用 isset 前要確認變數有宣告，不然會 warning
    $isset = isset($val) ? 'true' : 'false';
    $boolCast = (!!$val) ? 'true' : 'false';
    $empty = empty($val) ? 'true' : 'false';

    echo "isset: {$isset}, !!: {$boolCast}, empty: {$empty}\n\n";
}
```

**部分輸出解釋：**

```
=== null ===
isset: false, !!: false, empty: true

=== 空字串 ===
isset: true, !!: false, empty: true

=== 字串0 ===
isset: true, !!: false, empty: true

=== 整數0 ===
isset: true, !!: false, empty: true

=== 布林false ===
isset: true, !!: false, empty: true

=== 空陣列 ===
isset: true, !!: false, empty: true

=== 正常字串 ===
isset: true, !!: true, empty: false

=== 正整數 ===
isset: true, !!: true, empty: false
```

#### 總結

- **`isset($var)`**：只在乎「變數有沒有存在、不是 null」
- **`!!($var)`**：純粹轉成布林值，0、空字串、空陣列、null 都會變 false
- **`empty($var)`**：判斷是否「沒有值」，判斷條件最嚴格，包含 "0" 也算空

**如果你要判斷「變數有宣告而且有值」：**

```php
if (isset($var) && !empty($var)) {
    // do something
}
```

#### 常見坑與誤區

**1. `isset()` 以為能判斷「有沒有值」**

```php
$var = '';
if (isset($var)) {
    echo '有值';
}
```

**輸出：**

```
有值
```

很多人以為空字串應該算「沒值」，但 `isset` 只判斷是否存在且不是 null。所以 `''`、`0`、`false`、`[]` 都會被當成「有值」。

**2. `empty()` 判斷太寬鬆**

```php
$var = '0';
if (empty($var)) {
    echo '空的';
}
```

**輸出：**

```
空的
```

很多人以為字串 `'0'` 是「有內容」，但 `empty('0')` 卻會當成「空」。這是超常見的坑，在做表單驗證或使用者輸入檢查時尤其容易出問題。

**3. `!!($var)` 以為能取代 `isset()`**

```php
if (!!$var) {
    echo 'true';
}
```

如果 `$var` 根本沒宣告，會噴 `Notice: Undefined variable`。所以 `!!` 不能用來判斷變數「是否存在」，只能判斷「已存在的變數是否為真值」。

**4. 多層陣列判斷**

```php
$data = ['user' => ['name' => 'Ivan']];

if (isset($data['user']['age'])) {
    echo $data['user']['age'];
}
```

`isset` 在判斷多層陣列 key 時，安全不會噴錯（會回傳 false）。但如果用 `!!` 或 `empty`，變數沒宣告或 key 不存在就會直接噴錯。

**5. 表單輸入判斷**

很多人會這樣：

```php
if (!empty($_POST['age'])) {
    // 使用者有填 age
}
```

**問題：** 如果使用者真的輸入 0，這裡會判斷成「沒填」。在做數值型輸入驗證時很容易踩坑。

#### 實務建議

- **要判斷變數是否存在（宣告過 & 不是 null）** → 用 `isset()`

```php
if (isset($user['name'])) { ... }
```

- **要判斷變數是否為「真值」** → 用 `!!`

```php
if (!!$isActive) { ... }   // 等價於 if ($isActive)
```

- **要判斷「是否為空值」但避免踩到 '0' 的坑** → 不建議直接用 `empty()`
  → 改用更精準的條件，例如：

```php
if ($value === '' || $value === null) { ... }
```

- **處理表單輸入（特別是數字 0）**
  建議用 `isset()` + 嚴格比較

```php
if (isset($_POST['age']) && $_POST['age'] !== '') {
    $age = (int) $_POST['age'];
}
```

#### 總結

- **`isset`** → 判斷「有沒有宣告 & 不是 null」
- **`!!`** → 判斷「布林真值」
- **`empty`** → 判斷「是不是空」，但過度寬鬆，'0' 會踩坑

**最常見坑點：**

- `empty('0')` 會回傳 true
- `!!` 不能用在「變數可能沒宣告」的情況
- `isset` 不能用來判斷「變數有沒有值」

## Autoload 自動載入

一般可以透過 `include`, `include_once`, `require`, `require_once`，來將檔案引入到我們目前正在編寫的這個檔案。

習慣上我們會將一個 class 存放在單一的 php 檔案中，例如 Member.php 相對於 Member class。

但當程式需要引用到這個 class，就可以用上面的方法來引用此 class 以供後續操作。

而 php autoload 機制可以讓我們在需要這個物件的時候，才去真正的引入這個 class，這個動作就是常聽到的 lazyload 延遲載入。

- `__autoload`
  php5 提供了 `__autoload()` 這個魔術方法實現上述 Autoload 機制，雖然這個方法效能及方便性並不是非常理想。

## 魔術常數

- 不分大小寫，但一般而言都會以大寫呈現

### `__LINE__` 檔案中的當前行號

```php
echo __LINE__ . PHP_EOL; // 1
echo __LINE__ . PHP_EOL; // 2
echo __LINE__ . PHP_EOL; // 3
```

### `__FILE__` 檔案的完整路徑和檔名

- 若將其使用在 `include` 中，則返回包含檔案的名稱。
- `__FILE__`總是包含一個絕對路徑(如果是符號連線，則是解析後的絕對路徑)。

  ```php
  echo __FILE__ . PHP_EOL; // D:\phpproject\php\newblog\php-magic-constant.php
  ```

### `__DIR__` 檔案所在的目錄

- 如果用在被包括檔案中，則返回被包括的檔案所在目錄。
- 其等同於 `dirname(__FILE__)`。
- 除非是根目錄，否則目錄中名不包括末尾的斜線。

  ```php
  echo __DIR__ . PHP_EOL; // D:\phpproject\php\newblog
  ```

### `__FUNCTION__` 返回該函數被定義時的名字

```php
echo __FUNCTION__ . PHP_EOL; // 函數尚未被定義

function testFunction()
{
  echo __FUNCTION__ . PHP_EOL; //  testFunction
}

class TestClass
{
  function testFunctionButInClass()
  {
    echo __FUNCTION__ . PHP_EOL; // testFunctionButInClass
  }
}

testFunction();
$test = new TestClass();
$test->testFunctionButInClass();
```

### `__CLASS__` 返回類別名稱

```php
echo __CLASS__ . PHP_EOL; // 類別尚未被宣

function testClass()
{
    echo __CLASS__ . PHP_EOL; // 類別尚未被宣告
}

trait TestClassTrait
{
    function testClass2()
    {
        echo __CLASS__ . PHP_EOL; // TestClassClass
    }
}

class TestClassClass
{
    use TestClassTrait;
    function testClass1()
    {
        echo __CLASS__ . PHP_EOL; // TestClassClass
    }
}

testClass();
$test = new TestClassClass();
$test->testClass1();
$test->testClass2();
```

### `__TRAIT__` Trait 的名字

```php
echo __TRAIT__ . PHP_EOL; // 什麼也沒有
function testTrait()
{
    echo __TRAIT__ . PHP_EOL; // 什麼也沒有
}

trait TestTrait
{
    function testTrait2()
    {
        echo __TRAIT__ . PHP_EOL; // TestTrait
    }
}

class TestTraitClass
{
    use TestTrait;

    function testTrait1()
    {
        echo __TRAIT__ . PHP_EOL; // 什麼也沒有
    }
}

testTrait();
$test = new TestTraitClass();
$test->testTrait1();
$test->testTrait2();
```

### `__METHOD__` 類別的方法名稱，返回該方法被定義時的名字

```php
echo __METHOD__ . PHP_EOL; // 尚無方法

function testMethod() {
  echo __METHOD__ . PHP_EOL; // testMethod
}

class TestMethodClass
{
  function testMethodButinClass() {
    echo __METHOD__ . PHP_EOL; // TestMethodClass::testMethodButinClass
  }
}

testMethod();
$test = new TestClassClass();
$test->testMethodButinClass();
```

### `__NAMESPACE__` 當前命名空間的名稱

- 此常數是在編譯時定義的

  ```php
  echo __NAMESPACE__ . PHP_EOL; // test\magic\constant

  class TestNameSpaceClass
  {
      function testNamespace() {
          echo __NAMESPACE__ . PHP_EOL; // test\magic\constant
      }
  }

  $test = new TestNameSpaceClass();
  $test->testNamespace();
  ```

## 魔術方法

> 參考資料：
>
> [PHP 之十六個魔術方法詳解](https://segmentfault.com/a/1190000007250604)

### `__construct` 類別的構造函數

php 中構造方法是物件創建完成後，第一個被物件自動呼叫的方法。在每個類別中，都有一個構造方法，如果沒有宣告，那麼類別中會預設存在一個沒有參數且內容為空的構造方法。

1. 作用：通常構造方法被用來執行一些初始化任務，如對成員屬性在創建對象時，賦予初始值
2. 在類別中的聲明格式：

   ```php
   function __construct (params) {
    // code
    // 通常用來對成員屬性進行初始化賦值
   }
   ```

3. 在類別中聲明構造方法需要注意的事項

   1. 在同一個類別中只能宣告一個構造方法
   2. 必定是以雙底線開始

      ```php
      class Person
      {
        public $name;
        public $age;
        public $sex;
        /**
         * 顯示宣告一個構造函數且帶參數
         */
        public function __construct($name = "", $age = 22, $sex = "man") {
          $this->name = $name;
          $this->sex = $sex;
          $this->age = $age;
        }
        /**
         * say 方法
         */
        public function say()
        {
          echo "我叫：" . $this->name . "，性別：" . $this->sex . "，年齡：" . $this->age;
        }
      }

      /**
       * $person1
       */
      $person1 = new Person()
      echo $person1->say(); // 我叫：，性別：男，年齡：27
      /**
       * $person2
       *
       * @param $name 小明
       */
      $person2 = new Person('小明');
      echo $person2->say(); // 我叫：小明，性別：男，年齡：27
      /**
       * $person3
       *
       * @param $name 李四
       * @param $sex 男
       * @param $age 25
       */
      $person3 = new Person('李四', '男', '25')
      echo $person3->say(); // 我叫：李四，性別：男，年齡：25
      ```

### `__destruct` 類別的解構函數

允許在銷毀一個類別之前，執行一些操作或完成一些功能，比如關閉文件，釋放結果集等

1. 宣告格式

   ```php
   function __destruct()
   {
     // code
   }
   ```

2. 解構函數的作用

   ```php
   class Person{
       public $name;

       public $age;

       public $sex;

       public function __construct($name="", $sex="男", $age=22)
       {
           $this->name = $name;
           $this->sex  = $sex;
           $this->age  = $age;
       }

       /**
        * say 说话方法
        */
       public function say()
       {
           echo "我叫：".$this->name."，性别：".$this->sex."，年齡：".$this->age;
       }

       /**
        * 声明一个析构方法
        */
       public function __destruct()
       {
           echo "我覺得我還可以搶救一下，我的名字叫".$this->name;
       }
   }

   $Person = new Person("小明");
   unset($Person); // 銷毀上面建立的物件
   ```

### `__call` 在物件中呼叫一個不可訪問的方法時，呼叫此方法

此方法接受兩參數，`$function_name` 會自動接收不存在的方法名，`$arguments` 則以陣列的方式接收不存在方法的多個參數。

1. 宣告此方法的格式

   ```php
   function __call(string $function_name, array $arguments){
     // code
   }
   ```

2. 此方法的作用：為避免當呼叫的方法不存在而產生錯誤，導致意外的程序中止，可以使用 `__call()` 方法來避免。剛方法在呼叫的方法不存在時，會自動呼叫，程式仍會繼續執行下去。

   ```php
   class Person
   {
       function say()
       {
              echo "Hello, world!<br>";
       }

       /**
        * 宣告此方法用來處理，當呼叫了此物件中不存在的方法
        */
       function __call($funName, $arguments)
       {
             echo "你所呼叫的函數：" . $funName . "(參數：" ;  // 輸出呼叫的不存在方法名稱
             print_r($arguments); // 输出呼叫不存在方法的參數列表
             echo ")不存在！<br>\n"; // 結束換行
       }
   }

   $Person = new Person();
   $Person->run("teacher"); // 呼叫物件中不存在的方法，此時會自動呼叫物件中的 __call() 方法
   $Person->eat("小明", "蘋果");
   $Person->say();
   ```

   輸出

   ```php
   你所呼叫的函數：run(參數：Array ( [0] => teacher ) )不存在！

   你所呼叫的函數：eat(參數：Array ( [0] => 小明 [1] => 蘋果 ) )不存在！

   Hello, world!
   ```

### `__callStatic` 用靜態方式呼叫一個不可訪問的方法時，呼叫此方法

```php
<?php
class Person
{
    function say()
    {
        echo "Hello, world!<br>";
    }

    /**
     * 宣告此方法用來處理當靜態呼叫了不存在的方法時
     */
    public static function __callStatic($funName, $arguments)
    {
        echo "你所呼叫的靜態方法：" . $funName . "(參數：" ;  // 輸出呼叫不存在的方法名稱
        print_r($arguments); // 输出呼叫不存在方法時傳入的參數
        echo ")不存在！<br>\n"; // 结束换行
    }
}

$Person = new Person();
$Person::run("teacher"); // 用於呼叫物件中不存在的靜態方法時，會自動呼叫物件中的__callStatic()方法
$Person::eat("小明", "蘋果");
$Person->say();
```

### `__get` 獲取一個類別的成員變數時呼叫

在 php 物件導向中，若類別成員被設定為 private 時，若我們在外面呼叫他則會出現"無法訪問某個私有屬性"的錯誤。

- 此方法的作用：在程式運行中，透過他可以在物件外面獲取私有屬性成員的值

  ```php
  class Person
  {
      private $name;
      private $age;

      function __construct($name="", $age=1)
      {
          $this->name = $name;
          $this->age = $age;
      }

      /**
       * 在類別中添加__get()方法，在直接獲取屬性時，自動呼叫一次，以屬性名作為參數傳入並處理
       * @param $propertyName
       *
       * @return int
       */
      public function __get($propertyName)
      {
          if ($propertyName == "age") {
              if ($this->age > 30) {
                  return $this->age - 10;
              } else {
                  return $this->$propertyName;
              }
          } else {
              return $this->$propertyName;
          }
      }
  }

  $Person = new Person("小明", 60);   // 透過將 Persian 類別實例化的物件，並透過建構函示為屬性添加預設值
  echo "姓名：" . $Person->name . "<br>";   // 直接呼叫私有屬性 $name，自動呼叫了__get()方法可以間接獲取
  echo "年龄：" . $Person->age . "<br>";    // 自動呼叫 __get()方法，根據物件本身的情況會返回不同的值
  ```

  ```php
  姓名：小明
  年齡：50
  ```

### `__set` 設置一個類別的成員變數時呼叫

- 作用：設置私有屬性，給一個未定義的屬性賦值，此方法會被觸發，傳入的參數是被設置的屬性名和值

  ```php
  class Person
  {
      private $name;

      private $age;

      public function __construct($name="",  $age=25)
      {
          $this->name = $name;
          $this->age  = $age;
      }

      /**
       * 宣告此方法需兩個參數，直接為私有屬性賦值時自動呼叫，並可以排除非法賦值
       *
       * @param $property
       * @param $value
       */
      public function __set($property, $value) {
          if ($property=="age")
          {
              if ($value > 150 || $value < 0) {
                  return;
              }
          }
          $this->$property = $value;
      }

      /**
       * 在類別中宣告 say()，將所有的私有屬性輸出
       */
      public function say(){
          echo "我叫".$this->name."，今年".$this->age."歲了";
      }
  }

  $Person= new Person("小明", 25); // 注意，初始值將被下面所更改
  // 自動呼叫 __set()，將數系名稱name傳遞給第一個參數，將屬性值"小明"傳遞給第二參數
  $Person->name = "小红";     // 赋值成功。如果没有__set()，則出錯。
  // 自動呼叫 __set() 函数，將屬性名稱 age 傳給第一個參數，將屬性值 26 傳給第二個參數
  $Person->age = 16; //赋值成功
  $Person->age = 160; //160是一个非法值，赋值失效
  $Person->say();  //输出：我叫小红，今年 16 歲了
  ```

### `__isset()` 當私有屬性呼叫 isset() 或 empty() 時呼叫此方法

## 方法

### `in_array()` 檢查陣列中是否包含特定的數值

- `bool in_array(mixed $needle, array $haystack, bool $strict = false)`
  - `$needle` 要查找的值
  - `$haystack` 要檢查的陣列
  - `#strict` 可選，若為 `true`，則不僅檢查直是否相等，還要檢查型別是否相等。預設為 `false`

```php
$fruits = ["apple", "banana", "cherry", "date"];

// 使用 in_array 检查数组中是否包含 "cherry"，不考虑数据类型
if (in_array("cherry", $fruits)) {
    echo "数组中包含 'cherry'。";
} else {
    echo "数组中不包含 'cherry'。";
}

// 使用 in_array 检查数组中是否包含 2，考虑数据类型
if (in_array(2, $fruits, true)) {
    echo "数组中包含 2（考虑数据类型）。";
} else {
    echo "数组中不包含 2（考虑数据类型）。";
}

```

### `foreach`

- `foreach()` 尋訪陣列

  ```php
  foreach ($array as $value) {
    // 每次尋訪會將陣列的值存到value中，直到陣列結束
  }
  foreach ($array as $key => $value) {
   // 每次尋訪會將陣列的值以及key，存到value中  key => 流水號
  }
  ```

- `continue` 跳出本次循環，繼續執行下向執行

- `array_key_first()` 取得陣列中第一個 key 值
- `array_key_last()` 取得陣列中最後一個 key 值

  ```php
  $array  = array("dog", "rabbit", "horse", "rat", "cat");
  foreach($array as $index => $animal) {
      if ($index === array_key_first($array))
          echo $animal; // output: dog
      if ($index === array_key_last($array))
          echo $animal; // output: cat
  }
  ```

- `break` 跳出迴圈

  ```php
  <?php
  foreach (array('1','2','3') as $first) {
      echo "$first ";
      foreach (array('3','2','1') as $second) {
          echo "$second ";
          if ($first == $second) {
              break;  // this will break both foreach loops
          }
      }
      echo ". ";  // never reached!
  }
  echo "Loop Ended";
  ?>
  ```

- 輸出

  ```php
  1 3 2 1 . 2 3 2 . 3 3 . Loop Ended
  ```

### `scandir` 掃描指定的目錄，並返回為陣列

- `scandir()` 掃描指定的目錄，並返回為陣列

### `list` 宣告陣列中的值，使其成為變數

- `list(var1, var2...)` 宣告陣列中的值，使其成為變數

  ```php
  $my_array = array('dog', 'cat', 'horse');
  list($a, $b, $c) = $my_array;
  echo "i have several animals, a $a, a $b, a $c. ";
  // i have several animals, a dog, a cat and a horse.
  ```

### `append` 將傳入的值附加進陣列

- `append(var1, var2)`

  ```php
  // PHP function to illustrate the
  // append() method
  $arrObj = new ArrayObject(array('Geeks', 'for', 'Geeks'));
  // Appending an array
  $arrObj->append(array('welcomes', 'you'));
  var_dump($arrObj);
  ```

- 輸出

  ```php
  object(ArrayObject)#1 (1) {
    ["storage":"ArrayObject":private]=>
    array(4) {
      [0]=>
      string(5) "Geeks"
      [1]=>
      string(3) "for"
      [2]=>
      string(5) "Geeks"
      [3]=>
      array(2) {
        [0]=>
        string(8) "welcomes"
        [1]=>
        string(3) "you"
      }
    }
  }
  ```

### 在陣列中新增元素

#### 直接賦值

```php
$array[] = $array;
```

```php
$flower = array();
echo("The array is empty, as you can see. \n");
print_r($flowers);
echo("Now, we have added the values. \n");
$flowers[] = "Rose";
$flowers[] = "Jasmine";
$flowers[] = "Lili";
$flowers[] = "Hibiscus";
$flowers[] = "Tulip";
print_r($flowers);
```

```php
The array is empty, as you can see.
Array
(
)
Now, we have added the values.
Array
(
    [0] => Rose
    [1] => Jasmine
    [2] => Lili
    [3] => Hibiscus
    [4] => Tulip
)
```

#### `array_push` 在陣列最後新增元素

- `array_push($array, $value1, $value2, ..., $valueN);`
- `$array` 必須，目標新增元素的陣列
- `$value1`, `$value2` 必須，欲新增至陣列的元素，可以為字串、整數、浮點數等

  ```php
  $flowers = array();
  echo("The array is empty, as you can see. \n");
  print_r($flowers);
  echo("Now, we have added the values. \n");
  array_push($flowers, "Rose", "Jasmine", "Lili", "Hibiscus", "Tulip");
  print_r($flowers);
  ```

  ```php
  The array is empty, as you can see.
  Array
  (
  )
  Now, we have added the values.
  Array
  (
      [0] => Rose
      [1] => Jasmine
      [2] => Lili
      [3] => Hibiscus
      [4] => Tulip
  )
  ```

#### `array_unshift` 在陣列前端插入

- `array_unshift($array, $value1, $value2, ..., $valueN)`
- `$array` 必須，目標新增元素的陣列
- `$value1`, `$value2` 必須，欲新增至陣列的元素，可以為字串、整數、浮點數等

  ```php
  $flowers = ['first', 'second'];
  print_r($flowers);
  echo("Now we have added the values. \n");
  echo(array_unshift($flowers, "Rose", "Jasmine", "Lili", "Hibiscus", "Tulip"));
  echo("\n");
  print_r($flowers);
  ```

  ```php
  Array
  (
    [0] => first
    [1] => second
  )
  Now we have added the values.
  7
  Array
  (
    [0] => Rose
    [1] => Jasmine
    [2] => Lili
    [3] => Hibiscus
    [4] => Tulip
    [5] => first
    [6] => second
  )
  ```

### `array_fill` 以填充數值的方式，建立新陣列

- `array_fill(int $start_index, int $count, mixed $value): array` 將傳入的`$value`，加入`$count` 個值到陣列，開始的 key 值由`$start_index` 指定

- `$start_index` 回傳陣列的第一個 key 值，如為負數，返回的第一個 key 將會是 start_index 的值，而後面的 key 值由 0 開始。

- `$count` 插入值的數量，需大於等於 0 ，否則拋出 E_WARNING。

- `$value` 傳入陣列的值。

  ```php
  $a = array_fill(5, 6, 'banana');
  $b = array_fill(-2, 4, 'pear');
  print_r($a);
  print_r($b);
  ```

  ```php
  Array
  (
    [5]  => banana
    [6]  => banana
    [7]  => banana
    [8]  => banana
    [9]  => banana
    [10] => banana
  )
  Array
  (
    [-2] => pear
    [0] => pear
    [1] => pear
    [2] => pear
  )
  ```

### `array_combine` 將傳入的參數合併為陣列

- `array_combine(array $keys, array $values): array` `$key`為 key 值，`$value` 為相對應的值。

  ```php
  $a = array('green', 'red', 'yellow');
  $b = array('avocado', 'apple', 'banana');
  $c = array_combine($a, $b);
  print_r($c);
  ```

  ```PHP
  Array
  (
    [green]  => avocado
    [red]    => apple
    [yellow] => banana
  )
  ```

### `array_unique` 從陣列中刪除重複的值

- `array_unique($array, $flags)`

- `$array` 要刪除重複值的陣列
- `$flags` 指定陣列的排序模式，有五種型別
- `SORT_REGULAR` 正常常比較元素
- `SORT_NUMERIC` 以數字方式比較元素
- `SORT_STRING` 以字串方式比較元素
- `SORT_LOCALE_STRING` 基於當前的語言環境，以字串方式比較元素。

### `array_diff` 判斷陣列之間差異

- `array_diff( $array1 , $array2 , $array3 , ... ):array` 後面每個陣列都跟第一個陣列做比較，此方法會回傳在第一陣列中有出現，但未出現在其他陣中的值，並會保留鍵名

  ```php
  $array1 = array('A','B','C','D');
  $array2 = array('C','D','E','F');
  $array3 = array('A','B','E','F');
  $newArray1 = array_diff($array1,$array2);
  print_r($newArray1);
  $newArray2 = array_diff($array1,$array3);
  print_r($newArray2);
  ```

  ```PHP
  Array
  (
    [0] => A,
    [1] => B
  )
  Array
  (
    [2] => C,
    [3] => D
  )
  ```

- 進階用法

藉由其查詢兩個以上陣列之間的差異，並返回不存在陣列中的值之特性。

因此可用來刪除陣列中多個值，而不影響其索引值。

```php
//Declare the array
$flowers = [
  "Rose",
  "Lili",
  "Jasmine",
  "Hibiscus",
  "Tulip",
  "Sun Flower",
  "Daffodil",
  "Daisy"
];

$flowers = array_diff($flowers, array("Rose","Lili"));
echo "The array is:\n";
print_r($flowers);
```

```php
Array
(
[2] => Jasmine
[3] => Hibiscus
[4] => Tulip
[5] => Sun Flower
[6] => Daffodil
[7] => Daisy
)
```

### `array_slice` 從陣列中取得一段連續的元素

此方法會返回一個新的陣列，包含從原陣列取得的元素，而原始陣列不會被修改。

- `array_slice(array $array, int $offset, int $length = null, bool $preserve_keys = false);`
  - `$array` 目標的陣列
  - `$offset` 從陣列的哪一個位置開始取得元素
  - `$length` 可選參數，指定取得的元素個數，若未設置，則從 $offset 開始擷取到陣列最後的所有元素。
  - `$preserve_keys` 可選參數，若為 `true`，則保留原始陣列的 key 值，預設為 `false`

```php
$fruits = ['apple', 'banana', 'cherry', 'date','fig'];

// 擷取陣列前三個元素
$slice1 = array_slice($fruits, 0, 3);
print_r($slice1); // 输出：['apple', 'banana', 'cherry']

// 擷取陣列的後兩個元素
$slice2 = array_slice($fruits, -2);
print_r($slice2); // 输出：['date', 'fig']
```

### 日期/時間

#### `date` 格式化 Unix timestamps

- `date(string $format, ?int $timestamp = null)`

- `$format` 指定的格式
  - `Y` 年份，四位數
  - `y` 年份二位數
  - `F` 月份英文全名；如 'March'
  - `M` 月份英文縮寫；如 'Mar'
  - `m` 月份數字，不足二位前面補 0
  - `n` 月份數字
  - `D` 星期英文縮寫；如：'Fri'
  - `l` 星期英文全稱；如：'Friday'
  - `w` 星期數字
  - `d` 幾日數字，不足二位前面補 0
  - `j` 幾日數字
  - `H` 24 小時制，不足二位前面補 0
  - `h` 12 小時制，不足二位前面補 0
  - `G` 24 小時制
  - `g` 12 小時制
  - `i` 分鐘
  - `A` Am 或 Pm
  - `a` am 或 pm
  - `s` 秒
  - `U` 總秒數
  - `t` 指定月份的天數；如"28", "31"
  - `z` 一年中的第幾天
- `$timestamp` 時間戳(可選)

#### `mktime` 取得指定日期的時間戳

- `mktime($hour, $minute = null, $second = null, $month = null, $day = null, $year = null)`
- 任何省略的變數，將依據本地時間設置

#### `date_diff` 獲取以分鐘為單位的時間差

- `date_diff($StartDateTimeObject, $EndDateTimeObject)`
  - `$StartDateTimeObject1` 必須，為一個 DataTime 物件，表示開始日期。
  - `$EndDateTimeObject1` 必須，為一個 DataTime 物件，表示結束日期。
  - 若失敗返回 false

```php
$date_time_start = date_create('2019-06-19')
$date_time_end = date_create('2020-06-19')

$difference = date_diff($date_time_start, $date_time_end);
```

### `sort` 陣列排序

#### 依 value 排序

- 由小到大排序值
- `sort` 刪除 key
- `asort` 保留 key
- 由大到小排序值
- `rsort` 刪除 key
- `arsort` 保留 key

#### 依 key 排序

- `ksort` 由小到大排索引值
- `krsort` 由大到小排索引值

#### 自訂排序

加上一個前綴 `u` 在相對應的方法

- 範例一：
  今天有一個陣列如下

  ```php
  $unsorted = [
      ['name'   => 'good',
       'sorter' => '1',],

      ['name'   => 'bad',
       'sorter' => '3',],

      ['name'   => 'normal',
       'sorter' => '2',],
  ];
  ```

  我要透過 sorter 這個 key 的 value 來做排序

  ```php
  usort($unsorted, function ($a, $b) {
      return $a['sorter'] > $b['sorter'];
      // 如果 a > b 的話 就會輸出 1，而因為 usort 的 根基是 sort
      // 意即是照 value 由小到大排序，所以輸出 1 的就會往後排，進而達到目的
  });
  ```

  ```php
  array(3) {
   [0]=>
   array(2) {
     ["name"]=>
     string(4) "good"
     ["sorter"]=>
     string(1) "1"
   }
   [1]=>
   array(2) {
     ["name"]=>
     string(6) "normal"
     ["sorter"]=>
     string(1) "2"
   }
   [2]=>
   array(2) {
     ["name"]=>
     string(3) "bad"
     ["sorter"]=>
     string(1) "3"
   }
  }
  ```

- 範例二：

  如果一樣的陣列，但要用來比對的數值是重複的

  ```php
  $unsorted = [
      ['name'   => 'good', 'sorter' => '1',],
      ['name'   => 'bad', 'sorter' => '3',],
      ['name'   => 'normal', 'sorter' => '3',],
  ];
  ```

  可以增加一個比對條件

  ```php
  $unsorted = [
      [
        'name'   => 'good',
        'sorter' => '1',
        'newSorter'=> '2'
      ],
      [
        'name'   => 'bad',
        'sorter' => '3',
        'newSorter'=> '3'
      ],
      [
        'name'   => 'normal',
        'sorter' => '3',
        'newSorter' => '1'
      ],
      [
        'name'   => 'hahaha',
        'sorter' => '2',
        'newSorter' => '1'
      ],
  ];
  ```

  依照 sorter 來進行排序，但如果 sorter 數值相同，則使用 newSorter 來進行排序

  ```php
  usort($unsorted, function ($a, $b)) {
      return $a['sorter'] > $b['sorter'] || ($a['sorter'] == $b['sorter'] && $a['newSorter'] > $b['newSorter']);
  }

  // 或這樣寫
  if ($a['sorter'] > $b['sorter'] || ($a['sorter'] == $b['sorter'] && $a['newSorter'] > $b['newSorter'])) {
      return 1;
  } elseif ($a['sorter'] < $b['sorter']) {
      return -1;
  } else {
      return 0;
  }
  ```

  ```php
  array(4) {
    [0]=>
    array(3) {
      ["name"]=>
      string(4) "good"
      ["sorter"]=>
      string(1) "1"
      ["newSorter"]=>
      string(1) "2"
    }
    [1]=>
    array(3) {
      ["name"]=>
      string(6) "hahaha"
      ["sorter"]=>
      string(1) "2"
      ["newSorter"]=>
      string(1) "1"
    }
    [2]=>
    array(3) {
      ["name"]=>
      string(6) "normal"
      ["sorter"]=>
      string(1) "3"
      ["newSorter"]=>
      string(1) "1"
    }
    [3]=>
    array(3) {
      ["name"]=>
      string(3) "bad"
      ["sorter"]=>
      string(1) "3"
      ["newSorter"]=>
      string(1) "3"
    }
  }
  ```

### 分割字串

#### `explode`

- `explode( string $delimiter , string $string , int $limit )`

- `$delimiter` - 字串的切割部位，請自行設定，字串形態，必填
- `$string` - 被要處理的字串，字串形態，必填項目。
- `$limit` - 設定字串切割後最多可輸出的數量，數字形態，可為正整數或負整數，如果填寫正整數，最後的的部份包含切割完剩下的所有部份，，如果填寫負整數，則倒數的部份若在負整數範圍 內將不會顯示，非必填項目

  ```php
  <?php
    $str = 'Apple Dog Pig';
    $str_sec = explode(" ",$str);
    print_r($str_sec);
  ```

  ```php
  Array (
  　[0] => Apple
  　[1] => Dog
  　[2] => Pig
  )
  ```

- 加入`$limit` 參數

  ```php
  <?php
    $str = 'Apple Dog Pig';
    $str_sec_A = explode(" ",$str,2);
    $str_sec_B = explode(" ",$str,-1);
    print_r($str_sec_A);
    print_r($str_sec_B);
  ```

  ```php
  Array (
  　[0] => Apple
  　[1] => Dog Pig
  )
  Array (
  　[0] => Apple
  　[1] => Dog
  )
  ```

#### `str_split`

- `str_split($string, $length)`

- `string` 必需。規定要分割的字符串。
- `length` 可選。規定每個數組元素的長度。默認是 1。

  ```php
  <?php
    $NewString = "M'L2";
    $Arr2=str_split($NewString,3);//根據每三個字元切割
    print_r($Arr2);
  ```

  ```php
  Array(
      [0] => "M'L"
      [1] => 2
  )
  ```

#### preg_split

- `preg_split ( string $pattern , string $subject , int $limit , int $flags )`

- `pattern` 用於搜索的模式，字串形式
- `subject` 輸入字串
- `limit` 可選，用來設定分割後的單位總數量，預設值為 -1
- `flags` 可選
  - `PREG_SPLIT_NO_EMPTY`只返回非空白部分
  - `PREG_SPLIT_DELIM_CAPTURE`和字串中的正規表達式一起返回
  - `PREG_SPLIT_OFFSET_CAPTURE`將每個返回增加字串的偏移量

```php
//根據空格切開
$NewString1 = preg_split("/[\s,]+/", "Welcome to Wibibi.Have a good day.");
print_r($NewString1);

echo '<br>';

//把每個英文字母切開
$NewString2 = 'Welcome';
$NewString2 = preg_split('//', $NewString2, -1, PREG_SPLIT_NO_EMPTY);
print_r($NewString2);
```

### `array_slice` 從陣列中取出想要的元素

- `array_slice($array, $start, $length, $preserve)`

- `array` 必填，傳入陣列。
- `start` 必填，規定取出元素的開始位置，0 = 第一個元素，若傳入正數，則由前往後取值，若為負值由後往前取值。
- `length` 選填，規定返回的陣列長度。
- `preserve` 選填，`true` 保留 key 值，`false` 重置 key 值。

  ```php
  <?php
  $a=array("red","green","blue","yellow","brown");
  print_r(array_slice($a,2));
  ```

  ```php
  Array
  (
      [0] => blue
      [1] => yellow
      [2] => brown
  )
  ```

### `implode` 將陣列轉為字串

- `implode($separator, $array)`

- `separator` 可選。規定數組元素之間放置的內容。默認是 ""（空字符串）。
- `array` 必需。要結合為字符串的數組。

  ```php
  $arr = [1,2,3,4,5,6];
  print_r(implode('=', $arr));
  ```

  ```php
  "1=2=3=4=5=6"
  ```

### `array_filter` 過濾陣列元素(刪除陣列空值)

- `array_filter($arrayName, $callbackFunction, $callbackParameter)`

  - `$arrayName` 必須，目標陣列
  - `$callbackFunction` 可選，指定刪除的參數，預設刪除陣列中等於 false 的值
  - `$callbackParameter` 可選，引用傳遞給回傳函數的參數

    - `ARRAY_FILTER_USE_KEY` 將 key 作為唯一參數傳遞給回調函數，而不是數組的值
    - `ARRAY_FILTER_USE_BOTH` 將值和鍵都作為參數而不是值傳遞給回調

      ```php
      // PHP function to check for even elements in an array
      function Even($array)
      {
          // returns if the input integer is even
          if($array%2==0)
             return TRUE;
          else
             return FALSE;
      }
      $array = array(12, 0, 0, 18, 27, 0, 46);
      print_r(array_filter($array, "Even"));
      ```

      ```php
        Array (
            [0] => 12
            [1] => 0
            [2] => 0
            [3] => 18
            [5] => 0
            [6] => 46
        )
      ```

### `str_pad` 填充字串為指定長度

- `str_pad($string, $length, $pad_string, $pad_type)`

- string 必填，要填充的字串。
- length 必填，規定新字串的長度，若小於傳入的字串長度，則不進行操作。
- pad_string 可選，提供填充的字串，預設為空白。
- pad_type 可選，字串填充的方向。

  - STR_PAD_BOTH 填充字串的兩側，若不為偶數，則將額外的字串填充至右側。
  - STR_PAD_LEFT 填充到字串的左側。
  - STR_PAD_RIGHT 填充到字串的右側(預設)。

    ```php
    $str = "Hello world";
    echo str_pad($str, 20, ".", STR_PAD_LEFT);
    ```

    ```php
    .........Hello World
    ```

    ```php
    $str = "Hello world";
    echo str_pad($str, 20, ".:", STR_PAD_BOTH);
    ```

    ```php
    .:.:Hello World.:.:.
    ```

### 資料序列化及反序列化

#### `string serialize` 序列化

- `string serialize( mixed $value )`

- $value: 要序列化的對象或陣列

  ```php
  $sites = array('Google', 'Runoob', 'Facebook');
  $serialized_data = serialize($sites);
  echo  $serialized_data . PHP_EOL;
  ```

  ```php
  a:3:{i:0;s:6:"Google";i:1;s:6:"Runoob";i:2;s:8:"Facebook";}
  ```

#### `mixed unserialize` 反序列化

- `mixed unserialize( string $str )`

- $str: 序列化後的字串

  ```php
  $str = 'a:3:{i:0;s:6:"Google";i:1;s:6:"Runoob";i:2;s:8:"Facebook";}';
  $unserialized_data = unserialize($str);
  print_r($unserialized_data);
  ```

  ```php
  Array
  (
      [0] => Google
      [1] => Runoob
      [2] => Facebook
  )
  ```

### `file_get_contents` 將本地文件存入一個變數中

- `file_get_contents($path, $include_path, $context, $start, $max_length)`

- path (必須) 文件的路徑
- include_path (可選) 如果也想在 include_path 中搜尋文件，可以將該參數設為"1"
- context (可選) 規定文件控制代碼的環境
- start (可選) 指定在文件中開始讀取的位置。
- max_length (可選) 規定讀取的位元組。

### `str_pad` 補足字串

- `str_pad($str, $pad_length , $pad_string, $pad_type)`

- `$str` 來源字串
- `$pad_length` 補完後字串長度
- `$pad_string` 補入的字元
- `$pad_type` 補入的規則

  - `STR_PAD_BOTH` 左右都補
  - `STR_PAD_LEFT` 從左邊開始
  - `STR_PAD_RIGHT` 從右邊開始

  把 id 由左邊開始補 0，補到五位數

  ```php
  $id=01;
  $id=str_pad($id,5,"0",STR_PAD_LEFT);
  echo $id;
  //00001
  ```

### `str_replace` 替換字串

### 將字串轉換為數值

> 若字串開頭為 0，轉為數值後開頭的 0 會被省略

- `number_format()` 若失敗則返回`E_WARNING`

- 使用類型轉換

  ```php
  $num = "1000.314";
  echo (int)$num
  ```

- 透過運算子將字串轉為數值，例如在字串中 + 0

### `is_a` 檢查物件是該類別，或該類別是此物件的父類別(boolean)

- `is_a( object $object , string $class_name )`

- 此函數在 php 5 之後已廢棄，改用 `instanceof` 型態運算子

### `substr` 取得部分字串，可設定字串長度

- `substr( $string , $start , $length )`

- $string 原始的字串
- $start 要開始擷取的位置(須為數字，可為正數或負數)
- $length 要擷取的字串長度(須為數字，可為正數或負數)

```php
echo substr("abcde", -1);       // 輸出 e，因為從字尾開始算一個字母。
echo substr("abcde", -2);       // 輸出 de，因為從字尾開始算，共取兩個字母。

echo substr("abcd", -3, 1);     // 輸出 b，因為從字尾開始算，先取三個字母為 bcd，接著長度在從 bcd 取 1 位。
echo substr("abcdef", 0, -1);   // 輸出 abcde，因為程式先從零開始取整段字串，長度再由字串尾扣掉一個。
echo substr("abcdef", 2, -1);   // 輸出 cde，因為程式先從第二個字元開始，取得 cdef 這幾個字，再由取得的字串尾扣掉一個。
echo substr("abcdef", 5, -2);   // 回傳 false，因為程式一開始先取得 f，然後扣掉五個字元，就什麼都沒有囉！
echo substr("abcdef", -4, -2);  // 輸出 cd，因為程式先取得 cdef 這四個字元，再從其中的字尾開始扣掉兩個字元。
```

### 轉換字母大小寫

#### `ucfirst` 將字串的首字母轉為大寫

```php
$foo = 'hello world!';
$foo = ucfirst($foo);             // Hello world!
```

#### `strtolower` 將字串換為小寫

```php
$str = "Mary Had A Little Lamb and She LOVED It So";
$str = strtolower($str);
// mary had a little lamb and she loved it so
```

#### `strtoupper` 將字串換為大寫

```php
$str = "Mary Had A Little Lamb and She LOVED It So";
$str = strtoupper($str);
//  MARY HAD A LITTLE LAMB AND SHE LOVED IT SO
```

### `define` 定義一個常數

- `define(name,value,case_insensitive)`

- name 必須，規定常數的名稱。通常為全大寫 + 下划線。
- value 必須，規定常數的值。
- case_insensitive 必須，規定常數是否大小寫敏感，預設為 false : 大小寫敏感。

- 常數類似變數，但常數在設定之後，其值無法改變，常數名不用 `$` 開頭，作用域不影響對常數的存取，其值只能是字串或數值

## 在 Linux 執行 php 檔

### 方法一

- 在程式的第一行加入路徑 -q

  ```php
  #! /usr/bin/php -q
  $foo = 123;
  ```

- 將 php 檔賦予執行權限

  ```bash
  chmod +x testing.php
  ```

- d/n

  ```bash
  ./testing.php # 可以像其他 shell script 般執行
  ```
