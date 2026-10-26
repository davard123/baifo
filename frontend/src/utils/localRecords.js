import { ref } from 'vue'
import { BUDDHAS } from '../data/buddhas.js'

export const LOCAL_RECORDS_KEY = 'fopusha.private-records.v1'
const fields = ['username', 'age', 'wish', 'buddha', 'blessing', 'target', 'ancestor', 'ancestor_name', 'relationship']
const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) ?? '/api'
const BUDDHA_NAME_BY_SLUG = Object.fromEntries(BUDDHAS.map((b) => [b.slug, b.name]))

// 最近一次提交是否公开到了心愿墙；成功提示、回向完成页据此显示文字。
export const lastSavePublished = ref(false)

export const SAVE_CHOICES = ['local', 'public']

export function readLocalRecords() {
  try {
    const raw = localStorage.getItem(LOCAL_RECORDS_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data) || data.some(row => !row || typeof row.id !== 'string' || typeof row.wish !== 'string')) throw new Error()
    return data
  } catch {
    throw new Error('无法读取本机记录，请检查浏览器存储设置。现有数据未被覆盖。')
  }
}

// 把一条记录转成心愿墙需要的字段。名字由服务器打码，只显示第一个字。
function toWallItem(path, payload) {
  const name = String(payload.username || '')
  if (path === '/ancestor-wishes') {
    return { kind: 'ancestor', deity: '', topic: String(payload.relationship || ''), name, wish: String(payload.wish || '') }
  }
  if (payload.blessing === 'caishen') {
    const match = String(payload.wish || '').match(/^【([^·】]+)·?([^】]*)】([\s\S]*)$/)
    return {
      kind: 'caishen',
      deity: match ? match[1] : '',
      topic: String(payload.target || (match ? match[2] : '')),
      name,
      wish: match ? match[3].trim() : String(payload.wish || ''),
    }
  }
  if (payload.blessing) {
    return { kind: 'blessing', deity: '', topic: String(payload.blessing), name, wish: String(payload.target ? `${payload.target}：${payload.wish}` : payload.wish) }
  }
  return { kind: 'buddha', deity: BUDDHA_NAME_BY_SLUG[payload.buddha] || '', topic: '', name, wish: String(payload.wish || '') }
}

// 自动配的祝福语里有访客全名；公开前把正文里的名字换成"王**"这样的打码名字。
function maskNameInWish(item) {
  const chars = Array.from(item.name.trim())
  if (chars.length < 2) return item
  return { ...item, wish: item.wish.split(item.name.trim()).join(chars[0] + '**') }
}

async function publishToWall(path, payload, signal) {
  const res = await fetch(`${API_BASE}/wall`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(maskNameInWish(toWallItem(path, payload))),
    signal,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.status !== 'success') {
    throw new Error(`没有公开成功：${data.detail || '请稍后再试'}。本次内容未保存，可以修改后重试，或改选“仅保存在本机”。`)
  }
}

// 本机保存始终执行；只有访客明确选择"公开到心愿墙"时，才先发布到公开心愿墙。
// 先公开再存本机：公开失败时什么都不存，避免重试时本机出现重复记录。
export async function saveLocalRequest(path, options = {}) {
  if (!['/wishes', '/ancestor-wishes'].includes(path) || options.method !== 'POST') throw new Error('不支持的本地记录操作。')
  if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
  const payload = JSON.parse(options.body)
  if (!SAVE_CHOICES.includes(payload.storageChoice)) throw new Error('请为本次记录选择保存方式。')
  const rows = readLocalRecords()
  const isPublic = payload.storageChoice === 'public'
  if (isPublic) await publishToWall(path, payload, options.signal)
  const record = Object.fromEntries(fields.filter(key => payload[key] != null).map(key => [key, payload[key]]))
  record.id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  record.created_at = new Date().toISOString()
  record.record_type = path === '/ancestor-wishes' ? 'ancestor' : 'wish'
  if (isPublic) record.published = true
  try {
    localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify([...rows, record]))
  } catch {
    if (!isPublic) throw new Error('未保存：本机存储不可用或空间不足。内容没有上传，请保留输入后重试。')
  }
  lastSavePublished.value = isPublic
  // 只存本机的也算一次人次：只发类型，不发任何内容；失败不影响保存。
  if (!isPublic) countSubmission(toWallItem(path, payload).kind)
  statsVersion.value += 1
  return { ok: true, json: async () => ({ status: 'success', id: record.id, published: isPublic }) }
}

export async function fetchWall(kind = '', limit = 30) {
  const query = new URLSearchParams({ limit: String(limit) })
  if (kind) query.set('kind', kind)
  const res = await fetch(`${API_BASE}/wall?${query}`)
  if (!res.ok) throw new Error('心愿墙暂时打不开')
  return res.json()
}

// 每次提交后 +1，心愿墙据此重新取累计人次。
export const statsVersion = ref(0)

function countSubmission(kind) {
  fetch(`${API_BASE}/count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind }),
    keepalive: true,
  }).catch(() => {})
}

export async function fetchStats({ fresh = false } = {}) {
  const res = await fetch(`${API_BASE}/stats`, fresh ? { cache: 'no-store' } : undefined)
  if (!res.ok) throw new Error('stats unavailable')
  return res.json()
}
