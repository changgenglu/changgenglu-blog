import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import Markdown from 'vue3-markdown-it';
import 'highlight.js/styles/monokai.css';

createApp(App).use(store).use(router).use(Markdown).mount("#app");
