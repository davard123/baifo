<script setup>
// 「九宫风水」App 下载横条：财神方位页、入宅吉日页的标题下面用。文案见 data/fengshuiApp.js（预渲染也用同一份）。
// App 只有简体界面，繁体页（/zh-hant/）不显示。样式在 style.css（.app-bar），预渲染的 HTML 也用得上。
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { APPLE_LOGO_PATH, FENGSHUI_APP, fengshuiAppText } from '../data/fengshuiApp.js'
import { isHantPath } from '../i18n/hant.js'
import { track } from '../utils/analytics.js'

const props = defineProps({
  kind: { type: String, default: 'fangwei' },
  direction: { type: String, default: '' },
})

const route = useRoute()
const show = computed(() => !isHantPath(route.path))
const text = computed(() => fengshuiAppText(props.kind, props.direction))

function onClick() {
  track('app_store_click', { app: 'fengshui', page: window.location.pathname })
}
</script>

<template>
  <a
    v-if="show"
    class="app-bar"
    :href="FENGSHUI_APP.url"
    target="_blank"
    rel="noopener"
    aria-label="九宫风水 App，到 App Store 下载"
    @click="onClick"
  >
    <img class="app-bar-icon" :src="FENGSHUI_APP.icon" width="44" height="44" :alt="FENGSHUI_APP.iconAlt" />
    <span class="app-bar-text">{{ text }}</span>
    <span class="app-bar-btn"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" :d="APPLE_LOGO_PATH" /></svg>{{ FENGSHUI_APP.button }}</span>
  </a>
</template>
