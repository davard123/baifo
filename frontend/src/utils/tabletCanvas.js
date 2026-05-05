// Canvas 合成：在牌位图上覆盖某某某区域并写入自定义姓名
// 坐标基于实测（1122×1402图）：深色木面 x:36-64%, 某某某 y:28-60%

const ZONE_X = 0.36   // 深色木面左边界
const ZONE_W = 0.28   // 深色木面宽度
const TEXT_Y_START = 0.27  // 某某某第一字顶部
const CHAR_STEP  = 0.128   // 每个字符占图片高度的比例（含间距）
const BG_SAMPLE  = [0.50, 0.40]   // 采样深色背景的坐标（某某某字间深色区）

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

      // 1. 画原始牌位图
      ctx.drawImage(img, 0, 0)

      // 2. 采样深色木纹背景色（字符间区域）
      const sx = Math.round(W * BG_SAMPLE[0])
      const sy = Math.round(H * BG_SAMPLE[1])
      let px
      try { px = ctx.getImageData(sx, sy, 1, 1).data }
      catch { px = [59, 41, 27, 255] }  // CORS fallback: #3b291b
      const bg = `rgb(${px[0]},${px[1]},${px[2]})`

      // 3. 填充"某某某"整体区域（从第一字上方到第三字下方）
      const fillX = W * ZONE_X
      const fillY = H * (TEXT_Y_START - 0.02)
      const fillW = W * ZONE_W
      const fillH = H * (CHAR_STEP * 3 + 0.05)  // 3个字的高度 + 余量
      ctx.fillStyle = bg
      ctx.fillRect(fillX, fillY, fillW, fillH)

      // 4. 竖排写入自定义姓名（匹配原字大小）
      const chars = Array.from(name || '')
      if (chars.length > 0) {
        const fontSize = Math.round(H * CHAR_STEP * 0.82)
        ctx.font = `bold ${fontSize}px "KaiTi","STKaiti","SimSun",serif`
        ctx.fillStyle = '#c8a030'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.6)'
        ctx.shadowBlur = 4

        const cx = W * (ZONE_X + ZONE_W / 2)
        chars.forEach((ch, i) => {
          const cy = H * TEXT_Y_START + i * H * CHAR_STEP + H * CHAR_STEP * 0.5
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
