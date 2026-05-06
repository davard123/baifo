const OVERLAY_X = 0.435
const OVERLAY_W = 0.128
const OVERLAY_Y_START = 0.16
const OVERLAY_Y_END = 0.54
const TEXT_Y_START = 0.19
const DEFAULT_STEP = 0.103
const cache = new Map()
const VERSION = 9

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

      // Clear the original placeholder column completely, then rebuild a clean wood plaque core.
      const woodBase = ctx.createLinearGradient(overlayX, overlayY, overlayX + overlayW, overlayY)
      woodBase.addColorStop(0, '#4e3220')
      woodBase.addColorStop(0.18, '#6a4630')
      woodBase.addColorStop(0.5, '#5a3926')
      woodBase.addColorStop(0.82, '#69452f')
      woodBase.addColorStop(1, '#4b301f')
      ctx.fillStyle = woodBase
      ctx.fillRect(overlayX, overlayY, overlayW, overlayH)

      const verticalShade = ctx.createLinearGradient(overlayX, overlayY, overlayX, overlayY + overlayH)
      verticalShade.addColorStop(0, 'rgba(255, 241, 216, 0.05)')
      verticalShade.addColorStop(0.12, 'rgba(255, 241, 216, 0.015)')
      verticalShade.addColorStop(0.72, 'rgba(38, 23, 12, 0.06)')
      verticalShade.addColorStop(1, 'rgba(24, 14, 8, 0.12)')
      ctx.fillStyle = verticalShade
      ctx.fillRect(overlayX, overlayY, overlayW, overlayH)

      const innerGlow = ctx.createLinearGradient(overlayX, overlayY, overlayX + overlayW, overlayY)
      innerGlow.addColorStop(0, 'rgba(255, 236, 208, 0.028)')
      innerGlow.addColorStop(0.5, 'rgba(255, 236, 208, 0.008)')
      innerGlow.addColorStop(1, 'rgba(255, 236, 208, 0.026)')
      ctx.fillStyle = innerGlow
      ctx.fillRect(overlayX, overlayY, overlayW, overlayH)

      const chars = Array.from(cleanName).slice(0, 4)
      const maxTextHeight = H * (OVERLAY_Y_END - TEXT_Y_START) * 0.94
      const stepPx = Math.min(H * DEFAULT_STEP, maxTextHeight / chars.length)
      const fontSize = Math.max(18, Math.round(stepPx * 0.58))
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
