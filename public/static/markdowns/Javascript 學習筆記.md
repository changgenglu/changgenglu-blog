# Javascript 學習筆記

<!-- TOC -->

- [Javascript 學習筆記](#javascript-學習筆記)
  - [基本概念](#基本概念)
    - [宣告與命名](#宣告與命名)
      - [let, const 特性](#let-const-特性)
      - [如何分辨使用 let 和 const 的時機？](#如何分辨使用-let-和-const-的時機)
    - [let 和 const 解決了什麼問題？](#let-和-const-解決了什麼問題)
    - [javascript 參數傳遞方式](#javascript-參數傳遞方式)
  - [存取資料的方法](#存取資料的方法)
    - [基本型別](#基本型別)
    - [物件型別](#物件型別)
    - [把基本型別當作參數傳入函式](#把基本型別當作參數傳入函式)
    - [Function](#function)
      - [First-class Object](#first-class-object)
      - [宣告 function](#宣告-function)
      - [呼叫 function](#呼叫-function)
      - [IIFF](#iiff)
      - [Scope 作用域](#scope-作用域)
        - [Lexical Scope 語彙範疇](#lexical-scope-語彙範疇)
        - [參數也屬於內層 scope](#參數也屬於內層-scope)
        - [巢狀 scope](#巢狀-scope)
  - [運算式與運算子](#運算式與運算子)
    - [嚴謹模式](#嚴謹模式)
    - [賦值運算子](#賦值運算子)
    - [比較運算子](#比較運算子)
    - [算數運算子](#算數運算子)
    - [邏輯運算子](#邏輯運算子)
    - [其餘運算子與展開運算子](#其餘運算子與展開運算子)
    - [三元運算式](#三元運算式)
    - [if else](#if-else)
  - [流程判斷與迴圈](#流程判斷與迴圈)
    - [switch](#switch)
    - [while 迴圈](#while-迴圈)
    - [for 迴圈](#for-迴圈)
    - [for of](#for-of)
    - [for in](#for-in)
  - [函式 function](#函式-function)
    - [定義函式](#定義函式)
    - [箭頭函式](#箭頭函式)
    - [Scope 變數的有效範圍](#scope-變數的有效範圍)
    - [Hoisting 提升](#hoisting-提升)
      - [變數提升](#變數提升)
      - [函式提升](#函式提升)
      - [為何會有 Hoisting 的現象？](#為何會有-hoisting-的現象)
      - [最佳實踐](#最佳實踐)
    - [全域變數](#全域變數)
  - [Promise](#promise)
    - [如何使用](#如何使用)
    - [狀態](#狀態)
    - [then 的使用](#then-的使用)
    - [錯誤處理](#錯誤處理)
    - [finally](#finally)
    - [async/await 同步操作](#asyncawait-同步操作)
  - [方法](#方法)
    - [document](#document)
      - [`createdElement()` 建立節點](#createdelement-建立節點)
      - [`appendChild()` 增加子節點](#appendchild-增加子節點)
      - [`.querySelector` 元素選擇器](#queryselector-元素選擇器)
      - [`.querySelectorAll` 選取所有指定元素](#queryselectorall-選取所有指定元素)
      - [`setAttribute()` 增加標籤屬性](#setattribute-增加標籤屬性)
      - [移除 HTML 元素](#移除-html-元素)
        - [使用 CSS 隱藏元素](#使用-css-隱藏元素)
        - [`removeChild()` 從 DOM 中完全移除元素](#removechild-從-dom-中完全移除元素)
      - [`remove()` ES6 新方法](#remove-es6-新方法)
    - [prototype.forEach](#prototypeforeach)
    - [prototype.map](#prototypemap)
    - [prototype.push](#prototypepush)
    - [`Math.round` 四捨五入](#mathround-四捨五入)
    - [`Array.prototype.filter`](#arrayprototypefilter)
    - [物件取值、新增與刪除](#物件取值新增與刪除)
      - [物件取值](#物件取值)
      - [物件轉為陣列](#物件轉為陣列)
      - [新增物件屬性](#新增物件屬性)
      - [刪除物件屬性](#刪除物件屬性)
    - [SET 集合](#set-集合)
      - [基本使用](#基本使用)
      - [陣列與集合間轉換](#陣列與集合間轉換)
      - [過濾陣列中重複的元素](#過濾陣列中重複的元素)
    - [JSON 轉換](#json-轉換)
      - [`JSON.stringify` 將物件轉為 json 字串](#jsonstringify-將物件轉為-json-字串)
      - [`JSON.parse` 將 json 字串轉換為物件](#jsonparse-將-json-字串轉換為物件)
    - [計時器](#計時器)
      - [setTimeout()](#settimeout)
      - [setInterval()](#setinterval)
  - [屬性描述器](#屬性描述器)
    - [使用字面值宣告屬性的特徵](#使用字面值宣告屬性的特徵)
    - [取得屬性特徵](#取得屬性特徵)
    - [Object.defineProperty 設定單一個屬性描述器](#objectdefineproperty-設定單一個屬性描述器)
    - [Object.defineProperties 一次設定多個屬性](#objectdefineproperties-一次設定多個屬性)
    - [資料描述器](#資料描述器)
      - [writable 屬性是否可以改值](#writable-屬性是否可以改值)
      - [Configurable 是否可編輯該屬性](#configurable-是否可編輯該屬性)
      - [Enumerable 屬性是否會在物件的屬性列舉時被顯示](#enumerable-屬性是否會在物件的屬性列舉時被顯示)
      - [value 屬性的值](#value-屬性的值)
      - [屬性描述器屬於淺層設定](#屬性描述器屬於淺層設定)
    - [存取器描述器](#存取器描述器)
      - [宣告方式](#宣告方式)
      - [Getter](#getter)
    - [setter](#setter)
    - [資料處理器與存取器處理器](#資料處理器與存取器處理器)
    - [取值器與設值器的應用](#取值器與設值器的應用)
  - [額外補充](#額外補充)
    - [random 公式](#random-公式)

<!-- /TOC -->

> **參考資料：**
>
> [重新認識 javascript](https://ithelp.ithome.com.tw/users/20065504/ironman/1259)

## 基本概念

- Javascript 的原始值(基本型別/primitive type)：
  - null(empty)
  - undefined(預設/未定義)
  - string("12345")
  - number(12345)
  - boolean(true/false)
  - symbol(ES6)
- Javascript 的複合值(物件 => object)：包含一個或多個原始值，像是物件或是物件實字，除了基本型別以外的型別都是物件

- 物件：使用 new 關鍵字建立物件

```javascript
const name = new type(arguments);
const d = new Date();
```

- 物件實字

```javascript
var obj = {
  name: "eason",
  action: "haha",
};
```

- 陣列

```javascript
var arr = [1, 2, 3, 4, 5];
arr[8] = 12;
arr = [1, 2, 3, 4, 5, "", "", "", 12];
```

- 用 new 建構出來的是物件 object

```javascript
    var a = new String("test");
    typeof(a) = object
```

- 只有建構式，則會轉為原始值

```javascript
    var a = String("test");
    typeof(a) = string
```

- 複合值在 javascript 是透過記憶體中的位址來比對

```javascript
var a = new String("test");
var b = new String("test");

console.log(a === b);
// false
```

- 將不同型態的物件通通轉為字串
  \`${}\` 在大括號中加入變數

- 宣告原始值：單獨放一個記憶體位址 以 by value 運作
- 宣告複合值：包含許多原始值，但是只放在一個記憶體位置 以 by reference(參考) 運作

- 更改變數為參考物件(複合值)內的原始值，記憶體位址不變
- 更改變數為原始值，會更改變數的記憶體位址

- undefined
  這地方沒有這個東西，所以你無法使用
- NaN
  要轉型成數字時傳入參數非數字的時候
- null
  這地方會有一個值，但這個值目前還沒準備好的意思，所以先填入 `null`

- this
  - 物件掛在誰身上就是`this`，`this`只在當下單一層的作用域裡有效果，箭頭函式就不會。
  - 如果宣告變數，則在宣告當層以及內層為有效範圍。
  - 單純的呼叫`this`，`this`會變成 Global

.bind //定義 function 內的 this 是什麼

### 宣告與命名

- 命名規則
  - 開頭字元需要是 ASCII 字元(英文小寫)，或是下底線(\_)、錢號($)。開頭字元不得使用數字。
  - 大小寫敏感
  - 名稱不得使用保留字

**注意** 下底線開頭的命名常為特別用途：如類別中的私有變數、常數或方法。錢符號也通常為特殊用途命名。

變數與方法名稱都用小駝峰式的命名，類別用大駝峰式命名。

在 ES5 之前都只會用 `var` 宣告變數，在 ES6 之後加入 `let` 和 `const`，現在應以新加入的特性進行宣告。

#### let, const 特性

- 區塊作用域

  - 變數只存活在 {} 花括號裡面，外面不能調用

  ```javascript
  {
    const x = 10;
  }
  console.log(x); //Uncaught ReferenceError: x is not defined

  {
    let y = 20;
  }
  console.log(y); //Uncaught ReferenceError: y is not defined

  {
    var z = 30;
  }
  console.log(z); //30
  ```

- 變量會提升，但若未宣告該變數，會回報錯誤，而非 undefined
  - var 變數的宣告，初始預設值為 undefined，但 let, const 不會有這個預設，當執行 let 變數宣告語句時，才會初始化且能夠被訪問。
- 不允許重複宣告
- 全域變數不會成為 window 的屬性

#### 如何分辨使用 let 和 const 的時機？

> 如果變數會變，就使用 let，不變就用 const

更改指的是記憶體地址的改變，而不是值的改變

- 記憶體存放變數的原則：
  - 基本型別值：
    - 字串、數值、undefined、null、symbol
    - 以上不能更改他的值，只能重新賦值，此時會更改記憶體位址
- 引用值：
  - 物件、陣列、函式
  - 可以修改裡面的值，這樣不會更改記憶體位置，但若重新賦予一個新的值，就會更改記憶體位址。

### let 和 const 解決了什麼問題？

用 var 宣告時，容易導致意外汙染全域變數的問題，例如，區域變數覆蓋全域變數

```javascript
var food = "apple";
function func() {
  var result = "I eat " + food;
  console.log(result);
}
func(); //I eat apple
```

在 func 方法中用到全域變數 food，組合字串及回傳。

但如果程式碼變得複雜時，沒注意到 food 已經在第一行宣告過了

### javascript 參數傳遞方式

> 可能是 Call by sharing

下面的例子，原始型別的 mtString 傳遞給 target 的結果符合 call by value 的行為

但當我們將 myObj 傳遞給 target 時，為何也出現和 call by value 的行為相同的結果？

```javascript
var myString = "hello world";
var myObj = { prop1: 123 };
function setAsLiteralobj(target) {
  console.log("target_1: ");
  console.log(target);
  target = {};
  console.log("target_2: ");
  console.log(target);
}
setAsLiteralObj(myString);
console.log(myString); // 'hello world'
setAsLiteralObj(myObj);
console.log(myObj);
```

```txt
<!-- setAsLiteralObj(myString) -->
"target_1: "
"hello world"
"target_2: "
[object Object] { ... }
<!-- setAsLiteralObj(myString) -->

<!-- console.log(myString); // 'hello world' -->
"hello world"
<!-- console.log(myString); // 'hello world' -->

<!-- setAsLiteralObj(myObj); -->
"target_1: "
[object Object] {
  prop1: 123
}
"target_2: "
[object Object] { ... }
<!-- setAsLiteralObj(myObj); -->

<!-- console.log(myObj); -->
[object Object] {
  prop1: 123
}
<!-- console.log(myObj); -->
```

當宣告完 `function setAsLiteralObj()` 後的記憶體位置狀況，`setAsLiteralObj()` 其實是被當成一個變數，指向 `function setAsLiteralObj()` 的內容。

當呼叫 `setAsLiteralObj()`，此時 `myString` 會將記憶體位置指派給 function 中的 `target` 參數，可以理解為在乎叫 function 時，宣告參數：

```javascript
var target = myString;
```

因此記憶體位置會變成 `myString` 與 `target` 都會指向同一個位置。

此時在 function 中，將 `target` 透過字面值賦值 `{}`，所以 `target` 會從原本指向 `hello world` 改成指向我們剛創造出來的 `{}`

當呼叫 function 時傳入的參數為 `object` 時，也是一樣的概念 `setAsLiteralObj(myObj)`，`myObj` 會被指派給 function 的參數 `target`。此時，`target` 與執行 `setAsLiteralObj(myString)` 時的 `target` 不同，下面將以 `target'` 代稱被指配 `myObj` 的新 `target`。

在 `target = {}` 時，`target'` 被賦值 `{}`，因此原來 `target'` 從原本指向 `{prop1: 123}` 改成指向剛剛創造出來的 `{}` 位置。

結果就是 `myString` 和 `myObj` 依然指向原來的記憶體物件，而這些記憶體物件的內容都沒有被改變，改變的只有 `target` 和 `target'` 指向的記憶體位置而已

## 存取資料的方法

- 基本類型：傳值(pass by value)
- 物件類型：傳址(pass by reference)、pass by sharing

### 基本型別

當一個變數被賦予基本型別的值時，整個值就會存在記憶體中。

當複製基本型別的值到另一個變數時，只會複製他們的值，而該兩變數並不會影響到對方。

這個情況稱作傳值。

```javascript
var box1 = 10;
var box2 = "hello";

//拷貝box1,box2的值
var boxA = box1;
var boxB = box2;

boxA = 30;
boxB = "goodbye";

console.log(box1, box2, boxA, boxB); // 10,"hello",30,"goodbye"
```

一開始 boxA 和 boxB 只是各自複製了 box1 和 box2 的值，boxA 和 box1，以及 boxB 和 box2 是沒有關係的，所以當要重新賦值給 boxA. boxB 時，box1, box2 不會受到影響。

### 物件型別

當變數被賦予是物件型別的資料時，記憶體會被存放該物件在記憶體中的位置，並引用該地址來指向該物件。

當複製一個物件到另一個變數時，複製的是該物件的地址，若此物件有被修改，所有引用該物件的變數，值都會被修改

```javascript
var user = {
  name: "Mary",
  age: 30,
};

//拷貝user物件的地址
var userCopy = user;
userCopy.age = 20;

console.log(user); // {name: 'Mary', age:20}
console.log(userCopy); // {name: 'Mary', age:20}
console.log(user === userCopy); // true
```

但若將變數重新賦予一個新變數

```javascript
var user = {
  name: "Mary",
  age: 30,
};

var userCopy = user;

userCopy = {
  name: "Mary",
  age: 20,
};

console.log(user); // {name: Mary", age: "30"}
console.log(userCopy); // {name: Mary", age: "20"}
console.log(user === userCopy); // false
```

當一個變數被重新賦予一個新的物件，並非修改該物件，因此地址整個變了，並指向另一個新的物件。

### 把基本型別當作參數傳入函式

當我們把基本型別當作參數傳入函式時，函式的參數會複製那些基本型別的值，所以在函式外的變數並不會被影響。

```javascript
var box1 = 100;
var box2 = 200;

function add(a, b) {
  a = 10;
  b = 20;
}

add(box1, box2);
console.log(box1, box2); //100,200
```

以上例子中，像之前提及的傳值概念一樣，a 和 b 複製了 box1, box2 的值。即使修改 a 和 b，box1, box2 都不會被修改。

### Function

> 可以將 javascript 的 function 看做是可執行的物件，其有兩大特性：
>
> 是 first-class Object
> 有自己的 Scope

#### First-class Object

對物件型別能做的事情，也能對 function 做

- 將 function 自由指派給變數或屬性

  ```javascript
  function myFunction() {
    console.log("This is myFunction");
  }
  var a = myFunction,
    myObj = { fn: myFunction };
  console.log(a); // f myFunction() { console.log('This is  myFunction'); }
  console.log(myObj.fn); // f myFunction() { console.log('This is  myFunction'); }
  a(); // "This is myFunction"
  myObj.fn(); // "This is myFunction"
  ```

  function 可以自由指派給其他參數，當印出 `a`/`myObj.fn` 時，會 log 整個 `myFunction` 的內容。此時變數/屬性的內容是 `myFunction`，因此當加上 `()`，就會執行 function。

- 為 function 加上屬性

  ```javascript
  function myFunction() {
    console.log("This is myFunction");
  }
  myFunction.prop1 = "This is prop1";
  console.log(myFunction.prop1); // "This is prop1"
  myFunction(); // "This is myFunction"
  ```

- 當作 Expression 使用
  `function` 可以搭配各種運算元用，甚至也可以放在 if 中判斷

  if 判斷的是 `function` 是否被正式宣告，未加上 `()` 時，`function` 不會被執行

  ```javascript
  function myFunction() {
    console.log("This is myFunction");
  }
  console.log(!myFunction); // false
  ```

- 可以在任何地方宣告
  和物件一樣，可以在任何地方宣告，也可以在 function 中宣告一個 function，甚至在傳入參數時宣告

  ```javascript
  function myFunction(callback) {
    console.log("This is myFunction"); // This is myFunction
    callback(); // This is myCallback
    function myInnerFunction() {
      console.log("This is myInnerFunction");
    }
    myInnerFunction(); // This is myInnerFunction
  }
  myFunction(function myCallback() {
    console.log("This is myCallback");
  });
  ```

#### 宣告 function

宣告的方法主要有三種：

- function declaration

  ```javascript
  function myFunction() {
    console.log("Function declared with Function declaration");
  }
  ```

- function expression
  function 可以被傳遞給其他參數儲存。如字面值一般， function 也可以在定義的同時賦予變數。

  ```javascript
  var myFunction = function NamedFunction() {
    console.log("Function declared with Function expression");
  };
  myFunction(); // "Function declared with Function expression"
  ```

  也因為此宣告方式會將 function 傳遞給一個變數，因此 javascript 允許 function 搭配匿名函式使用：

  ```javascript
  var myFunction = function () {
    console.log("Function declared with Function expression");
  };
  myFunction(); // "Function declared with Function expression"
  ```

- with function constructor
  和其他的內建物件型別相同，function 也可以利用 new 來新增物件

  ```javascript
  var myFunction = new Function(
    "parameter1",
    "parameter2",
    "console.log('Function declared with Function Constructor')"
  );
  myFunction(); // Function declared with Function Constructor
  ```

  若用 function expression 也有相同效果

  ```javascript
  var myFunction = function (parameter1, parameter2) {
    console.log("Function declared with Function expression");
  };
  myFunction(); // "Function declared with Function expression"
  ```

  因此一般而言會使用 function expression 取代 new 來增加易讀性與效能

#### 呼叫 function

- 一般呼叫
  在 function 後面加上 `()` 就可以呼叫 function

  ```javascript
  myFunction();
  ```

- 使用 function 內建函式呼叫
  function 中有內建 `call` 和 `apply` 函式可以用來呼叫 function
  和使用 `()` 來執行 function 的差別在於內建函式具有明確指定 this 的功能。

  ```javascript
  var myFunction = function (parameter1, parameter2) {
    console.log(parameter1, parameter2);
  };
  myFunction.call(null, "hello world", 123); // "hello world" 123
  myFunction.apply(null, ["hello world", 123]); // "hello world" 123
  ```

  `call` 和 `apply` 函式的差異在於 apply 的第二個參數為陣列，裡面帶要傳入 `function` 的參數，因此在範例中可以看到 `apply` 的第二個參數為 `['hello world', 123]`，這兩個參數會被攤開為 `parameter1` 和 `parameter2` 後放入 `myFunction` 中執行

- 使用 new 呼叫
  使用 new 代表 function 當作建構式來使用，會回傳子行別為該 function 的物件

  ```javascript
  function myFunction() {
    console.log("Function declared with Function expression");
  }
  var a = new myFunction(); // "Function declared with Function expression"
  console.log(a); // myFunction {}
  ```

#### IIFF

> (Immediately Invoked Function Expression) 或稱自我調用函式

IIFE 有兩種特性：

- 當程式執行到 IIFE 的宣告位置時，IIFE 會自動執行
- 為一種 function expression

```javascript
// 格式
(function () {
  // some codes
})();

// 實際範例
(function () {
  console.log("This is IIFE"); // "This is IIFE"
})();
```

不需要額外呼叫就會自己執行，重點除了包裹 function 的 `()` 外，還有用來呼叫 function 的 `()`。

若未加上最後面呼叫 function 的 `()`，此 function 便不會自動執行。

IIFE 回傳值

```javascript
var myString = (function () {
  return "This is IIFE";
})();
console.log(myString); // This is IIFE
```

IIFE 除了會自動執行以外，與一般 function 的特性都是一模一樣的。

#### Scope 作用域

> Scope: 規範哪些變數在哪些程式碼中可以取用的規則
>
> javascript 和大多數的語言都是採用 Lexical Scope(語彙範疇)

##### Lexical Scope 語彙範疇

代表著區塊間的包裹關係，被包裹在內層的區塊可以保護自己的變數不被外層取用；相反的，外層區域的變數還是可以被內層區塊使用

```javascript
var outer = "From Outer";
function myFunction() {
  var inner = "From Inner";
  console.log(outer); // "From Outer"
  console.log(inner); // "From Inner"
}
console.log(outer); // "From Outer"
console.log(inner); // Uncaught ReferenceError: inner is not defined
```

在 function 的 `{}` 區塊中宣告一個新的變數 `inner`，此一變數可以在 `myFunction(){}` 的區塊裡被取用，然而當 `myFunction(){}` 區塊外試圖取用 `inner` 時，就會發生 `innerVar is not defined` 的錯誤。

##### 參數也屬於內層 scope

```javascript
var myString = "hello world";
function setAsLiteralObj(target) {
  target = {};
}
setAsLiteralObj(myString);
console.log(myString); // 'hello world'
console.log(target); // Uncaught ReferenceError: target is not defined
```

執行 `setAsLiteralObj(myString);` 時，`myString` 會將記憶體位置指派給 `function` 中新的參數 `target`，也就是 `target` 是再執行 `setAsLiteralObj` 時才建立的新參數，新參數 `target` 是屬於 `setAsLiteralObj` 這個 `function` 區塊，因此在外層印 `target` 時，一樣會得到錯誤訊息。

##### 巢狀 scope

```javascript
var outer = "outer";
function myFunction() {
  // --- 內層 ---
  var middle = "middle";
  function myInnerFunction() {
    // ~~~ 最內層 ~~~
    var inner = "inner";
    // ~~~ 最內層 ~~~
  }
  myInnerFunction();
  // --- 內層 ---
}

myFunction();
```

## 運算式與運算子

### 嚴謹模式

- 宣告在主程式開頭：Global Scope，所有的程式都會在嚴謹模式下執行。
- 宣告在函數開頭：Function Scope，只有該函數內的程式會在嚴謹模式下執行。

```javascript
var chang = 100; // 將變數chang改成99
chag = 99; // 拼錯字
console.log(chang); // 100

("use strict");
var chang = 100;
chag = 99; // // ReferenceError: chag is not defined
```

- 嚴謹模式需要明確的宣告，未明確宣告`this`也會失效，這樣比較不會因為拼錯字而產生污染
- 在非嚴謹模式下如果沒有用 var 宣告變數，而直接賦值，會直接將此變數作宣告
- 嚴謹模式下並不會幫你執行，程式完全不跑

### 賦值運算子

- 賦值
- 賦予左方運算元與右方運算元相同之值。`x = y` 會把`y`的值賦予給`x`。

```javascript
x = y;
```

- 加法賦值

```javascript
x += y;
x = x + y;
```

- 減法賦值

```javascript
x -= y;
x = x - y;
```

### 比較運算子

`==`：等於

`!=`：不等於

- 如果運算元相同型別，就使用嚴格比較去檢驗。
- null 跟 undefined 相同。
- 運算元一個是數值，一個是字串，會將字串轉數字，再進行比較。
- 其中一個是 true 或 false 會轉成數字的 1 或 0，再進行比較。
- 其中一個是物件，另一個是字串或數值，物件會先轉成基型值，再進行比較。

`===`：嚴格等於

`!==`：嚴格不等於

- 先判斷運算元的型別是否相同，若不相同，結果為 false。
- null 與 undefined 都跟自己相等。
- true 與 false 都跟自己相等。
- NaN 不等於任何值，包括自己。
- 只要是 number 型別的值一樣，他們就相等。
- 0 跟-0 相等。
- string 長度跟內容不一樣，包括空白，它們就不相等。
- 如果參考至同一個物件、陣列、函式，相同的記憶體位置，他們就相等，若無，就算內容的值一樣，它們也不相等，不同的記憶體位置存相同的值。

```javascript
console.log("1" === 1); //false
console.log(null === null); //true
console.log(undefined === undefined); //true
console.log(null === undefined); //false
console.log(NaN === NaN); //false
console.log(NaN !== NaN); //true
console.log("ABC" === "ABC "); //false
```

`>`：大於

`>=`：大於等於

`<`：小於

`<=`：小於等於

注意：`=>`不是運算子，是箭頭函式。

### 算數運算子

- `%` 回傳兩個運算元相除後的餘數。

```javascript
count = 12 % 5;
console.log(count); // 回傳 2
```

- `++` 將運算元增加 1。

```javascript
x = 3;
x++;
console.log(x); // 回傳4，設定之後回傳

++x;
console.log(x); // 回傳3，回傳之後再設定
```

- `--` 將運算元減少 1。

```javascript
x = 3;
x--;
console.log(x); // 回傳2，設定之後回傳

--x;
console.log(x); // 回傳3，回傳之後再設定
```

### 邏輯運算子

- `&&` // `and` 前後全部為 `true` ，才會是 `true`，否則都返回 `false`
- `||` // `or` 前後只要一個是 `true` 就會返回 `true`，除非全部都是 `false`
- `!` // `not` 將後面的值做反向，如果是 `true` 就返回 `false`，如果是 `false` 就返回 `true`
- `!!` // `true`反轉再反轉，返回原本的布林值。
  大多用在轉換一些可以形成布林值的情況。
  而經過`!!`運算後，只會很單純出現`true` or `false`，可以單純化減少某些特殊情況出錯的機率。
  例如：希望"空字串"和`null`被視為完全相同時

  ```javascript
  const a = "";
  const b = null;

  a === b; // false
  !!a === !!b; // true
  ```

- 短路邏輯(短路解析)
  Javascript 裡面只要是 `0`、`""`、`null`、`false`、`undefined`、`NaN` 都會被判定為 `false`

  - 用 || 來設定變數預設值
    如果 obj 存在的話就維持原樣，如果不存在就給予空物件

    ```javascript
    if (!obj) {
      obj = {};
    }

    //短路邏輯的寫法
    var obj = obj || {};
    ```

  - 用 && 來檢查物件與屬性值

    ```javascript
    var name = o && o.getName();
    ```

  - 用 || 來簡化程式碼

    ```javascript
    if (!obj) {
      call_function();
    }
    obj || call_function();
    ```

  - 用 && 來簡化程式碼

    ```javascript
    var a = 1;
    if (a == 1) {
      alert("a=1");
    }
    a == 1 && alert("a=1");
    ```

  - 用 && 、|| 來簡化程式碼

    ```javascript
    var a = 3,
      b;
    if (a == 3) {
      b = 1;
    } else if (a == 5) {
      b = 2;
    } else {
      b = 3;
    }
    b = (a == 3 && 1) || (a == 5 && 2) || 3;
    ```

  - 善用 ! 的轉換

    ```javascript
    if (obj !== "null" && obj !== "undefined") {
      //....
    }
    if (!!obj) {
      //....
    }
    ```

### 其餘運算子與展開運算子

- 其餘運算子

  假設要將一個陣列的值相加後取平均

  ```javascript
  let arr = [1, 2, 3, 4, 5];

  let avg = function (arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum / arr.length;
  };

  console.log(avg(arr)); //  3
  ```

  但若呼叫 function 時，不是傳入陣列，而是傳入多個參數

  最後得到的結果會是 NaN

  ```javascript
  let avg = function (arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum / arr.length;
  };

  console.log(avg(1, 3, 5, 7, 9)); // NaN
  ```

  運用其餘運算子`...`，將輸入函式中的參數值變成陣列的形式

  ```javascript
  let avg = function (...arr) {
    console.log(arr); // [1,3,5,7,9]
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum / arr.length;
  };

  console.log(avg(1, 3, 5, 7, 9)); // 5
  ```

- 展開運算子 `...`

  關鍵字與其餘運算子相同，但功能與其餘運算子相反，展開運算子可以把陣列中的元素取出。

  假設要用 `Math.max()` 來找出最大值，但傳入的參數為陣列，此時會得到 NaN

  ```javascript
  let number = [1, 2, 3, 4, 5, 6, 7, 8];

  console.log(Math.max(number)); // NaN
  ```

  運用展開運算子將陣列展開成許多數值

  ```javascript
  let number = [1, 2, 3, 4, 5];

  console.log(Math.max(...number)); // 5

  console.log(...number); // 1,2,3,4,5
  ```

### 三元運算式

```javascript
condition ? val1 : val2;
```

- 如果條件為 true ，此時回傳[數值 / 運算式（1）]
- 如果條件為 false，此時回傳[數值 / 運算式（2）]

```javascript
var status = "";
if (a < 60) {
  status = "不及格";
} else {
  status = "及格";
}

// 三元運算式
var status = a < 60 ? "不及格" : "及格";
```

### if else

```javascript
if (A) {
  //  A = True 執行這邊
} else if (B) {
  //  A = False and B = True 執行這邊
} else {
  //  A = False and B = False 執行這邊
}
```

- 判斷式括號裡會強制轉成布林值
- `null` 跟 `undefined` 和 `NaN` 在 if 判斷時值都會轉換為 `false`

## 流程判斷與迴圈

### switch

```javascript
switch (expression) {
  // expression => 表達式，用來跟每個case做比較
  case value1:
    //當 表達式 的值符合 value1
    //要執行的陳述句
    break;
  case value2:
    //當 表達式 的值符合 value2
    //要執行的陳述句
    break;
  default:
    //當 表達式 的值都不符合上述條件
    //要執行的陳述句
    break;
}
```

- 如果忘記放 break，則當下的 case 執行完之後，會直接往下一個 case 執行，直到遇見 break

```javascript
switch (表達式) {
  case x:
  case y:
  case z:
    //如果有多項條件，要執行同一陳述句可以合併撰寫
    // code block
    break;
  case a:
  case b:
  case c:
    // code block
    break;
}
```

### while 迴圈

```javascript
while ((A = x)) {
  陳述句; // 當條件式"A"成立的時候，就重複做"陳述句"
  break; // 遇到 break 就會停止，否則就會繼續執行，直到 A = F
}
```

- 完成之後再回去檢查"A"，成立就做"B"
- 直到"A"不成立，才會離開

```javascript
do {
  // 放要重複做的事情，會先執行一次再進入判斷
} while (判斷式);
```

### for 迴圈

```javascript
for (var i = 0; i < 10; i++) {
  // 要被執行的陳述句
  // for迴圈會產生出從"i = 0"開始到"i < 10"的長度
  // 可以當作計數器，每數一次就執行一次陳述句
}

// for (statement 1; statement 2; statement 3){}
// Statement 1 執行程式之前做一次
// Statement 2 執行程式的條件
// Statement 3 執行程式後每次執行

for (var i = 0; i < 10; i++) {
  // 也可以在迴圈裡加入判斷式取"i"的值
  if (i % 2 == 0) {
    continue; //跳過這次不做
  }
  if (i == 7) {
    break; //跳出整個for迴圈
  }

  console.log(i); // ans = "1  3  5" 7跟9已經跳出迴圈，所以不會被執行出
}
```

### for of

```javascript
var 物件 = ["A", "B", "C", "D"];
for (const 變數1 of 物件1) {
  // 大多使用在陣列，或是其他需要查找物件的內容物
}

let 字串 = "ES6"; //例如用來查找字串或數列等等
for (let 變數2 of 字串) {
  console.log(變數2); // "E", "S", "6"
}
```

### for in

```javascript
var 物件2 = {
  AA: 100,
  BB: 20,
};
for (變數3 in 物件2) {
  //會逐一尋找物件裡的屬性
  //且只顯示有值的資料出來
  console.log(物件2); //此時出現的是物件裡的字串
  console.log(物件2[變數3]); //此時出現的是物件裡的數值
}

var 物件3 = [10, 20, 30];
物件3[6] = 999; //這時物件3的陣列[10, 20, 30, nill]
```

## 函式 function

> function 是物件的一種

### 定義函式

- 函式宣告

  ```javascript
  function name(params) {
    // do some things
  }
  ```

- 函式運算式

  透過匿名函式將變數賦值

  ```javascript
  var squsre = function (params) {
    return params;
  };
  ```

  若在 function 加上名稱時，這個名稱只在"自己函式的區塊內有效"

  ```javascript
  var square = function func(number) {
    console.log(typeof func); // "function"
    return number * number;
  };

  console.log(typeof func); // undefined
  ```

- 透過 new 關鍵字建立函式

```javascript
// F 要大寫
var square = new Function("number", "return number * number");
```

透過關鍵字建立的函式物件，每次執行時都會進行解析字串的動作(如：`'return number * number'`)

### 箭頭函式

```javascript
function test(a) {
  return a + 1; // 將物件、運算結果傳出到呼叫點
}

var test = function (a) {
  return a + 1;
};

var test = (a) => {
  return a + 1;
};

var test = (a) => a + 1; //最終省略了function和return

var answer = test(5); //呼叫點，test(5)會將刮號內的參數傳到function的刮號(a)中
```

- 箭頭函式僅用於 function 內只有一條運算式時

### Scope 變數的有效範圍

> 全域變數和區域變數的差異

```javascript
var x = 1;

var someThingHappened = function (y) {
  var x = 100;
  return x + y;
};

console.log(someThingHappened(50)); // 150
console.log(x); // 1
```

切分變數有效範圍的最小單位是 `function`

因此在 function 中透過 var 宣告的變數，其作用範圍僅限於這個函式。

此例中在一開始宣告的變數 x 與在 function 內部宣告的變數 x 為兩個不同變數。

若 function 中沒有宣告新變數，則會一層一層往外尋找，直到全域變數為止

```javascript
var x = 1;

var doSomeThing = function (y) {
  x = 100;
  return x + y;
};

console.log(doSomeThing(50)); // 150
console.log(x); // 100
```

此例中，function 中未宣告新變數 x，因此 javascript 向外層尋找同名的變數，直到最外層的全域變數，並將其賦值。

### Hoisting 提升

#### 變數提升

當 Scope 中的變數有被宣告，即使在宣告之前即調用變數，javascript 會將先告的語法拉到此 scope 的上面

```javascript
var x = 1;

var doSomeThing = function (y) {
  console.log(x); // undefined

  var x = 100;
  return x + y;
};

console.log(doSomeThing(50)); // 150
console.log(x); // 1
```

對編譯器而言此，這段程式碼會是這個樣子

```javascript
var x = 1;

var doSomeThing = function (y) {
  var x; // 宣告的語法被拉到上面
  console.log(x); // undefined
  x = 100;
  return x + y;
};

console.log(doSomeThing(50)); // 150
console.log(x); // 1
```

#### 函式提升

透過"函式宣告"方式定義的函式可以在宣告前使用

```javascript
square(2); // 4

function square(number) {
  return number * number;
}
```

而透過"函式運算式"定義的函式則是會出現錯誤

```javascript
square(2); // TypeError: square is not a function

var square = function (number) {
  return number * number;
};
```

除呼叫時機不同，此兩者在執行時無明顯差異

#### 為何會有 Hoisting 的現象？

> javascript 中的 Compiler(編譯器) 和 Engine (引擎) 執行的順序，造成提升的特性

- 變數宣告屬於 compiler 的工作
  javascript compiler 會將程式碼解析成有意義的語法結構，轉換成機器可以理解的目的碼。接著 compiler 會建立所有的變數，保留其記憶體空間，並且繫結到所屬的 scope 上面。也就是說，程式開始一行一行執行前，會先將所有變數宣告好。

- 初始化、賦值屬於 engine 的工作
  在 compiler 好之後，engine 才會開始一行一行的執行程式，也就是初始化、賦值的這個動作也是由 engine 在編譯好之後，等待被執行的程式碼之一。

#### 最佳實踐

1. 宣告變數應集中在燈前 scope 的最上面

### 全域變數

其實在 javascript 中並無所謂"全域變數"，所謂全域變數指的是"全域物件"(亦稱作"頂層物件")的屬性。

以瀏覽器而言，全域物件指的是 `window`，在 node 的環境中則叫做 `global`。

- 全域物件的屬性

  於外層透過 var 宣告一個變數 a，當我們調用 `window.a` 會回傳我們宣告的此一變數

  ```javascript
  var a = 10;
  console.log(a); // 10
  ```

- 變數的作用範圍，最小的的切分單位為 function
- 即使是寫在函式中，沒有 var 宣告的變數，會變成全域變數
- 全域變數指的是全域物件(頂層物件)的屬性

> ### 附註
>
> 在 javascript ES6 之後有新的宣告方法 let 與 const，分別定義"變數"與"常數"
> 和 var 不同的是，他們的作用區域是透過大括號`{}`來切分的

## Promise

當 javascript 在執行時，會將非同步操作留到最後進行處理。

非同步操作如：文件操作、資料庫操作、AJAX 及定時器等等。

javascript 有兩種實現非同步的方式：

1. 回調函示 callback function
   當需要執行多個非同步操作時，程式碼會不斷的往內嵌套，又被稱做 callback 地獄(callback hell)

   ```js
   callback(() => {
     console.log("Hello!");
     callback(() => {
       console.log("Hello!");
       callback(() => {
         console.log("Hello!");
         callback(() => {
           console.log("Hello!");
         }, 200);
       }, 200);
     }, 200);
   }, 200);
   ```

2. Promise

### 如何使用

> 用來表示一個非同步操作的最終完成(或失敗)及其結果值

Promise 為一個構造函示，透過 new 關鍵字建立一個 promise。其會接收一個函示作為參數，此函示又稱為 executor，executor 會立即執行。

```js
new Promise((resolve, reject) => {
  console.log("即刻執行");
});
```

而此 executor 會再接受另外兩個函示參數：

- resolve 實現函數：當請求完成，成功時會調用 resolve，並回傳結果。
- reject 拒絕函數：當請求完成，失敗時會調用。

```js
function requestData(url) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url === "explainthis.io") {
        resolve("hello welcome to explainthis");
      } else {
        reject("it is not explainthis");
      }
    }, 3000);
  });
}

// 1. 請求成功
requestData("explainthis.io").then((res) => {
  console.log(res); //hello welcome to explainthis
});

// 2. 請求失敗
requestData("explainthis.com").catch((e) => console.log(e)); //it is not explainthis
```

### 狀態

Promise 狀態有三種

- pending 初始狀態，已執行 executor，但還在等待中。
- fulfilled 表示操作完成，執行 resolve 函式。
- rejected 表示操作失敗，執行 reject 函式。

### then 的使用

1. 多次調用
   promise 可以用鏈式(chaining)的方式串連多個非同步操作

   ```js
   function requestData(url) {
     return new Promise((resolve, reject) => {
       setTimeout(() => {
         if (url === "explainthis.io") {
           resolve("hello welcome to explainthis");
         } else {
           reject("it is not explainthis");
         }
       }, 3000);
     });
   }

   requestData("explainthis.io")
     .then((res) => {
       console.log(res);
       // 印出 executor 執行的結果 => hello welcome to explainthis
       return 1;
     })
     .then((res) => {
       console.log(res); // 印出前面執行結束後回傳的值 => 1
       return 2;
     })
     .then((res) => {
       console.log(res); // 印出前面執行結束後回傳的值 => 2
     });
   ```

2. 傳入兩個參數，一是成功的回調，二是失敗的回調

   ```js
   function requestData(url) {
     return new Promise((resolve, reject) => {
       setTimeout(() => {
         if (url === "explainthis.io") {
           resolve("hello welcome to explainthis");
         } else {
           reject("it is not explainthis");
         }
       }, 0);
     });
   }

   requestData("explainthis.com").then(
     (res) => {
       console.log(res);
     },
     (reason) => {
       console.log(reason); // 錯誤，回傳 => it is not explainthis
     }
   );
   ```

### 錯誤處理

Promise 的錯誤處理，只需要加上 catch 捕捉錯誤，並執行一些錯誤處理代碼。當請求失敗時，catch 方法將捕獲錯誤，並輸出錯誤訊息。

```js
fetch("https://explainthis.com/data")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error("oops!", error); // 捕獲錯誤，輸出錯誤訊息
  })
  .finally(() => {
    console.log("close loader"); // 操作完成，輸出 => close loader
  });
```

### finally

若有加上 `finally`，當 Promise 完成後，無論狀態為 fulfilled 或是 rejected 都會進入 finally 方法。

### async/await 同步操作

首先使用 async 關鍵字將函式標記為非同步函式，也就是指返回值為 Promise 物件的函式。

在非同步函式中，可以調用其他非同步函式，並使用 await 語法，await 會等待 Promise 完成之後返回最終的結果。

```js
async function getData() {
  const res = await fetch("https://getsomedata");
  const data = await res.json();
  console.log(data);
}

getData();
```

## 方法

### document

#### `createdElement()` 建立節點

例如在文件中新增一個 `<em>` 標籤

```javascript
var str = document.createElement("em"); //新增 em 標籤
str.textContent = "新增文字";
```

#### `appendChild()` 增加子節點

在 html 中，新增一個 `<div>`

```html
<div class="title">title</div>
```

增加子節點

```javascript
document.querySelector(".title").appendChild(str);
```

最終 html 上面顯示：

```html
<div class="title">
  title
  <em class="red">新增文字</em>
</div>
```

#### `.querySelector` 元素選擇器

用法和 css 一樣，選取 id 元素時用 `#`，選取 class 元素時用 `.`

```javascript
document.querySelector(".title");
```

#### `.querySelectorAll` 選取所有指定元素

用法和 `.querySelector()` 一樣，但不同於 `.querySelector()`，`.querySelectorAll()` 可以一次選取所有具有相同元素的內容

#### `setAttribute()` 增加標籤屬性

透過 javascript 來增加 HTML 標籤屬性，例如要動態加上一個 a 標籤連結

```html
<div class="titleClass">
  <a href="#">Link</a>
</div>
<script src="js/practice1.js"></script>
```

```javascript
const el = document.querySelector(".titleClass"); //選擇單一元素為 HTML 裡的 class 名稱為 titleClass
el.setAttribute("href", "www.facebook.com"); //前面是屬性，後面是內容
```

動態新增 id 來操控 HTML

```html
<div class="str">title</div>
<script src="js/practice1.js"></script>
```

```css
#strId {
  color: blue;
  font-size: 18px;
}
```

```javascript
var elStr = document.querySelector(".str"); //選擇單一元素為 HTML 的 class 名稱為 str
elStr.setAttribute("id", "strId"); //因為在 CSS 有動態新增一個 id，所以選擇新增的 id 屬性來控制他的值(會帶回 CSS 的設定內容)
```

#### 移除 HTML 元素

##### 使用 CSS 隱藏元素

```javascript
var elem = document.querySelector("#some-element");
elem.style.display = "none";
```

##### `removeChild()` 從 DOM 中完全移除元素

```javascript
var elem = document.querySelector("#some-element");
elem.parentNode.removeChild(elem);
```

#### `remove()` ES6 新方法

```javascript
var elem = document.querySelector("#some-element");
elem.remove();
```

### prototype.forEach

forEach 會修改原始陣列，且不會回傳值

```javascript
var forEachIt = people.forEach(function (item, index, array) {
  console.log(item, index, array); // 物件, 索引, 全部陣列
  return item; // forEach 沒在 return 的，所以這邊寫了也沒用
});
console.log(forEachIt); // undefined

people.forEach(function (item, index, array) {
  item.age = item.age + 1; // forEach 就如同 for，不過寫法更容易
});

console.log(people); // 全部 age + 1
```

### prototype.map

使用 map 時會需要回傳一個值，他會透過函式內所回傳的值組成一個陣列。

- 如不回傳，則為 undefined
- 回傳長度等於原始長度

map 很適合將原始的變數運算後，重新組合成一個新的陣列。

使用語法：

```Javascript
const newArr = arr.map(function (value, index, array){
  //...
});
```

- `newArr` 處理後的新陣列
- `arr` 要執行 map 的舊陣列
- `function` 舊陣列中每個元素要執行的函式
- `value` 陣列中正在處理的值
- `index` 陣列中正在處理的 key 值(可略)
- `array` 舊陣列(可略)

```javascript
let A = [9000, 8500, 5500, 6500];
let B = A.map(function (value, index, array) {
  return value * 2;
});

console.log(A); // [9000, 8500, 5500, 6500] - 原陣列不會被修改
console.log(B); // [18000, 17000, 11000, 13000] 回傳新陣列
```

### prototype.push

添加一個或多個元素至陣列末端，並回傳陣列的新長度。

```javascript
arr.push(element1[, ...[, elementN]])
```

- `elementN` 欲添加至陣列末端的元素

### `Math.round` 四捨五入

```javascript
Math.round(3.14); // 3
Math.round(5.49999); // 5
Math.round(5.5); // 6
Math.round("5.50001"); // 6
Math.round(-5.49999); // -5
Math.round(-5.5); // -5
Math.round(-5.50001); // -6

let data = 18.62645;
Math.round(data * 10) / 10; // 18.6
Math.round(data * 100) / 100; // 18.63
Math.round(data * 1000) / 1000; // 18.626
```

### `Array.prototype.filter`

- `arr.filter(function(item, index, array), thisValue)`
  - `item` 必須，目前元素的值
  - `index` 可選，目前元素的 key
  - `array` 可選，目前元素屬於的陣列
  - `thisValue` 可選，物件作為該次呼叫時使用，傳遞給函數當作 `this` 的值，若省略，則 `this` 的值為 `undefined`

```javascript
var ages = [32, 33, 12, 40];

function checkAdult(age) {
  return age >= document.getElementById("ageToCheck").value;
}

function myFunction() {
  document.getElementById("demo").innerHTML = ages.filter(checkAdult);
}
```

若要去除陣列中的空值

```javascript
var myArrayNew = myArray.filter((el) => el);
```

[### `Array.prototype.splice` 新增刪除陣列中的元素

- `array.splice(start, deleteCount, item)`

  - start 必填，陣列中要開始改動的元素索引。若索引長度大於陣列長度，則實際開始的索引值會被預設為陣列長度。若索引值為負，則會從陣列中最後一個元素開始往前改動(起始為 -1)，若其絕對值大於陣列長度，則會被設為 0。
  - deleteCount 可選，欲刪除的原陣列數量的整數。若省略，或其值大於可以被刪除的元素數量(從 start 到陣列最後的長度)，則將從 start 開始到陣列最後一個元素全部刪除。若 deleteCount 為 0 或負數，則不會有元素被刪除。
  - item 1, item 2 可選，從 start 開始要加入的元素，若未傳入任何數值，則將 start 到 deleteCount 之間的元素刪除。

- 從 `[2]` 的位置開始，刪除 0 個元素並插入 `drum`

  ```javascript
  var myFish = ["angel", "clown", "mandarin", "sturgeon"];
  var removed = myFish.splice(2, 0, "drum");

  // myFish 為 ["angel", "clown", "drum", "mandarin", "sturgeon"]
  // removed 為 []，沒有任何元素被刪除
  ```

- 從 `[3]` 的位置開始，刪除一個元素

  ```javascript
  var myFish = ["angel", "clown", "drum", "mandarin", "sturgeon"];
  var removed = myFish.splice(3, 1);

  // removed 為 ["mandarin"]
  // myFish 為 ["angel", "clown", "drum", "sturgeon"]
  ```

- 從 `[0]` 開始，刪除兩個元素，並插入 "parrot", "anemone", "blue"

  ```javascript
  var myFish = ["angel", "clown", "trumpet", "sturgeon"];
  var removed = myFish.splice(0, 2, "parrot", "anemone", "blue");

  // myFish 為 ["parrot", "anemone", "blue", "trumpet", "sturgeon"]
  // removed 為 ["angel", "clown"]
  ```

### 物件取值、新增與刪除

#### 物件取值

```javascript
var family = {
  name: "ma's family",
  deposit: 1000,
  members: {
    mother: "mom",
    father: "dad",
  },
};

console.log(family.name); // ma's family
console.log(family.members.mother); // mom
console.log(family["name"]); // ma's family
```

用中括號語法，允許以變數的方式取值

```javascript
var family = {
  name: "ma's family",
  deposit: 1000,
  members: {
    mother: "mom",
    father: "dad",
  },
};
var a = "name";

console.log(family.a); // undefine
console.log(family[a]); // ma's family
```

`.` 語法是直接以字串的方式尋找該物件的屬性，而 family 物件並無 a 屬性。
但中括號中的語法是將變數 a 的值帶入，相當於 `family['name']`。

另外，在物件中的屬性一律是字串，因此可以允許各種數字或是特殊字元，但在 `.` 語法中，會受到許多限制。

```javascript
var family = {
  name: "ma's family",
  deposit: 1000,
  members: {
    mother: "mom",
    father: "dad"
  },
  1: '1',
  '$-小名家': '$-小名家 string'
};

console.log(family.1) // 語法錯誤
console.log(family[1]) // 1

console.log(family.$-小名家) // 語法錯誤
console.log(family['$-小名家']) // $-小名家 string
```

執行物件中的方法，也可以用點語法或是中括號

```javascript
var family = {
  name: "ma's family",
  deposit: 1000,
  members: {
    mother: "mom",
    father: "dad",
  },
  callFamily: function () {
    console.log("call 2 ma's family");
  },
};

family.callFamily(); // call 2 ma's family
family["callFamily"](); // call 2 ma's family
```

#### 物件轉為陣列

陣列本身舉有許多好用的方法：`forEach`, `map`, `reduce`, `find`...，但物件無法使用這些陣列方法

利用 `Object` 關鍵字，將物件轉為陣列。

- Object.values 可以直接傳入一個物件，並將物件直接轉為陣列的形式，但無法取得 key 值。
- Object.keys 傳入一個物件，並將其 key 值以陣列方式呈現，僅只取 key 值。
- Object.entries 傳入物件，並同時回傳 key 值與 values，但產生的新結構，會另外用一層陣列組成。

#### 新增物件屬性

```javascript
var family = {
  name: "ma's family",
  deposit: 1000,
  members: {
    mother: "mom",
    father: "dad",
  },
  callFamily: function () {
    console.log("call 2 ma's family");
  },
};

family.dog = "小豬";
family["kitten"] = "K Ka貓";
family["$"] = "money";
console.log(family);
```

#### 刪除物件屬性

使用 `delete` 關鍵字

```javascript
var family = {
  name: "ma's family",
  deposit: 1000,
  members: {
    mother: "mom",
    father: "dad",
  },
  callFamily: function () {
    console.log("call 2 ma's family");
  },
};

family.dog = "小豬";
family["kitten"] = "K Ka貓";
family["$"] = "money";

delete family.deposit;
delete family["$"];
console.log(family);
```

### SET 集合

#### 基本使用

- set 裡面的值是不會重複的

```javascript
// new Set Type
let classroom = new Set(); //  建立教室這個 set
let Aaron = { name: "Aaron", country: "Taiwan" };
let Jack = { name: "Jack", country: "USA" };
let Johnson = { name: "Johnson", country: "Korea" };

// 把物件放入 set 中
classroom.add(Aaron);
classroom.add(Jack);
classroom.add(Johnson);

// 檢驗 set 中是否包含某物件
if (classroom.has(Aaron)) console.log("Aaron is in the classroom");

//  把物件移除 set 中
classroom.delete(Jack);
console.log(classroom.size); //    看看 set 中有多少元素
console.log(classroom);
```

#### 陣列與集合間轉換

```javascript
// 集合轉成陣列
let setToArray = [...classroom]; // Array.from(classroom)

// 陣列轉成集合
let arrayToSet = new Set(setToArray);
```

#### 過濾陣列中重複的元素

利用 set 中元素不會重複的特性，來過濾掉陣列中重複的元素，留下唯一

```javascript
var mySet = new Set();

mySet.add(1); // Set { 1 }
mySet.add(5); // Set { 1, 5 }
mySet.add("some text"); // Set { 1, 5, 'some text' }
var o = { a: 1, b: 2 };
mySet.add(o); // Set { 1, 5, 'some text', { a: 1, b: 2 } }

// // o is referencing a different object so this is okay
mySet.add({ a: 1, b: 2 }); // Set { 1, 5, 'some text', { a: 1, b: 2 }, { a: 1, b: 2 } }
```

### JSON 轉換

- json 為一組字串
- 在使用 {} 建立物件時，屬性名稱的引號可以省略，但在 json 格式中，屬性名稱一定要有引號。
- 若物件中的值為 function 時，無法透過 json 傳遞。

#### `JSON.stringify` 將物件轉為 json 字串

#### `JSON.parse` 將 json 字串轉換為物件

### 計時器

瀏覽器內建的計時器

#### setTimeout()

來設定一段時間過後，自動執行某個函數(callback)，這個計時器只會執行一次。

```javascript
const timeoutId = setTimeout(func, delay[, param1, param2, ...]);
const timeoutId = setTimeout(func, delay);
```

`func` 時間到執行的函數。
`delay` 等候時間，單位為毫秒。
`param*` 用來指定要傳入 `func` 的參數
`setTimeout()` 執行後會返回一個數字，表示這個計時器的 id

```javascript
const timeoutId = setTimeout(myAlert, 5000);

function myAlert() {
  alert("五秒鐘到了");
}
```

若取消計時器，可以使用 `clearTimeout(timeoutId)`;

#### setInterval()

用來設定每過一段時間，就會自動執行某個函數(callback)，這個計時器會重複執行。

```javascript
const intervalId = setInterval(func, delay[, param1, param2, ...]);
const intervalId = setInterval(func, delay);
```

```javascript
const intervalId = setInterval(function () {
  alert("十秒鐘又到了");
}, 10000);
```

若取消計時器，可以使用 `clearInterval(intervalId)`;

## 屬性描述器

當對於屬性除了指定 key/value 以外有更進一步的要求時，例如設定屬性為 read-only 甚至是 constant 時，就可以使用屬性描述器。

屬性的特徵：

- 資料描述器
  - writable
  - configurable
  - enumerable
  - value
- 存取器描述器
  - get
  - set

這些特徵都是可以透過屬性描述器去設定的 `Object.defineProperty` 和 `Object.definedProperties`

### 使用字面值宣告屬性的特徵

- writable, configurable, enumerable 都會是 true
- value 代表屬性的值
- get, set 則是沒有設定

### 取得屬性特徵

若想要瞭解一個屬性的特徵時，可以使用 `Object.getOwnPropertyDescriptor(object, 'propertyName')` 這個內建函式

```javascript
var obj = { prop1: "prop1", prop2: "prop2" };
Object.getOwnPropertyDescriptor(obj, "prop1", "prop2");
// {
//    value: "prop1",
//    writable: true,
//    enumerable: true,
//    configurable: true
// }
```

使用字面值創建的屬性，其 `writable`, `enumerable`, `configurable` 都會是 `true`，而 `value` 就會是此屬性的值 `prop1`

對於一次察看多個屬性的特徵，可以使用 `Object.getOwnPropertyDescriptors(object, 'propertyName1', 'propertyName2', ...)`

```javascript
var obj = { prop1: "prop1", prop2: "prop2" };
Object.getOwnPropertyDescriptors(obj, "prop1", "prop2");
// {
//   prop1: { value: "prop1", writable: true, enumerable: true, configurable: true },
//   prop2: { value: "prop2", writable: true, enumerable: true, configurable: true }
// }
```

### Object.defineProperty 設定單一個屬性描述器

```javascript
Object.defineProperty(object, "propertyName", descriptor);
// descriptor 是一個 object，descriptor 裡面的屬性可以是剛剛提到的屬性特徵
```

在 `obj` 中按需求設定 ‵prop` 這個屬性

```javascript
var obj = {};
Object.defineProperty(obj, "prop", {
  writable: false,
  configurable: true,
  enumerable: true,
  value: "This is prop",
});
console.log(obj.prop); // "This is prop"
```

### Object.defineProperties 一次設定多個屬性

```javascript
Object.definedProperties(object, properties);

// properties 也是一個 object，其結構如下：
// {
//   'propertyName1': descriptor1,
//   'propertyName2': descriptor1,
//    ...
//   'propertyNamen': descriptorn
// }
```

```javascript
var obj = {};
Object.defineProperties(obj, {
  prop1: {
    writable: false,
    configurable: true,
    enumerable: true,
    value: "This is prop1",
  },
  prop2: {
    writable: false,
    configurable: true,
    enumerable: true,
    value: "This is prop2",
  },
});
console.log(obj.prop1); // "This is prop1"
console.log(obj.prop2); // "This is prop2"
```

### 資料描述器

> 參考資料：
>
> [JavaScript - 屬性描述器](https://ithelp.ithome.com.tw/articles/10197826)

#### writable 屬性是否可以改值

可以將屬性設定為 `read-only`

當使用屬性的字面值( `obj.prop` 與 `obj[prop]`)定義屬性時，屬性的 writable 為 true，也就代表可以寫入。

相較之下，當 writable 為 false 就代表此屬性為 read-only

在非嚴格模式下，還是可以對 read-only 的屬性進行寫值，但會沒有效果。

```javascript
var obj = {};
Object.defineProperty(obj, "prop1", {
  value: "This is prop1",
  configurable: true,
  enumerable: true,
  writable: false, // 將 writable 設為 false
});
console.log(obj.prop1); // 'This is prop1'
obj.prop1 = "This is prop2";
console.log(obj.prop1); // 'This is prop1'
```

#### Configurable 是否可編輯該屬性

屬性描述器在一般狀況下，可以利用屬性描述器重新設定，若沒有重新設定，會保留原有的特徵。

```javascript
var obj = {};
obj.prop1 = "This is prop1";

Object.defineProperty(obj, "prop1", {
  value: "This is prop1",
  configurable: true,
  enumerable: true,
  writable: false,
});
console.log(obj.prop1); // "This is prop1"
obj.prop1 = "This is prop2";
console.log(obj.prop1); // "This is prop1"
```

上面將 `writable` 設為 `false`，因此無法對 `obj.prop1` 賦值。

下面實作禁止屬性被重新設定：

```javascript
var obj = {};
Object.defineProperty(obj, "prop1", {
  value: "This is prop1",
  configurable: false,
  enumerable: true,
  writable: true,
});
console.log(obj.prop1); // "This is prop1"

Object.defineProperty(obj, "prop1", {
  value: "This is prop1",
  configurable: true,
  enumerable: true,
  writable: false,
}); // Uncaught TypeError: Cannot redefine property: prop1

delete obj.prop1; // false 禁止屬性被刪除
console.log(obj.prop1); // "This is prop1"
```

當 `obj.prop1` 已經被設定為 `configurable: false` 時，又試著重新設定屬性描述器一次時，javascript 會報錯。

即是在非嚴格模式下，都不允許重新設定 `configurable: false` 的屬性描述。

但有一個特例：在 `configurable: false`，`writable` 特徵還是可以從 `true` 改為 `false`

#### Enumerable 屬性是否會在物件的屬性列舉時被顯示

在 `for...in` 的屬性列舉動作中，只有可列舉的屬性會被迭代

```javascript
var obj = {};
Object.defineProperty(obj, "prop1", {
  value: "This is prop1",
  configurable: true,
  enumerable: false,
  writable: true,
});
obj.prop2 = "This is prop2";

console.log("prop1" in obj); // true
console.log("prop2" in obj); // true
for (var prop in obj) {
  console.log("prop: ", prop); // "prop: This is prop2"
}
```

雖然 `prop1` 和 `prop2` 都存在於物件中(利用 `in` 檢查)，但因為 `obj.prop1` 被設定為 `enumerable: false` 因此在 `for...in` 列舉的動作中，並不會被迭代到。

相較之下，普通屬性的 `obj.prop2` 可以被列舉。

- `obj.propertyIsEnumerable` 檢查屬性是否可列舉且為物件自有的

```javascript
var obj = { prop1: "prop1" };
Object.defineProperty(obj, "prop2", {
  value: "prop2",
  enumerable: false,
  writable: true,
  configurable: true,
});
obj.propertyIsEnumerable("prop1"); // true
obj.propertyIsEnumerable("prop2"); // false
```

使用 Object.keys 會將所有可列舉的屬性列成一個陣列

```javascript
var obj = { prop1: "prop1" };
Object.defineProperty(obj, "prop2", {
  value: "prop2",
  enumerable: false,
  writable: true,
  configurable: true,
});
Object.keys(obj); // ["prop1"]
```

#### value 屬性的值

```javascript
var obj = {};
Object.defineProperty(obj, "prop1", {
  value: "This is prop1",
  writable: true,
  configurable: true,
  enumerable: true,
});
console.log(obj.prop1); // "This is prop1"
```

上面程式碼，等同於下面

```javascript
var obj = {};
obj.prop1 = "This is prop1";
console.log(obj.prop1); // "This is prop1"
```

#### 屬性描述器屬於淺層設定

淺層設定：只有目標物件的`自有屬性`才會擁有這個特徵，若屬性又指向了另一個物件，則另一個物件內的屬性，即不為自有屬性，亦不會擁有這個特徵。

```javascript
var obj = {};
var innerObj = { innerProp: "This is innerProp" };

Object.defineProperty(obj, "prop1", {
  value: innerObj,
  writable: false,
  configuration: true,
  enumerable: true,
});

obj.prop1 = {};
console.log(obj.prop1); // { innerProp: "This is innerProp" }

obj.prop1.innerProp = "innerProp changed!";
console.log(obj.prop1); // { innerProp: "innerProp changed!" }
```

將 `obj.prop1` 設為 `writable: false`，並賦值為 `innerObj`，接著試圖將`{}` 寫入 `obj.prop1`。此時寫入的動作並沒有成功，`obj.prop1` 還是指向 `innerObj`

但若賦值的是 `innerObj` 的屬性 `innerProp` 的話，是可以寫入的，因為只有 `obj` 自身的屬性 `prop1` 被指定為 `writable: false`，而 `prop1` 指向的 `innerObj` 內部屬性則不受 `prop1` 的特徵管轄，因此複寫 `innerProp` 是可行的

### 存取器描述器

`get` 和 `set` 分別為取值器與設值器，可以將他想像成是函式。
當有設定這兩個特徵時，他們會覆蓋 javascript 原有的取值與設值行為 `[[GET]]` 和 `[[set]]`

#### 宣告方式

- 使用物件字面值時直接定義

  ```javascript
  var obj = {
    get propName() {
      // ... do something
      return "some value";
    },
    set propName(val) {
      // ... do something
    },
  };
  ```

- 利用屬性描述器定義

  ```javascript
  Object.defineProperty(obj, "prop1", {
    // ...
    get: function () {
      // ... do something
      return "some value";
    },
    set: function (val) {
      // ... do something
    },
  });
  ```

以上的宣告方式是一樣的

#### Getter

需要回傳一個值來當作取值結果

```javascript
var obj = {
  get prop1() {
    return "This is prop1";
  },
};
console.log(obj.prop1); // 'This is prop1'

obj.prop1 = "Change value!";
console.log(obj.prop1); // 'This is prop1'
```

無論怎麼修改 prop1 的值，最後回傳的都是取值器回傳的 "This is prop1"

### setter

在拿到值之後，去做指定的動作

```javascript
var obj = {
  set prop1(val) {
    console.log("prop1 setted: ", val);
  },
};
obj.prop1 = "This is prop1"; // "prop1 setted:  This is prop1"

console.log(obj.prop1); // undefined
```

將 "this is prop1" 傳入 prop1 中，此時會印出 set 要求的 log，當要取出 obj.prop1 的值時，因為我們並沒有設置 get，因此出現 undefined

### 資料處理器與存取器處理器

- 資料描述器：代表屬性是有值，會有以下兩個特徵
  - value
  - writable
- 存取器描述器：屬性的值是由取值器與設值器所決定，會有以下兩個特徵：
  - get
  - set

需要注意的是，資料描述器與存取器描述器不相容。

若今天物件中的屬性已經設定了 get 和 set，也就代表已經定義取值和設值的行為，此時再額外進行屬性值(value)與唯獨(writable)的設定，產生行為衝突

```javascript
var obj = {};
Object.defineProperty(obj, "prop1", {
  get: function () {
    return "This is prop1";
  },
  value: "test",
  writable: true,
}); // Uncaught TypeError: Invalid property descriptor. Cannot both specify accessors and a value or writable attribute, #<Object>
```

### 取值器與設值器的應用

```javascript
var obj = {};
Object.defineProperty(obj, "prop1", {
  set: function (val) {
    this._prop1_ = val * 2;
  },
  get: function () {
    return this._prop1_;
  },
  configurable: true,
  enumerable: true,
});

obj.prop1 = 100;
console.log(obj.prop1); // 200
```

上面我們宣告了一個變數 obj 並加入一個屬性 prop1，並為這個屬性同時加入 get 和 set，這兩個函式的共通點：都對 obj.prop1 進行存取。

## 額外補充

### random 公式

```javascript
function getRandom(start, end) {
  return Math.floor(Math.random() * (end - start + 1)) + start;
}
var r = getRandom(0, 255);
var g = getRandom(0, 255);
var b = getRandom(0, 255);
```
