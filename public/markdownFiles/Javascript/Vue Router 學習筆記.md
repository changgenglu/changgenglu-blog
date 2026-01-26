# Vue Router

> 過去大多以靜態網頁為主，所有資料都是從伺服器輸出，隨著時間與技術推進，前端在網頁的領域越來越吃重，漸漸的原本由後端伺服器控制路由改為前端接手
>
> 參考資料：
>
> [重新認識 Vue.js 4-1 Vue Router 與前後端路由](https://book.vue.tw/CH4/4-1-vue-router-intro.html)

## 由前端接手的路由

以 laravel 為例，首先要將所有的入口都指向同一個頁面，在由此頁面渲染 Vue.js

```php
// routes/web.php
Route::get('/{any}', 'SinglePageController@index')->where('any', '.*');
```

接著在 SinglePageController 將 index 指向 app:

```php
// app/Http/controllers/SinglePageController.php
class SinglePageController extend Controller
{
  public function index() {
    return view('app');
  }
}
```

最後在 /resource/views/app.blade.php 新增 <div id='app'>...</div> 以及 <script src='{{ mix('js/app.js') }}'></script> 將 Vue.js 以及前端程式的進入點，引入到網頁上。

```html
<!-- \\ resources\views\app.blade.php -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Vue SPA Demo</title>
  </head>
  <body>
    <div id="app">
      <app></app>
    </div>
    <script src="{{ mix('js/app.js') }}"></script>
  </body>
</html>
```

## 基本應用

在網頁中加入 <router-view></router-view> 當作 Route 的進入點，並使用 <router-link> 來產生對應的連結：

```html
<div id="app">
  <h1>Hello Vue Router App!</h1>

  <p>
    <!-- router-link 在經過編譯後會變成 <a> 標籤 -->
    <!-- 使用 to 屬性來處理目標 URL -->
    <router-link to="/">Go to Home</router-link>
    <router-link to="/about">Go to About</router-link>
  </p>

  <!-- 渲染 route 的位置 -->
  <router-view></router-view>
</div>
```

在 app.js 中定義 route

```js
// 定義兩個 route 元件，分別是 Home 與 About
const Home = { template: "<div>Home</div>" };
const About = { template: "<div>About</div>" };

// 指定 URL 與對應的元件
const routes = [
  { path: "/", component: Home },
  { path: "/about", component: About },
];

// 建立 VueRouter 實體物件
const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: routes,
});

// 建立 Vue 實體元件
const app = Vue.createApp({});

// 透過 app.use(router) 使 app 的所有子元件
// 都能存取 this.$router 與 this.$route
app.use(router);

// 掛載 Vue.js 實體至 DOM
app.mount("#app");
```

若使用 Vue CLI，可以新增 route.js 檔案

```js
// route.js
import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import About from "./views/About.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/about", component: About },
  ],
});
```

接著在 main.js 透過 .use(router) 加入至 app 中：

```js
// main.js
import { createApp } from "vue";
import App from "./App.vue";
import { route } from "./route";

const app = createApp(App).use(route);
app.mount("#app");
```

## history 路由設定

v3 以前為 mode，v4 開始改為 history。Vue Router 處理前端路由的不同方式，分別是 Hash Mode 以及 HTML5 (History API) Mode 兩種。

### Hash 模式

在 HTML5 的 History API 還沒出現之前，想要控制 URL 又不能換頁，只能透過 URL hash，也就是 #。此一符號在網頁中代表「錨點」的含義。# 後面接的是個網頁的某個位置。

`https://book.vue.tw/#app`

以上面這個網址為例，如果網頁中有某個節點的 `id='app'` 像是 <div id='app'></div>，那麼當這個連結被開啟時，瀏覽器就會自動把位置捲到此錨點位置。

而在同一個頁面中，若只是改變了 # 後面的文字，不會讓整個頁面刷新，而當 URL Hash 被更新時，同時也會增加一筆記錄到瀏覽器的瀏覽歷史裡，也就是說，透過瀏覽器 `上一頁`、`下一頁`來切換不同 # 的位置，不會引發頁面重新刷新。

於是可以透過 Ajax 搭配 hashchange 事件，去監聽 URL Hash 的狀態來決定目前顯示的內容，此為早期前端路由的解決方案。

在 vue Router 中，只要將 hitory 設定為 createWebHashHistory() 即可開啟 Hash Mode

```js
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    //...
  ],
})
```

而 createWebHashHistory() 預設路徑為 location.pathname 或 / 根目錄，若想額外處理則可以裡面加上路徑的字串，像是 createWebHashHistory('/folder/')，對應的就是 https://example.com/folder/#

Hash Mode 的優點是無須調整後端設定，甚至 file:// 開頭的檔案協定，直接開啟網頁也可以順利運作。不過這種作法也有缺點，搜尋引擎在收錄頁面的時候，會自動忽略 URL 裡面帶有 # 符號的部分，因此不利於網站的 SEO。

### HTML5 (history API) 模式

