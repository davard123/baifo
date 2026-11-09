// 念佛计数的本地存储。
//
// 刻意不入库：这是每天都会用的私人功课，跟站内「照片与姓名只保存在本地设备」
// 的隐私姿态保持一致，也免去登录门槛 —— 高频工具一旦要求注册就不高频了。

const KEY = 'fopusha_nianfo_v1'
const KEEP_DAYS = 30

export const CHANTS = [
  { key: 'amituofo', text: '南无阿弥陀佛', short: '弥陀' },
  { key: 'guanyin', text: '南无观世音菩萨', short: '观音' },
  { key: 'shakyamuni', text: '南无本师释迦牟尼佛', short: '本师' },
  { key: 'ksitigarbha', text: '南无地藏王菩萨', short: '地藏' },
  { key: 'medicine', text: '南无药师琉璃光如来', short: '药师' },
]

export const GOALS = [108, 300, 1080, 3000]

/** 用本地时区取日期键 —— 每日功课按用户自己的一天算。 */
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)
  return Math.round(ms / 86400000)
}

function emptyState() {
  return { total: 0, byDate: {}, lastDate: '', streak: 0, chant: 'amituofo', goal: 108, sound: false }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    return { ...emptyState(), ...parsed, byDate: parsed.byDate ?? {} }
  } catch {
    return emptyState()
  }
}

export function saveState(state) {
  try {
    // 只保留最近 KEEP_DAYS 天，避免 localStorage 无限膨胀
    const keys = Object.keys(state.byDate).sort()
    const trimmed = {}
    for (const k of keys.slice(-KEEP_DAYS)) trimmed[k] = state.byDate[k]
    localStorage.setItem(KEY, JSON.stringify({ ...state, byDate: trimmed }))
  } catch {
    // 隐私模式下 localStorage 可能不可写；计数在内存里照常工作，不该因此报错
  }
}

/** 计一声佛号，返回新状态。连续天数在这里推进。 */
export function increment(state, by = 1) {
  const today = dateKey()
  const next = { ...state, byDate: { ...state.byDate } }

  if (next.lastDate !== today) {
    const gap = next.lastDate ? daysBetween(next.lastDate, today) : null
    next.streak = gap === 1 ? (next.streak || 0) + 1 : 1
    next.lastDate = today
  } else if (!next.streak) {
    next.streak = 1
  }

  next.byDate[today] = (next.byDate[today] ?? 0) + by
  next.total = (next.total ?? 0) + by
  return next
}

export function todayCount(state) {
  return state.byDate[dateKey()] ?? 0
}

/** 连续天数在跨天后会过期：昨天没念、今天也还没念，就该显示 0。 */
export function effectiveStreak(state) {
  if (!state.lastDate) return 0
  const gap = daysBetween(state.lastDate, dateKey())
  if (gap === 0) return state.streak || 0
  if (gap === 1) return state.streak || 0 // 昨天念过，今天还来得及接上
  return 0
}

/** 最近 n 天的计数，用于小图表。返回 [{date, count}]，含没念的空天。 */
export function recentDays(state, n = 14) {
  const out = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const k = dateKey(d)
    out.push({ date: k, count: state.byDate[k] ?? 0 })
  }
  return out
}

/**
 * 木鱼声：合成而非加载音频文件，省一个二进制资源，也避免版权问题。
 * 2026-11-09 重做（David 嫌旧的像敲铁）：模态合成——空心木腔三个不成整数倍的共振，
 * 衰减几十毫秒，敲击瞬间音高略高再落下，加 4ms 带通噪声做「嗒」。
 * 参数与 D:/document/念佛板块/audio/muyu/synth_muyu.py 的「C-小木鱼清脆」一致（David 选的）。
 */
const MUYU_MODES = [
  [760, 1.0, 0.04],
  [1690, 0.4, 0.02],
  [3350, 0.18, 0.01],
]

function renderMuyu(sampleRate) {
  const n = Math.floor(sampleRate * 0.3)
  const out = new Float32Array(n)
  for (const [f, amp, decay] of MUYU_MODES) {
    let phase = Math.random() * Math.PI * 2
    for (let k = 0; k < n; k += 1) {
      const t = k / sampleRate
      phase += (2 * Math.PI * f * (1 + 0.03 * Math.exp(-t / 0.012))) / sampleRate
      out[k] += amp * Math.sin(phase) * Math.exp(-t / decay)
    }
  }
  // 敲击的「嗒」：4ms 噪声，简单一阶高通 + 低通，留 1.2k–5k 左右
  const m = Math.floor(sampleRate * 0.004)
  let hp = 0
  let prevIn = 0
  let lp = 0
  const aH = Math.exp((-2 * Math.PI * 1200) / sampleRate)
  const aL = Math.exp((-2 * Math.PI * 5000) / sampleRate)
  const burst = new Float32Array(m)
  let peak = 1e-9
  for (let k = 0; k < m; k += 1) {
    const x = (Math.random() * 2 - 1) * (1 - k / m)
    hp = aH * (hp + x - prevIn)
    prevIn = x
    lp = (1 - aL) * hp + aL * lp
    burst[k] = lp
    peak = Math.max(peak, Math.abs(lp))
  }
  for (let k = 0; k < m; k += 1) out[k] += (0.35 * burst[k]) / peak
  const a = Math.floor(sampleRate * 0.001)
  for (let k = 0; k < a; k += 1) out[k] *= k / a
  let max = 1e-9
  for (let k = 0; k < n; k += 1) max = Math.max(max, Math.abs(out[k]))
  for (let k = 0; k < n; k += 1) out[k] /= max
  return out
}

export function createWoodblock() {
  let ctx = null
  let buffers = null
  return function play() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return
        ctx = new AC()
      }
      if (ctx.state === 'suspended') ctx.resume()
      if (!buffers) {
        // 预先合成几下，轮流用，每下略有不同，听起来不机械
        buffers = Array.from({ length: 4 }, () => {
          const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate)
          b.getChannelData(0).set(renderMuyu(ctx.sampleRate))
          return b
        })
      }
      const src = ctx.createBufferSource()
      src.buffer = buffers[Math.floor(Math.random() * buffers.length)]
      const gain = ctx.createGain()
      gain.gain.value = 0.55
      src.connect(gain).connect(ctx.destination)
      src.start()
    } catch {
      // 音频不可用时静默降级，计数照常
    }
  }
}
