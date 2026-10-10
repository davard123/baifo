<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BOWL_FULL,
  CAISHEN,
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
import VisionMaker from '../components/VisionMaker.vue'

const STORE_KEY = 'fopusha-qiucai-v1'
// 已拜圆满的神仙（供养四样 + 叩拜三下），全部圆满后解锁愿景图
const DEITY_DONE_KEY = 'fopusha-qiucai-deities-v1'
const FULL_OFFERINGS = ['incense', 'lamp', 'fruit', 'ingot']
const completedDeities = ref([])
const visionPreview = ref(false)

function loadCompleted() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEITY_DONE_KEY) || '[]')
    if (Array.isArray(saved)) completedDeities.value = saved
  } catch {
    completedDeities.value = []
  }
  // 测试用：网址带 ?vision-preview=1 时直接解锁
  visionPreview.value = new URLSearchParams(window.location.search).get('vision-preview') === '1'
}

function markDeityComplete(key) {
  if (completedDeities.value.includes(key)) return false
  completedDeities.value = [...completedDeities.value, key]
  try {
    localStorage.setItem(DEITY_DONE_KEY, JSON.stringify(completedDeities.value))
  } catch {
    // 存不了就只在本次页面内生效
  }
  return true
}

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

  if (FULL_OFFERINGS.every((key) => done.value[key]) && bowCount.value >= 3 && markDeityComplete(deity.value.key)) {
    const count = completedDeities.value.length
    const total = CAISHEN.length
    setTimeout(() => showToast(count >= total
      ? '八位神仙全部拜圆满！往下看，可以生成你的成功愿景图了。'
      : `${deity.value.name}已拜圆满（${count}/${total}），再去拜拜其他神仙吧。`), 1400)
  }

  if (bowlFull.value && !bowlCelebrated.value) {
    bowlCelebrated.value = true
    burst('full', 28)
    setTimeout(() => showToast('聚宝盆已满！财气圆满，写下你的求财心愿吧。'), 900)
  }
}

const fullRef = ref(null)

// 换一位神仙就重新开始：供养、财气、叩拜、赐福状态和已提交的心愿全部清掉，连拜天数保留
function resetRitual() {
  done.value = {}
  qi.value = 0
  bowCount.value = 0
  bowlCelebrated.value = false
  blessingUntil.value = 0
  clearTimeout(poseTimer)
  aura.value = 0
  effect.value = ''
  particles.value = []
  result.value = null
  cardUrl.value = ''
  form.value.wish = ''
}

function chooseDeity(item, scroll = false) {
  if (item.key !== deity.value.key) resetRitual()
  deity.value = item
  preloadPose(item)
  if (scroll) fullRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  resetRitual()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  document.title = '网上求财祈福｜在线拜财神、求财运求福寿 - fopusha.com'
  document.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    '网上求财、网上祈福，在线拜财神：选择赵公明、关公、文财神、五路财神、福星、禄星、寿星或黄财神，上香、点灯、献元宝、投金币、摇钱树，写下求财心愿，领取专属求财祝福卡。'
  )
  loadStats()
  loadCompleted()
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
    <section ref="fullRef" class="qc-full" aria-label="在线拜财神">
      <div class="qc-full__bar">
        <router-link to="/" class="qc-full__back">← 首页</router-link>
        <h1>求财祈福</h1>
        <span class="qc-full__today">
          <strong class="qc-full__deity">{{ deity.name }} · {{ deity.title }}</strong>
          <span>今日{{ todayInfo.ganzhi }} · 财神方位 <strong>{{ todayInfo.direction }}</strong></span>
        </span>
      </div>

      <div class="qc-stage" :class="[`fx-${effect}`, { lit: done.lamp, smoking: done.incense, full: bowlFull }]">
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
        <div class="qc-stage__smoke" aria-hidden="true"></div>
        <!-- 两侧叩拜的人（背影，面朝财神）：点一次叩拜，叩首一次后跪着停住 -->
        <div
          v-for="side in ['l', 'r']"
          :key="side"
          class="qc-worshipper"
          :class="[`qc-worshipper--${side}`, { shown: bowCount > 0 }]"
          aria-hidden="true"
        >
          <div :key="bowCount" class="qc-worshipper__poses" :class="{ bowing: bowCount > 0 }">
            <img class="qc-pose qc-pose--kneel" :src="`/ritual/${side === 'l' ? 'man' : 'woman'}-kneel.webp`" alt="" />
            <img class="qc-pose qc-pose--bow" :src="`/ritual/${side === 'l' ? 'man' : 'woman'}-bow.webp`" alt="" />
          </div>
        </div>
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
        <div class="qc-bowl-mini" :aria-label="`聚宝盆财气 ${bowlPercent}%`">
          <img :src="PROP('bowl')" alt="" />
          <span class="qc-bowl-mini__bar"><span :style="{ width: bowlPercent + '%' }"></span></span>
        </div>
      </div>

      <div class="qc-ways" role="group" aria-label="祈福方式">
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
        </button>
      </div>

      <div class="qc-deities" role="group" aria-label="选择财神，上方神像随之切换">
        <button
          v-for="item in CAISHEN"
          :key="item.key"
          type="button"
          class="qc-deity"
          :class="{ active: deity.key === item.key }"
          :aria-pressed="deity.key === item.key"
          @click="chooseDeity(item)"
        >
          <img v-if="item.avatar" :src="item.avatar" :alt="item.name" class="qc-deity__seal" decoding="async" />
          <span v-else class="qc-deity__seal">{{ item.name.slice(0, 1) }}</span>
          <span class="qc-deity__name">{{ item.name }}</span>
        </button>
      </div>
    </section>

    <section class="qc-altar card">
      <div class="qc-panel">
        <p class="hero-text">
          不用跑庙，网上求财、网上祈福几分钟就能完成：选一位财神，上香、点灯、供果、献元宝，再投金币、摇钱树，写下你的求财心愿，领一张专属求财祝福卡。
        </p>
        <div class="qc-bowl" :aria-label="`聚宝盆财气 ${bowlPercent}%`">
          <div class="qc-bowl__head">
            <span class="qc-bowl__name"><img :src="PROP('bowl')" alt="" />聚宝盆</span>
            <span>{{ bowlFull ? '已满 · 财气圆满' : `财气 ${qi} / ${BOWL_FULL}` }}</span>
          </div>
          <div class="qc-bowl__bar"><span :style="{ width: bowlPercent + '%' }"></span></div>
        </div>

        <p v-if="reachedMilestone" class="qc-milestone">🎉 {{ reachedMilestone.text }}</p>
        <p v-else-if="nextMilestone" class="qc-milestone qc-milestone--next">
          {{ stats.streak ? `已连拜 ${stats.streak} 天，` : '' }}再拜 {{ nextMilestone.days - stats.streak }} 天：{{ nextMilestone.text }}
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

    <VisionMaker
      :unlocked="visionPreview || completedDeities.length >= CAISHEN.length"
      :done-count="completedDeities.length"
      :total="CAISHEN.length"
      :default-name="form.name"
    />

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
          <article v-for="item in CAISHEN" :key="item.key" class="qc-deity-card" role="button" tabindex="0" @click="chooseDeity(item, true)" @keydown.enter="chooseDeity(item, true)">
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
  padding: 0 0 64px;
  display: grid;
  gap: 20px;
}

/* ===== 满屏拜财神：竖屏铺满，横屏等高 ===== */
.qc-full {
  --gold: #c99a2e;
  --red: #9e1b1f;
  justify-self: center;
  width: min(100vw, calc(100dvh * 0.68));
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #fffdf8;
  color: #5a1a12;
  overflow: hidden;
}

@media (max-aspect-ratio: 3/4) {
  .qc-full { width: 100vw; margin-inline: calc(50% - 50vw); }
}

@media (min-aspect-ratio: 3/4) {
  .qc-full { border-radius: 0 0 20px 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35); }
}

.qc-full__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(201, 154, 46, 0.25);
  flex: none;
}
.qc-full__back { color: var(--red); font-size: 14px; white-space: nowrap; }
.qc-full__bar h1 { font-size: 20px; color: var(--red); letter-spacing: 0.1em; }
.qc-full__today { margin-left: auto; display: grid; gap: 1px; font-size: 12px; color: #8a5a2b; text-align: right; }
.qc-full__deity { font-size: 15px; }
.qc-full__today strong { color: var(--red); }

.qc-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 42%, #fff6dc 0%, #fffdf8 62%);
}

.qc-stage__img {
  position: absolute;
  left: 50%;
  bottom: 9%;
  transform: translateX(-50%);
  height: 86%;
  width: auto;
  max-width: 94%;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 10px 18px rgba(120, 70, 10, 0.28));
  transition: filter 0.6s;
  animation: appear 0.6s ease both;
}
.qc-stage.lit .qc-stage__img,
.qc-stage.full .qc-stage__img { filter: drop-shadow(0 0 26px rgba(230, 170, 40, 0.65)); }
.qc-stage__img.blessing { filter: drop-shadow(0 0 30px rgba(240, 180, 40, 0.85)) !important; }
.qc-stage.fx-bow .qc-stage__img { animation: nod 0.6s ease; }

.qc-aura {
  position: absolute; left: 50%; top: 6%; width: 92%; aspect-ratio: 1; transform: translateX(-50%);
  pointer-events: none; opacity: 0;
}
.qc-aura.on { animation: aura-flash 1.6s ease-out both; }
.qc-aura.steady { opacity: 1; animation: none; }
.qc-aura__rays, .qc-aura__ring { position: absolute; inset: 0; border-radius: 50%; }
.qc-aura__rays {
  background: repeating-conic-gradient(from 0deg, rgba(240, 190, 60, 0.38) 0deg 6deg, transparent 6deg 18deg);
  mask: radial-gradient(circle, #000 16%, transparent 68%);
  -webkit-mask: radial-gradient(circle, #000 16%, transparent 68%);
  animation: spin 18s linear infinite;
}
.qc-aura__ring { background: radial-gradient(circle, rgba(255, 225, 140, 0.7) 0%, rgba(245, 190, 70, 0.3) 32%, transparent 62%); }

.qc-stage__smoke {
  position: absolute; left: 50%; bottom: 14%; width: 60px; height: 140px; margin-left: -30px;
  opacity: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 100%, rgba(150, 120, 90, 0.28), transparent 70%);
  filter: blur(8px);
}
.qc-stage.smoking .qc-stage__smoke { opacity: 1; animation: smoke 3.2s ease-in-out infinite; }

.qc-stage__offerings {
  position: absolute; left: 0; right: 0; bottom: 2%;
  display: flex; justify-content: center; align-items: flex-end; gap: 14px;
}
.qc-prop { width: 15%; max-width: 78px; height: auto; animation: drop-in 0.5s ease both; filter: drop-shadow(0 4px 6px rgba(90, 50, 0, 0.3)); }
.qc-prop--lamp-l, .qc-prop--lamp-r { position: absolute; top: 8%; width: 12%; max-width: 64px; animation: drop-in 0.6s ease both, sway 3s ease-in-out infinite; }
.qc-prop--lamp-l { left: 4%; }
.qc-prop--lamp-r { right: 4%; }

.qc-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.qc-particle { position: absolute; top: -40px; animation-name: fall; animation-timing-function: ease-in; animation-fill-mode: both; }
.qc-particle img { width: 1em; height: 1em; object-fit: contain; }

.qc-toast {
  position: absolute; left: 50%; top: 12px; transform: translateX(-50%);
  max-width: 90%; padding: 8px 16px; border-radius: 999px;
  background: rgba(158, 27, 31, 0.92); color: #ffe9b0; font-size: 14px; text-align: center;
  animation: drop-in 0.3s ease both; z-index: 3;
}

.qc-stage__label {
  position: absolute; left: 12px; top: 64px;
  display: grid; gap: 2px; max-width: 30%;
}
.qc-stage__label strong { font-size: 20px; color: var(--red); }
.qc-stage__label span { font-size: 12px; color: #8a5a2b; line-height: 1.4; }

.qc-bowl-mini { position: absolute; right: 12px; top: 14px; display: grid; justify-items: center; gap: 4px; width: 64px; }
.qc-bowl-mini img { width: 44px; height: 44px; object-fit: contain; }
.qc-bowl-mini__bar { width: 100%; height: 6px; border-radius: 999px; background: rgba(201, 154, 46, 0.2); overflow: hidden; }
.qc-bowl-mini__bar span { display: block; height: 100%; background: linear-gradient(90deg, #e6a92e, #f5c84c); transition: width 0.5s ease; }

/* 一排祈福方式 */
.qc-ways {
  flex: none;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  padding: 8px 8px 6px;
  border-top: 1px solid rgba(201, 154, 46, 0.25);
}
.qc-way {
  display: grid; justify-items: center; gap: 2px;
  padding: 6px 0; border-radius: 12px;
  border: 1px solid rgba(201, 154, 46, 0.35);
  background: #fff8e8; color: #7a2a16; font-size: 12px; white-space: nowrap;
  transition: transform 0.15s, background 0.2s;
}
.qc-way:active { transform: scale(0.92); }
.qc-way.done { background: #fbe7c0; opacity: 0.75; }
.qc-way__img { width: 32px; height: 32px; object-fit: contain; }
.qc-way__icon { font-size: 24px; line-height: 32px; }

/* 选择财神：在神像下方，点了上面换 */
.qc-deities {
  flex: none;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 4px;
  padding: 6px 8px 10px;
  background: #fdf3df;
}
.qc-deity {
  display: grid; justify-items: center; gap: 2px;
  padding: 4px 0; border: 0; border-radius: 12px;
  background: transparent; color: #7a2a16;
}
.qc-deity__seal {
  width: 44px; height: 44px; border-radius: 50%;
  object-fit: cover; display: grid; place-items: center;
  border: 2px solid transparent; background: #f3dfb0;
  transition: transform 0.2s, border-color 0.2s;
}
.qc-deity.active .qc-deity__seal { border-color: var(--red); transform: scale(1.12); box-shadow: 0 0 0 3px rgba(201, 154, 46, 0.45); }
.qc-deity__name { font-size: 11px; white-space: nowrap; }
.qc-deity.active .qc-deity__name { color: var(--red); font-weight: 700; }

/* ===== 满屏以下：心愿、祝福卡、介绍 ===== */
.qc-altar { padding: 24px; }
.qc-panel { display: grid; gap: 14px; max-width: 720px; margin: 0 auto; }
.qc-panel h2 { font-size: 20px; color: #ffd86b; }
.hero-text { color: #fbe9c8; line-height: 1.8; }
.qc-bowl__head { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
.qc-bowl__name { display: inline-flex; align-items: center; gap: 6px; }
.qc-bowl__name img { width: 30px; height: 30px; object-fit: contain; }
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
  color: #4a0a0c; font-weight: 700; font-size: 16px; border-radius: 12px;
}
.submit-btn:disabled { opacity: 0.6; }
.ghost-btn { padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255, 216, 107, 0.4); background: transparent; color: #ffe9b0; }
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
.qc-deity-card { cursor: pointer; padding: 10px; border-radius: 12px; border: 1px solid rgba(255, 216, 107, 0.15); }
.qc-deity-card:hover { border-color: rgba(255, 216, 107, 0.5); }
.qc-deity-list h3, .faq-item h3 { font-size: 16px; color: #ffe9b0; margin-bottom: 4px; }
.faq-item { margin-bottom: 12px; }

.pose-enter-active, .pose-leave-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.pose-enter-from { opacity: 0; transform: translateX(-50%) scale(0.96); }
.pose-leave-to { opacity: 0; transform: translateX(-50%) scale(1.03); }

@keyframes fall {
  0% { transform: translateY(0) rotate(0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(110vh) rotate(300deg); opacity: 0.2; }
}
@keyframes drop-in { from { transform: translateY(-12px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes smoke { 0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.7; } 50% { transform: translateY(-30px) scaleX(1.3); opacity: 0.3; } }
@keyframes aura-flash { 0% { opacity: 0; transform: translateX(-50%) scale(0.7); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateX(-50%) scale(1.15); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes sway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes nod { 0%, 100% { transform: translateX(-50%); } 50% { transform: translateX(-50%) translateY(6px) scale(0.99); } }
@keyframes appear { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%); } }

/* 叩拜的人：拜一下停一下（每次点击只播一遍：跪直 → 叩首 → 跪直） */
.qc-worshipper {
  position: absolute;
  bottom: 0;
  height: 30%;
  aspect-ratio: 0.75;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease, transform 0.6s ease;
  z-index: 2;
  pointer-events: none;
}
.qc-worshipper--l { left: 2%; }
.qc-worshipper--r { right: 2%; }
.qc-worshipper.shown { opacity: 1; transform: none; }
.qc-worshipper__poses { position: absolute; inset: 0; }
.qc-pose {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: contain; object-position: bottom center;
  filter: drop-shadow(0 4px 8px rgba(90, 50, 0, 0.3));
}
.qc-pose--bow { opacity: 0; }
.qc-worshipper__poses.bowing .qc-pose--kneel { animation: qc-kneel-once 1.6s ease-in-out both; }
.qc-worshipper__poses.bowing .qc-pose--bow { animation: qc-bow-once 1.6s ease-in-out both; }
@keyframes qc-kneel-once { 0%, 15% { opacity: 1; } 30%, 70% { opacity: 0; } 85%, 100% { opacity: 1; } }
@keyframes qc-bow-once { 0%, 15% { opacity: 0; } 30%, 70% { opacity: 1; } 85%, 100% { opacity: 0; } }

@media (max-width: 380px) {
  .qc-way { font-size: 11px; }
  .qc-way__img { width: 28px; height: 28px; }
  .qc-deity__seal { width: 38px; height: 38px; }
  .qc-deity__name { font-size: 10px; }
}
@media (max-width: 860px) {
  .card { padding: 20px; }
}
</style>
