const key      = slug => `ancestor_photo_${slug}`
const nameKey  = slug => `ancestor_name_${slug}`

export function saveName(slug, name) {
  if (name?.trim()) localStorage.setItem(nameKey(slug), name.trim())
  else localStorage.removeItem(nameKey(slug))
}
export function getName(slug) {
  return localStorage.getItem(nameKey(slug)) || null
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
