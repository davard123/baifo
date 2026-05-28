const BASE = import.meta.env.VITE_API_BASE ?? '/api'
const RECORD_CACHE_TTL = 30_000

let warmPromise = null
const recordCache = new Map()

function makeJsonResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function getRecordCacheKey(path, options) {
  const method = (options.method ?? 'GET').toUpperCase()
  if (method !== 'GET') return null
  if (!path.startsWith('/wishes') && !path.startsWith('/ancestor-wishes')) return null
  return path
}

function invalidateRecordCache(path) {
  const prefix = path.startsWith('/ancestor-wishes') ? '/ancestor-wishes' : '/wishes'
  for (const key of recordCache.keys()) {
    if (key.startsWith(prefix)) {
      recordCache.delete(key)
    }
  }
}

// 预热后端：避免 serverless 容器冷启动导致首次提交卡顿
// - 4 分钟内不重复预热（避免悬停/路由变化触发太多请求）
// - 失败自动重置，下次再试
// - keepalive=true 即使页面跳转也能完成
let warmedAt = 0
const WARM_VALID_MS = 4 * 60 * 1000
const SUBMIT_WARMUP_WAIT_MS = 1_500

function isWarmFresh() {
  return warmedAt && Date.now() - warmedAt < WARM_VALID_MS
}

async function waitForWarmup(maxMs = SUBMIT_WARMUP_WAIT_MS) {
  if (isWarmFresh()) return

  const warm = warmApi()
  if (!warm) return

  await Promise.race([
    warm,
    new Promise((resolve) => setTimeout(resolve, maxMs)),
  ])
}

export function warmApi() {
  if (warmPromise) {
    return warmPromise
  }
  if (isWarmFresh()) {
    return Promise.resolve(null)
  }
  warmPromise = (async () => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30_000)
      const res = await fetch(`${BASE}/readyz`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
        keepalive: true,
      })
      clearTimeout(timer)
      warmedAt = Date.now()
      return res
    } catch {
      warmedAt = 0
      return null
    } finally {
      warmPromise = null
    }
  })()
  return warmPromise
}

export async function apiFetch(path, options = {}) {
  const url = BASE + path
  const cacheKey = getRecordCacheKey(path, options)
  const cached = cacheKey ? recordCache.get(cacheKey) : null

  if (cached && Date.now() - cached.ts < RECORD_CACHE_TTL) {
    return makeJsonResponse(cached.data)
  }

  if ((options.method ?? 'GET').toUpperCase() !== 'GET') {
    await waitForWarmup()
  }

  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`请求失败 ${res.status}: ${text}`)
  }

  if (cacheKey) {
    try {
      const data = await res.clone().json()
      recordCache.set(cacheKey, { data, ts: Date.now() })
    } catch {
      // ignore cache parse errors
    }
  } else if (path.startsWith('/wishes') || path.startsWith('/ancestor-wishes')) {
    invalidateRecordCache(path)
  }

  return res
}
