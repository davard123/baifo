const OVERLAY_X = 0.435
const OVERLAY_W = 0.13
const OVERLAY_Y_START = 0.18
const OVERLAY_Y_END = 0.54
const TEXT_Y_START = 0.2
const DEFAULT_STEP = 0.11
const BG_SAMPLE = [0.5, 0.28]
const cache = new Map()
const VERSION = 5

export async function renderTablet(imageSrc, name) {
  const cleanName = (name || '').trim()
  if (!cleanName) return imageSrc

  const cacheKey = `${VERSION}::${imageSrc}::${cleanName}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const W = img.naturalWidth
      const H = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      ctx.drawImage(img, 0, 0)

      const sx = Math.round(W * BG_SAMPLE[0])
      const sy = Math.round(H * BG_SAMPLE[1])
      let px
      try {
        px = ctx.getImageData(sx, sy, 1, 1).data
      } catch {
        px = [63, 42, 26, 255]
      }

      ctx.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`
      ctx.fillRect(
        W * OVERLAY_X,
        H * OVERLAY_Y_START,
        W * OVERLAY_W,
        H * (OVERLAY_Y_END - OVERLAY_Y_START)
      )

      const chars = Array.from(cleanName).slice(0, 4)
      const maxTextHeight = H * (OVERLAY_Y_END - TEXT_Y_START) * 0.94
      const stepPx = Math.min(H * DEFAULT_STEP, maxTextHeight / chars.length)
      const fontSize = Math.max(22, Math.round(stepPx * 0.78))
      const textBlockHeight = stepPx * chars.length
      const startY = H * TEXT_Y_START + Math.max(0, (maxTextHeight - textBlockHeight) / 2)

      ctx.font = `700 ${fontSize}px "KaiTi","STKaiti","SimSun",serif`
      ctx.fillStyle = '#d1ad61'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = 3

      const cx = W * (OVERLAY_X + OVERLAY_W / 2)
      chars.forEach((char, index) => {
        const cy = startY + index * stepPx + stepPx * 0.5
        ctx.fillText(char, cx, cy)
      })

      const url = canvas.toDataURL('image/jpeg', 0.92)
      cache.set(cacheKey, url)
      resolve(url)
    }

    img.onerror = () => resolve(imageSrc)
    img.src = imageSrc
  })
}
