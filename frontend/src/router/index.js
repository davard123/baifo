import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import BuddhaPage from '../pages/BuddhaPage.vue'
import AncestorPage from '../pages/AncestorPage.vue'
import AncestorsPage from '../pages/AncestorsPage.vue'
import GuidePage from '../pages/GuidePage.vue'
import TopicPage from '../pages/TopicPage.vue'

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
