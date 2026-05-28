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

export function warmApi() {
  if (!warmPromise) {
    warmPromise = fetch(`${BASE}/`, { method: 'GET' }).catch(() => null)
  }
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
    warmApi()
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
