import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.js'
import { warmApi } from './api.js'

// App 启动立即预热后端，避免首次提交冷启动卡顿
warmApi()

createApp(App).use(router).mount('#app')
