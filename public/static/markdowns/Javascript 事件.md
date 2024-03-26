# Javascript 事件

> 參考資料：
>
> [重新認識 JavaScript: Day 14 事件機制的原理](https://ithelp.ithome.com.tw/articles/10191970)

## 事件流程

假設有兩個元素：outer, inner

```html
<div id='outer'>
  <div id='inner'></div>
</div>
```

此時當點擊 inner 的時候，也代表同時點擊 outer，甚至實際上我們也點擊到整個網頁。

事件流程(Event Flow)指的就是`網頁元素接收事件的順序`。

- 事件流程可以分為兩種機制：
  - 事件冒泡(Event Bubbling)
  - 事件捕獲(Event Capturing)


### 事件冒泡

事件冒泡的意思是：從啟動事件的元素節點開始，逐層向上傳遞，直到整個網頁的根節點，也就是 `document`。

```html
<!DOCTYPE html>
<html>
<head>
  <title>TITLE</title>
</head>
<body>

  <div>CLICK</div>

</body>
</html>
```

如上面程式碼，假設點擊了 click 元素，那在`事件冒泡`的機制下，觸發事件的順序會是：

1. `<div>CLICK</div>`
2. `<body>`
3. `<html>`
4. `document`

向這樣 click 事件逐層向上依序被觸發，就是事件冒泡。

### 事件捕獲

事件捕獲和事件冒泡的機制正好相反

```html
<!DOCTYPE html>
<html>
<head>
  <title>TITLE</title>
</head>
<body>

  <div>CLICK</div>

</body>
</html>

```

今點擊 click 後，事件捕獲的機制會是：

1. `document`
2. `<html>`
3. `<body>`
4. `<div>CLICK</div>`

### 機制執行邏輯

當事件被觸發時，兩種事件傳遞的機制都會執行。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>title</title>
</head>
<body>
    <table>
        <tbody>
            <tr>
                <td>a</td>
                <td>b</td>
            </tr>
            <tr>
                <td>c</td>
                <td>d</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
```

假設現在的事件為點擊 `<td>c</td>`，當事件發生時，會先執行`事件捕獲(capture phase)`：

1. `document`
2. `<html>`
3. `<body>`
4. `<table>`
5. `<tbody>`
6. `<tr>`
7. `<td>` (實際被點擊的元素)

由上而下依序觸發他們的 click 事件。

藉著再繼續執行`事件冒泡(bubble phase)`，反方向由 `<td>` 一路向上傳至 `document` 結束整個事件流程。

若要檢驗事件流程，可以透過`addEventListener()` 方法來綁定 click 事件：

```html
<div>
  <div id="parent">
    父元素
    <div id="child">子元素</div>
  </div>
</div>
```

```js
// 父元素
var parent = document.getElementById('parent');
// 子元素
var child = document.getElementById('child');

// 透過 addEventListener 指定事件的綁定
// 第三個參數 true / false 分別代表捕獲/ 冒泡 機制

parent.addEventListener('click', function () {
  console.log('Parent Capturing');
}, true);

parent.addEventListener('click', function () {
  console.log('Parent Bubbling');
}, false);


child.addEventListener('click', function () {
  console.log('Child Capturing');
}, true);

child.addEventListener('click', function () {
  console.log('Child Bubbling');
}, false);

```

當點擊 `子元素`時，透過`console.log()`可以觀察到事件觸發的順序。

```text
"Parent Capturing"
"Child Capturing"
"Child Bubbling"
"Parent Bubbling"
```

若點擊`父元素`，則出現

```text
"Parent Capturing"
"Parent Bubbling"
```

當點擊子元素時，父層的`捕獲` 會先被觸發。然後到子層內部的 `捕獲`接著`冒泡`事件，最後才又回到父層的`冒泡`結束。

那子層的`捕獲`或`冒泡`的順序要依程式碼的順序而定。

若是`捕獲`在`冒泡`前面：

```js
child.addEventListener('click', function () {
  console.log('Child Capturing');
}, true);

child.addEventListener('click', function () {
  console.log('Child Bubbling');
}, false);
```

則會得到

```text
"Child Capturing"
"Child Bubbling"
```

若是將兩段程式碼順序相反，結果如下：

```js
child.addEventListener('click', function () {
  console.log('Child Bubbling');
}, false);

child.addEventListener('click', function () {
  console.log('Child Capturing');
}, true);
```

```text
"Child Bubbling"
"Child Capturing"
```

## 註冊事件的綁定

除了 `addEventListener()`方法，綁定事件的方式還有其他方法。

### on-event 處理器 (HTML 屬性)

對 html 標籤而言，只要支援某個`事件`的觸發，就可以透過 `on + 事件名`的屬性來註冊事件：

```html
<button id="btn" onclick="console.log('HI');">Click</button>
```

如同上面範例，透過 `onclick`事件，就可以在 `<button>`標籤上面註冊 `click`事件，也就是當使用者按下 `<button>`標籤時，就會執行 `conaole.log('HI');`的程式碼。

但基於程式碼的使用性與維護性考量，現在不建議用此方法來綁定事件。

### on-event 處理器(非 HTML 屬性)

像是 `window`或`document`此類沒有實體元素的情況，一樣可以用 DOM API 提供的`on-event 處理器(on-event handler)`來處理事件

```js
window.onload = function(){
  document.write("Hello world!");
};
```

上面程式碼會在 `window`觸發 `load` 事件時，執行相對應功能。

另外，若是實體元素也可透過 DOM API 取得 DOM 物件後，在透過 on-event 處理器來處理事件。

```html
<button id='btn'>
  Click
</button>
```

ㄊ

```js
const btn = document.getElementById('btn');

btn.onclick = function(){
  console.log('HI')
};
```

若想解除事件，則重新指定`on-event hendler`為`null`

### 事件監聽`EventTarget.addEventListener()`

 `.addEventListener()`有三個參數，分別為`事件名稱`、`事件處理器`、`執行機制`。

- 事件名稱：HTML DOM 事件，為字串
- 事件處理器：事件觸發時執行的 function
- 執行機制(boolean)：決定事件以捕獲或是冒泡機制執行。

用此方法來註冊事件的好處是可以重複指定多個`處理器(handler)`給同一個標籤的同一個事件。

```js
var btn = document.getElementById('btn');

btn.addEventListener('click', function(){
  console.log('HI');
}, false);

btn.addEventListener('click', function(){
  console.log('HELLO');
}, false);
```

點擊觸發事件：

```text
"HI"
"HELLO"
```

若是要解除事件的註冊，則是透過 `removeEventListener()`來取消。

## HTML DOM 事件

> 參考資料：
>
> [HTML DOM 事件](https://www.runoob.com/jsref/dom-obj-event.html)

HTML DOM 事件允許 javascript 在 html 檔案中註冊不同事件處理程序。

事件通常和函式結合使用，函式不會在事件發生前被執行(如使用者點擊按鈕)。

### DOM Event事件名稱整理

|     屬性     | 描述                          |
| :----------: | ----------------------------- |
|     blur     | 物件失去焦點時                |
|    change    | 物件內容改變時                |
|    click     | 滑鼠點擊物件時                |
|   dblclick   | 滑鼠連點二下物件時            |
|    error     | 當圖片或文件下載產生錯誤時    |
|    focus     | 當物件被點擊或取得焦點時      |
|   keydown    | 按下鍵盤按鍵時                |
|   keypress   | 按下並放開鍵盤按鍵後          |
|    keyup     | 按下並放開鍵盤按鍵時          |
|     load     | 網頁或圖片完成下載時          |
|  mousedown   | 按下滑鼠按鍵時                |
|  mousemove   | 介於over跟out間的滑鼠移動行為 |
|   mouseout   | 滑鼠離開某物件四周時          |
|  mouseover   | 鼠離開某物件四周時            |
|   mouseup    | 放開滑鼠按鍵時                |
|    resize    | 當視窗或框架大小被改變時      |
|    scroll    | 當捲軸被拉動時                |
|    select    | 當文字被選取時                |
|    submit    | 當按下送出按紐時              |
| beforeunload | 當使用者關閉(或離開)網頁之前  |
|    unload    | 當使用者關閉(或離開)網頁之後  |