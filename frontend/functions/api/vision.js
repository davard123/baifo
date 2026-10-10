// 求财专区「愿景图」生成接口：POST /api/vision（multipart/form-data）
// 字段：profession, theme, custom（职业为「其他」时的行业描述）, cf-turnstile-response
// 画面里不放人：职业是画面主角（餐馆、房子……随机一种风格），祥瑞主题是环绕它的氛围。
// 生图：Cloudflare Workers AI（FLUX.2 klein 4B）为主，MiniMax image-01 备用；顺序可用 VISION_PRIMARY 环境变量调换。
// 图上不生成任何文字，名字和祝福语由前端另外印。
import { PROFESSIONS, THEMES } from '../../src/data/vision.js'

const DAILY_LIMIT = 2
const BLOCKED = /(裸|色情|性感|暴力|血|枪|毒品|赌|政治|习近平|特朗普|支票|证件|身份证|护照|nude|naked|sex|gun|blood|drug)/i
const NO_TEXT = 'Absolutely no text, no letters, no numbers, no Chinese characters, no signs with writing anywhere in the image.'
const NO_PEOPLE = 'No people, no human figures, no faces anywhere in the image.'
const STYLE = 'Grand symbolic Chinese auspicious artwork, epic mythical scale, ultra detailed 3D render like a premium CG poster, rich red and gold palette, glowing golden light, festive and triumphant.'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function buildPrompt({ profession, theme, custom }) {
  const p = PROFESSIONS.find((item) => item.key === profession)
  const t = THEMES.find((item) => item.key === theme)
  if (!p || !t) return null
  const industry = custom.replace(/[^\p{L}\p{N}\s]/gu, ' ').slice(0, 30) || 'their own field'
  const subject = p.subjects[Math.floor(Math.random() * p.subjects.length)].replace('{industry}', industry)
  return `${STYLE} The main subject, large and centered, is ${subject}. All around it: ${t.prompt} ${NO_PEOPLE} ${NO_TEXT}`
}

// 人机验证（Turnstile）：后台配置了 TURNSTILE_SECRET_KEY 时必须通过，本地开发未配置则跳过
async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) return true
  if (!token) return false
  const body = new FormData()
  body.append('secret', env.TURNSTILE_SECRET_KEY)
  body.append('response', token)
  body.append('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
  const data = await res.json().catch(() => ({}))
  return data.success === true
}

// 只有生成成功才计数，失败不占用当天名额
async function readLimit(env, ip) {
  const day = new Date().toISOString().slice(0, 10)
  const key = `vision:${day}:${ip}`
  const used = env.QIUCAI_LIMIT ? Number((await env.QIUCAI_LIMIT.get(key)) || 0) : 0
  return { key, used, ok: used < DAILY_LIMIT }
}

async function countUse(env, limit) {
  if (!env.QIUCAI_LIMIT) return
  await env.QIUCAI_LIMIT.put(limit.key, String(limit.used + 1), { expirationTtl: 60 * 60 * 26 })
}

async function viaWorkersAI(env, prompt) {
  if (!env.AI) throw new Error('no AI binding')
  const form = new FormData()
  form.append('prompt', prompt)
  form.append('width', '768')
  form.append('height', '1024')
  const packed = new Response(form)
  const result = await env.AI.run('@cf/black-forest-labs/flux-2-klein-4b', {
    multipart: { body: packed.body, contentType: packed.headers.get('content-type') },
  })
  if (!result?.image) throw new Error('workers ai returned no image')
  // Workers AI 返回的是 JPEG 或 PNG 的 base64，按文件头判断类型
  const mime = result.image.startsWith('/9j/') ? 'image/jpeg' : 'image/png'
  return `data:${mime};base64,${result.image}`
}

async function viaMiniMax(env, prompt) {
  if (!env.MINIMAX_API_KEY) throw new Error('no MINIMAX_API_KEY')
  const res = await fetch(`${env.MINIMAX_BASE || 'https://api.minimaxi.com'}/v1/image_generation`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.MINIMAX_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'image-01',
      prompt,
      aspect_ratio: '3:4',
      response_format: 'base64',
      n: 1,
      prompt_optimizer: false,
    }),
  })
  const data = await res.json().catch(() => ({}))
  const image = data?.data?.image_base64?.[0]
  if (!res.ok || !image) throw new Error(`minimax ${res.status} ${data?.base_resp?.status_msg || ''}`)
  return `data:image/jpeg;base64,${image}`
}

export async function onRequestPost({ request, env }) {
  let form
  try {
    form = await request.formData()
  } catch {
    return json({ error: '请求格式不对，请刷新页面再试。' }, 400)
  }
  const profession = String(form.get('profession') || '')
  const theme = String(form.get('theme') || '')
  const custom = String(form.get('custom') || '').trim()

  if (BLOCKED.test(custom)) return json({ error: '行业描述里有不适合生成的内容，请换个说法。' }, 400)
  const prompt = buildPrompt({ profession, theme, custom })
  if (!prompt) return json({ error: '请先选择你的职业和祥瑞主题。' }, 400)

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  if (!(await verifyTurnstile(env, String(form.get('cf-turnstile-response') || ''), ip))) {
    return json({ error: '人机验证没有通过，请重新勾选验证后再试。' }, 403)
  }
  const limit = await readLimit(env, ip)
  if (!limit.ok) return json({ error: `每人每天可以生成 ${DAILY_LIMIT} 张愿景图，明天再来吧。` }, 429)

  const order = env.VISION_PRIMARY === 'minimax' ? [viaMiniMax, viaWorkersAI] : [viaWorkersAI, viaMiniMax]
  const errors = []
  for (const run of order) {
    try {
      const image = await run(env, prompt)
      await countUse(env, limit)
      return json({ image, left: DAILY_LIMIT - limit.used - 1 })
    } catch (err) {
      errors.push(String(err?.message || err))
    }
  }
  console.log('vision failed', errors.join(' | '))
  return json({ error: '财神正忙，图没画出来，请稍后再试。' }, 502)
}
