// 念经「听我念」的语音识别：全部在本机，不上传声音或文字。
// - 默认：Vosk 离线中文小模型（和 David 的安卓/电脑提词器同一个模型），国内、微信里都能用。
//   模型约 44MB，切成 3 块放 /nianjing/model/（Pages 单文件上限 25MB），首次下载后存 Cache Storage。
// - iPhone/iPad 的 Safari（不在微信里）：用系统自带识别，不用下模型。
import { fuzzy } from './sutraAligner.js'

const MODEL_BASE = '/nianjing/model/'
const CACHE = 'nianjing-model'

let modelPromise = null
let pinyinMod = null

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent)
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function nativeRecognitionAvailable() {
  return isIOS() && !isWeChat() && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function voiceSupported() {
  return !!navigator.mediaDevices?.getUserMedia && (nativeRecognitionAvailable() || typeof WebAssembly === 'object')
}

/** 识别出的文字 → 每个汉字的模糊读音集合（多音字全收）。 */
export async function hanToPys(text) {
  if (!pinyinMod) pinyinMod = await import('pinyin-pro')
  const out = []
  for (const ch of text) {
    if (!/\p{Script=Han}/u.test(ch)) continue
    const all = pinyinMod.pinyin(ch, { multiple: true, type: 'array', toneType: 'none' })
    out.push([...new Set(all.map(fuzzy).filter(Boolean))])
  }
  return out
}

/** 预先加载拼音库（给经文的字补常见读音用）。 */
export async function loadPinyin() {
  if (!pinyinMod) pinyinMod = await import('pinyin-pro')
  return pinyinMod
}

async function fetchModelBlob(onProgress) {
  const manifest = await (await fetch(`${MODEL_BASE}manifest.json`, { cache: 'no-cache' })).json()
  const cache = 'caches' in window ? await caches.open(`${CACHE}-${manifest.version}`) : null
  const blobs = []
  let done = 0
  for (const name of manifest.parts) {
    const url = `${MODEL_BASE}${name}?v=${manifest.version}`
    let res = cache ? await cache.match(url) : null
    if (!res) {
      res = await fetch(url)
      if (!res.ok) throw new Error(`模型下载失败（${res.status}）`)
      if (cache) await cache.put(url, res.clone())
    }
    const b = await res.blob()
    blobs.push(b)
    done += b.size
    onProgress?.(Math.min(1, done / manifest.size))
  }
  // 清掉旧版本模型
  if ('caches' in window) {
    for (const k of await caches.keys()) if (k.startsWith(CACHE) && k !== `${CACHE}-${manifest.version}`) caches.delete(k)
  }
  return new Blob(blobs, { type: 'application/gzip' })
}

function loadVoskModel(onProgress) {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [vosk, blob] = await Promise.all([import('vosk-browser'), fetchModelBlob(onProgress)])
      // vosk-browser 是 UMD 包，打包后 createModel 可能挂在 default 上
      const createModel = vosk.createModel || vosk.default?.createModel
      const url = URL.createObjectURL(blob)
      return createModel(url, -1)
    })().catch((e) => {
      modelPromise = null
      throw e
    })
  }
  return modelPromise
}

/**
 * @param {{ onText: (text: string, final: boolean) => void,
 *           onState: (state: 'loading'|'listening'|'stopped'|'error', info?: { progress?: number, reason?: string }) => void }} cb
 */
export function createVoiceEngine({ onText, onState, phrases = [] }) {
  // 把识别范围限定在本部经的句子里（每句汉字用空格隔开）：2026-11-09 用心经录音测，
  // 1.6 倍速时处理快了约 2.6 倍、几乎一字不差，2 倍速也能一路跟到结尾。不限定时念快了手机会算不过来。
  const grammar = phrases.length ? JSON.stringify([...phrases, '[unk]']) : null
  const native = nativeRecognitionAvailable()
  let stopFn = null
  let running = false

  async function startVosk() {
    onState('loading', { progress: 0 })
    const model = await loadVoskModel((p) => onState('loading', { progress: p }))
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    })
    const AC = window.AudioContext || window.webkitAudioContext
    const ctx = new AC()
    const rec = grammar ? new model.KaldiRecognizer(ctx.sampleRate, grammar) : new model.KaldiRecognizer(ctx.sampleRate)
    rec.on('partialresult', (m) => {
      const t = (m.result.partial || '').replace(/\s+/g, '')
      if (t) onText(t, false)
    })
    rec.on('result', (m) => {
      const t = (m.result.text || '').replace(/\s+/g, '')
      if (t) onText(t, true)
    })
    const src = ctx.createMediaStreamSource(stream)
    const proc = ctx.createScriptProcessor(4096, 1, 1)
    proc.onaudioprocess = (e) => {
      try {
        rec.acceptWaveform(e.inputBuffer)
      } catch {
        /* 识别器已移除 */
      }
    }
    src.connect(proc)
    proc.connect(ctx.destination)
    if (ctx.state === 'suspended') await ctx.resume()
    stopFn = () => {
      proc.disconnect()
      src.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      rec.remove()
      ctx.close().catch(() => {})
    }
  }

  function startNative() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    let rec = null
    const begin = () => {
      rec = new SR()
      rec.lang = 'zh-CN'
      rec.continuous = true
      rec.interimResults = true
      rec.onresult = (e) => {
        let text = ''
        let final = true
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript
          if (!e.results[i].isFinal) final = false
        }
        text = text.replace(/\s+/g, '')
        if (text) onText(text, final)
      }
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          running = false
          onState('error', { reason: '没有麦克风权限，请在浏览器设置里允许本站使用麦克风。' })
        }
      }
      // 系统识别说一阵会自己停，念经时自动接上
      rec.onend = () => {
        if (running) begin()
      }
      rec.start()
    }
    begin()
    stopFn = () => {
      running = false
      try {
        rec?.abort()
      } catch {
        /* ignore */
      }
    }
  }

  return {
    kind: native ? 'native' : 'vosk',
    async start() {
      if (running) return
      running = true
      try {
        if (native) startNative()
        else await startVosk()
        if (running) onState('listening')
      } catch (e) {
        running = false
        stopFn?.()
        stopFn = null
        const denied = e?.name === 'NotAllowedError' || e?.name === 'SecurityError'
        onState('error', {
          reason: denied
            ? '没有麦克风权限，请在浏览器设置里允许本站使用麦克风。'
            : e?.name === 'NotFoundError'
              ? '这台设备没有找到麦克风。'
              : `语音识别没能启动：${e?.message || e}`,
        })
      }
    },
    stop() {
      running = false
      stopFn?.()
      stopFn = null
      onState('stopped')
    },
  }
}
