// 念经页的状态：念到哪个字、往下走的方式、背景声、字号、续读。
// 「念到哪」统一用 cursor 表示：已经念完的字数（0…总字数）。
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { NIANJING_BY_SLUG, UNVERIFIED_CHARS, toUnits } from '../data/nianjing.js'
import { SutraAligner, fuzzy } from '../utils/sutraAligner.js'
import { createVoiceEngine, hanToPys, loadPinyin, voiceSupported } from '../utils/voiceEngine.js'
import { createWoodblock } from '../utils/nianfo.js'

const PREFS_KEY = 'nianjing:prefs'
const posKey = (slug) => `nianjing:pos:${slug}`

// 卡拉OK一屏显示的一段：按标点切，再拼成不超过这么多字
const SEGMENT_MAX = 16

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
  } catch {
    return {}
  }
}

/** 把一行切成卡拉OK用的小段（在标点处断开，每段不超过 SEGMENT_MAX 字）。 */
export function buildSegments(lines) {
  const segs = []
  lines.forEach((line, li) => {
    let cur = []
    let n = 0
    const flush = () => {
      if (cur.length) {
        const us = cur.filter((t) => t.u !== undefined)
        segs.push({ line: li, tokens: cur, start: us.length ? us[0].u : line.start, end: us.length ? us.at(-1).u + 1 : line.start })
      }
      cur = []
      n = 0
    }
    // 先按标点拆成短语
    const phrases = []
    let ph = []
    for (const t of line.tokens) {
      ph.push(t)
      if (t.u === undefined) {
        phrases.push(ph)
        ph = []
      }
    }
    if (ph.length) phrases.push(ph)
    for (const p of phrases) {
      const len = p.filter((t) => t.u !== undefined).length
      if (n && n + len > SEGMENT_MAX) flush()
      if (len > SEGMENT_MAX) {
        // 一个短语就超长（咒语常见）：硬切
        for (const t of p) {
          cur.push(t)
          if (t.u !== undefined) n += 1
          if (n >= SEGMENT_MAX) flush()
        }
      } else {
        cur.push(...p)
        n += len
      }
    }
    flush()
  })
  return segs.filter((s) => s.end > s.start)
}

export function useNianjing(slugRef) {
  const prefs = readPrefs()
  const meta = computed(() => NIANJING_BY_SLUG[slugRef.value] || null)
  const sutra = shallowRef(null)
  const units = shallowRef({ chars: [], lines: [] })
  const segments = shallowRef([])
  const loading = ref(false)

  const cursor = ref(0)
  const running = ref(false)
  const mode = ref(prefs.mode || 'voice') // voice | auto | manual
  const view = ref(prefs.view || 'karaoke') // karaoke | prompt（竖屏）
  const speed = ref(prefs.speed || 90) // 自动模式每分钟字数
  const bgm = ref(prefs.bgm || 'off') // muyu | music | off
  const bpm = ref(prefs.bpm || 60) // 木鱼每分钟下数
  const fontSize = ref(prefs.fontSize || 'm') // m | l | xl
  const resumeAt = ref(0) // 上次念到的位置（>0 时提示续读）

  const voiceState = ref('idle') // idle | loading | listening | stopped | error
  const voiceProgress = ref(0)
  const voiceError = ref('')
  const heard = ref('') // 刚听到的几个字，显示出来让人知道它在听
  const canVoice = typeof window !== 'undefined' && voiceSupported()

  const total = computed(() => units.value.chars.length)
  const finished = computed(() => total.value > 0 && cursor.value >= total.value)

  function lineOf(u) {
    const ls = units.value.lines
    if (!ls.length) return 0
    const c = Math.min(u, total.value - 1)
    let lo = 0
    let hi = ls.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (ls[mid].end <= c) lo = mid + 1
      else hi = mid
    }
    return lo
  }
  const lineIndex = computed(() => lineOf(cursor.value))
  const segmentIndex = computed(() => {
    const segs = segments.value
    const c = Math.min(cursor.value, total.value - 1)
    let lo = 0
    let hi = segs.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (segs[mid].end <= c) lo = mid + 1
      else hi = mid
    }
    return Math.max(0, lo)
  })

  watch([mode, view, speed, bgm, bpm, fontSize], () => {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ mode: mode.value, view: view.value, speed: speed.value, bgm: bgm.value, bpm: bpm.value, fontSize: fontSize.value }),
      )
    } catch {
      /* 隐私模式 */
    }
  })

  let saveTimer = null
  watch(cursor, (c) => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        if (c > 0 && c < total.value) localStorage.setItem(posKey(slugRef.value), String(c))
        else localStorage.removeItem(posKey(slugRef.value))
      } catch {
        /* ignore */
      }
    }, 800)
    if (finished.value) stop()
  })

  // ── 听我念 ──
  let aligner = null
  let engine = null
  let feedSeq = 0

  async function buildAligner() {
    const py = await loadPinyin()
    const script = units.value.chars.map((c) => {
      if (UNVERIFIED_CHARS.has(c.ch) || !c.py) return []
      const set = new Set([fuzzy(c.py)])
      for (const p of py.pinyin(c.ch, { multiple: true, type: 'array', toneType: 'none' })) set.add(fuzzy(p))
      return [...set].filter(Boolean)
    })
    aligner = new SutraAligner(script)
    aligner.seek(cursor.value)
  }

  async function onHeard(text) {
    if (!aligner) return
    heard.value = text.replace(/\[unk\]/g, '').slice(-14)
    const seq = ++feedSeq
    const hyp = await hanToPys(text)
    if (seq !== feedSeq || !running.value || mode.value !== 'voice') return
    const p = aligner.feed(hyp)
    if (p < 0 || p === cursor.value) return
    // 往回只退一两个字多半是对齐抖动，不是真的重念：不动，免得字一闪一闪
    if (p < cursor.value && cursor.value - p < 3) {
      aligner.seek(cursor.value)
      return
    }
    cursor.value = p
  }

  async function startVoice() {
    voiceError.value = ''
    heard.value = ''
    if (!canVoice) {
      voiceError.value = '这个浏览器不支持语音识别，已改成自动往下走。'
      mode.value = 'auto'
      startAuto()
      return
    }
    ensureEngine()
    await buildAligner()
    await engine?.start()
  }

  function ensureEngine() {
    if (!engine && canVoice) {
      engine = createVoiceEngine({
        phrases: units.value.lines
          .map((l) => l.tokens.filter((t) => t.u !== undefined).map((t) => t.ch).join(' '))
          .filter(Boolean),
        onText: (t) => onHeard(t),
        onState: (s, info) => {
          voiceState.value = s
          if (info?.progress !== undefined) voiceProgress.value = info.progress
          if (s === 'error') {
            voiceError.value = `${info?.reason || '语音识别出错了。'}已改成自动往下走。`
            engine = null
            if (running.value && mode.value === 'voice') {
              mode.value = 'auto'
              startAuto()
            }
          }
        },
      })
    }
  }

  // ── 自动 ──
  let autoTimer = null
  function startAuto() {
    clearInterval(autoTimer)
    autoTimer = setInterval(() => {
      if (cursor.value < total.value) cursor.value += 1
    }, Math.round(60000 / Math.max(20, speed.value)))
  }
  watch(speed, () => {
    if (running.value && mode.value === 'auto') startAuto()
  })

  // ── 背景声 ──
  let woodTimer = null
  let knock = null
  let music = null
  function startBgm() {
    stopBgm()
    if (bgm.value === 'muyu') {
      knock = knock || createWoodblock()
      knock()
      woodTimer = setInterval(() => knock(), Math.round(60000 / Math.max(30, bpm.value)))
    } else if (bgm.value === 'music') {
      if (!music) {
        music = new Audio('/nianjing/music.mp3')
        music.loop = true
        music.volume = 0.3
      }
      music.play().catch(() => {})
    }
  }
  function stopBgm() {
    clearInterval(woodTimer)
    woodTimer = null
    music?.pause()
  }
  watch([bgm, bpm], () => {
    if (running.value) startBgm()
  })

  function stopMovers() {
    clearInterval(autoTimer)
    autoTimer = null
    feedSeq += 1
    engine?.stop()
  }

  async function start() {
    if (!total.value) return
    if (finished.value) setCursor(0)
    resumeAt.value = 0
    running.value = true
    if (mode.value === 'voice') {
      ensureEngine()
      engine?.prime()
    }
    startBgm()
    if (mode.value === 'voice') await startVoice()
    else if (mode.value === 'auto') startAuto()
  }

  function stop() {
    running.value = false
    stopMovers()
    stopBgm()
  }

  watch(mode, () => {
    if (!running.value) return
    stopMovers()
    if (mode.value === 'voice') {
      ensureEngine()
      engine?.prime()
      startVoice()
    }
    else if (mode.value === 'auto') startAuto()
  })

  function setCursor(u) {
    cursor.value = Math.max(0, Math.min(total.value, u))
    aligner?.seek(cursor.value)
  }

  function nextSegment() {
    const s = segments.value[segmentIndex.value]
    setCursor(s && cursor.value < s.end ? s.end : (segments.value[segmentIndex.value + 1]?.end ?? total.value))
  }
  function prevSegment() {
    const i = segmentIndex.value
    const s = segments.value[i]
    setCursor(s && cursor.value > s.start ? s.start : (segments.value[Math.max(0, i - 1)]?.start ?? 0))
  }

  async function load() {
    stop()
    engine = null // 识别范围按经文定，换经要重建
    sutra.value = null
    units.value = { chars: [], lines: [] }
    segments.value = []
    aligner = null
    cursor.value = 0
    resumeAt.value = 0
    if (!meta.value) return
    loading.value = true
    const slug = slugRef.value
    const mod = await meta.value.load()
    if (slug !== slugRef.value) return
    sutra.value = mod.default
    units.value = toUnits(mod.default.lines)
    segments.value = buildSegments(units.value.lines)
    loading.value = false
    try {
      const saved = Number(localStorage.getItem(posKey(slug)) || 0)
      if (saved > 0 && saved < total.value) resumeAt.value = saved
    } catch {
      /* ignore */
    }
  }
  watch(slugRef, load, { immediate: true })

  function resume() {
    setCursor(resumeAt.value)
    resumeAt.value = 0
  }

  onBeforeUnmount(() => {
    stop()
    clearTimeout(saveTimer)
    music = null
  })

  return {
    meta, sutra, units, segments, loading, total, finished,
    cursor, lineIndex, segmentIndex, running, mode, view, speed, bgm, bpm, fontSize,
    resumeAt, resume, voiceState, voiceProgress, voiceError, heard, canVoice,
    start, stop, setCursor, nextSegment, prevSegment, lineOf,
  }
}
