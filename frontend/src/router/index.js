import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import BuddhaPage from '../pages/BuddhaPage.vue'
import AncestorPage from '../pages/AncestorPage.vue'
import AncestorsPage from '../pages/AncestorsPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/buddha/:slug', component: BuddhaPage },
    { path: '/ancestor/:slug', component: AncestorPage },
    { path: '/ancestors', component: AncestorsPage }
  ],
  scrollBehavior: () => ({ top: 0 })
})