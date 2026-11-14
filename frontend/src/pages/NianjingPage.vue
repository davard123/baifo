<script setup>
// 念经板块 /nianjing/：自己看着拼音出声念，页面听声音跟上（和 /jing/ 放录音跟读无关）。
// 竖屏一屏一种视图（卡拉OK / 提词器），横屏左右两栏（左一句一句、右一页一页）。
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import SutraLine from '../components/nianjing/SutraLine.vue'
import SutraPage from '../components/nianjing/SutraPage.vue'
import SutraSeg from '../components/nianjing/SutraSeg.vue'
import SutraHeader from '../components/nianjing/SutraHeader.vue'
import { labelTokens, labelZhuyin, sourceNote } from '../data/nianjing.js'
import { isHantPath, loadConverter } from '../i18n/hant.js'
import { hantSutraText } from '../i18n/hantSutra.js'
import { groupSegments, paginate, paginateByHeights, pagesFromRanges } from '../utils/nianjingLayout.js'
import { NIANJING, buddhaImages } from '../data/nianjing.js'
import { useNianjing } from '../composables/useNianjing.js'
import { useWakeLock } from '../composables/useWakeLock.js'

const route = useRoute()
const slug = computed(() => (route.params.slug ? String(route.params.slug) : ''))
// 繁体页（/zh-hant/）：经文整行转繁体，默认标注音；简体页默认标拼音
const isHant = isHantPath(route.path)
const nj = useNianjing(slug, { hant: isHant })
const {
  meta, sutra, units, segments, blocks, total, finished, cursor, lineIndex, segmentIndex,
  running, mode, view, speed, bgm, bpm, fontSize, resumeAt, voiceState, voiceProgress, voiceError, heard,
} = nj

// 念经时人不碰手机：每念一个字都续一下常亮
const wake = useWakeLock({ idleMs: 5 * 60 * 1000 })
watch(cursor, () => wake.poke())

const listCards = NIANJING.map((s) => ({ ...s, thumb: buddhaImages(s.buddha)[0] }))

const image = ref('')
watch(
  () => meta.value?.buddha,
  (b) => {
    const imgs = b ? buddhaImages(b) : []
    image.value = imgs.length ? imgs[Math.floor(Math.random() * imgs.length)] : ''
  },
  { immediate: true },
)

const showSettings = ref(false)

// ── 标音：注音 / 拼音 / 只看字（繁体、简体各记各的）──
const RUBY_KEY = isHant ? 'nianjing:ruby:hant' : 'nianjing:ruby:hans'
const RUBIES = isHant
  ? [{ key: 'zhuyin', label: '注音' }, { key: 'pinyin', label: '拼音' }, { key: 'none', label: '只看字' }]
  : [{ key: 'pinyin', label: '拼音' }, { key: 'none', label: '只看字' }]
function readRuby() {
  try {
    const v = localStorage.getItem(RUBY_KEY)
    if (RUBIES.some((r) => r.key === v)) return v
  } catch {
    /* 存不了就用默认 */
  }
  return RUBIES[0].key
}
const ruby = ref(readRuby())
watch(ruby, (v) => {
  try {
    localStorage.setItem(RUBY_KEY, v)
  } catch {
    /* 隐私模式 */
  }
})
provide('njRuby', ruby)
const hantConvert = shallowRef(null)
if (isHant) loadConverter().then((c) => (hantConvert.value = c)).catch(() => {})
const tw = (text, py = '') => (hantConvert.value ? hantSutraText(text, hantConvert.value, py) : text)
const FONT_PX = { m: 25, l: 30, xl: 36 }
const fontPx = computed(() => FONT_PX[fontSize.value] || 25)
// 经题块：每行配注音；繁体页把字先整行转好（header.hant），等转换器好了再显示
const header = computed(() => {
  const h = meta.value?.header
  if (!h) return null
  if (isHant && !hantConvert.value) return null
  const out = {
    ...h,
    titleZy: labelZhuyin(h.title, h.titlePy),
    subZy: h.sub ? labelZhuyin(h.sub, h.subPy) : null,
    translatorZy: labelZhuyin(h.translator, h.translatorPy),
  }
  if (isHant) Object.assign(out, { hant: true, title: tw(h.title, h.titlePy), sub: h.sub ? tw(h.sub, h.subPy) : h.sub, translator: tw(h.translator, h.translatorPy) })
  return out
})
const headerNote = computed(() => tw(sourceNote(sutra.value?.source?.id)))
// 经题下面一两句话：这页有什么、怎么用
const headerIntro = computed(() => {
  if (!meta.value) return ''
  return tw(
    isHant
      ? `${meta.value.title}全文，每个字都标了注音；在「设置」里可以改成拼音或只看字。按「开始」出声念，念到哪一句就亮到哪一句。`
      : `${meta.value.title}全文，每个字都标了拼音。按「开始」出声念，念到哪一句就亮到哪一句。`,
  )
})
// 页面打开默认是「全文」：整篇经文连着往下排，不用点任何东西就能读完；
// 按「开始」或切到卡拉OK、提词器（横屏是左右两栏）才进入跟读。每次打开都从全文开始，不记。
const reading = ref(false)
function enterReading(v) {
  if (v) view.value = v
  reading.value = true
  nextTick(() => scrollPromptToCurrent(false))
}
// 标题和预渲染的 HTML 一致：繁体「心經全文（注音版）」，简体「心经全文（带拼音）」
const fullSuffix = isHant ? '全文（注音版）' : '全文（带拼音）'
const heading = computed(() => (meta.value ? `${meta.value.title}${fullSuffix}` : '念经'))
// 全文下面列其他经咒和相关页面（和预渲染 HTML 里的链接一样）
const otherSutras = computed(() =>
  NIANJING.filter((s) => s.slug !== slug.value).map((s) => ({ to: `/nianjing/${s.slug}/`, label: `${s.title}${fullSuffix}` })),
)
// 同一部经在 /jing/ 有女声读诵、唱诵视频：念经页主打全文注音/拼音和自己念，诵经页主打听录音、看视频（两页互相链接）
const jingLink = computed(() => {
  const j = meta.value?.jingSlug
  if (!j) return null
  const name = meta.value.slug === 'puxian' ? '普贤行愿品偈颂' : meta.value.title
  return { to: `/jing/${j}/`, label: `想听女声读诵、看诵经${isHant ? '影片' : '视频'}：${name}读诵页 →` }
})

// ── 卡拉OK：当前一段 + 前后各一段 ──
const curSeg = computed(() => segments.value[segmentIndex.value])
const prevSeg = computed(() => segments.value[segmentIndex.value - 1])
const nextSeg = computed(() => segments.value[segmentIndex.value + 1])
const curHeading = computed(() => units.value.lines[lineIndex.value]?.heading || '')
// 念到第一段之前（cursor 在第一段内）卡拉OK上方显示经题块
const showKHeader = computed(() => !!header.value && segmentIndex.value === 0)

// ── 提词器：整篇，当前行固定在屏幕上方约三分之一处 ──
const promptBox = ref(null)
let userScrollUntil = 0
function onPromptScroll() {
  // 用户手动滑动后，几秒内不自动滚回去
}
function onPromptTouch() {
  userScrollUntil = Date.now() + 4000
}
function scrollPromptToCurrent(smooth = true) {
  const box = promptBox.value
  if (!box || Date.now() < userScrollUntil) return
  const el = box.querySelector(`[data-line="${lineIndex.value}"]`)
  if (!el) return
  const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - box.clientHeight / 3
  box.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' })
}
watch(lineIndex, () => nextTick(() => scrollPromptToCurrent()))

// ── 书页：按容器大小把小段排进一页一页 ──
const bookBox = ref(null)
const bookSize = ref({ w: 0, h: 0 })
let ro = null
// 经题块占几行（书页第 1 页顶上）：按字号倍数粗估，宁大勿小
function headerRows(cpr) {
  const h = header.value
  if (!h) return 0
  const one = (text, scale, lh) => {
    const n = labelTokens(text).length
    return (Math.ceil((n * scale) / cpr) * scale * lh) / 2.25
  }
  return one(h.title, 1.15, 2.1) + (h.sub ? one(h.sub, 0.95, 2.1) : 0) + one(h.translator, 0.7, 2.3) + (headerNote.value ? (0.62 * 2) / 2.25 : 0) + (headerIntro.value ? (0.6 * 1.7 * Math.ceil((headerIntro.value.length * 0.6) / cpr)) / 2.25 : 0) + 0.4
}
// 先用估算分页（立刻有页可看、偏保守），再用实测分页替换
const pagesEst = computed(() => {
  const { w, h } = bookSize.value
  if (!w || !h || !segments.value.length) return []
  const charW = fontPx.value * 1.04
  const rowH = fontPx.value * 2.25
  const cpr = Math.max(4, Math.floor(w / charW))
  const rows = Math.max(3, Math.floor(h / rowH))
  return paginate(segments.value, { width: w, fontPx: fontPx.value, rows, topRows: headerRows(cpr) })
})
const measured = shallowRef(null)
const pages = computed(() => measured.value || pagesEst.value)

// ── 实测分页：隐藏容器里和书页同宽同字号整篇排一遍，读每个小段的位置，按页高切；再逐页复核 ──
const measuring = ref(false)
const verified = ref(false)
const measureEl = ref(null)
const probing = ref(null)
const probeEl = ref(null)
const allGroups = computed(() => (measuring.value ? groupSegments(segments.value) : []))
let measureSeq = 0
let measureTimer = null

// 内联 span 的矩形只是字体框，不是行框：用「行高」和一个校准量 c 还原行框上下沿
function readBoxes(root) {
  let c = 0
  let L = 0
  const first = root.querySelector('.nj-sg')
  if (first) {
    L = parseFloat(getComputedStyle(first).lineHeight) || 0
    c = first.getClientRects()[0].top - first.parentElement.getBoundingClientRect().top
  }
  const base = root.getBoundingClientRect().top
  const boxes = new Map()
  for (const n of root.querySelectorAll('[data-sg]')) {
    const rs = n.getClientRects()
    if (!rs.length) continue
    if (n.classList.contains('nj-sg')) boxes.set(+n.dataset.sg, { top: rs[0].top - c - base, bottom: rs[rs.length - 1].top - c + L - base })
    else boxes.set(+n.dataset.sg, { top: rs[0].top - base, bottom: rs[rs.length - 1].bottom - base })
  }
  const heads = new Map()
  for (const n of root.querySelectorAll('[data-hd-for]')) {
    heads.set(+n.dataset.hdFor, n.getBoundingClientRect().top - base - (parseFloat(getComputedStyle(n).marginTop) || 0))
  }
  return { boxes, heads }
}

async function verifyPages(id, ranges, H) {
  const segs = segments.value
  let p = 0
  let changed = false
  while (p < ranges.length) {
    if (id !== measureSeq) return
    const r = ranges[p]
    for (;;) {
      probing.value = { first: p === 0, groups: groupSegments(segs.slice(r.s, r.e)) }
      await nextTick()
      if (!probeEl.value || id !== measureSeq) return
      const { boxes } = readBoxes(probeEl.value)
      const bottom = boxes.get(segs[r.e - 1].idx)?.bottom ?? 0
      if (bottom <= H + 0.5 || r.e - r.s <= 1) break
      r.e -= 1
      changed = true
      if (ranges[p + 1]) ranges[p + 1].s = r.e
      else ranges.push({ s: r.e, e: segs.length })
    }
    p += 1
    if (p % 6 === 0) await new Promise((res) => setTimeout(res))
  }
  probing.value = null
  if (changed && id === measureSeq) measured.value = pagesFromRanges(segs, ranges)
  if (id === measureSeq) verified.value = true
}

async function runMeasure() {
  const id = ++measureSeq
  const { w, h } = bookSize.value
  const segs = segments.value
  if (!w || !h || !segs.length) return
  try {
    await document.fonts?.ready
  } catch {
    /* 没有 fonts API 就直接量 */
  }
  if (id !== measureSeq) return
  measuring.value = true
  await nextTick()
  const el = measureEl.value
  if (!el || id !== measureSeq) {
    measuring.value = false
    return
  }
  const { boxes, heads } = readBoxes(el)
  const tops = segs.map((sg) => heads.get(sg.idx) ?? boxes.get(sg.idx)?.top ?? 0)
  const bottoms = segs.map((sg) => boxes.get(sg.idx)?.bottom ?? 0)
  tops[0] = 0
  measuring.value = false
  const ranges = paginateByHeights(tops, bottoms, h)
  measured.value = pagesFromRanges(segs, ranges)
  await verifyPages(id, ranges, h)
}
function invalidateMeasure() {
  measureSeq += 1
  measuring.value = false
  verified.value = false
  probing.value = null
  measured.value = null
  clearTimeout(measureTimer)
  measureTimer = setTimeout(runMeasure, 150)
}
watch([bookSize, fontPx, segments, header, headerNote, headerIntro, ruby], invalidateMeasure)
const cursorPage = computed(() => {
  const ps = pages.value
  let i = 0
  while (i + 1 < ps.length && ps[i + 1].start <= Math.min(cursor.value, total.value - 1)) i += 1
  return i
})
const bookPage = ref(0)
watch(cursorPage, (p) => {
  bookPage.value = p
})
watch(pages, () => {
  bookPage.value = cursorPage.value
})
function flip(d) {
  bookPage.value = Math.max(0, Math.min(pages.value.length - 1, bookPage.value + d))
}
let touchX = null
function onBookTouchStart(e) {
  touchX = e.touches[0].clientX
}
function onBookTouchEnd(e) {
  if (touchX === null) return
  const dx = e.changedTouches[0].clientX - touchX
  touchX = null
  if (Math.abs(dx) > 50) flip(dx < 0 ? 1 : -1)
}

function cursorFor(seg) {
  if (!seg) return -1
  if (cursor.value >= seg.end) return Infinity
  if (cursor.value < seg.start) return -1
  return cursor.value
}

function pick(u) {
  nj.setCursor(u)
}

function toggleRun() {
  if (running.value) nj.stop()
  else {
    if (!reading.value) enterReading()
    nj.start()
  }
}

const MODES = [
  { key: 'voice', label: '听我念' },
  { key: 'auto', label: '自动' },
  { key: 'manual', label: '手动' },
]
const BGMS = [
  { key: 'muyu', label: '木鱼' },
  { key: 'music', label: '佛乐' },
  { key: 'off', label: '静音' },
]
const SIZES = [
  { key: 'm', label: '中' },
  { key: 'l', label: '大' },
  { key: 'xl', label: '特大' },
]

const status = computed(() => {
  if (voiceError.value) return voiceError.value
  if (finished.value) return '念完了，随喜功德。'
  if (!running.value) return mode.value === 'voice' ? '点「开始」后对着手机念，念到哪里就走到哪里。' : ''
  if (mode.value === 'voice') {
    if (voiceState.value === 'loading')
      return voiceProgress.value > 0 && voiceProgress.value < 1
        ? `第一次使用，正在下载语音识别（约 44MB）… ${Math.round(voiceProgress.value * 100)}%`
        : '正在准备语音识别…'
    if (voiceState.value === 'listening') return heard.value ? `听到：${heard.value}` : '正在听，请出声念。'
  }
  return ''
})

const progressPct = computed(() => (total.value ? Math.round((cursor.value / total.value) * 100) : 0))


onMounted(() => {
  ro = new ResizeObserver(([e]) => {
    bookSize.value = { w: e.contentRect.width, h: e.contentRect.height }
  })
  watch(
    bookBox,
    (el, old) => {
      if (old) ro.unobserve(old)
      if (el) ro.observe(el)
    },
    { immediate: true },
  )
})
onMounted(() => document.fonts?.addEventListener?.('loadingdone', invalidateMeasure))
onBeforeUnmount(() => {
  ro?.disconnect()
  clearTimeout(measureTimer)
  measureSeq += 1
  document.fonts?.removeEventListener?.('loadingdone', invalidateMeasure)
})
</script>

<template>
  <!-- 经目 -->
  <main v-if="!slug" class="nj-list">
    <nav class="nj-crumb"><router-link to="/">← 返回首页</router-link><a href="/chant/" class="nj-en" lang="en" data-keep-script>English</a></nav>
    <header class="nj-list-head">
      <p class="nj-kicker">在线念经</p>
      <h1>{{ isHant ? '经文附注音，念到哪里走到哪里' : '经文带拼音，念到哪里走到哪里' }}</h1>
      <p><template v-if="isHant">每部经都是全文，每个字标注音（也可以换成拼音）。</template>选一部经，自己出声念。打开「听我念」，手机会听你的声音，念到哪一句就亮到哪一句；不方便出声时，也可以让它自动往下走，或者手动翻页。声音只在手机上识别，不会上传。</p>
      <p>想听女声读诵、看唱诵{{ isHant ? '影片' : '视频' }}跟着念：<router-link to="/jing/">在线诵经 →</router-link></p>
    </header>
    <div class="nj-grid">
      <router-link v-for="s in listCards" :key="s.slug" :to="`/nianjing/${s.slug}/`" class="nj-card">
        <img v-if="s.thumb" :src="s.thumb" alt="" loading="lazy" decoding="async" />
        <span class="nj-card__title">{{ s.title }}</span>
        <span class="nj-card__note">{{ s.note }}</span>
      </router-link>
    </div>
  </main>

  <!-- 念经 -->
  <main v-else class="nj-reader" :class="[`nj-view-${view}`, { 'nj-full': !reading }]" :style="{ '--nj-font': fontPx + 'px' }">
    <header class="nj-bar">
      <router-link to="/nianjing/" class="nj-back" aria-label="返回经目">‹ 经目</router-link>
      <h1 class="nj-title">{{ heading }}</h1>
      <span v-if="reading" class="nj-pct" aria-label="进度">{{ progressPct }}%</span>
      <div class="nj-viewtoggle" role="group" aria-label="显示方式">
        <button type="button" :class="{ on: !reading }" @click="reading = false">全文</button>
        <button type="button" class="nj-vt-port" :class="{ on: reading && view === 'karaoke' }" @click="enterReading('karaoke')">卡拉OK</button>
        <button type="button" class="nj-vt-port" :class="{ on: reading && view === 'prompt' }" @click="enterReading('prompt')">提词器</button>
        <button type="button" class="nj-vt-land" :class="{ on: reading }" @click="enterReading()">跟读</button>
      </div>
    </header>

    <p v-if="!meta" class="nj-empty">没有找到这部经。<router-link to="/nianjing/">回经目</router-link></p>

    <section v-else class="nj-stage">
      <!-- 卡拉OK（竖屏可选；横屏左栏） -->
      <div class="nj-pane nj-karaoke">
        <div class="nj-pic">
          <img v-if="image" :src="image" :alt="`${meta.title}对应的佛菩萨像`" />
        </div>
        <div class="nj-kline">
          <SutraHeader v-if="showKHeader" :header="header" :note="headerNote" :intro="headerIntro" class="nj-kheader" />
          <p v-if="curHeading" class="nj-heading">{{ curHeading }}</p>
          <p class="nj-k nj-k--prev"><SutraSeg v-if="prevSeg" :seg="prevSeg" :cursor="Infinity" @pick="pick" /></p>
          <p class="nj-k nj-k--cur"><SutraSeg v-if="curSeg" :seg="curSeg" :cursor="cursorFor(curSeg)" @pick="pick" /></p>
          <p class="nj-k nj-k--next"><SutraSeg v-if="nextSeg" :seg="nextSeg" :cursor="-1" @pick="pick" /></p>
        </div>
      </div>

      <!-- 提词器（竖屏可选） -->
      <div ref="promptBox" class="nj-pane nj-prompt" @scroll.passive="onPromptScroll" @touchstart.passive="onPromptTouch" @wheel.passive="onPromptTouch">
        <SutraHeader v-if="header" :header="header" :note="headerNote" :intro="headerIntro" class="nj-pheader" />
        <p v-if="jingLink" class="nj-xlink"><router-link :to="jingLink.to">{{ jingLink.label }}</router-link></p>
        <template v-for="(b, bi) in blocks" :key="bi">
          <p v-if="b.headStart" class="nj-hd">{{ b.heading }}</p>
          <p v-if="b.kind === 'para'" class="nj-para"><span
            v-for="li in b.lines"
            :key="li"
            :data-line="li"
            class="nj-ln"
            :class="{ now: li === lineIndex }"
          ><SutraLine
            :tokens="units.lines[li].tokens"
            :cursor="li < lineIndex ? Infinity : li > lineIndex ? -1 : cursor"
            @pick="pick"
          /></span></p>
          <div v-else class="nj-verse">
            <p v-for="row in b.rows" :key="row.lines[0]" class="nj-vrow" :class="{ gap: row.gapBefore }"><template v-for="(li, k) in row.lines" :key="li"><template v-if="k">　</template><span
              :data-line="li"
              class="nj-ln"
              :class="{ now: li === lineIndex }"
            ><SutraLine
              :tokens="units.lines[li].tokens"
              :cursor="li < lineIndex ? Infinity : li > lineIndex ? -1 : cursor"
              @pick="pick"
            /></span></template></p>
          </div>
        </template>
        <div class="nj-prompt__pad nj-prompt__pad--end"></div>
      </div>

      <!-- 书页（横屏右栏） -->
      <div class="nj-pane nj-book" @touchstart.passive="onBookTouchStart" @touchend.passive="onBookTouchEnd">
        <div ref="bookBox" class="nj-book__page" :data-verified="verified ? 1 : 0">
          <SutraPage
            v-if="pages[bookPage]"
            :header="header"
            :note="headerNote"
            :intro="headerIntro"
            :show-header="bookPage === 0"
            :groups="pages[bookPage].groups"
            :line-index="lineIndex"
            :cursor="cursor"
            @pick="pick"
          />
        </div>
        <div class="nj-book__nav">
          <button type="button" :disabled="bookPage <= 0" @click="flip(-1)">‹ 上一页</button>
          <span>第 {{ bookPage + 1 }} / {{ pages.length || 1 }} 页</span>
          <button type="button" :disabled="bookPage >= pages.length - 1" @click="flip(1)">下一页 ›</button>
        </div>
      </div>
      <!-- 量页高用的隐藏容器：和书页同宽同字号，整篇排一遍读每个小段的位置；再逐页复核 -->
      <div v-if="measuring" ref="measureEl" class="nj-measure" aria-hidden="true" :style="{ width: bookSize.w + 'px' }">
        <SutraPage :header="header" :note="headerNote" :intro="headerIntro" show-header :groups="allGroups" />
      </div>
      <div v-if="probing" ref="probeEl" class="nj-measure" aria-hidden="true" :style="{ width: bookSize.w + 'px' }">
        <SutraPage :header="header" :note="headerNote" :intro="headerIntro" :show-header="probing.first" :groups="probing.groups" />
      </div>
    </section>

    <nav v-if="meta && !reading" class="nj-more" aria-label="其他经咒">
      <h2>其他经咒</h2>
      <ul>
        <li v-for="s in otherSutras" :key="s.to"><router-link :to="s.to">{{ s.label }}</router-link></li>
      </ul>
      <p>
        <router-link to="/nianjing/">在线念经首页</router-link>
        <router-link to="/jing/">在线诵经（读诵、唱诵视频）</router-link>
        <router-link to="/nianfo/">念佛计数器</router-link>
      </p>
    </nav>

    <div v-if="resumeAt > 0" class="nj-resume" role="dialog" aria-label="续读">
      <span>上次念到第 {{ (units.lines[nj.lineOf(resumeAt)]?.dtext || units.lines[nj.lineOf(resumeAt)]?.text || '').slice(0, 8) }}…，接着念吗？</span>
      <button type="button" class="primary" @click="nj.resume(); enterReading()">接着念</button>
      <button type="button" @click="resumeAt = 0">从头念</button>
    </div>

    <p v-if="status" class="nj-status" :class="{ err: !!voiceError }" role="status">{{ status }}</p>

    <footer v-if="meta" class="nj-controls">
      <button type="button" class="nj-go" :class="{ on: running }" @click="toggleRun">
        {{ running ? '暂停' : finished ? '再念一遍' : '开始' }}
      </button>
      <div class="nj-chips" role="group" aria-label="往下走的方式">
        <button v-for="m in MODES" :key="m.key" type="button" :class="{ on: mode === m.key }" @click="mode = m.key">{{ m.label }}</button>
      </div>
      <div v-if="reading" class="nj-step">
        <button type="button" aria-label="上一句" @click="nj.prevSegment()">‹</button>
        <button type="button" aria-label="下一句" @click="nj.nextSegment()">›</button>
      </div>
      <button type="button" class="nj-gear" :aria-expanded="showSettings" @click="showSettings = !showSettings">设置</button>

      <div v-if="showSettings" class="nj-settings">
        <div class="nj-row">
          <span>背景声</span>
          <div class="nj-chips">
            <button v-for="b in BGMS" :key="b.key" type="button" :class="{ on: bgm === b.key }" @click="bgm = b.key">{{ b.label }}</button>
          </div>
        </div>
        <label v-if="bgm === 'muyu'" class="nj-row">
          <span>木鱼快慢</span>
          <input v-model.number="bpm" type="range" min="40" max="120" step="5" />
          <b>{{ bpm }} 下/分</b>
        </label>
        <label class="nj-row">
          <span>自动速度</span>
          <input v-model.number="speed" type="range" min="40" max="240" step="10" />
          <b>{{ speed }} 字/分</b>
        </label>
        <div class="nj-row">
          <span>标音</span>
          <div class="nj-chips">
            <button v-for="r in RUBIES" :key="r.key" type="button" :class="{ on: ruby === r.key }" @click="ruby = r.key">{{ r.label }}</button>
          </div>
        </div>
        <div class="nj-row">
          <span>字号</span>
          <div class="nj-chips">
            <button v-for="s in SIZES" :key="s.key" type="button" :class="{ on: fontSize === s.key }" @click="fontSize = s.key">{{ s.label }}</button>
          </div>
        </div>
        <p class="nj-note">点经文里任意一个字，就从那个字接着念。「听我念」的声音只在手机上识别，不会上传。</p>
        <p v-if="jingLink" class="nj-note"><router-link :to="jingLink.to">{{ jingLink.label }}</router-link></p>
      </div>
    </footer>
  </main>
</template>

<style scoped>
/* ── 经目 ── */
.nj-list {
  /* 全站底色是深色，这里铺满暖色纸面 */
  min-height: 100vh;
  padding: 16px max(20px, calc((100% - 980px) / 2)) 72px;
  background: #f7f0e6;
  color: var(--ink-warm, #392b24);
}
.nj-crumb a { color: var(--ink-soft, #756558); text-decoration: none; }
.nj-crumb .nj-en { float: right; color: #8a4a1c; font-size: 0.9rem; }
.nj-list-head { margin: 18px 0 24px; }
.nj-kicker { color: #b5832f; letter-spacing: 0.2em; font-size: 0.82rem; margin: 0; }
.nj-list-head h1 { font-size: clamp(1.5rem, 4.6vw, 2.2rem); margin: 6px 0 10px; color: #7a2a1c; }
.nj-list-head p { color: var(--ink-soft, #756558); max-width: 40em; }
.nj-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}
.nj-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 10px 14px;
  border-radius: 16px;
  background: #fffaf2;
  border: 1px solid rgba(122, 86, 51, 0.16);
  box-shadow: 0 10px 26px rgba(72, 42, 18, 0.08);
  text-decoration: none;
  color: inherit;
}
.nj-card img { width: 100%; aspect-ratio: 16 / 10; object-fit: contain; border-radius: 10px; background: #f3e8d6; }
.nj-card__title { font-size: 1.15rem; font-weight: 700; margin-top: 6px; color: #5a2a1a; }
.nj-card__note { font-size: 0.85rem; color: var(--ink-soft, #756558); }

/* ── 念经页 ── */
.nj-reader {
  --nj-done: #b5832f;
  --nj-cur: #a3261c;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: #f7f0e6;
  color: #392b24;
  font-family: 'Noto Serif SC', 'Songti SC', 'STSong', serif;
  overflow: hidden;
}
.nj-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  padding-top: max(8px, env(safe-area-inset-top));
  border-bottom: 1px solid rgba(122, 86, 51, 0.18);
  background: #fffaf2;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
}
.nj-back { color: #756558; text-decoration: none; white-space: nowrap; }
.nj-title { font-size: 1.1rem; margin: 0; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #5a2a1a; }
.nj-pct { font-size: 0.85rem; color: #9a8a7a; }
.nj-viewtoggle { display: flex; gap: 4px; }
.nj-viewtoggle button,
.nj-chips button,
.nj-step button,
.nj-gear,
.nj-book__nav button,
.nj-resume button {
  font: inherit;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(178, 126, 54, 0.4);
  background: #fffaf2;
  color: #392b24;
  cursor: pointer;
  white-space: nowrap;
}
.nj-viewtoggle button.on,
.nj-chips button.on,
.nj-resume button.primary {
  background: #b5832f;
  border-color: #b5832f;
  color: #fffaf2;
}
.nj-empty { padding: 40px 20px; }

.nj-stage {
  flex: 1;
  min-height: 0;
  display: flex;
}
.nj-pane { flex: 1; min-width: 0; min-height: 0; }
/* 竖屏：一屏一种 */
.nj-book { display: none; }
.nj-view-karaoke .nj-prompt { display: none; }
.nj-view-prompt .nj-karaoke { display: none; }

/* 卡拉OK */
.nj-karaoke { display: flex; flex-direction: column; overflow: hidden; }
.nj-pic {
  flex: 1 1 0;
  min-height: 64px;
  max-height: 40%;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 60%, #fff6e2, #efe0c6 70%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nj-pic img {
  height: 100%;
  width: 100%;
  object-fit: contain;
  animation: nj-drift 40s ease-in-out infinite alternate;
  transform-origin: 50% 40%;
}
@keyframes nj-drift {
  from { transform: scale(1) translate(0, 0); }
  to { transform: scale(1.14) translate(-2%, 2%); }
}
.nj-kline {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.6em;
  padding: 12px 14px;
  text-align: center;
}
.nj-heading { margin: 0; font-size: calc(var(--nj-font) * 0.72); font-weight: 600; color: #7a2a1c; }
.nj-kheader { font-size: calc(var(--nj-font) * 0.82); margin-bottom: 0.2em; align-self: stretch; min-width: 0; }
.nj-k { margin: 0; line-height: 2.2; }
.nj-k--prev { font-size: calc(var(--nj-font) * 0.85); opacity: 0.55; }
.nj-k--cur { font-size: calc(var(--nj-font) * 1.35); }
.nj-k--next { font-size: calc(var(--nj-font) * 0.9); color: #6d5d50; }

/* 提词器 */
.nj-prompt {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px;
  font-size: var(--nj-font);
}
.nj-prompt__pad--end { height: 60%; }
.nj-pheader { padding-top: 0.6em; }
.nj-xlink { margin: 0.2em 0 0.8em; text-align: center; font-size: 0.6em; }
.nj-xlink a, .nj-note a { color: #8a4a1c; }
.nj-measure {
  position: absolute;
  left: 0;
  top: 0;
  visibility: hidden;
  pointer-events: none;
  font-size: var(--nj-font);
  z-index: -1;
}

/* 书页 */
.nj-book { flex-direction: column; background: #fffaf2; }
.nj-book__page {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 14px 20px;
  font-size: var(--nj-font);
}
.nj-book__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  border-top: 1px solid rgba(122, 86, 51, 0.16);
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 0.85rem;
  color: #756558;
}
.nj-book__nav button:disabled { opacity: 0.4; cursor: default; }

/* 横屏：左卡拉OK、右书页 */
.nj-vt-land { display: none; }
@media (orientation: landscape) and (min-width: 700px) {
  .nj-viewtoggle .nj-vt-port { display: none; }
  .nj-viewtoggle .nj-vt-land { display: inline-block; }
  /* 右边书页已有经题块，左栏不重复，佛像保持大小 */
  .nj-kheader { display: none; }
  .nj-pic { flex: 0 0 42%; max-height: none; }
  .nj-kline { flex: 1 1 0; min-height: 0; }
  .nj-reader .nj-karaoke { display: flex; flex: 0 0 42%; border-right: 1px solid rgba(122, 86, 51, 0.2); }
  .nj-reader .nj-prompt { display: none; }
  .nj-reader .nj-book { display: flex; }
}

/* 全文（默认）：整页往下滚，只显示提词器那一栏的整篇经文，不高亮念到哪里 */
.nj-reader.nj-full { height: auto; min-height: 100vh; min-height: 100dvh; overflow: visible; }
.nj-reader.nj-full .nj-bar { flex-wrap: wrap; }
.nj-reader.nj-full .nj-title { order: 5; flex: 1 1 100%; white-space: normal; font-size: 1.35rem; padding: 2px 0; }
.nj-reader.nj-full .nj-viewtoggle { margin-left: auto; }
.nj-reader.nj-full .nj-stage { display: block; }
.nj-reader.nj-full .nj-karaoke,
.nj-reader.nj-full .nj-book { display: none; }
.nj-reader.nj-full .nj-prompt { display: block; overflow: visible; max-width: 46em; margin: 0 auto; }
.nj-reader.nj-full .nj-prompt__pad--end { display: none; }
.nj-reader.nj-full .nj-ln.now { background: none; }
.nj-reader.nj-full :deep(.sl-ch.done),
.nj-reader.nj-full :deep(.sl-ch.cur) { color: inherit; }
.nj-reader.nj-full :deep(.sl-ch.done rt) { color: var(--nj-py, #9a8a7a); }
.nj-reader.nj-full .nj-controls { position: sticky; bottom: 0; z-index: 4; }
.nj-reader.nj-full .nj-resume { position: fixed; }
.nj-more {
  max-width: 46em;
  margin: 8px auto 0;
  padding: 18px 16px 28px;
  border-top: 1px solid rgba(122, 86, 51, 0.18);
  font-family: 'Noto Sans SC', system-ui, sans-serif;
}
.nj-more h2 { margin: 0 0 10px; font-size: 1.05rem; color: #5a2a1a; }
.nj-more ul { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0 0 14px; padding: 0; list-style: none; }
.nj-more a { color: #8a4a1c; }
.nj-more p { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0; font-size: 0.92rem; }

.nj-status {
  margin: 0;
  padding: 6px 14px;
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 0.88rem;
  color: #6d5d50;
  background: #fbf4e8;
  border-top: 1px solid rgba(122, 86, 51, 0.12);
}
.nj-status.err { color: #8a2a1a; }

.nj-resume {
  position: absolute;
  left: 50%;
  bottom: 84px;
  transform: translateX(-50%);
  width: min(92vw, 460px);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fffaf2;
  box-shadow: 0 12px 36px rgba(72, 42, 18, 0.2);
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 0.92rem;
  z-index: 5;
}
.nj-resume span { flex: 1 1 100%; }

.nj-controls {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  background: #fffaf2;
  border-top: 1px solid rgba(122, 86, 51, 0.18);
  font-family: 'Noto Sans SC', system-ui, sans-serif;
}
.nj-go {
  font: inherit;
  font-weight: 700;
  padding: 8px 20px;
  border-radius: 999px;
  border: none;
  background: #a3261c;
  color: #fff8ec;
  cursor: pointer;
}
.nj-go.on { background: #6d5d50; }
.nj-chips { display: flex; gap: 4px; }
.nj-step { display: flex; gap: 4px; }
.nj-step button { padding: 6px 14px; font-size: 1.05rem; line-height: 1; }
.nj-gear { margin-left: auto; }
.nj-settings {
  position: absolute;
  right: 8px;
  bottom: calc(100% + 6px);
  width: min(94vw, 380px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
  background: #fffaf2;
  box-shadow: 0 16px 40px rgba(72, 42, 18, 0.22);
  z-index: 6;
}
.nj-row { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
.nj-row > span { flex: 0 0 4.5em; color: #756558; }
.nj-row input[type='range'] { flex: 1; accent-color: #b5832f; }
.nj-row b { font-weight: 500; min-width: 4.5em; text-align: right; }
.nj-note { margin: 0; font-size: 0.8rem; color: #9a8a7a; }

@media (max-width: 420px) {
  .nj-controls { gap: 5px; padding-left: 8px; padding-right: 8px; }
  .nj-chips { gap: 2px; }
  .nj-viewtoggle button,
  .nj-chips button,
  .nj-gear { padding: 6px 8px; font-size: 0.82rem; }
  .nj-step button { padding: 6px 9px; }
  .nj-go { padding: 8px 12px; }
}
</style>
