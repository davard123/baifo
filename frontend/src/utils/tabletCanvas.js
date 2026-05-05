const ZONE_X = 0.36
const ZONE_W = 0.28
const FILL_Y_START = 0.06
const FILL_Y_END = 0.62
const TEXT_Y_START = 0.18
const DEFAULT_STEP = 0.128
const BG_SAMPLE = [0.5, 0.4]
const cache = new Map()
const VERSION = 4

export async function renderTablet(imageSrc, name) {
  const cacheKey = `${VERSION}::${imageSrc}::${name}`
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
        px = [59, 41, 27, 255]
      }

      ctx.fillStyle = `rgb(${px[0]},${px[1]},${px[2]})`
      ctx.fillRect(
        W * ZONE_X,
        H * FILL_Y_START,
        W * ZONE_W,
        H * (FILL_Y_END - FILL_Y_START)
      )

      const chars = Array.from((name || '').trim()).slice(0, 8)
      if (chars.length > 0) {
        const maxTextHeight = H * (FILL_Y_END - TEXT_Y_START) * 0.92
        const stepPx = Math.min(H * DEFAULT_STEP, maxTextHeight / chars.length)
        const fontSize = Math.max(18, Math.round(stepPx * 0.8))
        const textBlockHeight = stepPx * chars.length
        const startY = H * TEXT_Y_START + Math.max(0, (maxTextHeight - textBlockHeight) / 2)

        ctx.font = `bold ${fontSize}px "KaiTi","STKaiti","SimSun",serif`
        ctx.fillStyle = '#c8a030'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.6)'
        ctx.shadowBlur = 4

        const cx = W * (ZONE_X + ZONE_W / 2)
        chars.forEach((ch, index) => {
          const cy = startY + index * stepPx + stepPx * 0.5
          ctx.fillText(ch, cx, cy)
        })
      }

      const url = canvas.toDataURL('image/jpeg', 0.92)
      cache.set(cacheKey, url)
      resolve(url)
    }

    img.onerror = () => resolve(imageSrc)
    img.src = imageSrc
  })
}
