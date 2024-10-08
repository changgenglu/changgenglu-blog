# JavaScript 陣列

> 參考資料：
>
> [JavaScript Array 陣列操作方法大全 ( 含 ES6 )](https://www.oxxostudio.tw/articles/201908/js-array.html)

<!-- TOC -->

- [JavaScript 陣列](#javascript-陣列)
  - [改變原始陣列](#改變原始陣列)
    - [push() 加入陣列最後一個位置](#push-加入陣列最後一個位置)
    - [pop() 取出陣列的最後一個元素](#pop-取出陣列的最後一個元素)
    - [shift() 取出並移除陣列的第一個元素](#shift-取出並移除陣列的第一個元素)
    - [unshift() 將元素添加到第一個位置](#unshift-將元素添加到第一個位置)
    - [reverse() 反轉陣列](#reverse-反轉陣列)
    - [splice(start, delete\_count, item) 新增或移除陣列中指定位置的元素](#splicestart-delete_count-item-新增或移除陣列中指定位置的元素)
    - [sort() 針對陣列的元素進行排列](#sort-針對陣列的元素進行排列)
    - [copyWithin()](#copywithin)
    - [fill()　置換陣列中的值](#fill置換陣列中的值)
  - [回傳陣列元素資訊或索引值](#回傳陣列元素資訊或索引值)
    - [length() 取得陣列長度](#length-取得陣列長度)
    - [indexOf() 尋找是否有符合的元素](#indexof-尋找是否有符合的元素)
    - [lastIndexOf()](#lastindexof)
    - [find() 回傳第一個符合判斷條件的元素](#find-回傳第一個符合判斷條件的元素)
    - [findIndex()](#findindex)
    - [filter() 回傳條件為 true 的元素組成的陣列](#filter-回傳條件為-true-的元素組成的陣列)
  - [針對每個元素進行處理](#針對每個元素進行處理)
    - [forEach()](#foreach)
  - [產生新的陣列或值](#產生新的陣列或值)
    - [join()](#join)
    - [concat()](#concat)
    - [slice() 擷取陣列，回傳指定範圍元素的新陣列](#slice-擷取陣列回傳指定範圍元素的新陣列)
    - [map() 處理陣列中每一個元素，最後回傳一個新的陣列](#map-處理陣列中每一個元素最後回傳一個新的陣列)
    - [reduce() 計算陣列中每個元素，並將結果與下個元素做計算](#reduce-計算陣列中每個元素並將結果與下個元素做計算)
    - [reduceRight() 計算方式為從右到左](#reduceright-計算方式為從右到左)
    - [flat() 將多維陣列扁平化](#flat-將多維陣列扁平化)
    - [flatMap() map + flat()](#flatmap-map--flat)
    - [Array.from()](#arrayfrom)
    - [Array.of() 將數值、字串等內容，轉換為陣列](#arrayof-將數值字串等內容轉換為陣列)
    - [toString() 將陣列轉換為字串](#tostring-將陣列轉換為字串)
  - [判斷](#判斷)
    - [every() 全部符合判斷條件回傳 true](#every-全部符合判斷條件回傳-true)
    - [some() 其中任一符合回傳 true](#some-其中任一符合回傳-true)
    - [include() 陣列中使否包含指定值](#include-陣列中使否包含指定值)
    - [Array.inArray()](#arrayinarray)
  - [其他](#其他)
    - [keys()](#keys)
    - [valueOf() 回傳陣列的原始值](#valueof-回傳陣列的原始值)

<!-- /TOC -->

## 改變原始陣列

### push() 加入陣列最後一個位置

將值加入陣列的最後一個位置，push() 會回傳新的陣列長度。

```javascript
let arr = [1, 2, 3, 4, 5, 6, 7, 8];
console.log(arr.push(9, 10)); // 10
console.log(arr); // [1, 2, 3, 4, 5, 6, 7, 8, ,9, 10]
```

### pop() 取出陣列的最後一個元素

```javascript
let arr = [1, 2, 3, 4, 5, 6];
let new_arr = arr.pop();
console.log(arr); // [1,2,3,4,5]
console.log(new_arr); // 6
```

### shift() 取出並移除陣列的第一個元素

```javascript
let arr = [1, 2, 3, 4, 5];
let new_arr = arr.shift();
console.log(arr); // [2, 3, 4, 5]
console.log(new_arr); // 1
```

### unshift() 將元素添加到第一個位置

```javascript
let arr = [1, 2, 3, 4, 5];
arr.unshift(100, 200, 300);
console.log(arr); // [100, 200, 300, 1, 2, 3, 4, 5]
```

### reverse() 反轉陣列

```javascript
let arr = [1, 2, 3, 4, 5];
arr.reverse();
console.log(arr); // [5, 4, 3, 2, 1]
```

### splice(start, delete_count, item) 新增或移除陣列中指定位置的元素

可以移除或新增陣列的元素，包含三個參數

- start 要編輯的序列號碼
- delete_count 要移除的長度(選填，若不填，則將第一個號碼位置面的所有元素清除，若為 0 則不刪除元素)
- item 要添加的內容(選填)

```javascript
let arr = [1, 2, 3, 4, 5, 6, 7, 8];
arr.splice(5, 1);
console.log(arr); // [1, 2, 3, 4, 5, 7, 8] (6 被移除了)
```

設定第三個參數就能添加或取代元素

```javascript
let arr = [1, 2, 3, 4, 5, 6, 7, 8];
arr.splice(5, 1, 100);
console.log(arr); // [1, 2, 3, 4, 5, 100, 7, 8]; (6 被移除，100 被加到第五的位置)
```

splice 方法會回傳被刪除的元素，若無刪除元素，則回傳空陣列

### sort() 針對陣列的元素進行排列

- 未帶入參數:

  預設排序為依照陣列內元素的 code UTF-16 的順序排序。

  ```js
  const arr_1 = [
    null,
    2,
    8,
    undefined,
    NaN,
    200,
    "Hi",
    "apple",
    "",
    "#",
    "!",
    "2",
  ];

  arr_1.sort();

  console.log(arr_1);
  // [ '', '!', '#', '2', 2, 200, 8, 'Hi', NaN, 'apple', null, undefined ]
  ```

  `sort()` 會將所有元素轉成字串後，以第一個字元為對象進行排序。符號會先被篩選出來，接著是數字，接著是字母。

- 傳入匿名函數

  `sort()` 會依匿名函式的參數與回傳的值當作排序依據

  - 當回傳值為負數時，前面的數放在前面
  - 當回傳值為正數時，後面的數在前面
  - 當回傳值為零時，保持不動

  ```js
  // 沒有給參數的預設排序
  const arr = [5, 9, 1, 3, 2, 6];
  arr.sort(); // [1, 2, 3, 5, 6, 9]

  // 以匿名函式回參數做「升序」排序
  arr.sort(function (a, b) {
    return a - b; // a - b > 0
  });
  // [1, 2, 3, 5, 6, 9]

  // 如果要反過來做「降序」排序
  arr.sort(function (a, b) {
    return b - a;
  });
  // [9, 6, 5, 3, 2, 1]
  ```

  為什麼參數相減就能判斷排序？

  ```js
  const arr = [5, 9, 1, 3, 2, 6];
  // 升序
  arr.sort(function (a, b) {
    if (a > b) {
      return 1; // 正數時，後面的數放在前面
    } else {
      return -1; // 負數時，前面的數放在前面
    }
  });

  // 降序
  arr.sort(function (a, b) {
    if (a < b) {
      return 1; // 正數時，後面的數放在前面
    } else {
      return -1; // 負數時，前面的數放在前面
    }
  });

  // 升序 另一種寫法，就會精簡到像最上面那樣！
  arr.sort(function (a, b) {
    if (a > b) {
      // a > b  等於 a - b > 0
      return a - b;
    } else {
      return a - b;
    }
  });
  ```

### copyWithin()

### fill()　置換陣列中的值

會將陣列中所有元素，置換為指定的值。

- fill(value, start, end)
  - value 必填，欲替換的值
  - start 可選，起使位置(包含該位置)
  - end 可選，停止位置(不包含此位置)

> 使用 fill() 會改變原本的陣列內容

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
a.fill("a");
console.log(a); // ['a','a','a','a','a','a','a','a']

let b = [1, 2, 3, 4, 5, 6, 7, 8];
b.fill("b", 3, 5);
console.log(b); // [1,2,3,'b','b',6,7,8]
```

## 回傳陣列元素資訊或索引值

### length() 取得陣列長度

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
console.log(a.length); // 8
```

### indexOf() 尋找是否有符合的元素

```js
const fruits = ["apple", "banana", "orange"];

fruits.indexOf("mango"); // -1 表示找不到
fruits.indexOf("apple"); // 0   表示在陣列的第 0 個位置找到
```

### lastIndexOf()

### find() 回傳第一個符合判斷條件的元素

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
console.log(a.find((e) => e > 3)); // 4
console.log(a.find((e) => e < 0)); // undefined
```

### findIndex()

### filter() 回傳條件為 true 的元素組成的陣列

會將陣列中每一個元素，帶入指定的函式做判斷，若元素符合判斷條件會傳出成唯一個新的陣列元素。

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
console.log(a.filter((e) => e > 3)); // [4, 5, 6, 7, 8]
console.log(a.filter((e) => e % 2 == 0)); // [2, 4, 6, 8]
```

## 針對每個元素進行處理

### forEach()

將陣列中每個元素套用到指定函式裡面進行運算。

函式有三個參數：

1. 表示每個元素的值(必填)
2. 該元素的索引值(選填)
3. 表示原本的陣列(選填)

```javascript
let a = [1, 2, 3, 4, 5];
let b = 0;
a.forEach((item) => {
  b = b + item;
});
console.log(b); // 15 => (1 + 2 + 3 + 3 + 4 + 5)
```

## 產生新的陣列或值

### join()

### concat()

### slice() 擷取陣列，回傳指定範圍元素的新陣列

- slice(startIndex, endIndex)
  - startIndex 必須，起始位置的 index，包含此位置。
  - endIndex 可選，擷取結束位置的索引，不包含此位置。預設為擷取至陣列末端。

```js
let arr = [1, 2, 3, 4, 5];

// 擷取位置 1 到位置 3 (不包含)的元素
let answer = arr.slice(1, 3);

console.log(answer); // [2,3]
console.log(arr); // [1,2,3,4,5] (原陣列未被修改)
```

若傳入負數索引為引數，則表示從陣列末尾開始計算。

```js
let arr = [1, 2, 3, 4, 5];

// 擷取倒數第二元素到陣列末端
let answer = arr.slice(-2);

console.log(answer); // [4,5]
```

### map() 處理陣列中每一個元素，最後回傳一個新的陣列

裡面有一個函式(必填)和一個回傳函式裡面的 this 參數(選填)，函式中包含三個參數：

1. 每個元素的值(必填)
2. 當前元素的 index 值(選填)
3. 當前的陣列(選填)

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
let b = a.map((e) => {
  return e + 10;
});
console.log(b); // [11, 12, 13, 14, 15, 16, 17, 18]
```

套用第二和第三個參數的變化

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
let b = a.map((e, i, arr) => {
  return `${e}${i}${arr.find((e) => e % 5 == 1)}`; // 組合成「元素 + 索引值 + 除以五餘數為 1 的元素」
});
console.log(b); // ['101', '211', '321', '431', '541', '651', '761', '871']
```

若要使用回傳函式裡 this 的函數，則「不能使用」箭頭函式，因為箭頭函式的 this 指向，和函式的 this 指向不同，所以要用一般的函式處理。

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
let b = a.map(function (e) {
  return e + this; // 此處的 this 為 10
}, 10);
console.log(b); // [11, 12, 13, 14, 15, 16, 17, 18]
```

### reduce() 計算陣列中每個元素，並將結果與下個元素做計算

可以將陣列中的每一個元素做計算，每次計算的結果，會再與下個元素做計算到結束為止。

包含一個函式，函式內有四個參數：

1. 計算的值(必填)
2. 取得的元素(必填)
3. 該元素的 index 值(選填)
4. 原本的陣列 (選填)

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
let b = a.reduce(function (total, e) {
  return total + e;
});
console.log(b); // 36 => (1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 = 36)
```

### reduceRight() 計算方式為從右到左

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
let b = a.reduce(function (total, e) {
  return total - e;
});
console.log(b); // -34 (1 - 2 - 3 - 4 - 5 - 6 - 7 - 8 = -34)
let c = a.reduceRight(function (total, e) {
  return total - e;
});
console.log(c); // -20 (8 - 7 - 6 - 5 - 4 - 3 - 2 - 1 = -20)
```

### flat() 將多維陣列扁平化

可以將一個多維陣列的深度轉換為一維(扁平化)，他有一個選填的參數，代表要轉換的深度，其預設為 1，如果深度很多層，可以用`infinity`來全部展開成一維陣列。

```javascript
let a = [1, 2, [3], [4, [5, [6]]]];
let b = a.flat();
let c = a.flat(2);
let d = a.flat(Infinity);
console.log(b); // [1, 2, 3, 4, [5, [6]]]
console.log(c); // [1, 2, 3, 4, 5, [6]]
console.log(d); // [1, 2, 3, 4, 5, 6]
```

### flatMap() map + flat()

在運算後直接將陣列扁平化

```javascript
let a = [1, 2, [3], [4, 5]];
let b = a.flatMap((e) => e + 1);
let c = a.map((e) => e + 1).flat();
console.log(b); // [2, 3, "31", "4,51"] ( 可以看到 b 和 c 得到的結果相同 )
console.log(c); // [2, 3, "31", "4,51"]
```

### Array.from()

### Array.of() 將數值、字串等內容，轉換為陣列

```javascript
let a = Array.Of(1, "a", 2, "b", 3);
console.log(a); // [1, "a", 2, "b", 3]
```

### toString() 將陣列轉換為字串

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
let b = a.toString();
console.log(b); // 1,2,3,4,5,6,7,8
```

## 判斷

### every() 全部符合判斷條件回傳 true

只要有任何一個元素不符合判斷條件，就會回傳 false，全部符合就會回傳 true。

```javascript
let a = [1, 2, 3, 4, 5, 6];
console.log(a.every((e) => e > 3)); // false (1, 2 小於 3，3　等於 3)
console.log(a.every((e) => e > 0)); // true
```

### some() 其中任一符合回傳 true

會將陣列中每一個元素帶入指定的函式中做判斷，只要有任一個元素符合判斷標準，就會回傳 true，若完全不符合，回傳 false

```javascript
let a = [1, 2, 3, 4, 5, 6];
console.log(a.some((e) => e > 3)); // true (因為 4, 5, 6 大於 3)
console.log(a.some((e) => e > 6)); // false (因為全部都小於或等於 6)
```

### include() 陣列中使否包含指定值

會判斷陣列中是否包含指定值，包含回傳 true，否則回傳 false。

有兩個參數：

1. 表示要判斷的值(必填)
2. 陣列的開始位置(選填)

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
console.log(a.includes(2)); // true
console.log(a.includes(2, 2)); // false (從陣列中第二個位置開始搜尋，沒有 2)
```

### Array.inArray()

## 其他

### keys()

### valueOf() 回傳陣列的原始值

```javascript
let a = [1, 2, 3, 4, 5, 6, 7, 8];
let b = a.valueOf();
console.log(a); // [1, 2, 3, 4, 5, 6, 7, 8]
let c = a.valueOf();
a.shift();
console.log(a); // [2, 3, 4, 5, 6, 7, 8]
console.log(b); // [2, 3, 4, 5, 6, 7, 8] ( 因為 a 的原始值更動了，所以 b 也變了 )
console.log(c); // [2, 3, 4, 5, 6, 7, 8]
```
