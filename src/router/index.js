import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
// import AllMyArticle from '../assets/fileNames.json'

// const ArticleRoute = AllMyArticle.map(item => ({
//   path: `/articles/${item}`,
//   name: item,
//   component: () => import(`../../public/static/markdowns/${item}`)
// }) );

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/category/:categoryName",
    name: "CategoryList",
    component: () => import("../views/CategoryListView.vue"),
  },
  {
    path: "/:title(.*)",
    name: "Markdown",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/MarkdownComponent.vue"),
  },
  // ...AllMyArticle
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
  // 上一頁回到離開時的捲動位置；首頁打字搜尋、翻頁、選分類只換 query，不該跳回頁首
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (typeof to.path === 'string' && to.path === from.path) return false;
    return { top: 0 };
  },
});

export default router;
