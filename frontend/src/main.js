import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router, { disposeRouterRecovery } from './router/index.js'
import { routeRecovery } from './recovery/index.js'
import { warmApi } from './api.js'
import { initAnalytics } from './utils/analytics.js'
import { autoHantTarget, rememberScript } from './i18n/hant.js'

// 分析只在这里同步建立本地队列，真正的第三方脚本在 analytics.js 里延后加载；
// 后端预热等页面资源完成后再放到空闲队列，同时保留用户首次悬停/触摸导航时
// 由页面主动预热的路径。
function scheduleNonCritical(task) {
  const runWhenIdle = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(task, { timeout: 2000 })
    } else {
      window.setTimeout(task, 0)
    }
  }

  if (document.readyState === 'complete') {
    runWhenIdle()
  } else {
    window.addEventListener('load', runWhenIdle, { once: true })
  }
}

initAnalytics()
scheduleNonCritical(warmApi)

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
