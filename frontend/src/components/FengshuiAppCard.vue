<script setup>
// 「九宫风水」App 下载卡片：财神方位页、入宅吉日页用。文案见 data/fengshuiApp.js（预渲染也用同一份）。
// App 只有简体界面，繁体页（/zh-hant/）不显示。样式在 style.css（.app-card），预渲染的 HTML 也用得上。
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FENGSHUI_APP, fengshuiAppCopy } from '../data/fengshuiApp.js'
import { isHantPath } from '../i18n/hant.js'
import { track } from '../utils/analytics.js'

const props = defineProps({
  kind: { type: String, default: 'fangwei' },
  direction: { type: String, default: '' },
})

const route = useRoute()
const show = computed(() => !isHantPath(route.path))
const copy = computed(() => fengshuiAppCopy(props.kind, props.direction))

function onClick() {
  track('app_store_click', { app: 'fengshui', page: window.location.pathname })
}
</script>

<template>
  <aside v-if="show" class="app-card" aria-label="九宫风水 App">
    <p class="app-card-title">{{ copy.title }}</p>
    <p class="app-card-text">{{ copy.text }}</p>
    <a class="app-card-btn" :href="FENGSHUI_APP.url" target="_blank" rel="noopener" @click="onClick">{{ FENGSHUI_APP.button }}</a>
  </aside>
</template>
