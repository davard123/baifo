<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AudioPlayer from './components/AudioPlayer.vue'
import NianfoDrawer from './components/NianfoDrawer.vue'
import { warmApi } from './api.js'
import { canonicalUrl, getSeoByPath, SITE } from '../scripts/seo.config.js'
import { isHantPath, stripHant, toHant, startHant, loadConverter } from './i18n/hant.js'

const route = useRoute()

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      element.setAttribute(key, value)
    }
  })
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('link')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      element.setAttribute(key, value)
    }
  })
}

function normalizePath(path) {
  if (!path) return '/'
  return path === '/' ? '/' : path.replace(/\/+$/, '')
}

function hantUrl(url) {
  return url.replace(SITE.baseUrl, `${SITE.baseUrl}${toHant('/').replace(/\/$/, '')}`)
}

async function applyRouteSeo(fullPath) {
  const hant = isHantPath(fullPath)
  const path = stripHant(fullPath)
  const page = getSeoByPath(path)
  const isKnownPage = !!page
  const normalizedPath = normalizePath(path)
  const convert = hant ? await loadConverter() : (text) => text
  const title = convert(page?.title || `页面未找到 | ${SITE.baseUrl.replace(/^https?:\/\//, '')}`)
  const description = convert(page?.description || '这个地址当前没有对应内容。')
  const image = page?.image ? `${SITE.baseUrl}${page.image}` : `${SITE.baseUrl}${SITE.defaultImage}`
  const hansCanonical = isKnownPage ? canonicalUrl(page.path) : `${SITE.baseUrl}${normalizedPath}`
  const canonical = hant ? hantUrl(hansCanonical) : hansCanonical
  const schema = Array.isArray(page?.schema) ? JSON.parse(convert(JSON.stringify(page.schema))) : []

  document.documentElement.lang = hant ? 'zh-Hant' : 'zh-CN'
  if (isKnownPage) {
    upsertLink('link[rel="alternate"][hreflang="zh-Hans"]', { rel: 'alternate', hreflang: 'zh-Hans', href: hansCanonical })
    upsertLink('link[rel="alternate"][hreflang="zh-Hant"]', { rel: 'alternate', hreflang: 'zh-Hant', href: hantUrl(hansCanonical) })
    upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: hansCanonical })
  }

  document.title = title

  upsertMeta('meta[name="description"]', { name: 'description', content: description })
  upsertMeta('meta[name="robots"]', {
    name: 'robots',
    content: isKnownPage
      ? 'index,follow,max-image-preview:large,max-snippet:300,max-video-preview:-1'
      : 'noindex,follow,max-image-preview:large,max-snippet:300,max-video-preview:-1',
  })
  upsertMeta('meta[name="keywords"]', { name: 'keywords', content: SITE.keywords.join(', ') })
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image })
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE.shortName })
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image })
  upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonical })

  let schemaScript = document.head.querySelector('#ld-webpage')

  if (!schemaScript) {
    schemaScript = document.createElement('script')
    schemaScript.id = 'ld-webpage'
    schemaScript.type = 'application/ld+json'
    document.head.appendChild(schemaScript)
  }

  schemaScript.textContent = JSON.stringify(schema)
}

watch(
  () => route.path,
  (path) => {
    applyRouteSeo(path)
    if (isHantPath(path)) startHant()
    // 拜佛 / 祭祀 / 求财页：悬浮按钮移到左上角，避免挡住右下方跪拜的人、供养面板和财神选择栏
    document.documentElement.classList.toggle('ritual-route', /^\/(buddha|ancestor|qiucai)(\/|$)/.test(stripHant(path)))
  },
  { immediate: true }
)

// 页面底部的简繁切换（普通 <a>，整页刷新切换，不受繁体链接改写影响）
const isHant = computed(() => isHantPath(route.path))
const hansHref = computed(() => stripHant(route.path))
const hantHref = computed(() => toHant(route.path))
const showSwitch = computed(() => !/^\/(buddha|ancestor)\//.test(stripHant(route.path)))

onMounted(() => {
  warmApi()
})
</script>

<template>
  <router-view />
  <p v-if="showSwitch" class="script-switch" data-keep-script>
    <a v-if="isHant" :href="hansHref" hreflang="zh-Hans" lang="zh-Hans">简体中文</a>
    <a v-else :href="hantHref" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>
  </p>
  <AudioPlayer />
  <NianfoDrawer />
</template>

<style>
#app { min-height: 100vh; }
.script-switch {
  text-align: center;
  margin: 0 auto 72px;
  font-size: 0.9rem;
}
.script-switch a { color: var(--text-muted); text-decoration: underline; text-underline-offset: 3px; }
.hidden-figure {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  left: 0;
  bottom: 0;
  pointer-events: none;
}
.site-disclaimer {
  max-width: 980px;
  margin: 0 auto 96px;
  padding: 0 20px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.8;
  text-align: center;
}
.site-disclaimer p {
  padding: 16px 18px;
  border: 1px solid rgba(242, 200, 121, 0.14);
  border-radius: 14px;
  background: rgba(27, 18, 35, 0.62);
}
@media (max-width: 600px) {
  .site-disclaimer {
    margin-bottom: 88px;
    padding: 0 12px;
    font-size: 0.78rem;
  }
}
</style>
