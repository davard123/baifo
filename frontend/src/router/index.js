import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import BuddhaPage from '../pages/BuddhaPage.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/buddha/:slug', component: BuddhaPage }
  ],
  scrollBehavior: () => ({ top: 0 })
})
