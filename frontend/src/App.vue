<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import AudioPlayer from './components/AudioPlayer.vue'
import { getSeoByPath, SITE } from '../scripts/seo.config.js'

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

function applyRouteSeo(path) {
  const page = getSeoByPath(path)
  const title = page?.title || SITE.name
  const description = page?.description || ''
  const image = page?.image ? `${SITE.baseUrl}${page.image}` : `${SITE.baseUrl}${SITE.defaultImage}`
  const canonical = `${SITE.baseUrl}${page?.path || path || '/'}`
  const schema = Array.isArray(page?.schema) ? page.schema : []

  document.title = title

  upsertMeta('meta[name="description"]', { name: 'description', content: description })
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
  (path) => applyRouteSeo(path),
  { immediate: true }
)
</script>

<template>
  <img src="/music/7-25-100%20(1).jpg" aria-hidden="true" class="hidden-figure" />
  <img src="/devotee.png" aria-hidden="true" class="hidden-figure" />
  <router-view />
  <section class="site-disclaimer" aria-label="网站说明">
    <p>
      本站提供在线礼佛、祈愿、供养、回向与祭祖追思内容，旨在帮助用户静心、发愿、纪念与了解相关佛教文化。
      祈愿不构成对现实结果的保证，也不能替代医疗、心理、法律、财务或紧急专业帮助。
    </p>
  </section>
  <AudioPlayer />
</template>

<style>
#app { min-height: 100vh; }
.hidden-figure {
  position: fixed;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.site-disclaimer {
  max-width: 980px;
  margin: 0 auto 96px;
  padding: 0 20px;
  color: rgba(103, 83, 60, 0.78);
  font-size: 0.82rem;
  line-height: 1.8;
  text-align: center;
}
.site-disclaimer p {
  padding: 16px 18px;
  border: 1px solid rgba(212, 168, 67, 0.16);
  border-radius: 14px;
  background: rgba(255, 251, 242, 0.62);
}
@media (max-width: 600px) {
  .site-disclaimer {
    margin-bottom: 88px;
    padding: 0 12px;
    font-size: 0.78rem;
  }
}
</style>
