<script setup>
import { onMounted, ref, watch } from 'vue'
import { fetchStats, fetchWall, statsVersion } from '../utils/localRecords.js'

// 公开心愿墙：只显示访客自己选择"公开到心愿墙"的心愿，名字已在服务器端打码。
const props = defineProps({
  kind: { type: String, default: '' },
  title: { type: String, default: '心愿墙' },
  sub: { type: String, default: '' },
  limit: { type: Number, default: 30 },
  refreshKey: { type: Number, default: 0 },
})

const KIND_LABEL = { buddha: '礼佛', caishen: '求财', blessing: '祈福', ancestor: '追思' }
const items = ref([])
const loading = ref(true)
const failed = ref(false)
// 真实累计数字（来自数据库计数，不含任何内容）
const total = ref(0)

function tagOf(item) {
  return [item.deity, item.topic].filter(Boolean).join(' · ') || KIND_LABEL[item.kind] || ''
}

function dateOf(value) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}月${d.getDate()}日`
}

async function load() {
  loading.value = true
  failed.value = false
  try {
    items.value = await fetchWall(props.kind, props.limit)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

function loadTotal(fresh = false) {
  fetchStats({ fresh })
    .then((d) => { total.value = (d.wishes || 0) + (d.ancestor || 0) + (d.public || 0) + (d.local || 0) })
    .catch(() => {})
}

onMounted(() => {
  load()
  loadTotal()
})
watch(() => props.refreshKey, load)
// 刚提交完：计数请求可能还在路上，稍等一下再绕过缓存重取。
watch(statsVersion, () => setTimeout(() => loadTotal(true), 1500))
</script>

<template>
  <section class="public-wall card" :aria-label="title">
    <h2 class="public-wall__title">{{ title }}</h2>
    <p v-if="total" class="public-wall__count">本站已累计 <strong>{{ total.toLocaleString('zh-CN') }}</strong> 人次在这里礼佛、祈福、追思先人</p>
    <p v-if="sub" class="public-wall__sub">{{ sub }}</p>
    <p v-if="loading" class="public-wall__empty">正在打开心愿墙…</p>
    <p v-else-if="failed" class="public-wall__empty">心愿墙暂时打不开，请稍后刷新。</p>
    <p v-else-if="!items.length" class="public-wall__empty">还没有人公开心愿。提交时选择“公开到心愿墙”，你的心愿会出现在这里。</p>
    <ul v-else class="public-wall__list">
      <li v-for="item in items" :key="item.id" class="public-wall__item">
        <div class="public-wall__meta">
          <strong>{{ item.name }}</strong>
          <span class="public-wall__tag">{{ tagOf(item) }}</span>
          <span class="public-wall__date">{{ dateOf(item.created_at) }}</span>
        </div>
        <p class="public-wall__wish">{{ item.wish }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* 自带浅色纸面配色：首页、求财页底色不同，统一用高对比度，避免深底深字看不清。 */
.public-wall { display: grid; gap: 10px; background: #fffaf2; color: #392b24; border: 1px solid rgba(122, 86, 51, .18); }
.public-wall__title { font-size: 22px; color: #8a1c1c; margin: 0; }
.public-wall__count { margin: 0; font-size: 15px; color: #392b24; }
.public-wall__count strong { color: #a5641a; font-size: 18px; }
.public-wall__sub, .public-wall__empty { margin: 0; font-size: 14px; line-height: 1.7; color: #6b5a4c; }
.public-wall__list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.public-wall__item { padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(165, 100, 26, .22); background: #fff3df; min-width: 0; }
.public-wall__meta { display: flex; flex-wrap: wrap; gap: 6px 10px; align-items: baseline; font-size: 13px; color: #392b24; }
.public-wall__tag { color: #a5641a; }
.public-wall__date { margin-left: auto; color: #8a7764; font-size: 12px; }
.public-wall__wish { margin: 6px 0 0; font-size: 15px; line-height: 1.75; color: #2f241e; overflow-wrap: anywhere; white-space: pre-line; }
</style>
