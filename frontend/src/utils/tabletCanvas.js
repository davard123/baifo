// 在牌位图上直接合成姓名文字，返回 data URL
// 某某某 区域坐标（基于图片百分比，可微调）
const ZONE = { x: 0.28, y: 0.12, w: 0.44, h: 0.40 }

const cache = new Map()

export async function renderTablet(imageSrc, name) {
  const cacheKey = `${imageSrc}::${name}`
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

      // 1. 画原图
      ctx.drawImage(img, 0, 0)

      // 2. 采样"某某某"区上方深色木纹背景色
      const sx = Math.round(W * 0.50)
      const sy = Math.round(H * 0.09)
      const px = ctx.getImageData(sx, sy, 1, 1).data
      const bg = `rgb(${px[0]},${px[1]},${px[2]})`

      // 3. 用采样色填充"某某某"区域，覆盖占位文字
      const zx = W * ZONE.x, zy = H * ZONE.y
      const zw = W * ZONE.w, zh = H * ZONE.h
      ctx.fillStyle = bg
      ctx.fillRect(zx, zy, zw, zh)

      // 4. 竖排写入自定义姓名（金色）
      const chars = Array.from(name || '')
      if (chars.length) {
        const fontSize = Math.round(zw * 0.58)
        ctx.font = `bold ${fontSize}px "SimSun","STSong",serif`
        ctx.fillStyle = '#c8a030'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 3
        const charH = zh / (chars.length + 0.4)
        chars.forEach((ch, i) => {
          ctx.fillText(ch, zx + zw / 2, zy + (i + 0.7) * charH)
        })
      }

      const url = canvas.toDataURL('image/jpeg', 0.92)
      cache.set(cacheKey, url)
      resolve(url)
    }
    img.onerror = () => resolve(imageSrc) // 加载失败时用原图
    img.src = imageSrc
  })
}
