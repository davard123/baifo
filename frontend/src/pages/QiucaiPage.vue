<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BOWL_FULL,
  CAISHEN,
  QIUCAI_BG,
  PROP,
  QIUCAI_ARTICLE,
  QIUCAI_FAQS,
  QIUCAI_SCENES,
  QIUCAI_STREAK_MILESTONES,
  QIUCAI_WAYS,
  caishenDirection,
  pickCouplet,
  pickGreeting,
  pickWish,
} from '../data/qiucai.js'
import { apiFetch, warmApi } from '../api.js'
import { getViewerProfile, saveViewerProfile } from '../utils/viewerProfile.js'

const STORE_KEY = 'fopusha-qiucai-v1'

const deity = ref(CAISHEN[0])
const done = ref({})
const qi = ref(0)
const toast = ref('')
const bowCount = ref(0)
const particles = ref([])
const effect = ref('')
// 神像回应：aura=身后金光一闪；blessing=换成赐福姿势（撒金币、举福字等）
const aura = ref(0)
const blessingUntil = ref(0)
const now = ref(Date.now())
const poseReady = ref({})
let poseTimer = null
const bowlCelebrated = ref(false)

const today = new Date()
const todayInfo = caishenDirection(today)

const form = ref({ name: '', scene: QIUCAI_SCENES[0].key, wish: '' })
const submitting = ref(false)
const submitError = ref('')
const result = ref(null)
const cardUrl = ref('')

const stats = ref({ lastDay: '', streak: 0, totalQi: 0, totalDays: 0 })
const wall = ref([])

let toastTimer = null
let particleId = 0

const bowlPercent = computed(() => Math.min(100, Math.round((qi.value / BOWL_FULL) * 100)))
const bowlFull = computed(() => qi.value >= BOWL_FULL)
// 聚宝盆满或已提交心愿后一直保持赐福姿势；叩拜 3 下临时显灵 3 秒
const blessing = computed(() => bowlFull.value || Boolean(result.value) || now.value < blessingUntil.value)
const showPose = computed(() => blessing.value && poseReady.value[deity.value.key])

function preloadPose(item) {
  if (!item.pose || poseReady.value[item.key] !== undefined) return
  poseReady.value = { ...poseReady.value, [item.key]: false }
  const img = new Image()
  img.onload = () => {
    poseReady.value = { ...poseReady.value, [item.key]: true }
  }
  img.src = item.pose
}

function flashAura() {
  aura.value += 1
}

function manifest(ms = 3000) {
  blessingUntil.value = Date.now() + ms
  now.value = Date.now()
  clearTimeout(poseTimer)
  poseTimer = setTimeout(() => {
    now.value = Date.now()
  }, ms + 50)
}
const scene = computed(() => QIUCAI_SCENES.find((item) => item.key === form.value.scene))
const nextMilestone = computed(() => QIUCAI_STREAK_MILESTONES.find((m) => m.days > stats.value.streak))
const reachedMilestone = computed(() =>
  [...QIUCAI_STREAK_MILESTONES].reverse().find((m) => m.days <= stats.value.streak)
)

function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
    if (saved) stats.value = { ...stats.value, ...saved }
  } catch {
    // 无痕模式等读不到本地存储时，按新访客处理
  }
}

function saveStats() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(stats.value))
  } catch {
    // 存不了就只在本次页面内生效
  }
}

// 当天第一次完成供养时记一次连拜
function markToday() {
  const key = dayKey()
  if (stats.value.lastDay === key) return
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const continued = stats.value.lastDay === dayKey(yesterday)
  stats.value = {
    ...stats.value,
    lastDay: key,
    streak: continued ? stats.value.streak + 1 : 1,
    totalDays: (stats.value.totalDays || 0) + 1,
  }
  saveStats()
}

function showToast(text) {
  clearTimeout(toastTimer)
  toast.value = text
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2600)
}

function burst(kind, count) {
  const symbols = {
    coin: ['coin', 'coin', '✨'],
    tree: ['coin', 'coin', '✨'],
    ingot: ['ingot', 'coin'],
    fruit: ['✨'],
    bow: ['✨'],
    full: ['coin', 'ingot', 'hongbao', 'coin'],
  }[kind] || ['✨']
  const batch = Array.from({ length: count }, () => ({
    id: ++particleId,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    left: 8 + Math.random() * 84,
    delay: Math.random() * 0.5,
    duration: 1.4 + Math.random() * 0.9,
    size: 18 + Math.random() * 18,
  }))
  particles.value = [...particles.value, ...batch]
  const ids = new Set(batch.map((p) => p.id))
  setTimeout(() => {
    particles.value = particles.value.filter((p) => !ids.has(p.id))
  }, 2600)
}

function act(way) {
  if (!way.repeat && done.value[way.key]) return
  done.value = { ...done.value, [way.key]: true }
  qi.value += way.qi
  stats.value = { ...stats.value, totalQi: (stats.value.totalQi || 0) + way.qi }
  markToday()

  effect.value = ''
  requestAnimationFrame(() => {
    effect.value = way.effect
  })

  if (way.key === 'bow') bowCount.value += 1
  if (['bow', 'coin', 'ingot', 'tree', 'lamp'].includes(way.key)) flashAura()
  if (way.key === 'bow' && bowCount.value % 3 === 0) {
    manifest()
    burst('coin', 18)
    setTimeout(() => showToast(`${deity.value.name}显灵赐福：${pickGreeting()}！`), 300)
  }
  const counts = { coin: 10, tree: 16, ingot: 6, fruit: 5, bow: 6 }
  if (counts[way.effect]) burst(way.effect, counts[way.effect])

  if (way.repeat && way.key !== 'bow') {
    showToast(`${way.toast} ${pickGreeting()}！`)
  } else if (way.key === 'bow') {
    showToast(`第 ${bowCount.value} 拜 · ${pickGreeting()}`)
  } else {
    showToast(way.toast)
  }

  if (bowlFull.value && !bowlCelebrated.value) {
    bowlCelebrated.value = true
    burst('full', 28)
    setTimeout(() => showToast('聚宝盆已满！财气圆满，写下你的求财心愿吧。'), 900)
  }
}

function chooseDeity(item) {
  deity.value = item
  preloadPose(item)
  showToast(`已请${item.name}（${item.title}）`)
}

function maskName(name = '') {
  const trimmed = name.trim()
  if (trimmed.length <= 1) return trimmed || '有缘人'
  return `${trimmed[0]}${'*'.repeat(Math.min(2, trimmed.length - 1))}`
}

async function loadWall() {
  try {
    const response = await apiFetch('/wishes?limit=50')
    if (!response.ok) return
    const rows = await response.json()
    wall.value = rows.filter((row) => row.blessing === 'caishen').slice(0, 12)
  } catch {
    wall.value = []
  }
}

async function submit() {
  submitError.value = ''
  const name = form.value.name.trim()
  if (!name) {
    submitError.value = '请先写下你的名字或称呼。'
    return
  }
  const blessingText = pickWish(form.value.scene, name)
  const wishText = form.value.wish.trim() || blessingText
  submitting.value = true
  try {
    const response = await apiFetch('/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: name,
        wish: `【${deity.value.name}·${scene.value.label}】${wishText}`,
        blessing: 'caishen',
        target: scene.value.label,
      }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.status !== 'success') throw new Error('提交失败')

    try {
      saveViewerProfile(name)
    } catch {
      // 本地存储不可用时不影响提交
    }
    markToday()
    result.value = {
      name,
      scene: scene.value.label,
      deity: deity.value.name,
      blessing: blessingText,
      couplet: pickCouplet(),
      date: dayKey(),
      image: poseReady.value[deity.value.key] ? deity.value.pose : deity.value.image,
    }
    burst('full', 24)
    cardUrl.value = await drawCard(result.value)
    loadWall()
  } catch {
    submitError.value = '提交没有成功，请稍后再试一次。'
  } finally {
    submitting.value = false
  }
}

async function anotherBlessing() {
  if (!result.value) return
  result.value = {
    ...result.value,
    blessing: pickWish(form.value.scene, result.value.name),
    couplet: pickCouplet(),
  }
  cardUrl.value = await drawCard(result.value)
}

function wrapText(ctx, text, maxWidth) {
  const lines = []
  let line = ''
  for (const char of text) {
    if (ctx.measureText(line + char).width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line += char
    }
  }
  if (line) lines.push(line)
  return lines
}

// 求财祝福卡：红底金字，可下载分享
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function drawCard(data) {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 1260
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const serif = "'Noto Serif SC', 'Source Han Serif CN', STSong, SimSun, serif"

  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height)
  bg.addColorStop(0, '#8e0f12')
  bg.addColorStop(0.55, '#b8161b')
  bg.addColorStop(1, '#6d0a0d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = '#f2c879'
  ctx.lineWidth = 6
  ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72)
  ctx.lineWidth = 2
  ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108)

  const figure = data.image ? await loadImage(data.image) : null
  if (figure) {
    // 神像放在标题和祝福语之间，宽度让开两侧对联
    const maxH = 420
    const maxW = 500
    const scale = Math.min(maxW / figure.width, maxH / figure.height)
    const w = figure.width * scale
    const h = figure.height * scale
    const glow = ctx.createRadialGradient(canvas.width / 2, 600, 40, canvas.width / 2, 600, 300)
    glow.addColorStop(0, 'rgba(255, 210, 110, 0.45)')
    glow.addColorStop(1, 'rgba(255, 210, 110, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(100, 360, canvas.width - 200, 460)
    ctx.drawImage(figure, (canvas.width - w) / 2, 800 - h, w, h)
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = '#fdecc1'
  ctx.font = `bold 44px ${serif}`
  ctx.fillText(data.couplet[2], canvas.width / 2, 140)

  ctx.fillStyle = '#ffd86b'
  ctx.font = `bold 96px ${serif}`
  ctx.fillText('求财祝福', canvas.width / 2, 270)

  ctx.fillStyle = '#fdecc1'
  ctx.font = `36px ${serif}`
  ctx.fillText(`敬拜 ${data.deity} · ${data.scene}`, canvas.width / 2, 340)

  // 两侧对联（竖排）
  ctx.font = `bold 40px ${serif}`
  ctx.fillStyle = '#ffd86b'
  const drawVertical = (text, x) => {
    ;[...text].forEach((char, index) => ctx.fillText(char, x, 430 + index * 56))
  }
  drawVertical(data.couplet[0], 120)
  drawVertical(data.couplet[1], canvas.width - 120)

  ctx.fillStyle = '#fff4dc'
  ctx.font = `34px ${serif}`
  const lines = wrapText(ctx, data.blessing, 600)
  lines.slice(0, 4).forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, 870 + index * 50)
  })

  ctx.fillStyle = '#ffd86b'
  ctx.font = `bold 52px ${serif}`
  ctx.fillText(`${data.name} 鸿运当头`, canvas.width / 2, 1095)

  ctx.fillStyle = '#fdecc1'
  ctx.font = `28px ${serif}`
  ctx.fillText(`${data.date} · fopusha.com 求财祈福`, canvas.width / 2, 1170)

  try {
    return canvas.toDataURL('image/png')
  } catch {
    return ''
  }
}

function resetAll() {
  done.value = {}
  qi.value = 0
  bowCount.value = 0
  bowlCelebrated.value = false
  result.value = null
  cardUrl.value = ''
  form.value.wish = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  document.title = '求财祈福｜在线拜财神、祈求财运亨通 - fopusha.com'
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    '在线拜财神求财：选择赵公明、关公、文财神、五路财神、福禄寿、黄财神或土地公，上香、点灯、献元宝、投金币、摇钱树，写下求财心愿，领取专属求财祝福卡。'
  )
  loadStats()
  preloadPose(deity.value)
  form.value.name = getViewerProfile()?.username || ''
  warmApi()
  loadWall()
})

onBeforeUnmount(() => {
  clearTimeout(toastTimer)
  clearTimeout(poseTimer)
})
</script>

<template>
  <main class="qiucai-shell">
    <nav class="top-nav">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <span>/</span>
      <span>求财专区</span>
    </nav>

    <header class="qc-hero">
      <p class="qc-kicker">求财专区 · 在线拜财神</p>
      <h1>求财祈福</h1>
      <p class="hero-text">
        选一位财神，上香、点灯、供果、献元宝，再投金币、摇钱树，写下你的求财心愿，领一张专属求财祝福卡。
      </p>
      <div class="qc-today">
        <span>今日 {{ todayInfo.ganzhi }}</span>
        <span>财神方位：<strong>{{ todayInfo.direction }}</strong></span>
        <span v-if="stats.streak">已连拜 <strong>{{ stats.streak }}</strong> 天</span>
        <span v-if="stats.totalQi">累计财气 <strong>{{ stats.totalQi }}</strong></span>
      </div>
    </header>

    <section class="qc-deities" aria-label="选择财神">
      <button
        v-for="item in CAISHEN"
        :key="item.key"
        type="button"
        class="qc-deity"
        :class="{ active: deity.key === item.key }"
        @click="chooseDeity(item)"
      >
        <img v-if="item.avatar" :src="item.avatar" :alt="item.name" class="qc-deity__seal" loading="lazy" decoding="async" />
        <span v-else class="qc-deity__seal">{{ item.name.slice(0, 1) }}</span>
        <span class="qc-deity__name">{{ item.name }}</span>
        <span class="qc-deity__title">{{ item.title }}</span>
      </button>
    </section>

    <section class="qc-altar card">
      <div class="qc-stage" :class="[`fx-${effect}`, { lit: done.lamp, smoking: done.incense, full: bowlFull }]">
        <img :src="QIUCAI_BG" alt="" class="qc-stage__bg" aria-hidden="true" />
        <div :key="'aura-' + aura" class="qc-aura" :class="{ on: aura > 0, steady: blessing }" aria-hidden="true">
          <span class="qc-aura__rays"></span>
          <span class="qc-aura__ring"></span>
        </div>
        <Transition name="pose" type="transition" :duration="400">
          <img
            :key="deity.key + (showPose ? '-pose' : '')"
            :src="showPose ? deity.pose : deity.image"
            :alt="`${deity.name}三维立体像`"
            class="qc-stage__img"
            :class="{ blessing: showPose }"
          />
        </Transition>
        <div class="qc-stage__glow" aria-hidden="true"></div>
        <div class="qc-stage__smoke" aria-hidden="true"></div>
        <img v-if="done.lamp" :src="PROP('lamp')" alt="" class="qc-prop qc-prop--lamp-l" aria-hidden="true" />
        <img v-if="done.lamp" :src="PROP('lamp')" alt="" class="qc-prop qc-prop--lamp-r" aria-hidden="true" />
        <div class="qc-stage__offerings" aria-hidden="true">
          <img v-if="done.fruit" :src="PROP('fruit')" alt="" class="qc-prop" />
          <img v-if="done.incense" :src="PROP('incense')" alt="" class="qc-prop" />
          <img v-if="done.ingot" :src="PROP('ingot')" alt="" class="qc-prop" />
          <img v-if="done.tree" :src="PROP('tree')" alt="" class="qc-prop" />
        </div>
        <div class="qc-particles" aria-hidden="true">
          <span
            v-for="p in particles"
            :key="p.id"
            class="qc-particle"
            :style="{ left: p.left + '%', animationDelay: p.delay + 's', animationDuration: p.duration + 's', fontSize: p.size + 'px' }"
          ><img v-if="p.symbol.length > 2" :src="PROP(p.symbol)" alt="" /><template v-else>{{ p.symbol }}</template></span>
        </div>
        <p v-if="toast" class="qc-toast" role="status">{{ toast }}</p>
        <div class="qc-stage__label">
          <strong>{{ deity.name }}</strong>
          <span>{{ deity.short }}</span>
        </div>
      </div>

      <div class="qc-panel">
        <h2>祈福方式</h2>
        <div class="qc-ways">
          <button
            v-for="way in QIUCAI_WAYS"
            :key="way.key"
            type="button"
            class="qc-way"
            :class="{ done: done[way.key] && !way.repeat }"
            @click="act(way)"
          >
            <img v-if="way.img" :src="way.img" alt="" class="qc-way__img" />
            <span v-else class="qc-way__icon">{{ way.icon }}</span>
            <span>{{ way.label }}</span>
            <small v-if="way.repeat">可多次</small>
            <small v-else-if="done[way.key]">已完成</small>
          </button>
        </div>

        <div class="qc-bowl" :aria-label="`聚宝盆财气 ${bowlPercent}%`">
          <div class="qc-bowl__head">
            <span class="qc-bowl__name"><img :src="PROP('bowl')" alt="" />聚宝盆</span>
            <span>{{ bowlFull ? '已满 · 财气圆满' : `财气 ${qi} / ${BOWL_FULL}` }}</span>
          </div>
          <div class="qc-bowl__bar"><span :style="{ width: bowlPercent + '%' }"></span></div>
        </div>

        <p v-if="reachedMilestone" class="qc-milestone">🎉 {{ reachedMilestone.text }}</p>
        <p v-else-if="nextMilestone" class="qc-milestone qc-milestone--next">
          再拜 {{ nextMilestone.days - stats.streak }} 天：{{ nextMilestone.text }}
        </p>

        <hr class="qc-divider" />

        <form v-if="!result" class="qc-form" @submit.prevent="submit">
          <h2>写下求财心愿</h2>
          <label class="field-label" for="qc-name">你的名字或称呼</label>
          <input id="qc-name" v-model="form.name" class="field" maxlength="20" autocomplete="nickname" placeholder="例如：王先生" />

          <span class="field-label">求财方向</span>
          <div class="qc-scenes">
            <button
              v-for="item in QIUCAI_SCENES"
              :key="item.key"
              type="button"
              class="qc-scene"
              :class="{ active: form.scene === item.key }"
              @click="form.scene = item.key"
            >{{ item.label }}</button>
          </div>

          <label class="field-label" for="qc-wish">想说的话（选填）</label>
          <textarea id="qc-wish" v-model="form.wish" class="field" rows="3" maxlength="200" placeholder="不填也可以，会为你配一段吉祥祝福"></textarea>

          <p v-if="submitError" class="error-msg">{{ submitError }}</p>
          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? '祈福中……' : '诚心祈愿，领取祝福卡' }}
          </button>
          <p class="qc-note">名字会显示在求财祈愿墙上（只显示首字）。请不要填写住址、证件等隐私信息。</p>
        </form>

        <div v-else class="qc-result">
          <h2>{{ result.name }}，祈愿已圆满</h2>
          <p class="qc-result__blessing">{{ result.blessing }}</p>
          <p class="qc-result__couplet">{{ result.couplet[0] }}　{{ result.couplet[1] }}　· {{ result.couplet[2] }}</p>
          <img v-if="cardUrl" :src="cardUrl" alt="求财祝福卡" class="qc-card" />
          <div class="qc-result__btns">
            <a v-if="cardUrl" :href="cardUrl" :download="`求财祝福卡-${result.name}.png`" class="submit-btn">保存祝福卡</a>
            <button type="button" class="ghost-btn" @click="anotherBlessing">换一句祝福</button>
            <button type="button" class="ghost-btn" @click="resetAll">再拜一次</button>
          </div>
        </div>
      </div>
    </section>

    <section class="card qc-info">
      <h2>{{ deity.name }} · {{ deity.title }}</h2>
      <p>{{ deity.desc }}</p>
      <p v-if="deity.day" class="qc-day">{{ deity.day }}</p>
    </section>

    <section v-if="wall.length" class="card qc-wall" aria-labelledby="qc-wall-title">
      <h2 id="qc-wall-title">求财祈愿墙</h2>
      <ul>
        <li v-for="item in wall" :key="item.id">
          <strong>{{ maskName(item.username) }}</strong>
          <span>{{ item.target || '求财' }}</span>
          <p>{{ item.wish }}</p>
        </li>
      </ul>
    </section>

    <section class="card qc-article">
      <section v-for="block in QIUCAI_ARTICLE" :key="block.title" class="copy-section">
        <h2>{{ block.title }}</h2>
        <p v-for="paragraph in block.paragraphs" :key="paragraph">{{ paragraph }}</p>
      </section>

      <section class="copy-section">
        <h2>各路财神怎么选</h2>
        <div class="qc-deity-list">
          <article v-for="item in CAISHEN" :key="item.key">
            <h3>{{ item.name }}（{{ item.title }}）</h3>
            <p>{{ item.short }}</p>
          </article>
        </div>
      </section>

      <section class="copy-section">
        <h2>求财祈福常见问题</h2>
        <article v-for="faq in QIUCAI_FAQS" :key="faq.q" class="faq-item">
          <h3>{{ faq.q }}</h3>
          <p>{{ faq.a }}</p>
        </article>
      </section>

      <p class="qc-note">求财祈福是表达心愿的方式，不能保证结果；理财投资请量力而行，必要时咨询专业人士。</p>
    </section>
  </main>
</template>

<style scoped>
.qiucai-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 64px;
  display: grid;
  gap: 20px;
}

.top-nav { display: flex; gap: 8px; color: var(--text-muted); font-size: 14px; }

.qc-hero {
  text-align: center;
  padding: 36px 20px 20px;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(60, 6, 8, 0.55), rgba(40, 4, 6, 0.92)),
    url('/qiucai/caishen-hero.webp?v=1') center 25% / cover no-repeat;
  border: 1px solid rgba(255, 210, 120, 0.35);
}

.qc-kicker { color: #ffd86b; letter-spacing: 0.2em; font-size: 14px; }
.qc-hero h1 { font-size: clamp(40px, 7vw, 64px); color: #ffe08a; text-shadow: 0 4px 24px rgba(255, 180, 40, 0.45); margin: 6px 0; }
.hero-text { max-width: 640px; margin: 0 auto; color: #fbe9c8; }

.qc-today {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}
.qc-today span {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 216, 107, 0.35);
  font-size: 14px;
}
.qc-today strong { color: #ffd86b; }

.qc-deities {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.qc-deity {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 12px 6px;
  border-radius: 16px;
  border: 1px solid rgba(255, 216, 107, 0.2);
  background: rgba(60, 12, 14, 0.7);
  color: var(--text);
  transition: transform 0.2s, border-color 0.2s;
}
.qc-deity:hover { transform: translateY(-3px); }
.qc-deity.active { border-color: #ffd86b; background: linear-gradient(180deg, #8e1215, #4a0a0c); }
.qc-deity__seal {
  width: 64px; height: 64px; border-radius: 50%;
  display: grid; place-items: center;
  font-size: 24px; font-weight: 700; color: #5a0b0e;
  background: radial-gradient(circle at 35% 30%, #fff1b8, #e6a92e);
  box-shadow: 0 4px 14px rgba(255, 190, 60, 0.4);
  object-fit: cover;
  border: 2px solid #ffd86b;
}
.qc-deity__name { font-weight: 700; }
.qc-deity__title { font-size: 12px; color: var(--text-muted); text-align: center; }

.qc-altar {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 24px;
  padding: 20px;
}

.qc-stage {
  position: relative;
  justify-self: center;
  width: min(100%, calc(82vh * 2 / 3));
  aspect-ratio: 2 / 3;
  border-radius: 20px;
  overflow: hidden;
  background: #2a0708;
}
.qc-stage__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7); transition: filter 0.6s; }
.qc-stage.lit .qc-stage__bg { filter: brightness(0.95); }
.qc-stage__img {
  position: absolute; left: 50%; top: 5%; transform: translateX(-50%);
  height: 50%; width: auto; max-width: 80%; object-fit: contain; object-position: bottom;
  filter: brightness(0.9) drop-shadow(0 12px 30px rgba(0, 0, 0, 0.55));
  transition: filter 0.6s;
  animation: appear 0.6s ease both;
}
.qc-stage__glow {
  position: absolute; inset: 0; pointer-events: none; opacity: 0;
  background: radial-gradient(circle at 50% 70%, rgba(255, 200, 80, 0.55), transparent 55%);
  transition: opacity 0.8s;
}
.qc-stage.lit .qc-stage__glow { opacity: 1; }
.qc-stage.full .qc-stage__glow { opacity: 1; animation: pulse 1.8s ease-in-out infinite; }
.qc-stage__smoke {
  position: absolute; left: 50%; bottom: 22%; width: 60px; height: 160px; margin-left: -30px;
  opacity: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 100%, rgba(255, 255, 255, 0.35), transparent 70%);
  filter: blur(8px);
}
.qc-stage.smoking .qc-stage__smoke { opacity: 1; animation: smoke 3.2s ease-in-out infinite; }
.qc-stage__offerings {
  position: absolute; left: 0; right: 0; bottom: 30%;
  display: flex; justify-content: center; gap: 18px; font-size: 34px;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
}
.qc-stage__offerings { align-items: flex-end; }
.qc-prop { width: 15%; max-width: 92px; height: auto; animation: drop-in 0.5s ease both; filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.5)); }
.qc-prop--lamp-l, .qc-prop--lamp-r { position: absolute; top: 36%; width: 13%; animation: drop-in 0.6s ease both, sway 3s ease-in-out infinite; }
.qc-prop--lamp-l { left: 4%; }
.qc-prop--lamp-r { right: 4%; }
.qc-particle img { width: 1em; height: 1em; object-fit: contain; }
.qc-way__img { width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.45)); }
.qc-bowl__name { display: inline-flex; align-items: center; gap: 6px; }
.qc-bowl__name img { width: 30px; height: 30px; object-fit: contain; }
.qc-stage__label {
  position: absolute; left: 0; right: 0; bottom: 0; text-align: center;
  padding: 14px 18px;
  background: linear-gradient(0deg, rgba(20, 2, 3, 0.9), transparent);
  display: grid; gap: 2px;
}
.qc-stage__label strong { color: #ffd86b; font-size: 20px; }
.qc-stage__label span { font-size: 14px; color: #fbe9c8; }
.qc-stage.fx-bow .qc-stage__img { animation: nod 0.6s ease; }
.qc-stage.lit .qc-stage__img, .qc-stage.full .qc-stage__img { filter: brightness(1.05) saturate(1.1) drop-shadow(0 0 28px rgba(255, 200, 80, 0.55)); }

.qc-aura {
  position: absolute; left: 50%; top: 4%; width: 78%; aspect-ratio: 1; transform: translateX(-50%);
  pointer-events: none; opacity: 0;
}
.qc-aura.on { animation: aura-flash 1.6s ease-out both; }
.qc-aura.steady { opacity: 1; animation: none; }
.qc-aura__rays, .qc-aura__ring { position: absolute; inset: 0; border-radius: 50%; }
.qc-aura__rays {
  background: repeating-conic-gradient(from 0deg, rgba(255, 220, 120, 0.42) 0deg 6deg, transparent 6deg 18deg);
  mask: radial-gradient(circle, #000 18%, transparent 70%);
  -webkit-mask: radial-gradient(circle, #000 18%, transparent 70%);
  animation: spin 18s linear infinite;
}
.qc-aura__ring { background: radial-gradient(circle, rgba(255, 236, 160, 0.75) 0%, rgba(255, 190, 60, 0.35) 32%, transparent 62%); }
.qc-stage__img.blessing { filter: brightness(1.08) saturate(1.15) drop-shadow(0 0 32px rgba(255, 210, 90, 0.75)) !important; }
.pose-enter-active, .pose-leave-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.pose-enter-from { opacity: 0; transform: translateX(-50%) scale(0.96); }
.pose-leave-to { opacity: 0; transform: translateX(-50%) scale(1.03); }

.qc-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.qc-particle { position: absolute; top: -40px; animation-name: fall; animation-timing-function: ease-in; animation-fill-mode: both; }

.qc-toast {
  position: absolute; left: 50%; top: 18px; transform: translateX(-50%);
  max-width: 90%;
  padding: 10px 18px; border-radius: 999px;
  background: rgba(90, 11, 14, 0.92); border: 1px solid #ffd86b;
  color: #ffe9b0; font-size: 15px; text-align: center;
  animation: drop-in 0.3s ease both;
}

.qc-panel { display: grid; gap: 14px; align-content: start; }
.qc-panel h2 { font-size: 20px; color: #ffd86b; }
.qc-ways { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.qc-way {
  display: grid; justify-items: center; gap: 2px;
  padding: 10px 4px; border-radius: 14px;
  border: 1px solid rgba(255, 216, 107, 0.3);
  background: linear-gradient(180deg, #7a1013, #4a0a0c);
  color: #fff3d6; font-size: 14px;
  transition: transform 0.15s;
}
.qc-way:active { transform: scale(0.94); }
.qc-way.done { opacity: 0.6; }
.qc-way__icon { font-size: 26px; }
.qc-way small { font-size: 11px; color: #f5d68f; }

.qc-bowl__head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
.qc-bowl__bar { height: 12px; border-radius: 999px; background: rgba(0, 0, 0, 0.35); overflow: hidden; }
.qc-bowl__bar span { display: block; height: 100%; background: linear-gradient(90deg, #e6a92e, #ffe08a); transition: width 0.5s ease; }

.qc-milestone { font-size: 14px; color: #ffe08a; }
.qc-milestone--next { color: var(--text-muted); }
.qc-divider { border: 0; border-top: 1px solid rgba(255, 216, 107, 0.2); }

.qc-form { display: grid; gap: 8px; }
.field-label { font-size: 14px; color: var(--text-muted); }
.field {
  width: 100%; padding: 10px 12px;
  border: 1px solid rgba(255, 216, 107, 0.3);
  background: rgba(0, 0, 0, 0.3); color: var(--text); font: inherit;
}
.qc-scenes { display: flex; flex-wrap: wrap; gap: 6px; }
.qc-scene {
  padding: 6px 12px; border-radius: 999px;
  border: 1px solid rgba(255, 216, 107, 0.3);
  background: transparent; color: var(--text); font-size: 14px;
}
.qc-scene.active { background: #b8161b; border-color: #ffd86b; color: #ffe9b0; }
.submit-btn {
  display: inline-block; text-align: center;
  padding: 12px 18px; border: 0;
  background: linear-gradient(180deg, #ffd86b, #e6a92e);
  color: #4a0a0c; font-weight: 700; font-size: 16px;
  border-radius: 12px;
}
.submit-btn:disabled { opacity: 0.6; }
.ghost-btn {
  padding: 12px 16px; border-radius: 12px;
  border: 1px solid rgba(255, 216, 107, 0.4);
  background: transparent; color: #ffe9b0;
}
.error-msg { color: #ff9f8f; font-size: 14px; }
.qc-note { font-size: 13px; color: var(--text-muted); }

.qc-result { display: grid; gap: 10px; }
.qc-result__blessing { font-size: 17px; line-height: 1.8; color: #fff3d6; }
.qc-result__couplet { color: #ffd86b; }
.qc-card { width: 100%; max-width: 360px; border-radius: 12px; justify-self: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
.qc-result__btns { display: flex; flex-wrap: wrap; gap: 8px; }

.qc-info h2, .qc-wall h2, .qc-article h2 { color: #ffd86b; font-size: 22px; margin-bottom: 10px; }
.qc-info p { line-height: 1.8; }
.qc-day { margin-top: 8px; color: #ffe08a; }

.qc-wall ul { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.qc-wall li { padding: 12px; border-radius: 14px; background: rgba(90, 11, 14, 0.45); border: 1px solid rgba(255, 216, 107, 0.18); }
.qc-wall li span { margin-left: 8px; font-size: 12px; color: #ffd86b; }
.qc-wall li p { margin-top: 6px; font-size: 14px; color: var(--text-muted); overflow-wrap: anywhere; }

.qc-article { display: grid; gap: 22px; }
.copy-section p { line-height: 1.9; margin-bottom: 8px; }
.qc-deity-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.qc-deity-list h3, .faq-item h3 { font-size: 16px; color: #ffe9b0; margin-bottom: 4px; }
.faq-item { margin-bottom: 12px; }

@keyframes fall {
  0% { transform: translateY(0) rotate(0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(560px) rotate(300deg); opacity: 0.2; }
}
@keyframes drop-in { from { transform: translateY(-12px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes smoke { 0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.7; } 50% { transform: translateY(-30px) scaleX(1.3); opacity: 0.3; } }
@keyframes aura-flash { 0% { opacity: 0; transform: translateX(-50%) scale(0.7); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateX(-50%) scale(1.15); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes sway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
@keyframes nod { 0%, 100% { transform: translateX(-50%); } 50% { transform: translateX(-50%) translateY(6px) scale(0.99); } }
@keyframes appear { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%); } }

@media (max-width: 860px) {
  .qc-deities { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .qc-altar { grid-template-columns: 1fr; padding: 12px; }
  .card { padding: 20px; }
}
@media (max-width: 420px) {
  .qc-ways { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .qc-way { font-size: 12px; }
}
</style>
