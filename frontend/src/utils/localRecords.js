export const LOCAL_RECORDS_KEY = 'fopusha.private-records.v1'
const fields = ['username', 'age', 'wish', 'buddha', 'blessing', 'target', 'ancestor', 'ancestor_name', 'relationship']

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

// This adapter deliberately has no network path. Only explicit local choices
// may write; historical server records are never fetched or imported.
export async function saveLocalRequest(path, options = {}) {
  if (!['/wishes', '/ancestor-wishes'].includes(path) || options.method !== 'POST') throw new Error('不支持的本地记录操作。')
  if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
  const payload = JSON.parse(options.body)
  if (payload.storageChoice !== 'local') throw new Error('请为本次记录选择“仅保存在本机，不上传”。')
  const rows = readLocalRecords()
  const record = Object.fromEntries(fields.filter(key => payload[key] != null).map(key => [key, payload[key]]))
  record.id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  record.created_at = new Date().toISOString()
  record.record_type = path === '/ancestor-wishes' ? 'ancestor' : 'wish'
  try {
    localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify([...rows, record]))
  } catch {
    throw new Error('未保存：本机存储不可用或空间不足。内容没有上传，请保留输入后重试。')
  }
  return { ok: true, json: async () => ({ status: 'success', id: record.id }) }
}
