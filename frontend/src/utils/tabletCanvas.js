const OVERLAY_X = 0.448
const OVERLAY_W = 0.102
const OVERLAY_Y_START = 0.19
const OVERLAY_Y_END = 0.525
const TEXT_Y_START = 0.208
const DEFAULT_STEP = 0.103
const cache = new Map()
const VERSION = 7

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

      const overlayX = Math.round(W * OVERLAY_X)
      const overlayY = Math.round(H * OVERLAY_Y_START)
      const overlayW = Math.round(W * OVERLAY_W)
      const overlayH = Math.round(H * (OVERLAY_Y_END - OVERLAY_Y_START))

      // Rebuild the center name column from nearby wood texture so it blends with the original plaque.
      const leftSampleX = Math.round(W * 0.454)
      const centerSampleX = Math.round(W * 0.486)
      const rightSampleX = Math.round(W * 0.522)
      const sampleW = Math.max(10, Math.round(W * 0.02))
      const midW = Math.round(overlayW * 0.32)
      const sideW = Math.round((overlayW - midW) / 2)

      ctx.drawImage(img, leftSampleX, overlayY, sampleW, overlayH, overlayX, overlayY, sideW, overlayH)
      ctx.drawImage(img, centerSampleX, overlayY, sampleW, overlayH, overlayX + sideW, overlayY, midW, overlayH)
      ctx.drawImage(
        img,
        rightSampleX,
        overlayY,
        sampleW,
        overlayH,
        overlayX + sideW + midW,
        overlayY,
        overlayW - sideW - midW,
        overlayH
      )

      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = 'rgba(61, 39, 23, 0.22)'
      ctx.fillRect(overlayX, overlayY, overlayW, overlayH)
      ctx.restore()

      const gloss = ctx.createLinearGradient(overlayX, overlayY, overlayX + overlayW, overlayY)
      gloss.addColorStop(0, 'rgba(255, 237, 210, 0.035)')
      gloss.addColorStop(0.5, 'rgba(255, 240, 214, 0.01)')
      gloss.addColorStop(1, 'rgba(255, 237, 210, 0.03)')
      ctx.fillStyle = gloss
      ctx.fillRect(overlayX, overlayY, overlayW, overlayH)

      const chars = Array.from(cleanName).slice(0, 4)
      const maxTextHeight = H * (OVERLAY_Y_END - TEXT_Y_START) * 0.94
      const stepPx = Math.min(H * DEFAULT_STEP, maxTextHeight / chars.length)
      const fontSize = Math.max(18, Math.round(stepPx * 0.62))
      const textBlockHeight = stepPx * chars.length
      const startY = H * TEXT_Y_START + Math.max(0, (maxTextHeight - textBlockHeight) / 2)

      ctx.font = `700 ${fontSize}px "KaiTi","STKaiti","SimSun",serif`
      ctx.fillStyle = '#e2c887'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(43, 26, 13, 0.24)'
      ctx.shadowBlur = 1.4

      const cx = W * (OVERLAY_X + OVERLAY_W / 2)
      chars.forEach((char, index) => {
        const cy = startY + index * stepPx + stepPx * 0.5
        ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.04))
        ctx.strokeStyle = 'rgba(124, 86, 44, 0.34)'
        ctx.strokeText(char, cx, cy)
        ctx.fillText(char, cx, cy)
      })

      const url = canvas.toDataURL('image/png')
      cache.set(cacheKey, url)
      resolve(url)
    }

    img.onerror = () => resolve(imageSrc)
    img.src = imageSrc
  })
}
