# PHP 物件導向

<!-- TOC -->

- [PHP 物件導向](#php-物件導向)
  - [物件和類別 `Objects` and `Classes`](#物件和類別-objects-and-classes)
  - [建立類別 `Class`](#建立類別-class)
  - [定義類別的屬性](#定義類別的屬性)
  - [定義類別的方法 Methods](#定義類別的方法-methods)
  - [定義類別的常數 const](#定義類別的常數-const)
  - [封裝 Encapsulation](#封裝-encapsulation)
  - [PHP 魔術函數](#php-魔術函數)
    - [`__construct` 建構式](#__construct-建構式)
    - [`__destruct` 解構式](#__destruct-解構式)
    - [`unset`](#unset)
    - [`__toString`](#__tostring)
    - [`__get` `__set` 強制封裝](#__get-__set-強制封裝)
  - [類別繼承](#類別繼承)
    - [覆寫 Override 繼承的方法和屬性](#覆寫-override-繼承的方法和屬性)
    - [`final` 避免被覆寫](#final-避免被覆寫)
    - [範圍解析運算子 scope resolution operator](#範圍解析運算子-scope-resolution-operator)
  - [將屬性和方法加上可視性 Visibility](#將屬性和方法加上可視性-visibility)
    - [`Protected` 受保護的](#protected-受保護的)
    - [`Private` 隱私的](#private-隱私的)
  - [介面與抽象類別的應用](#介面與抽象類別的應用)
    - [interface 介面](#interface-介面)
    - [Abstract 抽象類別](#abstract-抽象類別)
  - [`trait` 的應用](#trait-的應用)
  - [`Static` 靜態關鍵字](#static-靜態關鍵字)
    - [概念與定義](#概念與定義)
    - [目的和好處](#目的和好處)
    - [範例](#範例)
  - [參考資料](#參考資料)

<!-- /TOC -->

## 物件和類別 `Objects` and `Classes`

把類似或有關聯的工作或屬性，組織到類別`class`裡面。
這可以讓程式保持遵守 **不重複原則 “don’t repeat yourself” (DRY)**，更容易維護。

- `class` 類別：可以比喻作一個建築的藍圖。類別是將房子的樣式設計出來。
- `object` 物件：依照藍圖蓋出來的房子。物件是類別的實例。
- `data` 資料：就像是鋼筋、水泥，用來蓋房子的材料。

`data`(建材)經過`class`(藍圖)，就會被實例化變成`object`(房子)。

## 建立類別 `Class`

```php
<?php
class MyClass
{
    // 類別的屬性和方法在大括號裡面宣告
}

$obj = new MyClass;

var_dump($obj);
```

- `new` 關鍵字在建立類別之後，實例化一個類別，並將它存到一個變數上。

- `var_dump()` 來印出變數的相關訊息於螢幕上。

最終會輸出

```html
object(MyClass)#1 (0) { }
```

此為最基礎的物件形式。

## 定義類別的屬性

使用屬性(Property)，也稱 **`Class`的變數(Variable)** 來把 `Data` 存入一個 `Class` 裡面。

```php
<?php

class MyClass
{
  public $prop1 = "I'm a class property!";
}

$obj = new MyClass;
```

- `public` 此為屬性的關鍵字，用來決定屬性的可視性(Visibility)。

指定要讀取的物件及屬性，並將其顯示在瀏覽器上

```php
echo $obj->prop1; // Output the property
```

- `->`（對象運算符）: 在 PHP 物件中，用來存取物件的屬性(Property)和方法(Methods)。
- `::`（雙冒號）: 用來訪問靜態屬性。

最後將會得到

```html
I'm a class property!
```

## 定義類別的方法 Methods

可以藉由執行這些方法，來更改物件的行為或是狀態。

建立一個方法來設定與讀取屬性 `$prop1` 的值

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function setProperty($new_value) {
        $this->prop1 = $new_value;
    }

    public function getProperty() {
        return $this->prop1 . "<br />";
    }
}

$obj = new MyClass;
echo $obj->getProperty(); // 得到原始的屬性值

$obj->setProperty("I'm a new property value!"); // 設定新的屬性值
echo $obj->getProperty(); // 得到新的屬性值
```

- `$this` : 物件透過 `$this` 關鍵字來參考自己，物件使用 $this 就如同你直接使用物件名稱來指定物件。
- `$this` 寫在 class 內部
- 使用這些含有 `$this` 的方法之前，記得先要實例化這些方法的物件。

  ```php
  $this->prop1;
  myClass->prop1; // 兩者的意義相同
  ```

輸出的結果

```html
I'm a class property! I'm a new property value!
```

接著再 `new` 一個新的 `class`

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function setProperty($new_value) {
        $this->prop1 = $new_value;
    }

    public function getProperty() {
        return $this->prop1 . "<br />";
    }
}

// 將兩個物件實例化
$obj = new MyClass;
$obj2 = new MyClass;

// 取得兩個物件的屬性變數 $prop1
echo $obj->getProperty();
echo $obj2->getProperty();

// 將兩個物件設定新的屬性值
$obj->setProperty("I'm a new property value!");
$obj2->setProperty("I belong to the second instance!");

// 輸出兩個物件的新屬性值
echo $obj->getProperty();
echo $obj2->getProperty();
```

輸出結果

```html
I'm a class property! I'm a class property! I'm a new property value! I belong
to the second instance!
```

- 物件導向將 `object` 視為獨立的個體，依照藍圖蓋出來的房子，每一間都是獨立的。

## 定義類別的常數 const

- 可以把類別中始終保持不變的值，定義為常數。

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    const constant = "value";

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    public function getProperty()
    {
        return $this->prop1 . "<br />";
    }

    function showConstant() {
        echo  self::constant . "<br />";
    }
}

// 將物件實例化
$obj = new MyClass;

// 取得物件的常數
echo $obj->showConstant();
echo MyClass::constant;
```

輸出結果

```html
value value
```

## 封裝 Encapsulation

每個物件都包含進行操作時需要的所有資訊，物件不必依賴其他物件來完成操作，將方法、欄位、屬性和邏輯包裝在類別內，透過類別的實體來實現，外部物件無法了解物件的內部細節，有種隱藏起來的概念，外部對資料的操作也只能透過已經定義的介面，用一段簡白的話來說，對事只了解他的外在，無需理解內部構造，即為封裝。

## PHP 魔術函數

### `__construct` 建構式

- `__construct()` : 當一個物件建立的時候會 **首先** 被呼叫。
- `__CLASS__` : 會回傳被呼叫的類別名稱。

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    public function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

// 實例化一個物件
$obj = new MyClass;

// 取得屬性 $prop1 的值
echo $obj->getProperty();

// 在生命週期的最後加上
echo "End of file.<br />";
```

最後輸出

```html
The class "MyClass" was initiated! I'm a class property! End of file.
```

### `__destruct` 解構式

- `__destruct()` : 可以清除物件，例如：關閉資料庫連線。

```php
<?php
class MyClass
    {
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function __destruct()
    {
        echo 'The class "', __CLASS__, '" was destroyed.<br />';
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    public function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

// 實例化一個新的物件
$obj = new MyClass;

// 取得屬性 $prop1 的值
echo $obj->getProperty();

// 在生命週期的最後加上
echo "End of file.<br />";
```

最後輸出畫面

```html
The class "MyClass" was initiated! I'm a class property! End of file. The class
"MyClass" was destroyed.
```

- 當物件使用完畢，PHP 會自動釋放記憶體。

### `unset`

- `unset()` : 此方法可以更明確觸發 `__destruct()` 魔術函數。

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function __destruct()
    {
        echo 'The class "', __CLASS__, '" was destroyed.<br />';
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    public function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

// 將一個物件實例化
$obj = new MyClass;

// 取得變數 $prop1
echo $obj->getProperty();

// 清除物件
unset($obj);

// 生命週期結束後回傳
echo "End of file.<br />";
```

結果會輸出

```html
The class "MyClass" was initiated! I'm a class property! The class "MyClass" was
destroyed. End of file.
```

### `__toString`

- `__toString` : 將物件轉換為字串。

如果將物件當作字串處理的話，會出現無法傳換型態的錯誤。

```php
// 實例化一個新的物件
$obj = new MyClass;

// 將物件輸出為字串
echo $obj;
```

輸出結果

```html
The class "MyClass" was initiated! Catchable fatal error: Object of class
MyClass could not be converted to string
```

加入 `__toString` 函數，來做轉換處理。

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function __destruct()
    {
        echo 'The class "', __CLASS__, '" was destroyed.<br />';
    }

    public function __toString()
    {
        echo "Using the toString method: ";
        return $this->getProperty();
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    public function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

// 實例化一個新的物件
$obj = new MyClass;

// 回傳物件為字串
echo $obj;

// 清除這個物件
unset($obj);

// 在生命周期結束後輸出
echo "End of file.<br />";
```

當物件試圖轉換成字串時，會觸發 `__toString` 函數，再由 `__toString` 函數呼叫 `getProperty()` 方法。
輸出結果為

```html
The class "MyClass" was initiated! Using the toString method: I'm a class
property! The class "MyClass" was destroyed. End of file.
```

### `__get` `__set` 強制封裝

- `__get()` 只會回傳屬性變數的值
- `__set()` 指派一個新的值給屬性變數

```php
class className
{
    private $attribute

    function __get($name)
    {
        return $this->$name;
    }

    function __set($name, $value)
    {
        $this->$name = $value;
    }

}

$a = new className();
//使用public時，不會用到__get(), __set()屬性

$a->attribute = 5;
//私下呼叫__set()，使用$name設為attribute，$value設為5

$a->attribute
//私下呼叫__get()，並將參數$name設為attribute
```

- 優點：藉由單一的存取處，可以自由地修改底層的實作

## 類別繼承

- `extend` : 此關鍵字可以讓類別繼承其他類別的**方法**和**屬性**。
- 子類別只能繼承一個父類別。

建立一個新的 `class` 並繼承 MyClass

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function __destruct()
    {
        echo 'The class "', __CLASS__, '" was destroyed.<br />';
    }

    public function __toString()
    {
        echo "Using the toString method: ";
        return $this->getProperty();
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    public function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

class MyOtherClass extends MyClass
{
    public function newMethod()
    {
        echo "From a new method in " . __CLASS__ . ".<br />";
    }
}

// 實例化一個新的物件
$new_object = new MyOtherClass;

// 回傳此類別的方法
echo $new_object->newMethod();

// 回傳父層類別的方法
echo $new_object->getProperty();
```

結果輸出

```html
The class "MyClass" was initiated! From a new method in MyOtherClass. I'm a
class property! The class "MyClass" was destroyed.
```

### 覆寫 Override 繼承的方法和屬性

在新的類別中，重新定義繼承自父層的屬性和方法

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function __destruct()
    {
        echo 'The class "', __CLASS__, '" was destroyed.<br />';
    }

    public function __toString()
    {
        echo "Using the toString method: ";
        return $this->getProperty();
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    public function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

class MyOtherClass extends MyClass
{
    public function __construct()
    {
        echo "A new constructor in " . __CLASS__ . ".<br />";
    }

    public function newMethod()
    {
        echo "From a new method in " . __CLASS__ . ".<br />";
    }
}

// 實例化一個新的物件
$new_object = new MyOtherClass;

// 回傳新類別的方法
echo $new_object->newMethod();

// 回傳父層類別的方法
echo $new_object->getProperty();
```

在新類別中，覆寫 `__construct` 方法的輸出結果

```html
A new constructor in MyOtherClass. From a new method in MyOtherClass. I'm a
class property! The class "MyClass" was destroyed.
```

### `final` 避免被覆寫

- 方法前加入 `final` 避免被覆寫

```php
class A
{
    public $attribute = 'default value';

    final function operation()
    {
        echo 'Something<br />';
        echo 'The value of $attribute is'.$this->attribute.'<br />';
    }
}
 //可防止B覆寫operation()
 ------------------------------------------------------------
 //如何完全防止一個類別被繼承？(完全不能被繼承)
final class A
{

}
```

### 範圍解析運算子 scope resolution operator

當要將繼承自父層類別的方法其功能做擴充，要保留原始的功能，但不用將原有的程式碼重寫一遍。

- 範圍解析運算子依然會受到可視性的限制。

新增一個改寫父層類別的函數，並使用 `範圍解析運算子::`，來調用父類別被覆寫的函數

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function __destruct()
    {
        echo 'The class "', __CLASS__, '" was destroyed.<br />';
    }

    public function __toString()
    {
        echo "Using the toString method: ";
        return $this->getProperty();
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    public function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

class MyOtherClass extends MyClass
{
    public function __construct()
    {
        parent::__construct(); // 調用來自父層的 construct 功能
        echo "A new constructor in " . __CLASS__ . ".<br />";
    }

    public function newMethod()
    {
        echo "From a new method in " . __CLASS__ . ".<br />";
    }
}

// 實例化一個新物件
$new_object = new MyOtherClass;

// 將物件輸出成字串
echo $new_object->newMethod();

// 使用來自父層的方法
echo $new_object->getProperty();
```

結果輸出

```html
The class "MyClass" was initiated! A new constructor in MyOtherClass. From a new
method in MyOtherClass. I'm a class property! The class "MyClass" was destroyed.
```

## 將屬性和方法加上可視性 Visibility

- `public` : 方法及屬性可以在類別之外被存取。
- `protected` : 該屬性或方法只能在類別以及子類別的內部存取。
- `private` : 該屬性或方法只能在定義它們的類別內存取。

### `Protected` 受保護的

將 MyClass 的 `getProperty()` 方法的可視性宣告為 `protected`，並且嘗試從外面呼叫這個方法

```php
<?php

class MyClass
{
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function __destruct()
    {
        echo 'The class "', __CLASS__, '" was destroyed.<br />';
    }

    public function __toString()
    {
        echo "Using the toString method: ";
        return $this->getProperty();
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    protected function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

class MyOtherClass extends MyClass
{
    public function __construct()
    {
        parent::__construct();
        echo "A new constructor in " . __CLASS__ . ".<br />";
    }

    public function newMethod()
    {
        echo "From a new method in " . __CLASS__ . ".<br />";
    }
}

// 實例化一個新物件
$new_object = new MyOtherClass;

// 嘗試調用父層的 protected 方法
echo $new_object->getProperty();
```

結果輸出

```html
The class "MyClass" was initiated! A new constructor in MyOtherClass. Fatal
error: Call to protected method MyClass::getProperty() from context ''
```

在子類別 MyOtherClass 中新增一個方法來調用父層的 `protected` `getProperty()` 方法

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function __destruct()
    {
        echo 'The class "', __CLASS__, '" was destroyed.<br />';
    }

    public function __toString()
    {
        echo "Using the toString method: ";
        return $this->getProperty();
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    protected function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

class MyOtherClass extends MyClass
{
    public function __construct()
    {
        parent::__construct();
        echo "A new constructor in " . __CLASS__ . ".<br />";
    }

    public function newMethod()
    {
        echo "From a new method in " . __CLASS__ . ".<br />";
    }

    public function callProtected()
    {
        return $this->getProperty();
    }
}

// 實例化一個新的物件
$new_object = new MyOtherClass;

// 用子類別的 public 方法調用父層的 protected 方法
echo $new_object->callProtected();
```

輸出結果

```html
The class "MyClass" was initiated! A new constructor in MyOtherClass. I'm a
class property! The class "MyClass" was destroyed.
```

### `Private` 隱私的

將父層 MyClass 的 `getProperty()` 方法的宣告為 `private`，並且使用 MyOtherClass 的 `callProtected()` 方法來調用 `getProperty()` 方法。

```php
<?php
class MyClass
{
    public $prop1 = "I'm a class property!";

    public function __construct()
    {
        echo 'The class "', __CLASS__, '" was initiated!<br />';
    }

    public function __destruct()
    {
        echo 'The class "', __CLASS__, '" was destroyed.<br />';
    }

    public function __toString()
    {
        echo "Using the toString method: ";
        return $this->getProperty();
    }

    public function setProperty($new_value)
    {
        $this->prop1 = $new_value;
    }

    private function getProperty()
    {
        return $this->prop1 . "<br />";
    }
}

class MyOtherClass extends MyClass
{
    public function __construct()
    {
        parent::__construct();
        echo "A new constructor in " . __CLASS__ . ".<br />";
    }

    public function newMethod()
    {
        echo "From a new method in " . __CLASS__ . ".<br />";
    }

    public function callProtected()
    {
        return $this->getProperty();
    }
}

// 實例化一個新的物件
$new_object = new MyOtherClass;

// 調用父層的方法
echo $new_object->callProtected();
```

輸出結果

```html
The class "MyClass" was initiated! A new constructor in MyOtherClass. Fatal
error: Call to private method MyClass::getProperty() from context 'MyOtherClass'
```

## 介面與抽象類別的應用

### interface 介面

- `implements`關鍵字 : 執行介面
- 定義功能名稱，但交由執行的類別去**實作**功能
- 執行介面的類別一定要實作介面的方法。
- 介面可以繼承其他的介面。
- 類別可以同時執行多個介面。

用於解決以下問題：

1. 定義共同行為：介面定義一組方法，但不實作這些方法。他允許不同的類別實作相同介面，確保這些類別具有相同的方法。
2. 實現多型：透過介面，可以實現多型，讓不同的物件以相同的方式被處理。
3. 降低耦合：介面提供一種抽象層，使得依賴於介面的程式碼，不需要知道具體實作的細節。
4. 強制契約：介面做為一種契約，確保實作該介面的類別必須提供特定的方法。

Bark.php

```php
<?php
interface Bark
{
  public function bark();
}
```

Swim.php

```php
<?php
interface Swim
{
  public function swim();
}
```

Human.php

```php
<?php
include "Bark.php";
include "Swim.php";
class Human implements Bark, Swim
{
  public function bark()
  {
    echo "人類叫聲...是在叫什麼啦！！";
  }

  public function swim()
  {
    echo "人類在游泳...不是在洗澡嗎？";
  }
}
```

demo.php

```php
<?php
include "Human.php";
$man = new Human();
echo $man->bark();
echo $man->swim();
```

介面的使用時機 : 當「多個類別（Class）」之間有共同的方法（function），但方法實做的方式有差異，可以將這些共用「方法」寫成「介面（Interface）」，讓其他的「子類別（Class）」去實做這個介面

### Abstract 抽象類別

- 父類別若不想實作介面方法，子類別又需要定義介面功能，可以將父類別抽象化，即可不用實作介面方法。
- 子類別繼承抽象父類別之後，必須要實作父類別的介面方法。

dog.php

```php
<?php
include "Bark.php";
abstract class dog implements Bark
{
   // 設定狗的屬性
   public $name;
   public $color;
   public $style;

   //設定建構子
   public function __construct($name,$color,$style)
   {
     $this->name = $name;
     $this->color = $color;
     $this->style = $style;
   }

   public function dogRun()
   {
     echo "狗狗跑步中...";
   }

   // 修改狗叫的功能
   public function Bark()
   {
     //這裡保持空白
   }

   public function __destruct()
   {
     echo "狗狗回家了...";
   }
}
```

Poodle.php

```php
include "dog.php";

class Poodle extends dog
{
  protected $size;

  public function __construct($name,$color,$style,$size)
  {
    parent::__construct($name,$color,$style);
    $this->size = $size;
  }

  // 實作父類別的狗叫 function
  public function Bark()
  {
    echo "狗叫...但小聲....";
    //呼叫父類別的 dogBark()
  }
}
```

demo2.php

```php
<?php
  include "Poodle.php";

  $my_dog = new Poodle("Windy","白色","貴賓狗",30);

  echo $my_dog->Bark();
```

抽象類別的使用時機 : 當「多個類別（Class）」之間有共同的方法（function）或屬性（attribute）時，可以將這些共用的地方寫成「抽象類別（Abstract Class）」，讓其他的「子類別（Class）」去繼承

## `trait` 的應用

簡化 Class 功能複用

```php
class Man
{
    public function walk() {
       // ...
    }
    public function run() {
       // ...
    }
}

class Woman
{
    public function walk() {
      // ...
    }
    public function run() {
       // ...
    }
}
```

當兩個 `class` 都有類似的內容(property 或 method)，用 `trait` 簡化

```php
trait Moveable
{
    public function walk() {
       // ...
    }
    public function run() {
       // ...
    }
}

class Man
{
    use Moveable;
}

class Woman
{
    use Moveable;
}
```

`trait`的屬性無法被使用其的類別覆寫

```php
trait CountAge
{
    protected $age;

    public function getAge(): int { return $this->age; }
    public function setAge(int $age): void { $this->age = $age; }
}

class Child
{
    use CountAge;

    protected $age = 10;
}
```

因為 CountAge 與 Child 中都存在 `$age` 這個屬性，此時便會產生

```html
PHP Fatal error: Child and CountAge define the same property ($age) in the
composition of Child. However, the definition differs and is considered
incompatible.
```

在使用這個 `trait` 的 `class` 都可以使用其所定義的方法。`trait` 中定義的方法為共有的。

```php
trait CheckAdult
{
    private function getAge(): int
    {
        return $this->age;
    }

    public function isAdult(): bool
    {
        return $this->getAge() >= 18;
    }
}

class Human
{
    use CheckAdult;

    protected $age = 18;

    public function canAccessPornHub(): bool
    {
        return $this->isAdult();
    }

    public function canAccessGayTube(): bool
    {
         public $this->getAge() >= 18;
    }
}
```

- 只要 `use` CheckAdult，就可以使用 `isAdult()` 與 `getAge()`。

`trait` 之間不可以具有相同名稱的方法，否則會丟出 Fatal Error。

```php
trait USD
{
    public function getBalance() {  }
}

trait TWD
{
    public function getBalance() {  }
}

class Wallet
{
    use USD;
    use TWD;
}
```

若將函式設為 private 也同樣會出現衝突。

```php
trait USD
{
    private function convert(string $to) {
       // ...
       }
    public function getUSDBalance(): int { return $this->convert('USD'); }
}

trait TWD
{
    private function convert(string $to) {
       // ...
       }
    public function getTWDBalance(): int { return $this->convert('TWD'); }
}

class Wallet
{
    use USD;
    use TWD;
}
```

## `Static` 靜態關鍵字

### 概念與定義

用於宣告靜態變數與方法。所謂「靜態」表示這些變數和方法屬於類別本身，而不是類別的任何特定實例。因此無論創建多少類別的實例，靜態變數和方法只會有一個。

### 目的和好處

- 程式碼重用：用於 static 方法和變數是類別及別的，因此不需要創建類別實例就可以使用。有助於減少程式碼的重複。
- 記憶體效率：靜態變數在所有實例間共享，因此他們同時也節省記憶體使用。尤其在需要多個實例共享資料狀或狀態時非常有用。

1. 靜態屬性：
   1. 靜態屬性是屬於 class 本身，而不是某個特定的物件實例。
   2. 可以使用 `self::` 關鍵字來存取靜態屬性。
   3. 靜態屬性在 class 的所有實例中共享。也就是說，若一個實例改變靜態屬性的值，其他實例也會受到影響。
2. 靜態方法
   1. 靜態方法可以在不建立實例的情況下被呼叫。
   2. 使用 self:: 關鍵字來呼叫靜態方法。
   3. 靜態方法中不能使用 $this，因為他們不屬於任何特定的物件實例。
3. 靜態繼承
   1. 在繼承的 class 中，靜態屬性和方法可以被子類別繼承。
   2. 使用 `parent::` 關鍵字可以在子類別中呼叫父層的靜態方法。

### 範例

1. 計數器：
   靜態屬性可以用來計算某個類別被實例化的次數。

   ```php
   class Counter {
       public static $count = 0;

       public function __construct() {
           self::$count++;
       }

       public static function getCount() {
           return self::$count;
       }
   }

   $a = new Counter();
   $b = new Counter();
   echo Counter::getCount(); // 輸出: 2
   ```

2. 單例模式：
   單例模式確保一個類別只有一個實例，並提供一個全局的訪問點。

   ```php
   class Singleton {
       private static $instance = null;

       private function __construct() {
           // 私有構造函數防止外部實例化
       }

       public static function getInstance() {
           if (self::$instance === null) {
               self::$instance = new Singleton();
           }
           return self::$instance;
       }
   }

   $singleton1 = Singleton::getInstance();
   $singleton2 = Singleton::getInstance();
   var_dump($singleton1 === $singleton2); // 輸出: bool(true)
   ```

3. 工具類別：
   靜態方法可以用來實現不需要狀態的工具函數。

   ```php
   class Utility {
       public static function formatDate($timestamp) {
           return date('Y-m-d H:i:s', $timestamp);
       }
   }

   echo Utility::formatDate(time()); // 輸出: 當前時間的格式化日期
   ```

4. 配置管理：
   使用靜態屬性來存儲和管理應用程序的配置。

   ```php
   class Config {
       private static $settings = [];

       public static function set($key, $value) {
           self::$settings[$key] = $value;
       }

       public static function get($key) {
           return isset(self::$settings[$key]) ? self::$settings[$key] : null;
       }
   }

   Config::set('database_host', 'localhost');
   echo Config::get('database_host'); // 輸出: localhost
   ```

## 參考資料

[後端 PHP+Laravel--新手實戰日記](https://ithelp.ithome.com.tw/articles/10216317)
