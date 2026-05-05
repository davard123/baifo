const key      = slug => `ancestor_photo_${slug}`
const nameKey  = slug => `ancestor_name_${slug}`

export function saveName(slug, name) {
  if (name?.trim()) localStorage.setItem(nameKey(slug), name.trim())
  else localStorage.removeItem(nameKey(slug))
}
export function getName(slug) {
  return localStorage.getItem(nameKey(slug)) || null
}

// 通用 per-slug 字段持久化
const fieldKey = (slug, field) => `ancestor_${field}_${slug}`
export function saveField(slug, field, value) {
  if (value !== null && value !== undefined && String(value).trim())
    localStorage.setItem(fieldKey(slug, field), String(value))
  else
    localStorage.removeItem(fieldKey(slug, field))
}
export function getField(slug, field) {
  return localStorage.getItem(fieldKey(slug, field)) || null
}

// 全局（跨 slug）字段
export function saveGlobal(key, value) {
  if (value !== null && value !== undefined && String(value).trim())
    localStorage.setItem(`ancestor_global_${key}`, String(value))
}
export function getGlobal(key) {
  return localStorage.getItem(`ancestor_global_${key}`) || null
}

function compress(file) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 600
      let w = img.width, h = img.height
      if (w > h) { h = Math.round(h * MAX / w); w = MAX }
      else       { w = Math.round(w * MAX / h); h = MAX }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.src = url
  })
}

export async function savePhoto(slug, file) {
  const dataUrl = await compress(file)
  localStorage.setItem(key(slug), dataUrl)
  return dataUrl
}

export function getPhoto(slug) {
  return localStorage.getItem(key(slug)) || null
}

export function clearPhoto(slug) {
  localStorage.removeItem(key(slug))
}
