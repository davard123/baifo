import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router, { disposeRouterRecovery } from './router/index.js'
import { routeRecovery } from './recovery/index.js'
import { warmApi } from './api.js'
import { initAnalytics } from './utils/analytics.js'
import { autoHantTarget, rememberScript } from './i18n/hant.js'

// App 启动立即预热后端，避免首次提交冷启动卡顿
warmApi()
initAnalytics()

// 读繁体的访客（浏览器语言是台湾、香港、澳门，或之前选过繁體中文）打开简体网址时，直接换到繁体版
const hantTarget = autoHantTarget(
  window.location,
  navigator.languages?.length ? navigator.languages : [navigator.language].filter(Boolean),
  undefined,
  { userAgent: navigator.userAgent },
)
// 手动点了简繁切换，就记住这个选择，以后不再自动换
document.addEventListener('click', (event) => {
  const link = event.target instanceof Element ? event.target.closest('a') : null
  const text = link ? link.textContent.trim() : ''
  if (text === '简体中文' || text === '簡體中文') rememberScript('hans')
  else if (text === '繁體中文') rememberScript('hant')
}, true)

const app = createApp(App)
app.provide('routeRecovery', routeRecovery)
app.use(router)
if (hantTarget) window.location.replace(hantTarget)
else app.mount('#app')
export function disposeApplication() {
  app.unmount()
  disposeRouterRecovery()
}
if (import.meta.hot) import.meta.hot.dispose(disposeApplication)
