const DEFAULT_SLOT = {
  x: 0.5,
  yStart: 0.29,
  yEnd: 0.54,
  fontScale: 0.56,
  color: '#d8bc79',
  stroke: 'rgba(112, 75, 37, 0.32)',
  shadow: 'rgba(43, 26, 13, 0.24)',
}

const TABLET_SLOTS = {
  'father.png': {
    x: 0.498,
    yStart: 0.30,
    yEnd: 0.55,
  },
  'mother.png': {
    x: 0.499,
    yStart: 0.305,
    yEnd: 0.555,
    color: '#b08a52',
    stroke: 'rgba(138, 104, 58, 0.22)',
    shadow: 'rgba(255, 245, 226, 0.18)',
  },
  'grandfather.png': {
    x: 0.5,
    yStart: 0.305,
    yEnd: 0.555,
  },
  'grandmother.png': {
    x: 0.498,
    yStart: 0.305,
    yEnd: 0.555,
  },
  'ancestors.png': {
    x: 0.499,
    yStart: 0.29,
    yEnd: 0.535,
  },
  'spouse.png': {
    x: 0.5,
    yStart: 0.295,
    yEnd: 0.545,
  },
  'child.png': {
    x: 0.499,
    yStart: 0.305,
    yEnd: 0.56,
    color: '#b08a52',
    stroke: 'rgba(138, 104, 58, 0.22)',
    shadow: 'rgba(255, 245, 226, 0.18)',
  },
  'general.png': {
    x: 0.5,
    yStart: 0.305,
    yEnd: 0.575,
  },
}

const cache = new Map()
const VERSION = 14

function getTabletSlot(imageSrc) {
  const filename = String(imageSrc || '').split('/').pop()
  return { ...DEFAULT_SLOT, ...(TABLET_SLOTS[filename] || {}) }
}

export async function renderTablet(imageSrc, name, options = {}) {
  const { blank = false } = options
  const cleanName = (name || '').trim()
  if (!cleanName) return imageSrc

  const cacheKey = `${VERSION}::${imageSrc}::${cleanName}::${blank ? 'blank' : 'named'}`
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
      const slot = getTabletSlot(imageSrc)

      ctx.drawImage(img, 0, 0)

      const chars = Array.from(cleanName).slice(0, 4)
      const slotHeight = H * (slot.yEnd - slot.yStart)
      const maxTextHeight = slotHeight * 0.92
      const divisor = Math.max(chars.length, 1)
      const stepPx = maxTextHeight / divisor
      const fontSize = Math.max(17, Math.round(stepPx * slot.fontScale))
      const textBlockHeight = stepPx * chars.length
      const startY = H * slot.yStart + Math.max(0, (maxTextHeight - textBlockHeight) / 2)

      ctx.font = `700 ${fontSize}px "KaiTi","STKaiti","SimSun",serif`
      ctx.fillStyle = slot.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = slot.shadow
      ctx.shadowBlur = 1.4

      if (chars.length) {
        const cx = W * slot.x
        chars.forEach((char, index) => {
          const cy = startY + index * stepPx + stepPx * 0.5
          ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.04))
          ctx.strokeStyle = slot.stroke
          ctx.strokeText(char, cx, cy)
          ctx.fillText(char, cx, cy)
        })
      }

      const url = canvas.toDataURL('image/png')
      cache.set(cacheKey, url)
      resolve(url)
    }

    img.onerror = () => resolve(imageSrc)
    img.src = imageSrc
  })
}
