<script setup>
// 念经板块 /nianjing/：自己看着拼音出声念，页面听声音跟上（和 /jing/ 放录音跟读无关）。
// 竖屏一屏一种视图（卡拉OK / 提词器），横屏左右两栏（左一句一句、右一页一页）。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SutraLine from '../components/nianjing/SutraLine.vue'
import SutraSeg from '../components/nianjing/SutraSeg.vue'
import SutraHeader from '../components/nianjing/SutraHeader.vue'
import { labelTokens, sourceNote } from '../data/nianjing.js'
import { paginate } from '../utils/nianjingLayout.js'
import { NIANJING, buddhaImages } from '../data/nianjing.js'
import { useNianjing } from '../composables/useNianjing.js'
import { useWakeLock } from '../composables/useWakeLock.js'

const route = useRoute()
const slug = computed(() => (route.params.slug ? String(route.params.slug) : ''))
const nj = useNianjing(slug)
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
const FONT_PX = { m: 25, l: 30, xl: 36 }
const fontPx = computed(() => FONT_PX[fontSize.value] || 25)
const header = computed(() => meta.value?.header || null)
const headerNote = computed(() => sourceNote(sutra.value?.source?.id))

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
  return one(h.title, 1.15, 2.1) + (h.sub ? one(h.sub, 0.95, 2.1) : 0) + one(h.translator, 0.7, 2.3) + (headerNote.value ? (0.62 * 2) / 2.25 : 0) + 0.4
}
const pages = computed(() => {
  const { w, h } = bookSize.value
  if (!w || !h || !segments.value.length) return []
  const charW = fontPx.value * 1.04
  const rowH = fontPx.value * 2.25
  const cpr = Math.max(4, Math.floor(w / charW))
  const rows = Math.max(3, Math.floor(h / rowH))
  return paginate(segments.value, { width: w, fontPx: fontPx.value, rows, topRows: headerRows(cpr) })
})
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
  else nj.start()
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
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <!-- 经目 -->
  <main v-if="!slug" class="nj-list">
    <nav class="nj-crumb"><router-link to="/">← 返回首页</router-link><a href="/chant/" class="nj-en" lang="en" data-keep-script>English</a></nav>
    <header class="nj-list-head">
      <p class="nj-kicker">在线念经</p>
      <h1>经文带拼音，念到哪里走到哪里</h1>
      <p>选一部经，自己出声念。打开「听我念」，手机会听你的声音，念到哪一句就亮到哪一句；不方便出声时，也可以让它自动往下走，或者手动翻页。声音只在手机上识别，不会上传。</p>
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
  <main v-else class="nj-reader" :class="[`nj-view-${view}`]" :style="{ '--nj-font': fontPx + 'px' }">
    <header class="nj-bar">
      <router-link to="/nianjing/" class="nj-back" aria-label="返回经目">‹ 经目</router-link>
      <h1 class="nj-title">{{ meta?.title || '念经' }}</h1>
      <span class="nj-pct" aria-label="进度">{{ progressPct }}%</span>
      <div class="nj-viewtoggle" role="group" aria-label="显示方式">
        <button type="button" :class="{ on: view === 'karaoke' }" @click="view = 'karaoke'">卡拉OK</button>
        <button type="button" :class="{ on: view === 'prompt' }" @click="view = 'prompt'; nextTick(() => scrollPromptToCurrent(false))">提词器</button>
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
          <SutraHeader v-if="showKHeader" :header="header" :note="headerNote" class="nj-kheader" />
          <p v-if="curHeading" class="nj-heading">{{ curHeading }}</p>
          <p class="nj-k nj-k--prev"><SutraSeg v-if="prevSeg" :seg="prevSeg" :cursor="Infinity" @pick="pick" /></p>
          <p class="nj-k nj-k--cur"><SutraSeg v-if="curSeg" :seg="curSeg" :cursor="cursorFor(curSeg)" @pick="pick" /></p>
          <p class="nj-k nj-k--next"><SutraSeg v-if="nextSeg" :seg="nextSeg" :cursor="-1" @pick="pick" /></p>
        </div>
      </div>

      <!-- 提词器（竖屏可选） -->
      <div ref="promptBox" class="nj-pane nj-prompt" @scroll.passive="onPromptScroll" @touchstart.passive="onPromptTouch" @wheel.passive="onPromptTouch">
        <SutraHeader v-if="header" :header="header" :note="headerNote" class="nj-pheader" />
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
        <div ref="bookBox" class="nj-book__page">
          <SutraHeader v-if="header && bookPage === 0" :header="header" :note="headerNote" />
          <template v-if="pages[bookPage]">
            <template v-for="g in pages[bookPage].groups" :key="g.segs[0].start">
              <p v-if="g.heading" class="nj-hd">{{ g.heading }}</p>
              <p v-if="g.kind === 'para'" class="nj-para"><template v-for="sg in g.segs" :key="sg.start"><span
                v-for="pt in sg.parts"
                :key="pt.line + '-' + pt.tokens[0].u"
                :data-line="pt.line"
                class="nj-ln"
                :class="{ now: pt.line === lineIndex }"
              ><SutraLine :tokens="pt.tokens" :cursor="cursorFor(sg)" @pick="pick" /></span></template></p>
              <div v-else class="nj-verse">
                <p v-for="sg in g.segs" :key="sg.start" class="nj-vrow" :class="{ gap: sg.gapBefore }"><template v-for="(pt, k) in sg.parts" :key="pt.line"><template v-if="k">　</template><span
                  :data-line="pt.line"
                  class="nj-ln"
                  :class="{ now: pt.line === lineIndex }"
                ><SutraLine :tokens="pt.tokens.filter((t) => !t.sep)" :cursor="cursorFor(sg)" @pick="pick" /></span></template></p>
              </div>
            </template>
          </template>
        </div>
        <div class="nj-book__nav">
          <button type="button" :disabled="bookPage <= 0" @click="flip(-1)">‹ 上一页</button>
          <span>第 {{ bookPage + 1 }} / {{ pages.length || 1 }} 页</span>
          <button type="button" :disabled="bookPage >= pages.length - 1" @click="flip(1)">下一页 ›</button>
        </div>
      </div>
    </section>

    <div v-if="resumeAt > 0" class="nj-resume" role="dialog" aria-label="续读">
      <span>上次念到第 {{ units.lines[nj.lineOf(resumeAt)]?.text.slice(0, 8) }}…，接着念吗？</span>
      <button type="button" class="primary" @click="nj.resume()">接着念</button>
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
      <div class="nj-step">
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
          <span>字号</span>
          <div class="nj-chips">
            <button v-for="s in SIZES" :key="s.key" type="button" :class="{ on: fontSize === s.key }" @click="fontSize = s.key">{{ s.label }}</button>
          </div>
        </div>
        <p class="nj-note">点经文里任意一个字，就从那个字接着念。「听我念」的声音只在手机上识别，不会上传。</p>
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
.nj-kheader { font-size: calc(var(--nj-font) * 0.82); margin-bottom: 0.2em; }
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
/* 连排的段落、行内高亮 */
.nj-para { margin: 0 0 0.6em; line-height: 2.25; }
.nj-ln {
  border-radius: 6px;
  padding: 0 2px;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  transition: background 0.3s;
}
.nj-ln.now { background: rgba(230, 184, 102, 0.34); }
.nj-hd {
  margin: 1.3em 0 0.4em;
  text-align: center;
  font-size: 0.8em;
  font-weight: 700;
  color: #7a2a1c;
  line-height: 1.8;
}
.nj-verse { margin: 0 0 0.6em; }
.nj-vrow { margin: 0; text-align: center; line-height: 2.25; }
.nj-vrow.gap { margin-top: 0.7em; }
.nj-vrow .nj-ln { display: inline-block; }
.nj-pheader { padding-top: 0.6em; }

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
@media (orientation: landscape) and (min-width: 700px) {
  .nj-viewtoggle { display: none; }
  .nj-reader .nj-karaoke { display: flex; flex: 0 0 42%; border-right: 1px solid rgba(122, 86, 51, 0.2); }
  .nj-reader .nj-prompt { display: none; }
  .nj-reader .nj-book { display: flex; }
}

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
