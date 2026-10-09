import { createRouter, createWebHistory } from 'vue-router'
import { warmApi } from '../api.js'
import { HANT_PREFIX, isHantPath, stripHant, toHant } from '../i18n/hant.js'

const Home = () => import('../pages/Home.vue')
const BuddhaPage = () => import('../pages/BuddhaPage.vue')
const AncestorPage = () => import('../pages/AncestorPage.vue')
const AncestorsPage = () => import('../pages/AncestorsPage.vue')
const GuidePage = () => import('../pages/GuidePage.vue')
const TopicPage = () => import('../pages/TopicPage.vue')
const NianfoPage = () => import('../pages/NianfoPage.vue')
const QiucaiPage = () => import('../pages/QiucaiPage.vue')
const NotFoundPage = () => import('../pages/NotFoundPage.vue')

function withTrailingSlashTarget(target) {
  if (typeof target === 'string') {
    if (!target || target === '/' || target.startsWith('http')) return target
    const match = target.match(/^([^?#]+)(.*)$/)
    if (!match) return target
    const [, path, suffix] = match
    if (path === '/' || path.endsWith('/')) return target
    return `${path}/${suffix}`
  }

  if (target && typeof target === 'object' && 'path' in target && typeof target.path === 'string') {
    if (!target.path || target.path === '/' || target.path.endsWith('/')) return target
    return { ...target, path: `${target.path}/` }
  }

  return target
}

const PAGE_ROUTES = [
    { path: '/', component: Home },
    { path: '/guide/:slug', component: GuidePage },
    { path: '/topic/:slug', component: TopicPage },
    { path: '/rituals/:slug', component: TopicPage },
    { path: '/prayers/:slug', component: TopicPage },
    { path: '/texts/:slug', component: TopicPage },
    { path: '/buddha/:slug', component: BuddhaPage },
    { path: '/ancestor/:slug', component: AncestorPage },
    { path: '/ancestors', component: AncestorsPage },
    { path: '/nianfo', component: NianfoPage },
    { path: '/qiucai', component: QiucaiPage },
]

// 繁体版：每个页面在 /zh-hant 下各有一份，组件相同，文字在显示时转换
const HANT_ROUTES = PAGE_ROUTES.map((route) => ({
  ...route,
  path: route.path === '/' ? `${HANT_PREFIX}/` : `${HANT_PREFIX}${route.path}`,
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...PAGE_ROUTES,
    ...HANT_ROUTES,
    { path: '/:pathMatch(.*)*', component: NotFoundPage },
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
  },
})

const originalResolve = router.resolve.bind(router)
router.resolve = ((to, currentLocation) =>
  originalResolve(withTrailingSlashTarget(to), currentLocation))

const originalPush = router.push.bind(router)
router.push = ((to) => originalPush(withTrailingSlashTarget(to)))

const originalReplace = router.replace.bind(router)
router.replace = ((to) => originalReplace(withTrailingSlashTarget(to)))

const WARMUP_ROUTES = ['/buddha/', '/ancestor/', '/ancestors/']
router.beforeEach((to, from) => {
  if (WARMUP_ROUTES.some((p) => stripHant(to.path).startsWith(p))) {
    warmApi()
  }
  // 在繁体页面里点站内链接，留在繁体版
  if (isHantPath(from.path) && !isHantPath(to.path)) {
    return toHant(to.fullPath)
  }
})

export default router
