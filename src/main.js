import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "bootstrap/dist/css/bootstrap.min.css";
import Markdown from "vue3-markdown-it";
import "highlight.js/styles/monokai.css";
import "./assets/styles/theme.css";
import "./assets/styles/patterns.css";

createApp(App).use(store).use(router).use(Markdown).mount("#app");

// 首次繪製後才開啟色彩過渡，避免載入時整頁色彩動畫
requestAnimationFrame(() => document.documentElement.setAttribute("data-theme-ready", ""));
