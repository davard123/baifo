// 开发：Vite proxy 把 /api/* → localhost:8080/*
// 生产：VITE_API_BASE 指向 Railway 后端 URL（不含尾斜杠）
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export async function apiFetch(path, options) {
  return fetch(`${BASE}${path}`, options)
}
