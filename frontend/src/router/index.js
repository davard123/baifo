import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import BuddhaPage from '../pages/BuddhaPage.vue'
import AncestorPage from '../pages/AncestorPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/buddha/:slug', component: BuddhaPage },
    { path: '/ancestor/:slug', component: AncestorPage }
  ],
  scrollBehavior: () => ({ top: 0 })
})