const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export async function apiFetch(path, options = {}) {
  const url = BASE + path
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`请求失败 ${res.status}: ${text}`)
  }
  return res
}
