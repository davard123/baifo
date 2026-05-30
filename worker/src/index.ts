import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  RESEND_API_KEY: string
  // After fopusha.com domain is verified in Resend, set this secret to:
  //   noreply@fopusha.com
  // Until then, leave unset — falls back to onboarding@resend.dev (Resend shared domain)
  RESEND_FROM?: string
}

const ADMIN_EMAIL = 'lodaviddai@gmail.com'

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

// ---- Resend email helper -----------------------------------------------------

async function sendEmail(env: Bindings, opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const from = env.RESEND_FROM ?? 'onboarding@resend.dev'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  })
  // Fire-and-forget: email failure never blocks the main response
}

// ---- Validation helpers ------------------------------------------------------

function parseLimit(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10)
  if (Number.isNaN(n)) return 15
  return Math.min(50, Math.max(1, n))
}

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

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
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

  // Optional: send confirmation if user provided email
  const email = asStr(body.email)
  if (email && isValidEmail(email)) {
    const buddhaName = payload.buddha || '佛菩萨'
    sendEmail(c.env, {
      to: email,
      subject: `您的祈愿已提交 | 礼佛祈愿`,
      html: `
        <p>您好 ${payload.username}，</p>
        <p>您向 <strong>${buddhaName}</strong> 的祈愿已成功提交：</p>
        <blockquote style="border-left:3px solid #c8a96e;padding:8px 16px;color:#555">
          ${payload.wish}
        </blockquote>
        <p>愿您所愿成真，平安吉祥。</p>
        <p style="color:#999;font-size:12px">— 礼佛祈愿 fopusha.com</p>
      `,
    })
  }

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

  // Optional: send confirmation if user provided email
  const email = asStr(body.email)
  if (email && isValidEmail(email)) {
    const ancestorName = payload.ancestor_name || payload.ancestor || '先人'
    sendEmail(c.env, {
      to: email,
      subject: `您的祭祖祈愿已提交 | 礼佛祈愿`,
      html: `
        <p>您好 ${payload.username}，</p>
        <p>您为 <strong>${ancestorName}</strong>（${payload.relationship}）的追思祈愿已成功提交：</p>
        <blockquote style="border-left:3px solid #c8a96e;padding:8px 16px;color:#555">
          ${payload.wish}
        </blockquote>
        <p>愿先人安息，福荫后代。</p>
        <p style="color:#999;font-size:12px">— 礼佛祈愿 fopusha.com</p>
      `,
    })
  }

  return c.json({ status: 'success' })
})

// ---- Contact form -----------------------------------------------------------
// POST /contact { name, email, message }
// Sends message to admin + auto-reply to sender

app.post('/contact', async (c) => {
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ detail: '无效的请求体' }, 422)
  }

  const name = asStr(body.name).trim()
  const email = asStr(body.email).trim()
  const message = asStr(body.message).trim()

  if (!name || !email || !message) {
    return c.json({ detail: '请填写姓名、邮箱和留言' }, 422)
  }
  if (!isValidEmail(email)) {
    return c.json({ detail: '邮箱格式不正确' }, 422)
  }

  // Notify admin
  await sendEmail(c.env, {
    to: ADMIN_EMAIL,
    subject: `礼佛祈愿 - 新留言：${name}`,
    html: `
      <p><strong>姓名：</strong>${name}</p>
      <p><strong>邮箱：</strong>${email}</p>
      <p><strong>留言：</strong></p>
      <blockquote style="border-left:3px solid #c8a96e;padding:8px 16px;color:#555">
        ${message}
      </blockquote>
    `,
  })

  // Auto-reply to sender
  sendEmail(c.env, {
    to: email,
    subject: '已收到您的留言 | 礼佛祈愿',
    html: `
      <p>您好 ${name}，</p>
      <p>我们已收到您的留言，将尽快回复。</p>
      <p style="color:#999;font-size:12px">— 礼佛祈愿 fopusha.com</p>
    `,
  })

  return c.json({ status: 'success' })
})

export default app
