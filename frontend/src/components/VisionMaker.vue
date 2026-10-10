<script setup>
// 愿景图：拜完全部财神后解锁。选职业和祥瑞主题、填年龄（可上传本人照片），
// 由 /api/vision 生成一张没有文字的成功场景图，再在下方印上名字、祝福语和日期，供下载。
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { PROFESSIONS, THEMES } from '../data/vision.js'

const props = defineProps({
  unlocked: { type: Boolean, default: false },
  doneCount: { type: Number, default: 0 },
  total: { type: Number, default: 8 },
  defaultName: { type: String, default: '' },
})

const profession = ref(PROFESSIONS[0].key)
const theme = ref(THEMES[0].key)
const custom = ref('')
const gender = ref('male')
const age = ref('')
const name = ref(props.defaultName)
const photoBlob = ref(null)
const photoPreview = ref('')
const consent = ref(false)

const loading = ref(false)
const waitSeconds = ref(0)
const error = ref('')
const cardUrl = ref('')
const left = ref(null)
let waitTimer = null

// 人机验证（Cloudflare Turnstile）：生成按钮只有在验证通过后才可用；每次请求后令牌作废，需要重置
const TURNSTILE_SITEKEY = '0x4AAAAAAFTPZcHYy05xhtbB'
const turnstileBox = ref(null)
const turnstileToken = ref('')
let turnstileId = null

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!window.__turnstileLoading) {
    window.__turnstileLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => resolve(window.turnstile)
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  return window.__turnstileLoading
}

async function renderTurnstile() {
  await nextTick()
  if (!turnstileBox.value || turnstileId !== null) return
  try {
    const turnstile = await loadTurnstile()
    turnstileId = turnstile.render(turnstileBox.value, {
      sitekey: TURNSTILE_SITEKEY,
      action: 'turnstile-spin-v1',
      language: 'zh-cn',
      callback: (token) => { turnstileToken.value = token },
      'expired-callback': () => { turnstileToken.value = '' },
      'error-callback': () => { turnstileToken.value = '' },
    })
  } catch {
    error.value = '人机验证加载失败，请刷新页面再试。'
  }
}

function resetTurnstile() {
  turnstileToken.value = ''
  if (window.turnstile && turnstileId !== null) window.turnstile.reset(turnstileId)
}

function removeTurnstile() {
  if (window.turnstile && turnstileId !== null) window.turnstile.remove(turnstileId)
  turnstileId = null
  turnstileToken.value = ''
}

const current = computed(() => PROFESSIONS.find((p) => p.key === profession.value))
const currentTheme = computed(() => THEMES.find((t) => t.key === theme.value) || THEMES[0])
const waitText = computed(() => {
  const lines = ['财神正在为你铺纸研墨……', '正在描绘你的成功场面……', '金光加持中，马上就好……', '再等几秒，好事不怕晚……']
  return lines[Math.min(lines.length - 1, Math.floor(waitSeconds.value / 8))]
})

// 表单出现时渲染验证框，表单消失（出结果）时移除
watch(
  () => props.unlocked && !cardUrl.value,
  (visible) => (visible ? renderTurnstile() : removeTurnstile()),
  { immediate: true }
)

watch(() => props.defaultName, (value) => {
  if (!name.value) name.value = value
})

// 照片在本地先缩到 512px 以内再上传（模型要求，也省流量）；只用于这一次生成
function pickPhoto(event) {
  const file = event.target.files?.[0]
  error.value = ''
  if (!file) return
  if (!/^image\//.test(file.type)) {
    error.value = '请选择一张图片。'
    return
  }
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.onload = () => {
    const scale = Math.min(1, 512 / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      photoBlob.value = blob
      photoPreview.value = canvas.toDataURL('image/jpeg', 0.85)
      URL.revokeObjectURL(url)
    }, 'image/jpeg', 0.88)
  }
  img.onerror = () => {
    error.value = '这张照片读不出来，请换一张。'
    URL.revokeObjectURL(url)
  }
  img.src = url
}

function clearPhoto() {
  photoBlob.value = null
  photoPreview.value = ''
  consent.value = false
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wrap(ctx, text, maxWidth) {
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

// AI 图在上，下方红底印字：名字、祝福语、日期、AI 祈愿图标记
async function composeCard(imageSrc) {
  const img = await loadImage(imageSrc)
  const W = 900
  const imgH = Math.round((img.height * W) / img.width)
  const bandH = 260
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = imgH + bandH
  const ctx = canvas.getContext('2d')
  const serif = "'Noto Serif SC', 'Source Han Serif CN', STSong, SimSun, serif"
  ctx.drawImage(img, 0, 0, W, imgH)

  const band = ctx.createLinearGradient(0, imgH, 0, imgH + bandH)
  band.addColorStop(0, '#9e1b1f')
  band.addColorStop(1, '#6d0a0d')
  ctx.fillStyle = band
  ctx.fillRect(0, imgH, W, bandH)
  ctx.fillStyle = '#e6b866'
  ctx.fillRect(0, imgH, W, 6)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffd86b'
  ctx.font = `bold 50px ${serif}`
  ctx.fillText(`${name.value.trim() || '有缘人'} · ${currentTheme.value.label}`, W / 2, imgH + 78)
  ctx.fillStyle = '#fff3d6'
  ctx.font = `34px ${serif}`
  wrap(ctx, `${currentTheme.value.blessing}；${current.value.wish}`, W - 120).slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, W / 2, imgH + 140 + i * 46)
  })
  const d = new Date()
  ctx.fillStyle = 'rgba(253, 236, 193, 0.85)'
  ctx.font = `24px ${serif}`
  ctx.fillText(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} · AI 祈愿图 · fopusha.com`, W / 2, imgH + bandH - 26)
  return canvas.toDataURL('image/jpeg', 0.9)
}

async function generate() {
  error.value = ''
  const ageNum = Number(age.value)
  if (!ageNum || ageNum < 18 || ageNum > 100) {
    error.value = '愿景图需要年满 18 岁，请填写年龄。'
    return
  }
  if (profession.value === 'other' && !custom.value.trim()) {
    error.value = '请写一下你做的是哪一行。'
    return
  }
  if (!turnstileToken.value) {
    error.value = '请先完成下方的人机验证。'
    return
  }
  if (photoBlob.value && !consent.value) {
    error.value = '上传照片前，请勾选确认这是你本人或已获本人同意。'
    return
  }
  const form = new FormData()
  form.append('profession', profession.value)
  form.append('theme', theme.value)
  form.append('custom', custom.value.trim())
  form.append('gender', gender.value)
  form.append('age', String(ageNum))
  form.append('cf-turnstile-response', turnstileToken.value)
  if (photoBlob.value) {
    form.append('photo', photoBlob.value, 'photo.jpg')
    form.append('consent', consent.value ? 'yes' : 'no')
  }
  loading.value = true
  cardUrl.value = ''
  waitSeconds.value = 0
  waitTimer = setInterval(() => {
    waitSeconds.value += 1
  }, 1000)
  try {
    const response = await fetch('/api/vision', { method: 'POST', body: form })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.image) throw new Error(data.error || '生成没有成功，请稍后再试。')
    left.value = data.left
    cardUrl.value = await composeCard(data.image)
  } catch (err) {
    error.value = err.message || '生成没有成功，请稍后再试。'
  } finally {
    clearInterval(waitTimer)
    loading.value = false
    resetTurnstile()
  }
}

onBeforeUnmount(() => {
  clearInterval(waitTimer)
  removeTurnstile()
})
</script>

<template>
  <section class="card vision" aria-labelledby="vision-title">
    <p class="vision-kicker">拜完全部财神解锁</p>
    <h2 id="vision-title">生成你的成功愿景图</h2>

    <div v-if="!unlocked" class="vision-locked">
      <p>八位神仙都拜圆满（供养四样、叩拜三下），就能解锁：为你画一张专属的祥瑞愿景图，龙凤呈祥、黄袍加身、金银满屋……再把你的行业化作画中的吉祥象征。</p>
      <div class="vision-progress"><span :style="{ width: (doneCount / total) * 100 + '%' }"></span></div>
      <p class="vision-progress__text">已圆满 {{ doneCount }} / {{ total }} 位</p>
    </div>

    <template v-else>
      <p class="vision-lead">选一个祥瑞主题和你的职业，财神为你画一张专属愿景图。图上的字由我们另外印上，可以下载保存。</p>

      <form v-if="!cardUrl" class="vision-form" @submit.prevent="generate">
        <span class="field-label">你的职业</span>
        <div class="chips">
          <button v-for="p in PROFESSIONS" :key="p.key" type="button" class="chip" :class="{ active: profession === p.key }" @click="profession = p.key">{{ p.label }}</button>
        </div>
        <input v-if="profession === 'other'" v-model="custom" class="field" maxlength="20" placeholder="你做哪一行？例如：美容院、装修、保险" />

        <span class="field-label">祥瑞主题</span>
        <div class="chips">
          <button v-for="t in THEMES" :key="t.key" type="button" class="chip" :class="{ active: theme === t.key }" @click="theme = t.key">{{ t.label }}</button>
        </div>

        <div class="vision-row">
          <label class="field-label">名字（印在图下方）
            <input v-model="name" class="field" maxlength="12" placeholder="例如：王先生" />
          </label>
          <label class="field-label">年龄
            <input v-model="age" class="field" inputmode="numeric" maxlength="3" placeholder="例如：45" />
          </label>
          <div class="field-label">性别
            <div class="chips">
              <button type="button" class="chip" :class="{ active: gender === 'male' }" @click="gender = 'male'">男</button>
              <button type="button" class="chip" :class="{ active: gender === 'female' }" @click="gender = 'female'">女</button>
            </div>
          </div>
        </div>

        <div class="vision-photo">
          <span class="field-label">上传一张本人照片（选填，画出来更像你）</span>
          <div v-if="photoPreview" class="vision-photo__preview">
            <img :src="photoPreview" alt="已选择的照片" />
            <button type="button" class="ghost-btn" @click="clearPhoto">换一张 / 不用照片</button>
          </div>
          <input v-else type="file" accept="image/*" class="field" @change="pickPhoto" />
          <label v-if="photoPreview" class="vision-consent">
            <input v-model="consent" type="checkbox" />
            这是我本人的照片，或已获得本人同意。照片只用于这一次生成，不会保存。
          </label>
        </div>

        <div ref="turnstileBox" class="vision-turnstile" data-action="turnstile-spin-v1"></div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="submit-btn" :disabled="loading || !turnstileToken">
          {{ loading ? waitText + '（' + waitSeconds + ' 秒）' : '生成我的愿景图' }}
        </button>
        <p class="qc-note">愿景图由 AI 生成，是祝福和心愿的寄托，不代表任何结果。每人每天可生成 2 张。</p>
      </form>

      <div v-else class="vision-result">
        <img :src="cardUrl" alt="我的成功愿景图" />
        <div class="vision-result__btns">
          <a :href="cardUrl" :download="`愿景图-${name || '有缘人'}.jpg`" class="submit-btn">下载愿景图</a>
          <button v-if="left !== 0" type="button" class="ghost-btn" @click="cardUrl = ''">换个主题再画一张</button>
        </div>
        <p v-if="left !== null" class="qc-note">今天还可以生成 {{ left }} 张。</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.vision { display: grid; gap: 12px; }
.vision-kicker { color: #e6b866; letter-spacing: 0.12em; font-size: 13px; }
.vision h2 { color: #ffd86b; font-size: 22px; }
.vision-lead, .vision-locked p { line-height: 1.8; color: #fbe9c8; }
.vision-progress { height: 10px; border-radius: 999px; background: rgba(0, 0, 0, 0.35); overflow: hidden; }
.vision-progress span { display: block; height: 100%; background: linear-gradient(90deg, #e6a92e, #ffe08a); transition: width 0.5s; }
.vision-progress__text { font-size: 14px; color: #ffe08a !important; }
.vision-form { display: grid; gap: 10px; }
.field-label { display: grid; gap: 6px; font-size: 14px; color: var(--text-muted); }
.field {
  width: 100%; padding: 10px 12px; border-radius: 12px;
  border: 1px solid rgba(255, 216, 107, 0.3);
  background: rgba(0, 0, 0, 0.3); color: var(--text); font: inherit;
}
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  padding: 6px 12px; border-radius: 999px;
  border: 1px solid rgba(255, 216, 107, 0.3);
  background: transparent; color: var(--text); font-size: 14px;
}
.chip.active { background: #b8161b; border-color: #ffd86b; color: #ffe9b0; }
.vision-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.vision-photo { display: grid; gap: 8px; }
.vision-photo__preview { display: flex; align-items: center; gap: 12px; }
.vision-photo__preview img { width: 72px; height: 72px; object-fit: cover; border-radius: 12px; }
.vision-consent { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; color: #fbe9c8; line-height: 1.6; }
.submit-btn {
  display: inline-block; text-align: center; padding: 12px 18px; border: 0; border-radius: 12px;
  background: linear-gradient(180deg, #ffd86b, #e6a92e); color: #4a0a0c; font-weight: 700; font-size: 16px;
}
.submit-btn:disabled { opacity: 0.75; }
.ghost-btn { padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255, 216, 107, 0.4); background: transparent; color: #ffe9b0; }
.error-msg { color: #ff9f8f; font-size: 14px; }
.qc-note { font-size: 13px; color: var(--text-muted); }
.vision-turnstile { min-height: 65px; }
.vision-result { display: grid; gap: 10px; justify-items: center; }
.vision-result img { width: 100%; max-width: 420px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
.vision-result__btns { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
</style>
