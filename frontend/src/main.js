import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router, { disposeRouterRecovery } from './router/index.js'
import { routeRecovery } from './recovery/index.js'
import { warmApi } from './api.js'

// App 启动立即预热后端，避免首次提交冷启动卡顿
warmApi()

const app = createApp(App)
app.provide('routeRecovery', routeRecovery)
app.use(router)
app.mount('#app')
export function disposeApplication() {
  app.unmount()
  disposeRouterRecovery()
}
if (import.meta.hot) import.meta.hot.dispose(disposeApplication)
