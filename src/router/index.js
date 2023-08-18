import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
// import AllMyArticle from '../assets/fileNames.json'

// const ArticleRoute = AllMyArticle.map(item => ({
//   path: `/articles/${item}`,
//   name: item,
//   component: () => import(`../../public/static/markdowns/${item}`)
// }) );

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/:title',
    name: "Markdown",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/MarkdownComponent.vue')
  },
  // ...AllMyArticle
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
