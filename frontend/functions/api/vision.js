// 求财专区「愿景图」生成接口：POST /api/vision（multipart/form-data）
// 字段：profession, scene, custom（职业为「其他」时的行业描述）, gender, age, consent, photo（可选，≤512px 的 JPEG）
// 生图：Cloudflare Workers AI（FLUX.2 klein 4B）为主，MiniMax image-01 备用；顺序可用 VISION_PRIMARY 环境变量调换。
// 照片只在本次请求里使用，不落盘、不进数据库。图上不生成任何文字，名字和祝福语由前端另外印。
import { PROFESSIONS } from '../../src/data/vision.js'

const DAILY_LIMIT = 2
const BLOCKED = /(裸|色情|性感|暴力|血|枪|毒品|赌|政治|习近平|特朗普|支票特写|证件|身份证|护照|nude|naked|sex|gun|blood|drug)/i
const NO_TEXT = 'Absolutely no text, no letters, no numbers, no Chinese characters, no signs with writing anywhere in the image.'
const STYLE = 'Realistic documentary-style photograph, natural human proportions, medium full-body shot, warm golden light, joyful prosperous atmosphere, high detail.'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function personPhrase({ gender, age, hasPhoto }) {
  if (hasPhoto) return 'The person from the reference photo (keep the same face, hairstyle and skin tone)'
  const g = gender === 'female' ? 'woman' : 'man'
  return `A friendly East Asian ${g} around ${age} years old`
}

function buildPrompt({ profession, scene, custom, gender, age, hasPhoto }) {
  const p = PROFESSIONS.find((item) => item.key === profession)
  if (!p) return null
  const s = p.scenes.find((item) => item.key === scene) || p.scenes[0]
  const who = personPhrase({ gender, age, hasPhoto })
  const what = profession === 'other'
    ? s.prompt.replace('{industry}', custom.replace(/[^\p{L}\p{N}\s]/gu, ' ').slice(0, 30) || 'their own field')
    : s.prompt
  return `${STYLE} ${who} ${what} ${NO_TEXT}`
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

async function viaWorkersAI(env, prompt, photo) {
  if (!env.AI) throw new Error('no AI binding')
  const form = new FormData()
  form.append('prompt', prompt)
  form.append('width', '768')
  form.append('height', '1024')
  if (photo) form.append('input_image_0', photo, 'photo.jpg')
  const packed = new Response(form)
  const result = await env.AI.run('@cf/black-forest-labs/flux-2-klein-4b', {
    multipart: { body: packed.body, contentType: packed.headers.get('content-type') },
  })
  if (!result?.image) throw new Error('workers ai returned no image')
  return `data:image/png;base64,${result.image}`
}

async function toBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

async function viaMiniMax(env, prompt, photo) {
  if (!env.MINIMAX_API_KEY) throw new Error('no MINIMAX_API_KEY')
  const body = {
    model: 'image-01',
    prompt,
    aspect_ratio: '3:4',
    response_format: 'base64',
    n: 1,
    prompt_optimizer: false,
  }
  if (photo) body.subject_reference = [{ type: 'character', image_file: `data:image/jpeg;base64,${await toBase64(photo)}` }]
  const res = await fetch(`${env.MINIMAX_BASE || 'https://api.minimaxi.com'}/v1/image_generation`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.MINIMAX_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
  const scene = String(form.get('scene') || '')
  const custom = String(form.get('custom') || '').trim()
  const gender = form.get('gender') === 'female' ? 'female' : 'male'
  const age = Math.round(Number(form.get('age')))
  const photo = form.get('photo')
  const hasPhoto = photo && typeof photo === 'object' && photo.size > 0

  if (!Number.isFinite(age) || age < 18 || age > 100) return json({ error: '愿景图需要年满 18 岁，请填写真实年龄。' }, 400)
  if (BLOCKED.test(custom)) return json({ error: '行业描述里有不适合生成的内容，请换个说法。' }, 400)
  if (hasPhoto) {
    if (form.get('consent') !== 'yes') return json({ error: '上传照片前，请先确认这是你本人或已获本人同意。' }, 400)
    if (photo.size > 600 * 1024 || !/^image\/(jpeg|png|webp)$/.test(photo.type)) return json({ error: '照片格式不对或太大，请换一张。' }, 400)
  }

  const prompt = buildPrompt({ profession, scene, custom, gender, age, hasPhoto })
  if (!prompt) return json({ error: '请先选择你的职业。' }, 400)

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const limit = await readLimit(env, ip)
  if (!limit.ok) return json({ error: `每人每天可以生成 ${DAILY_LIMIT} 张愿景图，明天再来吧。` }, 429)

  const order = env.VISION_PRIMARY === 'minimax' ? [viaMiniMax, viaWorkersAI] : [viaWorkersAI, viaMiniMax]
  const errors = []
  for (const run of order) {
    try {
      const image = await run(env, prompt, hasPhoto ? photo : null)
      await countUse(env, limit)
      return json({ image, left: DAILY_LIMIT - limit.used - 1 })
    } catch (err) {
      errors.push(String(err?.message || err))
    }
  }
  console.log('vision failed', errors.join(' | '))
  return json({ error: '财神正忙，图没画出来，请稍后再试。' }, 502)
}
