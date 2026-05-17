import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('../pages/Home.vue')
const BuddhaPage = () => import('../pages/BuddhaPage.vue')
const AncestorPage = () => import('../pages/AncestorPage.vue')
const AncestorsPage = () => import('../pages/AncestorsPage.vue')
const GuidePage = () => import('../pages/GuidePage.vue')
const TopicPage = () => import('../pages/TopicPage.vue')

export default createRouter({
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
  scrollBehavior: () => ({ top: 0 })
})
