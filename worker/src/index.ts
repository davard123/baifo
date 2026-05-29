import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Mirror FastAPI: allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['*'],
}))

// ---- Supabase PostgREST helpers ---------------------------------------------

function sb(env: Bindings, path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  }
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers })
}

// Clamp limit to 1..50, default 15 (matches Query(default=15, ge=1, le=50))
function parseLimit(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10)
  if (Number.isNaN(n)) return 15
  return Math.min(50, Math.max(1, n))
}

// Non-empty after strip (matches Pydantic not_empty validator)
function requireNonEmpty(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('不能为空')
  }
  return value.trim()
}

function asInt(value: unknown, fallback = 30): number {
  const n = Number.parseInt(String(value ?? ''), 10)
  return Number.isNaN(n) ? fallback : n
}

function asStr(value: unknown): string {
  return value == null ? '' : String(value)
}

// ---- Routes -----------------------------------------------------------------

app.get('/', (c) => c.json({ status: 'ok' }))

app.get('/wishes', async (c) => {
  const limit = parseLimit(c.req.query('limit'))
  const username = c.req.query('username')
  let path = `users?select=id,username,age,wish,buddha,blessing,target,created_at&order=id.desc&limit=${limit}`
  if (username && username.trim()) {
    path += `&username=eq.${encodeURIComponent(username.trim())}`
  }
  const res = await sb(c.env, path)
  if (!res.ok) return c.json({ detail: await res.text() }, 500)
  return c.json(await res.json())
})

app.post('/wishes', async (c) => {
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ detail: '无效的请求体' }, 422)
  }
  let payload
  try {
    payload = {
      username: requireNonEmpty(body.username),
      age: asInt(body.age),
      wish: requireNonEmpty(body.wish),
      buddha: asStr(body.buddha),
      blessing: asStr(body.blessing),
      target: asStr(body.target),
    }
  } catch (e) {
    return c.json({ detail: (e as Error).message }, 422)
  }
  const res = await sb(c.env, 'users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) return c.json({ detail: await res.text() }, 500)
  return c.json({ status: 'success' })
})

app.get('/ancestor-wishes', async (c) => {
  const limit = parseLimit(c.req.query('limit'))
  const username = c.req.query('username')
  let path = `ancestor_wishes?select=id,username,age,ancestor,ancestor_name,relationship,wish,created_at&order=id.desc&limit=${limit}`
  if (username && username.trim()) {
    path += `&username=eq.${encodeURIComponent(username.trim())}`
  }
  const res = await sb(c.env, path)
  if (!res.ok) return c.json({ detail: await res.text() }, 500)
  return c.json(await res.json())
})

app.post('/ancestor-wishes', async (c) => {
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ detail: '无效的请求体' }, 422)
  }
  let payload
  try {
    payload = {
      username: requireNonEmpty(body.username),
      age: asInt(body.age),
      ancestor: asStr(body.ancestor),
      ancestor_name: asStr(body.ancestor_name),
      relationship: asStr(body.relationship),
      wish: requireNonEmpty(body.wish),
    }
  } catch (e) {
    return c.json({ detail: (e as Error).message }, 422)
  }
  const res = await sb(c.env, 'ancestor_wishes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) return c.json({ detail: await res.text() }, 500)
  return c.json({ status: 'success' })
})

export default app
