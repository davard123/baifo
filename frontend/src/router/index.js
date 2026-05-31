import { createRouter, createWebHistory } from 'vue-router'
import { warmApi } from '../api.js'

const Home = () => import('../pages/Home.vue')
const BuddhaPage = () => import('../pages/BuddhaPage.vue')
const AncestorPage = () => import('../pages/AncestorPage.vue')
const AncestorsPage = () => import('../pages/AncestorsPage.vue')
const GuidePage = () => import('../pages/GuidePage.vue')
const TopicPage = () => import('../pages/TopicPage.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/guide/:slug', component: GuidePage },
    { path: '/topic/:slug', component: TopicPage },
    { path: '/rituals/:slug', component: TopicPage },
    { path: '/prayers/:slug', component: TopicPage },
    { path: '/texts/:slug', component: TopicPage },
    { path: '/buddha/:slug', component: BuddhaPage },
    { path: '/ancestor/:slug', component: AncestorPage },
    { path: '/ancestors', component: AncestorsPage }
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 24,
      }
    }

    return { top: 0 }
  }
})

// 进入任何可能提交记录的页面前再次预热（即使用户直接打开 /buddha/* 也覆盖）
const WARMUP_ROUTES = ['/buddha/', '/ancestor/', '/ancestors']
router.beforeEach((to) => {
  if (WARMUP_ROUTES.some((p) => to.path.startsWith(p))) {
    warmApi()
  }
})

export default router
