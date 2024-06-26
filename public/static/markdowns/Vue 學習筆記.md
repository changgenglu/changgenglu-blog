# Vue 學習筆記

<!-- TOC -->

- [Vue 學習筆記](#vue-學習筆記)
  - [Vue 實體的生命週期](#vue-實體的生命週期)
  - [Vue 屬性](#vue-屬性)
    - [watch 監聽器](#watch-監聽器)
      - [$watch](#watch)
      - [watch](#watch-1)
    - [computed 計算](#computed-計算)
      - [computed 和 watch 的差別](#computed-和-watch-的差別)
  - [eventHub 事件中心(vue 2)](#eventhub-事件中心vue-2)
  - [directive 指令](#directive-指令)
    - [屬性綁定](#屬性綁定)
    - [表單綁定 `v-model`](#表單綁定-v-model)
      - [input](#input)
      - [textarea 文字方塊](#textarea-文字方塊)
      - [radio](#radio)
      - [checkbox](#checkbox)
      - [select 下拉式選單](#select-下拉式選單)
    - [v-model 修飾子](#v-model-修飾子)
      - [.lazy](#lazy)
    - [模板綁定](#模板綁定)
      - [v-text](#v-text)
      - [v-html](#v-html)
      - [v-once](#v-once)
      - [v-pre](#v-pre)
    - [樣式綁定](#樣式綁定)
  - [條件渲染](#條件渲染)
    - [v-if](#v-if)
    - [v-show](#v-show)
  - [迴圈渲染](#迴圈渲染)
  - [事件監聽器](#事件監聽器)
    - [事件通用型修飾子](#事件通用型修飾子)
      - [.stop](#stop)
      - [.prevent](#prevent)
      - [.capture](#capture)
      - [.self](#self)
      - [.once](#once)
      - [.passive](#passive)
  - [props](#props)
    - [命名與使用](#命名與使用)
    - [傳遞 props 值的方法](#傳遞-props-值的方法)
      - [傳遞字串](#傳遞字串)
      - [傳遞數字、布林值、陣列、物件](#傳遞數字布林值陣列物件)
    - [單向數據流](#單向數據流)
    - [改變子模組內的 prop 值](#改變子模組內的-prop-值)
    - [物件型別的 prop 傳遞](#物件型別的-prop-傳遞)
    - [子組件接收來自父組件的 props](#子組件接收來自父組件的-props)
      - [在模板中](#在模板中)
      - [在 data 中](#在-data-中)
      - [在 methods 中](#在-methods-中)
      - [在 mounted 中](#在-mounted-中)
      - [在 computed 中](#在-computed-中)
  - [emit 子組件向父組件傳遞參數](#emit-子組件向父組件傳遞參數)
  - [ref 取得 Dom 元素](#ref-取得-dom-元素)
    - [基本用法：取得 dom 元素](#基本用法取得-dom-元素)
    - [獲取子組件中的 data 和調用子組件的方法](#獲取子組件中的-data-和調用子組件的方法)
    - [this.$refs 介紹](#thisrefs-介紹)
  - [this.$el](#thisel)
  - [Mixin 共用方法](#mixin-共用方法)
    - [局部混入](#局部混入)
    - [全域混入](#全域混入)
    - [vuex 和 mixin 的區別](#vuex-和-mixin-的區別)
  - [備註](#備註)
    - [Truthy(真值) 與 Falsy(假值)](#truthy真值-與-falsy假值)
    - [判斷當前環境是否為開發環境](#判斷當前環境是否為開發環境)
    - [取得 base\_url](#取得-base_url)

<!-- /TOC -->

## Vue 實體的生命週期

- `beforeCreate`: 當 Vue 實例初始化時便立即調用，此時尚未創建實例，因此所有 Vue 實體中的設定(如：data)都還未配置。
- `created`: 完成創建實例，此時 Vue 實體中的配置除了 \$el 外，其餘已全部配置，而 \$el 要在掛載模板後才會配置。
- `beforeMount`: 在 Vue 實體中被掛載到目標元素之前調用，此時的 \$el 依然未被 Vue 實體中的定義渲染的初始設定模板。
- `mounted`: Vue 實體上的設置已經安裝上模板，此時 \$el 是已經藉由實體中的定義渲染成真正的頁面。
- `beforeUpdate`: Vue 實體中的 data 產生變化後，或是執行 vm.$forceUpdate() 時調用，此時頁面尚未被重新渲染成變過的畫面。
- `update`: 在重新渲染頁面後調用，此時的頁面已經被重新渲染成改變後的畫面。
- `beforeDestroy`: 在此實體被銷毀前調用，此時實體依然擁有完整的功能。
- `destroyed`: 於此實體被銷毀後調用，此時實體中的任何定義(data, methods...)都已被解除綁定，在此做任何操作都會失效。

## Vue 屬性

### watch 監聽器

當資料變化時調用函數，函數會有兩個傳入參數：改變前的值、改變後的後的值，可以使用這個函數做跟此資料變化有的處理。

監聽器在 vue.js 中有兩種使用方式：

- `$watch` 實體上的函數，使用此函數註冊監聽器。
- `watch` 實體上的屬性，此屬性設置的物件在實體建立時會調用 `$watch` 註冊監聽器。

`$watch` 是註冊監聽器的函數，而 watch 是為了開發者方便在實體上設置監聽器而提供的，其實 watch 本身也是使用 $watch 註冊監聽器。

#### $watch

```javascript
unwatched = vm.$watch(expOrFn, callback, [options]);
```

`$watch` 的回傳值是註銷監聽器的函數，執行此函數可使監聽器失效。

- `exOrFn` 設定要監聽的目標，可以使用 javascript 表達式或是一個回傳監聽目標值的函數
- `callback` 當數值改變時，要叫用的函數，此函數會有兩個傳入參數：callback(newVal, oldVal)
  - `newVal` 改變後的資料值
  - `oldVal` 改變前的資料值
- `[options]` 非必要參數，監聽器的設定
  - `deep` 監聽物件時，物件下層屬性變化也會觸發監聽器
  - `immediate` 在實體初始畫設置監聽器的時候馬上叫用 callback 函數

```html
<div id="app">
  <button @click="a++">+</button>
  <button @click="a--">--</button>
  <div>a: {{a}}</div>
  <div>changed: {{newA}}</div>
  <div>before change: {{oldA}}</div>
</div>
```

```javascript
var vm = new Vue({
  ...
  data: {
    a: 1,
    newA: 0,
    oldA: 0
  }
});

vm.$watch('a', function(newA, oldA) {
  this.newA = newA;
  this.oldA = oldA;
});
```

#### watch

```javascript
watch: (
  key: value,
  ...
)
```

- 以 watch 為 key 值，下面定義的屬性都是欲監聽的資料來源。
- key 監聽目標名稱，可以使用 javascript 表達式
- value callback 函數的設定，共有 string, function, object 及 array 可以設定。
  - string callback 函數名稱
  - function callback 函數
  - object 設定監聽物件，設定方法如下
    - handler callback 函數
    - deep 布林值，是否監聽物件下層屬性
    - immediate 布林值 使否在實體初始化時立即調用 callback
  - array 當有多個監聽器時，使用陣列帶入多個 callback 函數

### computed 計算

和 watch 一樣，都是用來監聽數據的方式，但使用場景不同。

computed 是一個計算屬性，他根據依賴的資料，動態計算出一個新的值，並且會自動存入快取。當依賴的資料發生變化時，computed 會自動重新計算。這樣可以有效避免重複計算和提高性能。

computed 通常用計算衍生的資料，例如從一個列表中過濾出符合條件的資料，或根據資料的狀態產生顯示內容等等。在模板中，可以像普通的資料屬性一樣使用 computed

```javascript
export default {
  data() {
    return {
      count: 0,
    };
  },
  computed: {
    doubleCount() {
      return this.count * 2;
    },
  },
};
```

`doubleCount` 為一個計算屬性，他依賴於 count 屬性。當 count 屬性發生變化時，doubleCount 會自動重新計算。在模板中，可以像下面這樣使用：

```html
<p>count: {{ count }}</p>
<p>double count: {{ doubleCount }}</p>
```

#### computed 和 watch 的差別

computed 最大特點是必須回傳一個值，並且將其存入快取，當方法中的依賴改變時，才會重新執行和求值。

但 watch 和 methods 不會強制要求回傳一個值，他們只需要執行動作，不一定要回傳值。

watch 會偵測單一個值，當她有變化時就執行。methods 只要呼叫，就會執行。

- computed 的特點

  - 當元件被建立時(created 生命週期)，computed 方法會被建立和執行一次。之後如果依賴沒有更新，就不會重新執行和求值，僅回傳快取的值。
  - computed 只能被該 computed 修改，不能被其他方法修改。例如：this.some_computed_function = 123 就會報錯。
  - computed 的方法必須回傳一個值。
  - computed 方法無法傳入參數
  - computed 依賴更新才會重新執行

    > vue 官方文件
    >
    > 计算属性是基于它们的响应式依赖进行缓存的。只在相关响应式依赖发生改变时它们才会重新求值。

    響應式依賴：在一個 computed 方法中，他所用到在 data 建立的資料，當資料產生變化，此方法就會重新執行和求值。

    ```javascript
    computed:{
        total(){
            return this.price * this.quantity * this.discount
        }
    }
    ```

    total 的依賴就是 this.price, this.quantity, this.discount。只要其中一樣產生變化，就會重新執行 total()，並回傳新的值。

    當 computed 內所有的依賴都沒有發生變化，此 computed 函示就會一直回傳之前儲存起來的值。

    ```javascript
    <div id="app">
      <button @click="num = 1">按我改num</button>
      <p> 用add方法把以下的值由0變1：</p>
      <p> {{ add }} </p>
    </div>
    ```

    ```javascript
    // 當num變成1之後，changeOne()就不會再觸發，而「我有被觸發了！」這句也不會印出來

    import { createApp } from "https://cdnjs.cloudflare.com/ajax/libs/vue/3.0.9/vue.esm-browser.js";
    createApp({
      data() {
        return { num: 0 };
      },
      computed: {
        add() {
          console.log("我有被觸發了！");
          return this.num;
        },
      },
    }).mount("#app");
    ```

    當元件剛建立時(created)時，會打印一次，然後第一次按下按鈕時，會在打印一次，並且 num 會變成 1。
    但第二次之後按下按鈕，就不會再觸發 add() 方法，因為每次按下按鈕，都會將 num 賦值為 1，和之前快取儲存的值相同。

## eventHub 事件中心(vue 2)

在無關聯的組件之間，互相傳遞 data

在需要取得 data 的組件上設置一個監聽器，每次要傳遞 data 時，那個組件就會廣播這個事件並調用這些監聽器。

eventHub 最主要的功能就是**監聽**和**廣播**

若 vue 搭配其他框架時，在 library 新增一個 eventHub.js

```javascript
import Vue from "vue";
const eventHub = new Vue();
export default eventHub;
```

若只有單純 vue 框架，則在頂層組件的 `data` 裡初始化 eventHub，並使用 `provide` 對外傳遞這個 eventHub

```javascript
import Vue from "vue";

export default {
  name: "App",
  components: {
    GrandParent,
  },
  data() {
    return {
      eventHub: new Vue(),
    };
  },
  provide() {
    return {
      eventHub: this.eventHub,
    };
  },
  methods: {
    setRandomValue() {
      this.eventHub.$emit("update:msg", Math.random() * 100);
    },
  },
};
```

在要傳遞 data 的組件裡加入廣播

```javascript
import eventHub from "../library/eventHub";
export default {
  data() {
    return {
      name: "",
    };
  },
  methods: {
    getCategories: function () {
      let id = "";
      axios
        .get(base_url + "/api/category/")
        .then((response) => {
          this.name = response.data.name;
          eventHub.$emit("categoryupdate", this.name);
        })
        .catch(function (error) {
          console.log(error);
        });
    },
  },
  created() {
    this.getCategories();
  },
};
```

接著在需要監聽的組件裡注入這個依賴，並在添加事件監聽。

```javascript
import eventHub from "../library/eventHub";
export default {
  data() {
    return {
      categories: [],
    };
  },
  mounted() {
    eventHub.$on("categoryupdate", this.categoryupdate);
  },
  methods: {
    categoryupdate(input) {
      this.categories.push(input);
    },
  },
};
```

## directive 指令

### 屬性綁定

透過 `v-bind`，進行數據綁定 HTML class

傳遞對象給 v-bind:class，用以動態切換 class

```html
<div v-bind:class="{ active: isActive }"></div>
```

此時 `active` 這個 class 是否存在，將取決於 property `isActive` 的 truthiness(註 1)。

可以在對象中傳入更多屬性，來動態切換多個 class。此外 v-bind:class 也可以與普通的 class attribute 共存

```html
<div
  class="static"
  v-bind:class="{ active: isActive, 'text-danger': hasError }"
></div>
```

data:

```javascript
data: {
  isActive: true,
  hasError: false
}
```

渲染結果

```html
<div class="static active"></div>
```

當 isActive 或 hasError 變化時，class 的屬性會同步更新。

例如：若 hasError 值為 true，class 屬性將變為 "static active text-danger"。

綁定的數據對象，不一定要定義在模板裡

```html
<div v-bind:class="classObject"></div>
```

```javascript
data: {
  classObject: {
    active: true,
    'text-danger': false
  }
}
```

此渲染的結果和上面一樣。

也可以在此綁定 computed 屬性。

```html
<div v-bind:class="classObject"></div>
```

```javascript
data: {
  isActive: true,
  error: null
},
computed: {
  classObject: function () {
    return {
      active: this.isActive && !this.error,
      'text-danger': this.error && this.error.type === 'fatal'
    }
  }
}
```

### 表單綁定 `v-model`

> 當使用 v-model 指令時，表單元素會自動忽略原有的 value, checked 和 selected 屬性，實際的值將以 data 內的狀態為主

#### input

在 input 文字框加入 v-model="message" 屬性之後，此文字框便會自動被綁定 input 事件

```html
<div id="app">
  <input type="text" v-model="message" />
  <p>Message is {{ message }}</p>
</div>

<script>
  const vm = Vue.createApp({
    data() {
      return {
        message: "Hello",
      };
    },
  });
</script>
```

#### textarea 文字方塊

使用方式與 input 完全一樣

```html
<p><span>Multiline message is:</span>{{ message }}</p>

<textarea v-model="message"></textarea>
```

#### radio

```html
<div id="app">
  <div>
    <input type="radio" id="one" value="1" v-model="picked" />
    <label for="one">One</label>
  </div>
  <div>
    <input type="radio" id="two" value="2" v-model="picked" />
    <label for="two">Two</label>
  </div>

  <span>Picked: {{ picked }}</span>
</div>

<script>
  const vm = Vue.createApp({
    data() {
      return {
        picked: 1,
      };
    },
  }).mount("#app");
</script>
```

因為 data 裡的 picked 預設為 1，所以執行時畫面上 `<input type="radio" id="one" value="1">` 會預設為已選擇

#### checkbox

可以當作多選的選項，而當他只有一個的時候，又可以將它做 boolean 的選項

複選時，用法跟前面 radio 完全一樣，因為是複選的關係，其差別在 data 內的狀態必須為陣列

```html
<div id="app">
  <input type="checkbox" id="jack" value="jack" v-model="checkedNames" />
  <label for="jack">jack</label>
  <input type="checkbox" id="john" value="john" v-model="checkedNames" />
  <label for="john">john</label>
  <input type="checkbox" id="mike" value="mike" v-model="checkedNames" />
  <label for="mike">mike</label>
  <input type="checkbox" id="mary" value="mary" v-model="checkedNames" />
  <label for="mary">mary</label>
  <br />
  <p>Checked names: {{ checkedNames }}</p>
</div>

<script>
  const vm = Vue.createApp({
    data() {
      return {
        checkedNames: [],
      };
    },
  }).mount("#app");
</script>
```

- 如果要控制表單的全選或全部取消，只要控制 data 內的 checkedNames 陣列內容即可

當 checkbox 為單選時

```html
<div id="app">
  <input type="checkbox" id="checkbox" v-model="isChecked" />
  <label for="jack">Status: {{ isChecked }}</label>
</div>

<script>
  const vm = Vue.createApp({
    data() {
      return {
        isChecked: true,
      };
    },
  }).mount("#app");
</script>
```

此時， data 內的選項，會變成 true 或 false，當值為 true 時，對應的 checkbox 會被勾起。

#### select 下拉式選單

```html
<div id="app">
  <select v-model="selected">
    <option disabled value="">請選擇</option>
    <option>台北市</option>
    <option>新北市</option>
    <option>基隆市</option>
  </select>

  <p>Selected: {{ selected || '未選擇' }}</p>
</div>

<script>
  const vm = Vue.createApp({
    data() {
      return {
        selected: "",
      };
    },
  }).mount("#app");
</script>
```

v-model 標籤須使用在 `<select>` 標籤，不能用在 `<option>` 標籤中

### v-model 修飾子

#### .lazy

```html
<input v-model.lazy="message" />
```

在 v-model 屬性後面加上.lazy，此輸入框就會從原本的 input 事件，變成監聽 change 事件

也就是，原本 input 事件會在輸入值時做實時的更新，而監聽 change 事件，則是當使用者離開輸入框焦點時才會更新。

### 模板綁定

#### v-text

```html
<div id="app">
  <div v-text="text"></div>
</div>

<script>
  const vm = Vue.createApp({
    data() {
      return {
        text: "hello",
      };
    },
  }).mount("#app");
</script>
```

當透過 v-text 指令來進行綁定，此時畫面渲染出來的結果會與下面相同

```html
<div>{{ text }}</div>
```

但若在 v-text 綁定的標籤內加入文字，以 v-text 指令渲染出來的結果會無視標籤內的內容

```html
<!-- 只會出現 Hello -->
<div v-text="text">World!</div>

<!-- 出現 Hello world! -->
<div>{{ text }} world!</div>
```

#### v-html

和 v-text 類似，但當 data 的內容為 HTML 的語法時，v-html 會將其渲染為 html 語法

```html
<button v-for="(item, index) in data.links">{{ item.label }}</button>
<!--  輸出結果 -->
&laquo; Previous
```

```html
<button v-for="(item, index) in data.links" v-html="item.label"></button>
<!--  輸出結果 -->
<< Previous
```

#### v-once

只渲染指定的節點一次，往後就不再更新

#### v-pre

加入 v-pre 後，就不會解析模板內容。

### 樣式綁定

## 條件渲染

### v-if

其屬性為 truthy，當其返回 true 時會被渲染。

```html
<h1 v-if="awesome">Vue is awesome!</h1>
```

可以添加 `v-else`

```html
<h1 v-if="awesome">Vue is awesome!</h1>
<h1 v-else>It's not true.</h1>
```

還可以添加 `v-else-if`

此三元素需緊跟彼此，否則將不會被識別

### v-show

和 `v-if` 用法類似，不同的是 `v-show` 的元素始終會被渲染並保留在 DOM 中，`v-show` 只是單純的切換元素的 CSS property display。

`v-if` 是真正的條件渲染，他會確保在切換過程中條件內的事件監聽器和子組件適當的被銷毀和重建。

同時 `v-if` 也是惰性的，若在初始渲染時條件為 false，則不執行，直至條件第一次轉為 true 時，才會開始渲染。

相較之下，`v-show` 就比較單純，無論初始條件，元素總是會被渲染，`v-show` 做的只是基於 CSS 進行切換。

## 迴圈渲染

v-for 可以用陣列進行渲染成一個列表。其語法為 item in items，items 為源陣列，而 item 則為被迭代的陣列元素別名。

```html
<ul id="example-1">
  <li v-for="item in items" :key="item.message">{{ item.message }}</li>
</ul>
```

```javascript
var example1 = new Vue({
  el: "#example-1",
  data: {
    items: [{ message: "Foo" }, { message: "Bar" }],
  },
});
```

輸出

```txt
Foo
Bar
```

在 v-for 中可以訪問所有父作用域的 property。v-for 還可加入可選的第二參數作為當前的 key 值。

```html
<ul id="example-2">
  <li v-for="(item, index) in items">
    {{ parentMessage }} - {{ index }} - {{ item.message }}
  </li>
</ul>
```

```javascript
var example2 = new Vue({
  el: "#example-2",
  data: {
    parentMessage: "Parent",
    items: [{ message: "Foo" }, { message: "Bar" }],
  },
});
```

```txt
parent-0-Foo
parent-1-Bar
```

用 v-for 來迭代一個對象的 property

```html
<ul id="v-for-object" class="demo">
  <li v-for="value in object">{{ value }}</li>
</ul>
```

```javascript
new Vue({
  el: "#v-for-object",
  data: {
    object: {
      title: "How to do lists in Vue",
      author: "Jane Doe",
      publishedAt: "2016-04-10",
    },
  },
});
```

```txt
How to do lists in Vue
Jane Doe
2016-04-10
```

可以傳入第二個參數作為 property 的名稱(key 值)

```html
<div v-for="(value, name) in object">{{ name }}: {{ value }}</div>
```

```txt
title: How to do lists in Vue
author: Jane Doe
publishedAt: 2016-04-10
```

還可以傳入第三個參數作為索引值

```html
<div v-for="(value, name, index) in object">
  {{ index }}. {{ name }}: {{ value }}
</div>
```

```txt
0. title: How to do lists in Vue
1. author: Jane Doe
2. **publishedAt**: 2016-04-10
```

## 事件監聽器

> 靜態事件監聽
>
> - 元素上使用 v-on 監聽原生事件
> - 父組件設定 v-on 設定所需要監聽的事件，子組件用 $emit 觸發事件
> - 在 Vue 實體上設定生命週期鉤子，監聽各個鉤子事件。

當要在執行時去動態增減事件的監聽，這時就要用到 $on, $once, and $off 這些 js 函式來做設定。

### 事件通用型修飾子

> 一個事件指令可以加入多個修飾子，而修飾子的順序會影響執行的結果
>
> 如 `@click.prevent.self` 會先執行 `.prevent`，阻擋所有的點擊行為；而 `@click.self.prevent` 會先執行 `.self`，只會阻擋該元素自己的點擊事件。

#### .stop

阻止事件冒泡，同 `event.stopPropagation()`。

```html
<div class="outer" @click="alert('outer')">
  <span>Outer</span>
  <div class="inner" @click.stop="alert('inner')">Inner</div>
</div>
```

在 inner 區塊加上 `.stop`，`click` 事件就不會向外層傳遞。

#### .prevent

阻擋元素的預設行為，同 `event.preventDefault()`。

```html
<a href="#" class="btn" @click.prevent="alert('hello')">click me</a>
```

當然也可以和 `.stop` 一起使用：

```html
<a href="#" class="btn" @click.stop.prevent="alert('hello')">click me</a>
```

#### .capture

用來指定事件已捕獲的形式來觸發。

```html
<div class="outer" @click.capture="alert('outer')">
  <span>outer</span>
  <div class="inner" @click="alert('inner')">inner</div>
</div>
```

當 outer 的點擊事件指定捕獲的修飾子後，在沒有加上捕獲修飾子的 inner 上點擊，會先觸發 inner 的點擊事件在觸發 outer 的點擊事件。

而當 outer 的點擊事件加上捕獲後，則順序相反，點擊 inner 時會先印出 outer 再印出 inner。

#### .self

只會觸發元素自己的事件行為，由子層元素傳遞來的事件則不會觸發。

燈箱範例：在燈箱開啟之後，點擊燈箱外遮罩可以自動關閉燈箱

```vue
<template>
  <div class="modal-mask" :style="modelStyle">
    <div class="modal-container" @click="isShow = false">
      <div class="modal-body">Hello</div>
    </div>
  </div>

  <button @click="isShow = true">Click me</button>
</template>

<script>
export default {
  data() {
    return {
      isShow: false,
    };
  },
  computed: {
    modalStyle() {
      return {
        display: this.isShow ? "" : "none",
      };
    },
  },
  methods: {
    toggleModal() {
      this.isShow = !this.isShow;
    },
  },
};
</script>

<style lang="">
#app {
  display: block;
  overflow: hidden;
  width: 100%;
}

h4 {
  margin: 1rem 0;
  font-size: 1rem;
}

.modal-mask {
  position: absolute;
  z-index: 10;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: table;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
}

.modal-container {
  cursor: pointer;
  display: table-cell;
  vertical-align: middle;
}

.modal-body {
  cursor: auto;
  display: block;
  width: 50%;
  margin: 0 auto;
  padding: 2rem;
  background-color: #fff;
}
</style>
```

上面是一個燈箱的範例。由於 modal-body 的內容區塊在 modal-container 之下，因此當 modal-body 被點擊時，燈箱也會被關閉。

此時，若在 modal-container 的 click 事件加上 `.self` 修飾子，就可以排除這樣的問題。

```html
<div class="modal-mask" :style="modelStyle">
  <div class="modal-container" @click.self="isShow = false">
    <div class="modal-body">Hello</div>
  </div>
</div>

<button @click="isShow = true">Click me</button>
```

#### .once

讓指定的事件只會觸發一次。

```html
<button @click.once="plus">plus once</button>
```

#### .passive

告訴瀏覽器這個事件處理器不會呼叫 `event.preventDefault` 來停止瀏覽器的原生行為。

```html
<div @scroll.passive="onScroll">...</div>
```

此屬性常用來改善 scroll 事件的效能，因為以前的瀏覽器要多判斷 scroll 事件會不會被 preventDefault，加上 passive 屬性之後會直接忽略這個判斷。當 passive 屬性為 true 時，表示此事件不會被 preventDefault。

也就是，passive .prevent 兩修飾子無法同時使用，同時使用時，prevent 會被無視。

## props

### 命名與使用

可以使用 PascalCase 或是 camelCase 的命名方法，但在 html 中必須使用 kebab-case 且應該小寫(html 大小寫不敏感)

像是 PostTitle 、 CartItem 、 TodoItem 等，在 HTML 中使用時就會變成 post-title 、 cart-item 、 todo-item。

```vue
<div id="vm">
<!--post-title 跟 post-content 都是props -->
  <blog-post post-title="Blog1" post-content="I\'m content1"></blog-post>
</div>

<script>
Vue.component("blog-post", {
  props: ["PostTitle", "postContent"],
  template: `<div>
    <h3>{{ PostTitle }}</h3>
    <div>{{ postContent }}</div>
  </div>`,
});
</script>
```

### 傳遞 props 值的方法

#### 傳遞字串

```vue
<blog-post
  post-title="Blog1"
  post-content="I\'m content1"
  post-complete="true"
  post-total-num="500"
  post="{title:'Blog1'}"
>
</blog-post>
```

只要是直接傳遞(靜態傳遞)都是字串，所以 prop 接收的值 log1、I\'m content1、true、500、{...} 等等都是字串。

#### 傳遞數字、布林值、陣列、物件

利用 vue 的 v-bind 傳遞字串以外的值。

```vue
<blog-post
  post-title="動態傳遞"
  post-content="I\'m content1"
  v-bind:post-complete="true"
  v-bind:post-total-num="500"
  v-bind:post="{ title: '動態傳遞' }"
></blog-post>
```

也可以透過給予變數來獲得數字、布林值、陣列或物件等型別

```vue
<blog-post
  :post-title="postTitle"
  :post-content="postContent"
  :post-complete="postComplete"
  :post-total-num="postTotalNum"
  :post="post"
></blog-post>

<script>
const vm = new Vue({
  el: "#vm",
  data: {
    postTitle: "動態傳遞",
    postContent: "I'm content",
    postComplete: true,
    postTotalNum: 500,
    post: { title: "動態傳遞" },
  },
});
</script>
```

### 單向數據流

prop 是為了接收從富組件傳遞過來的資料，而這些資料是單向綁定的，已就是說父模組資料的更新，會影響子模組裡的 prop，但子模組裡 prop 值改變並不會影響父模組。

```vue
<prop-change :counter="counter"></prop-change>
<br />
<span>外 {{counter}}</span>
<button type="button" @click="changeOuterCounter">改變外面數字</button>

<script>
Vue.component("prop-change", {
  props: ["counter"],
  template: `<div>
    <span>component內的  {{counter}}</span>
    <button type="button" @click="changeInnerCounter">改變component數字</button>
  </div>`,
  methods: {
    changeInnerCounter() {
      this.counter += 2;
    },
  },
});

const vm = new Vue({
  el: "#vm",
  data: {
    counter: 1,
  },
  methods: {
    changeOuterCounter() {
      this.counter += 1;
    },
  },
});
</script>
```

以上測試可以得知：

- 外面(父層)的資料 counter 改變會影響子模組 prop 的 counter 的值。
- 子模組 prop 的 counter 值改變僅影響內部 counter 值
- 不論子模組的 prop 的 counter 值是否有變動，只要父模組資料 counter 改變時，子模組 prop 的 counter 值一定會連動。

### 改變子模組內的 prop 值

- 在 data 內創建一個值
  賦予 data 跟 prop 初始值相同的值，且之後也是針對該 data 內的值操作，並且不會再受到該 prop 的影響了

  ```javascript
  Vue.component("one-way-data", {
    props: ["counter"],
    template: `<div>
      <span>component內的  {{newCounter}}</span>
      <button type="button" @click="changeNewCounter">改變component數字</button>
    </div>`,
    data() {
      return {
        newCounter: this.counter,
      };
    },
    methods: {
      changeNewCounter() {
        this.newCounter += 10;
      },
    },
  });
  ```

### 物件型別的 prop 傳遞

- 父層透過標籤傳遞參數

```javascript
<ExLogLineComponent :channel-names="channel_names" :region-id="region.id" :bx-mac="region.bx_mac"></ExLogLineComponent>
```

- 子層 prop 接收參數後，透過 watch 將參數存入 data.return

```javascript
props: ['channelNames', 'regionId', 'bxMac'],
    data() {
        return {
            channel_names: [],
            region_id: '',
            mac: ''
        }
    },
    watch: {
        channelNames(names) {
            this.channel_names = names;
        },
        regionId(id) {
            this.region_id = id;
        },
        bxMac(mac) {
            this.mac = mac;
        }
    },
```

### 子組件接收來自父組件的 props

#### 在模板中

```vue
<template>
  <div>{{ parentData }}</div>
</template>

<script>
export default {
  props: ["parentData"],
};
</script>
```

#### 在 data 中

```vue
<script>
export default {
  props: ["parentData"],
  data() {
    return {
      parent_data: this.parentData,
    };
  },
};
</script>
```

#### 在 methods 中

```vue
<script>
export default {
  props: ["parentData"],
  methods: {
    printParentData: function () {
      console.log(this.$props.parentData);
    },
  },
};
</script>
```

#### 在 mounted 中

```vue
<script>
export default {
  props: ["parentData"],
  mounted() {
    console.log(this.message);
  },
};
</script>
```

#### 在 computed 中

```vue
<template>
  <div>
    <p>{{ parentDataLength }}</p>
  </div>
</template>

<script>
export default {
  props: ["parentData"],
  computed: {
    parentDataLength() {
      return this.parentData.length;
    },
  },
};
</script>
```

## emit 子組件向父組件傳遞參數

```vue
<!-- 子組件 HelloWorld.vue -->
<template>
  <div></div>
</template>

<script>
export default {
  methods: {
    open() {
      console.log("已呼叫");
      // 呼叫父組件方法
      this.$emit("refresh-data");
    },
  },
};
</script>
```

```vue
<!-- 父組件 -->
<template>
  <div id="app">
    <!-- 子組件傳遞的方法 refresh-data -->
    <HelloWorld ref="hello" @refresh-data="getData" />
    <button @click="getHello">取得 HelloWorld 組件中的值</button>
  </div>
</template>

<script>
import HelloWorld from "./components/HelloWorld.vue";

export default {
  components: {
    HelloWorld,
  },
  data() {
    return {};
  },
  methods: {
    getHello() {
      this.$refs.hello.open();
    },
    getData() {
      console.log("111111111");
    },
  },
};
</script>
```

最後輸出時，`已呼叫`為子組件輸出，`111111111111`為父組件輸出

## ref 取得 Dom 元素

> `refs` 是 vue 提供的一個 api，可以讓我們在 vue 中取得 Dom 元素

`ref` 被用來給元素或子組件註冊引用訊息，引用訊息將會註冊在父組件的`$refs` 物件上，如果在普通的 dom 元素上使用，那麼指向的就會是普通的 dom 元素；如果用在子組件上，引用就會指向該子組件的實例。

ref 的特性就是為元素或子組件賦予一個 id 引用，通過 `this.$ref.refName` 來訪問元素或是子組件的實例。

- 一共有三種用法：
  - ref 加在普通元素上，用 `this.ref.name` 獲取到的是 dom 元素
  - ref 加在子組件上，用 `this.ref.name` 方式，獲得的是組件實例，可以使用組件的所有方法。
  - 如何利用 v-for 和 ref 獲取一組陣列或是 dom 節點

### 基本用法：取得 dom 元素

```html
<p ref="p">Hello</p>
<children ref="children"></children>
```

```javascript
this.$ref.p;
this.$ref.children;
```

### 獲取子組件中的 data 和調用子組件的方法

```vue
<!-- 子組件 -->
<template>
  <div>{{ msg }}</div>
</template>

<script>
export default {
  data() {
    return {
      msg: "我是子組件";
    }
  },
  methods: {
    changeMsg() {
      this.mag = "變身";
    }
  }
}
</script>
```

```vue
<!-- 父組件 -->
<template>
  <div @click="parentMethod">
    <children ref="children"></children>
  </div>
</template>

<script>
import children from "components/children.vue";

export default {
  components: {
    children,
  },
  data() {
    return {};
  },
  methods: {
    parentMethod() {
      this.$ref.children; // 返回一個物件
      this.$ref.children.changMsg(); // 呼叫 children 的 changeMsg 方法
    },
  },
};
</script>
```

### this.$refs 介紹

`this.$refs` 為一個物件，持有當前組件中註冊過`ref`特性的所有`dom`元素和子組件實例。

注意：`$refs` 只有在組件完成渲染後才會填充，在初始渲染時無法取得，並且他是非響應式的，因此不能用他模版中做數據綁定。

當 ref 和 v-for 一起用時，你得到的 ref 將會是一個包含了對應的數據源的這些子組件的陣列。

```vue
<template>
  <ul>
    <li v-for="item in people" ref="refContent">{{ item }}</li>
  </ul>
</template>

<script>
export default {
  data: {
    return {
      people:['one', 'two', 'three', 'four', 'five']
    }
  },
  created() {
    this.$nextTick(() => {
      console.log(this.$refs.refContent);
    })
  },
  mounted() {
    console.log(this.$refs.refContent);
  }
};
</script>
```

## this.$el

在 vue 中，this.$el 是一個指向 Vue 實例渲染的一個 dom 元素的引用。用來訪問 vue 實例所渲染的 dom 元素。

在 javascript 中使用 document 時，會進行全域的 dom 操作，而在 vue 中，this.$el 的 dom 作用範圍僅在執行的組件中。

```vue
<template>
  <div>
    <h1>Hello, {{ name }}!</h1>
  </div>
</template>

<script>
export default {
  data() {
    return {
      name: "Vue",
    };
  },
  mounted() {
    console.log(this.$el); // 输出 <div><h1>Hello, Vue!</h1></div>
  },
};
</script>
```

## Mixin 共用方法

> 參考資料：
>
> [彻底搞懂 Vue 中的 Mixin 混入（保姆级教程）](https://juejin.cn/post/7076340796361801759)

將組件的共用邏輯或設定抽出，當組件需要使用時，直接將抽出的部分混入到組件內部。

```js
// src/mixin/index.js
export const index = {
  data() {
    return {
      msg: "msg from mixin",
    };
  },
  computed: {},
  created() {
    console.log("created in mixin");
  },
  mounted() {
    console.log("mounted in mixin");
  },
  methods: {
    clickMe() {
      console.log("click in mixin");
    },
  },
};
```

當 mixin 定義好之後，依據不同的業務場景，可以分為兩種：局部混入和全局混入。顧名思義，局部混入和元件的載入有點類似，就是當需要使用到 mixin 的程式碼時，在元件中引入。而全局混入則將 mixin 於 app.js 中引入，此時專案中任何元件都可以使用 mixin。

### 局部混入

在 component 中引入 mixin：

```vue
// src/App.vue
<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <button @click="clickMe">button</button>
  </div>
</template>

<script>
import { mixins } from "./mixin/index";
export default {
  name: "App",
  mixins: [mixins],
  created() {
    console.log("component call mixin data: ", this.msg);
  },
  mounted() {
    console.log("mounted in component");
  },
};
</script>
```

輸出：

```text
created in mixin
component call mixin data: msg from mixin
mounted in mixin
mounted in component
click in mixin
```

- mixin 的生命週期函數會和元件的生命週期一起合併執行
- 元件可以使用 mixin 中的 data 資料
- 元件中可以直接呼叫 mixin 中的方法
- 生命週期的執行順序為：先執行 mixin 再執行 component

若多個元件都有引入 mixin，當期中一個元件修改了 mixin 的資料，會影響其他元件嗎？

```vue
// src/component/demo.vue
<template>
  <button @click="demoShowMsg">demo button</button>
</template>
<script>
import { mixins } from "../mixin/index";
export default {
  mixins: [mixins],
  methods: {
    demoShowMsg() {
      console.log("msg in demo: ", this.msg);
    },
  },
};
</script>
```

在 App.vue 中引入

```vue
// src/App.vue
<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <button @click="clickMe">button</button>
    <button @click="changeMsg">edit mixin data</button>
    <demo></demo>
  </div>
</template>

<script>
import { mixins } from "./mixin/index";
import demo from "./components/demo.vue";
export default {
  name: "App",
  mixins: [mixins],
  components: { demo },
  created() {
    console.log("component call mixin data: ", this.msg);
  },
  mounted() {
    console.log("mounted in component");
  },
  methods: {
    changeMsg() {
      this.msg = "new message";
      console.log("new msg:", this.msg);
    },
  },
};
</script>
```

輸出：

```text
created in mixin
component call mixin data: msg from mixin
created in mixin
mounted in mixin
mounted in mixin
mounted in component
new msg in App: new message
msg in demo: msg from mixin
```

由上面程式碼可以得知，當 App.vue 中修改 msg 後，demo 元件並沒有受到任何變化。

### 全域混入

將 mixin 在 main.js 中註冊後，便可以在任何元件中直接使用。

```js
// main.js
import Vue from "vue";
import App from "./App.vue";
import { mixins } from "./mixin/index";
Vue.mixin(mixins);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount("#app");
```

此時若將前面的 App.vue 中引入 mixin 的部分註解掉，會發現效果和局部混入沒有任何差別。

```vue
// src/App.vue
<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <button @click="clickMe">button</button>
    <button @click="changeMsg">edit mixin data</button>
    <demo></demo>
  </div>
</template>

<script>
// import { mixins } from "./mixin/index";
import demo from "./components/demo.vue";
export default {
  name: "App",
  // mixins: [mixins],
  components: { demo },
  created() {
    console.log("component call mixin data: ", this.msg);
  },
  mounted() {
    console.log("mounted in component");
  },
  methods: {
    changeMsg() {
      this.msg = "new message";
      console.log("new msg:", this.msg);
    },
  },
};
</script>
```

雖然這樣做很方便，但是一般而言不推薦。

vue 官方：

> 請謹慎使用全域混入，因為他會影響每個獨立建立的 Vue 實例（包括第三方元件）。大多數情況下，只應應用於自訂選項，推薦將其作為插件發布，以避免重複應用程式混入。

### vuex 和 mixin 的區別

- vuex: 用來做狀態管理，裡面定義的變數在不同元件中均可以使用和修改。而在任一元件中修改此變數的值後，其他元件中此變數的值也會隨之修改。
- mixin: 可以定義共用的變數，在每個組件之中使用。引入組件後，每個變數都是獨立的，值的修改在組件中不會互相影響。

## 備註

### Truthy(真值) 與 Falsy(假值)

- `Truthy`：真值，只要是假值(false, 0, -0, 0n, "", null, undefined, NaN)以外的任何值皆為 true
- `Falsy`：假值

### 判斷當前環境是否為開發環境

```javascript
if (process.env.NODE_ENV !== "production") {
  this.is_dev = true;
} else {
  this.is_dev = false;
}
```

### 取得 base_url

- 在 html 加入 meta 標籤

  ```html
  <head>
    <meta name="base-url" content="{{ url('/') }}" />
  </head>
  ```

- 此時就可以透過 meta 標籤取得 base_url

  ```javascript
  window.base_url = document.head.querySelector('meta[name="base-url"]');
  ```
