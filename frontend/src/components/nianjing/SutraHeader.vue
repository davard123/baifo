<script setup>
// 经题块：经题、品名（可选）、译者、校对来源。都标拼音（来源行不标）；不可点、不随念诵变色，不参与语音跟读。
// 经题里以空格分开的每一块不从中间断开；窄屏放不下一块时，这一行的字号自动缩小。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { labelTokens } from '../../data/nianjing.js'

const props = defineProps({
  header: { type: Object, required: true },
  note: { type: String, default: '' },
})
const root = ref(null)

function chunks(tokens) {
  const out = [[]]
  for (const t of tokens) {
    if (t.gap) out.push([])
    else out.at(-1).push(t)
  }
  return out.filter((c) => c.length)
}
const rows = computed(() => {
  const h = props.header
  return [
    { cls: 'sh-title', chunks: chunks(labelTokens(h.title, h.titlePy)) },
    h.sub ? { cls: 'sh-sub', chunks: chunks(labelTokens(h.sub, h.subPy)) } : null,
    { cls: 'sh-tr', chunks: chunks(labelTokens(h.translator, h.translatorPy)) },
  ].filter(Boolean)
})

function fit() {
  const el = root.value
  if (!el) return
  for (const p of el.querySelectorAll('p[data-fit]')) {
    p.style.fontSize = ''
    const avail = p.clientWidth
    if (!avail) continue
    let max = 0
    for (const c of p.querySelectorAll('.sh-chunk')) max = Math.max(max, c.getBoundingClientRect().width)
    if (max > avail) p.style.fontSize = `${(parseFloat(getComputedStyle(p).fontSize) * avail * 0.97) / max}px`
  }
}
let ro = null
let lastW = 0
onMounted(() => {
  fit()
  if (typeof ResizeObserver === 'undefined') return
  ro = new ResizeObserver(([e]) => {
    if (Math.abs(e.contentRect.width - lastW) < 0.5) return
    lastW = e.contentRect.width
    fit()
  })
  ro.observe(root.value)
})
onBeforeUnmount(() => ro?.disconnect())
watch(() => [props.header, props.note], () => nextTick(fit))
// 来源行按词块折行，避免「校对注 / 音」这种断法
const noteParts = computed(() => props.note.split(/(?<=佛典)|(?=（)|(?=校对注音)/).filter(Boolean))
</script>

<template>
  <div ref="root" class="sh">
    <p v-for="r in rows" :key="r.cls" :class="r.cls" data-fit>
      <template v-for="(c, ci) in r.chunks" :key="ci"><template v-if="ci">{{ ' ' }}</template><span class="sh-chunk"><template v-for="(t, i) in c" :key="i"><ruby v-if="t.py">{{ t.ch }}<rt>{{ t.py }}</rt></ruby><template v-else>{{ t.ch }}</template></template></span></template>
    </p>
    <p v-if="note" class="sh-note"><span v-for="(part, pi) in noteParts" :key="pi" class="sh-chunk">{{ part }}</span></p>
  </div>
</template>

<style scoped>
.sh {
  text-align: center;
  margin: 0 auto 0.5em;
  padding: 0.3em 0 0.2em;
  user-select: none;
}
.sh p { margin: 0; word-spacing: 0.3em; }
.sh-chunk { display: inline-block; white-space: nowrap; word-spacing: 0; }
.sh ruby {
  ruby-position: over;
  /* 拼音比字宽时，邻字的拼音不要贴在一起 */
  margin: 0 0.07em;
}
.sh rt {
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 0.45em;
  font-weight: 400;
  letter-spacing: 0;
  color: inherit;
  opacity: 0.8;
}
.sh-title {
  font-size: 1.15em;
  font-weight: 700;
  color: #7a2a1c;
  line-height: 2.1;
}
.sh-sub {
  font-size: 0.95em;
  font-weight: 600;
  color: #7a2a1c;
  line-height: 2.1;
}
.sh-tr {
  font-size: 0.7em;
  color: #756558;
  line-height: 2.3;
}
.sh-note {
  font-size: 0.62em;
  color: #9a8a7a;
  line-height: 2;
  text-wrap: balance;
}
</style>
