#!/usr/bin/env node

/**
 * 本地佛像/财神造型浏览器验收。
 *
 * 运行前不需要改产品源码：脚本用 BrowserContext.addInitScript 固定
 * Math.random，让每一个数据造型都能被单独选中；所有 /wishes 与
 * /ancestor-wishes POST 都在浏览器路由层返回本地 mock 响应，绝不触达生产。
 * 默认只做证据采集（即使当前仍有缺图也会输出完整报告）；加 --strict 或
 * CHECK_STRICT=1 后，任意缺图、src 不匹配、回向未启动或网络越界都会返回非零。
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn, spawnSync } from 'node:child_process'

const { chromium } = await import(resolveModule(process.env.PLAYWRIGHT_MODULE || 'playwright'))
const { BUDDHAS } = await import('../src/data/buddhas.js')
const { CAISHEN } = await import('../src/data/qiucai.js')
const { CAISHEN_SLUG } = await import('../src/data/caishen-detail.js')
const { getCaishenLooks } = await import('../src/data/caishen-looks.js')

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultEvidence = path.resolve(frontendDir, '..', '..', 'fopusha佛像生成', 'check', 'deity-looks-20261024')
const base = new URL(process.env.TEST_BASE || `http://127.0.0.1:${process.env.TEST_PORT || '5173'}`)
const evidenceDir = path.resolve(process.env.TEST_EVIDENCE || defaultEvidence)
const strict = process.argv.includes('--strict') || process.env.CHECK_STRICT === '1'
const buddhaOnly = process.argv.includes('--buddha-only') || process.env.CHECK_BUDDHA_ONLY === '1'
const responsiveSample = process.argv.includes('--responsive-sample') || process.env.CHECK_FOCUS === 'responsive-sample'
function parseViewport(raw) {
  if (!raw) return { width: 1400, height: 1000 }
  const match = /^(\d+)x(\d+)$/i.exec(String(raw).trim())
  if (!match) throw new Error(`Invalid viewport ${raw}; expected WIDTHxHEIGHT, for example 390x844`)
  const width = Number(match[1])
  const height = Number(match[2])
  if (width < 320 || height < 320) throw new Error(`Viewport is too small: ${raw}`)
  return { width, height }
}
const viewport = parseViewport(process.env.TEST_VIEWPORT || process.env.VIEWPORT)
const timeout = Number(process.env.TEST_TIMEOUT || 15000)

// These are the fixed response anchors in dedication-v10's source-pixel
// coordinate system (1672x941).  The browser maps them through the actual
// imageRect, so this check remains valid after PrayerStage fit/crop changes.
// The original Guanyin (a7) emits from its animated mouth rather than a fixed
// response anchor. New Guanyin variants use their explicit targetOutputPixel
// metadata and the static anchor-aware light path instead.
const BUDDHA_EFFECT_ANCHORS = {
  shakyamuni: [670, 313],
  amitabha: [835, 383],
  medicine: [838, 446],
  maitreya: [479, 496],
  manjushri: [765, 277],
  samantabhadra: [690, 130],
  guanyin: null,
  ksitigarbha: [838, 559],
}

function resolveModule(specifier) {
  if (/^(?:node|data|file):/.test(specifier)) return specifier
  if (path.isAbsolute(specifier)) return pathToFileURL(specifier).href
  if (specifier.includes('/') || specifier.includes('\\')) return pathToFileURL(path.resolve(specifier)).href
  return specifier
}

function pathFromSrc(src) {
  if (!src) return ''
  try {
    const url = new URL(src, base)
    return `${url.pathname}${url.search}`
  } catch {
    return src
  }
}

function expectedPath(src) {
  return pathFromSrc(new URL(src, base).href)
}

function safeName(value) {
  return String(value || 'look').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'look'
}

function isRecordEndpoint(pathname) {
  return /^\/(?:wishes|ancestor-wishes)(?:$|[/?])/.test(pathname)
}

function jsonBody(value) {
  return JSON.stringify(value)
}

function recordError(state, type, data) {
  state.networkViolations.push({ type, ...data })
}

async function installNetworkGuards(page, state) {
  await page.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method().toUpperCase()
    const sameOrigin = url.origin === base.origin

    if (!sameOrigin) {
      state.blockedExternal.push({ url: url.href, method })
      await route.abort()
      return
    }

    if (isRecordEndpoint(url.pathname)) {
      const entry = { url: url.href, method, source: 'browser-route-mock' }
      state.recordRequests.push(entry)
      if (method === 'POST') {
        state.mockedWishPosts += 1
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: jsonBody({ status: 'success', published: false, mocked: true }),
        })
      } else {
        state.mockedRecordReads += 1
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      }
      return
    }

    if (url.pathname === '/api/wall' && method === 'GET') {
      state.mockedApiReads += 1
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      return
    }
    if (url.pathname === '/api/stats' && method === 'GET') {
      state.mockedApiReads += 1
      await route.fulfill({ status: 200, contentType: 'application/json', body: jsonBody({ wishes: 0, ancestor: 0, public: 0 }) })
      return
    }
    if ((url.pathname === '/api' || url.pathname === '/api/') && method === 'GET') {
      state.mockedApiReads += 1
      await route.fulfill({ status: 200, contentType: 'application/json', body: jsonBody({ status: 'ok', mocked: true }) })
      return
    }

    if (url.pathname === '/api/wall' && method !== 'GET') {
      recordError(state, 'public-wall-write-blocked', { url: url.href, method })
      await route.fulfill({ status: 403, contentType: 'application/json', body: jsonBody({ status: 'blocked', mocked: true }) })
      return
    }
    if (url.pathname.startsWith('/api/vision') && method !== 'GET') {
      recordError(state, 'vision-write-blocked', { url: url.href, method })
      await route.abort()
      return
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      recordError(state, 'unexpected-local-write', { url: url.href, method })
      await route.abort()
      return
    }

    await route.continue()
  })
}

function makeNetworkState() {
  return {
    recordRequests: [],
    mockedWishPosts: 0,
    mockedRecordReads: 0,
    mockedApiReads: 0,
    blockedExternal: [],
    networkViolations: [],
  }
}

async function createContext(browser, randomValue) {
  const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' })
  await context.addInitScript(({ fixedRandom }) => {
    const value = Number(fixedRandom)
    Math.random = () => value
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      // Storage may be unavailable in a locked-down browser context.
    }
  }, { fixedRandom: randomValue })
  return context
}

async function readImage(locator, waitMs = timeout) {
  try {
    await locator.waitFor({ state: 'attached', timeout: waitMs })
    return await locator.evaluate((image, maxWait) => new Promise((resolve) => {
      const read = () => {
        const rect = image.getBoundingClientRect()
        const style = getComputedStyle(image)
        resolve({
          src: image.currentSrc || image.src || '',
          complete: image.complete,
          loaded: image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          displayWidth: Number(rect.width.toFixed(2)),
          displayHeight: Number(rect.height.toFixed(2)),
          objectFit: style.objectFit || 'fill',
          alt: image.alt || '',
        })
      }
      if (image.complete) {
        read()
        return
      }
      const timer = setTimeout(read, maxWait)
      image.addEventListener('load', () => { clearTimeout(timer); read() }, { once: true })
      image.addEventListener('error', () => { clearTimeout(timer); read() }, { once: true })
    }), waitMs)
  } catch (error) {
    return { loaded: false, error: error.message, src: '', naturalWidth: 0, naturalHeight: 0, displayWidth: 0, displayHeight: 0, objectFit: 'fill' }
  }
}

function withAspectCheck(info) {
  const naturalRatio = info.naturalWidth > 0 && info.naturalHeight > 0
    ? info.naturalWidth / info.naturalHeight
    : null
  const displayRatio = info.displayWidth > 0 && info.displayHeight > 0
    ? info.displayWidth / info.displayHeight
    : null
  const aspectError = naturalRatio && displayRatio
    ? Math.abs(displayRatio - naturalRatio) / naturalRatio
    : null
  // For contain/none/scale-down, the image content preserves its intrinsic
  // ratio inside a frame whose DOM box may intentionally use another ratio.
  // Comparing that frame box directly would reject the existing PrayerStage
  // and Qiucai layouts even though the browser is not stretching the bitmap.
  const preservesIntrinsicRatio = ['contain', 'none', 'scale-down'].includes(info.objectFit)
  return {
    ...info,
    naturalRatio,
    displayRatio,
    aspectError,
    proportionOk: aspectError == null ? false : aspectError <= 0.05 || preservesIntrinsicRatio,
    proportionBasis: preservesIntrinsicRatio ? `object-fit:${info.objectFit}` : 'element-box-vs-natural',
  }
}

async function capture(locator, fallbackPage, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  try {
    await locator.screenshot({ path: outputPath, animations: 'disabled' })
  } catch {
    await fallbackPage.screenshot({ path: outputPath, animations: 'disabled' })
  }
  return outputPath
}

function createPageState(network) {
  return {
    network,
    pageErrors: [],
    requestFailures: [],
    consoleErrors: [],
  }
}

function attachPageDiagnostics(page, state) {
  page.on('pageerror', (error) => state.pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') state.consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => state.requestFailures.push({ url: request.url(), method: request.method(), failure: request.failure()?.errorText || 'unknown' }))
}

async function openPage(browser, randomValue) {
  const context = await createContext(browser, randomValue)
  const page = await context.newPage()
  page.setDefaultTimeout(timeout)
  const network = makeNetworkState()
  const state = createPageState(network)
  attachPageDiagnostics(page, state)
  await installNetworkGuards(page, network)
  return { context, page, state }
}

async function waitForStage(page, selector) {
  await page.locator(selector).waitFor({ state: 'attached', timeout })
}

// Map the selected source-pixel anchor through the same imageRect logic used
// by dedication-v10. The returned centroid is only a pixel-delta heuristic;
// it is evidence for review, never a semantic hand/object detector.
async function inspectBuddhaAlignment(page, targetMeta) {
  return page.locator('.dedication-canvas').evaluate((canvas, meta) => {
    const stage = document.querySelector('.stage')
    const image = document.querySelector('.buddha-img')
    if (!stage || !image) return { available: false, reason: 'stage-or-image-missing', targetMeta: meta }
    const canvasRect = canvas.getBoundingClientRect()
    const imageBox = image.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()
    const css = getComputedStyle(image)
    const px = name => parseFloat(css[name]) || 0
    const sx = image.offsetWidth ? imageBox.width / image.offsetWidth : 1
    const sy = image.offsetHeight ? imageBox.height / image.offsetHeight : 1
    const left = (px('borderLeftWidth') + px('paddingLeft')) * sx
    const top = (px('borderTopWidth') + px('paddingTop')) * sy
    const boxW = Math.max(1, imageBox.width - (px('borderRightWidth') + px('paddingRight')) * sx)
    const boxH = Math.max(1, imageBox.height - (px('borderBottomWidth') + px('paddingBottom')) * sy)
    const iw = image.naturalWidth || 1672
    const ih = image.naturalHeight || 941
    let width = boxW
    let height = boxH
    if (css.objectFit === 'contain' || css.objectFit === 'scale-down') {
      let fit = Math.min(boxW / iw, boxH / ih)
      if (css.objectFit === 'scale-down') fit = Math.min(1, fit)
      width = iw * fit
      height = ih * fit
    }
    const keywords = { left: 0, top: 0, center: .5, right: 1, bottom: 1 }
    const position = (value, available) => {
      if (value in keywords) return available * keywords[value]
      if (String(value).endsWith('%')) return available * parseFloat(value) / 100
      if (String(value).endsWith('px')) return parseFloat(value)
      return available * .5
    }
    const positions = (css.objectPosition || '50% 50%').split(/\s+/)
    const imageRect = [
      imageBox.left - canvasRect.left + left + position(positions[0], boxW - width),
      imageBox.top - canvasRect.top + top + position(positions[1] || '50%', boxH - height),
      width,
      height,
    ]
    const backingScaleX = canvas.width / Math.max(1, canvasRect.width)
    const backingScaleY = canvas.height / Math.max(1, canvasRect.height)
    const result = {
      available: true,
      targetMeta: meta,
      canvasBacking: { width: canvas.width, height: canvas.height },
      canvasRect: { left: canvasRect.left, top: canvasRect.top, width: canvasRect.width, height: canvasRect.height },
      stageRect: { left: stageRect.left, top: stageRect.top, width: stageRect.width, height: stageRect.height },
      imageRect: imageRect.map(value => Number(value.toFixed(4))),
      objectFit: css.objectFit,
      targetOutputPixel: meta?.targetOutputPixel || null,
      detectionMethod: 'canvas active-vs-source-image delta within a 96px CSS window; heuristic only',
    }
    if (!Array.isArray(meta?.targetOutputPixel)) {
      result.reason = meta?.reason || 'dynamic-effect-no-fixed-source-anchor'
      return result
    }
    const sourceX = Number(meta.targetOutputPixel[0])
    const sourceY = Number(meta.targetOutputPixel[1])
    const targetCanvasCss = [
      imageRect[0] + sourceX * imageRect[2] / 1672,
      imageRect[1] + sourceY * imageRect[3] / 941,
    ]
    const targetPage = [canvasRect.left + targetCanvasCss[0], canvasRect.top + targetCanvasCss[1]]
    result.targetCanvasCss = targetCanvasCss.map(value => Number(value.toFixed(3)))
    result.targetScreen = targetPage.map(value => Number(value.toFixed(3)))
    result.targetStage = [targetPage[0] - stageRect.left, targetPage[1] - stageRect.top].map(value => Number(value.toFixed(3)))

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      result.reason = 'canvas-context-missing'
      return result
    }
    const active = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const baseCanvas = document.createElement('canvas')
    baseCanvas.width = canvas.width
    baseCanvas.height = canvas.height
    const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true })
    baseCtx.drawImage(image, imageRect[0] * backingScaleX, imageRect[1] * backingScaleY, imageRect[2] * backingScaleX, imageRect[3] * backingScaleY)
    const source = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height).data
    const targetX = targetCanvasCss[0] * backingScaleX
    const targetY = targetCanvasCss[1] * backingScaleY
    const radiusCss = 96
    const radiusX = Math.max(1, Math.round(radiusCss * backingScaleX))
    const radiusY = Math.max(1, Math.round(radiusCss * backingScaleY))
    const minX = Math.max(0, Math.floor(targetX - radiusX))
    const maxX = Math.min(canvas.width - 1, Math.ceil(targetX + radiusX))
    const minY = Math.max(0, Math.floor(targetY - radiusY))
    const maxY = Math.min(canvas.height - 1, Math.ceil(targetY + radiusY))
    let sumWeight = 0
    let sumX = 0
    let sumY = 0
    let maxDelta = 0
    let deltaPixels = 0
    let activePixels = 0
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const index = (y * canvas.width + x) * 4
        const ar = active[index]
        const ag = active[index + 1]
        const ab = active[index + 2]
        const aa = active[index + 3] / 255
        if (aa > .02) activePixels += 1
        const br = source[index]
        const bg = source[index + 1]
        const bb = source[index + 2]
        const baseAlpha = source[index + 3] / 255
        const delta = Math.max(0, (ar + ag + ab) / 3 - (br + bg + bb) / 3) * Math.max(.35, aa) * Math.max(.35, baseAlpha)
        maxDelta = Math.max(maxDelta, delta)
        if (delta <= 8) continue
        deltaPixels += 1
        const weight = delta - 8
        sumWeight += weight
        sumX += x * weight
        sumY += y * weight
      }
    }
    result.sampleWindow = {
      radiusCss,
      activePixels,
      deltaPixels,
      maxDelta: Number(maxDelta.toFixed(3)),
    }
    if (sumWeight > 0) {
      const centroidCanvasCss = [sumX / sumWeight / backingScaleX, sumY / sumWeight / backingScaleY]
      const centroidPage = [canvasRect.left + centroidCanvasCss[0], canvasRect.top + centroidCanvasCss[1]]
      result.lightCentroidCanvasCss = centroidCanvasCss.map(value => Number(value.toFixed(3)))
      result.lightCentroidScreen = centroidPage.map(value => Number(value.toFixed(3)))
      result.lightCentroidStage = [centroidPage[0] - stageRect.left, centroidPage[1] - stageRect.top].map(value => Number(value.toFixed(3)))
      result.centroidDistancePx = Number(Math.hypot(centroidCanvasCss[0] - targetCanvasCss[0], centroidCanvasCss[1] - targetCanvasCss[1]).toFixed(3))
    } else {
      result.lightCentroidCanvasCss = null
      result.lightCentroidScreen = null
      result.lightCentroidStage = null
      result.centroidDistancePx = null
    }
    return result
  }, targetMeta).catch(error => ({ available: false, reason: error.message, targetMeta }))
}

// This creates a separate annotated copy from the real browser screenshot.
// It never adds a marker to the product page or to the original evidence PNG.
async function annotateAlignmentScreenshot(ownerPage, sourcePath, outputPath, alignment) {
  const source = (await fs.readFile(sourcePath)).toString('base64')
  const annotationPage = await ownerPage.context().newPage()
  try {
    await annotationPage.setContent('<!doctype html><html><body style="margin:0;background:#222"><canvas id="alignment-canvas"></canvas></body></html>')
    await annotationPage.evaluate(({ encoded, evidence }) => new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.querySelector('#alignment-canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        canvas.style.width = `${image.naturalWidth}px`
        canvas.style.height = `${image.naturalHeight}px`
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0)
        const sx = image.naturalWidth / Math.max(1, evidence.stageRect?.width || image.naturalWidth)
        const sy = image.naturalHeight / Math.max(1, evidence.stageRect?.height || image.naturalHeight)
        const point = value => Array.isArray(value) ? [value[0] * sx, value[1] * sy] : null
        const target = point(evidence.targetStage)
        const observed = point(evidence.lightCentroidStage)
        const cross = (value, color, label) => {
          if (!value) return
          const [x, y] = value
          ctx.save()
          ctx.strokeStyle = color
          ctx.fillStyle = color
          ctx.lineWidth = 3
          ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y); ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 16); ctx.stroke()
          ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.stroke()
          ctx.font = 'bold 16px sans-serif'
          ctx.fillText(label, x + 14, y - 12)
          ctx.restore()
        }
        if (target && observed) {
          ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(...target); ctx.lineTo(...observed); ctx.stroke(); ctx.restore()
        }
        cross(target, '#20e0ff', 'target')
        cross(observed, '#ff3b30', 'delta centroid')
        ctx.save()
        ctx.fillStyle = 'rgba(0,0,0,.78)'
        ctx.fillRect(12, 12, Math.min(image.naturalWidth - 24, 680), observed ? 78 : 58)
        ctx.fillStyle = '#fff'
        ctx.font = '14px sans-serif'
        ctx.fillText('ANNOTATED COPY — original screenshot unchanged', 24, 34)
        ctx.fillStyle = '#20e0ff'; ctx.fillText('cyan = source anchor target', 24, 55)
        ctx.fillStyle = '#ff8b83'; ctx.fillText(observed ? 'red = canvas-vs-source light delta centroid (heuristic)' : 'red marker unavailable: no fixed target or detectable delta', 250, 55)
        if (Number.isFinite(evidence.centroidDistancePx)) ctx.fillText(`distance ${evidence.centroidDistancePx}px`, 24, 75)
        ctx.restore()
        resolve()
      }
      image.onerror = () => reject(new Error('annotation source screenshot could not be decoded'))
      image.src = `data:image/png;base64,${encoded}`
    }), { encoded: source, evidence: alignment })
    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    await annotationPage.locator('#alignment-canvas').screenshot({ path: outputPath, animations: 'disabled' })
  } finally {
    await annotationPage.close()
  }
  return outputPath
}

async function performBuddhaBlessing(page, state, outputPath, targetMeta) {
  const toggle = page.locator('.panel-toggle')
  await toggle.click()
  await page.locator('.panel-section.open').waitFor({ state: 'visible', timeout })
  const form = page.locator('.wish-form form')
  await form.locator('#wish-name').fill('浏览器验收')
  await form.locator('#wish-age').fill('35')
  await form.locator('#wish-text').fill('仅用于本地浏览器验收，不向生产提交。')
  await form.locator('input[type="radio"][value="local"]').check()
  await form.locator('button[type="submit"]').click()
  let triggered = false
  try {
    await page.locator('.stage.blessing-active').waitFor({ state: 'visible', timeout: 8000 })
    triggered = true
  } catch {
    // Keep evidence even when an incomplete asset prevents the effect from starting.
  }
  const activeObservedAt = await page.evaluate(() => performance.now()).catch(() => null)
  // The active class is synchronous, while the first light response begins a
  // few frames later. Keep this in the 350–500ms review window so the genuine
  // canvas effect is visible without waiting for a later, different phase.
  await page.waitForTimeout(420)
  const captureObservedAt = await page.evaluate(() => performance.now()).catch(() => null)
  const alignment = await inspectBuddhaAlignment(page, targetMeta)
  if (activeObservedAt !== null && captureObservedAt !== null) {
    alignment.captureDelayMs = Number((captureObservedAt - activeObservedAt).toFixed(1))
    alignment.inspectionDurationMs = Number((await page.evaluate((started) => performance.now() - started, captureObservedAt).catch(() => 0)).toFixed(1))
  }
  const canvas = await page.locator('.dedication-canvas').evaluate((node) => ({
    width: node.width,
    height: node.height,
    displayWidth: node.getBoundingClientRect().width,
    displayHeight: node.getBoundingClientRect().height,
  })).catch(() => null)
  const screenshot = await capture(page.locator('.stage'), page, outputPath)
  const alignmentScreenshot = await annotateAlignmentScreenshot(page, screenshot, outputPath.replace(/\.png$/i, '-alignment.png'), alignment).catch(error => ({ error: error.message }))
  return {
    triggered,
    canvas,
    screenshot,
    alignment,
    alignmentScreenshot,
    wishPostsMocked: state.mockedWishPosts,
  }
}

async function performCaishenBlessing(page, state, outputPath) {
  await page.locator('.qc-info-toggle').click()
  await page.locator('.qc-info-drawer.open').waitFor({ state: 'visible', timeout })
  const form = page.locator('.qc-form')
  await form.locator('#qc-name').fill('浏览器验收')
  await form.locator('#qc-wish').fill('仅用于本地浏览器验收，不向生产提交。')
  await form.locator('input[type="radio"][value="local"]').check()
  await form.locator('button[type="submit"]').click()
  let resultShown = false
  try {
    await page.locator('.qc-result').waitFor({ state: 'visible', timeout })
    resultShown = true
  } catch {
    // Keep evidence for a missing or malformed blessing image.
  }
  const blessingImage = page.locator('.qc-stage__img.blessing')
  const idleOrBlessing = page.locator('.qc-stage__img').first()
  const displayed = await readImage((await blessingImage.count()) ? blessingImage : idleOrBlessing)
  const screenshot = await capture(page.locator('.qc-stage'), page, outputPath)
  return {
    resultShown,
    showPose: (await blessingImage.count()) > 0,
    displayed: withAspectCheck(displayed),
    screenshot,
    wishPostsMocked: state.mockedWishPosts,
  }
}

function buildBuddhaLooks(buddha) {
  return [
    {
      id: 'image',
      label: 'original image',
      image: buddha.image,
      anchorShift: buddha.anchorShift ?? null,
      targetOutputPixel: buddha.targetOutputPixel ?? null,
      mudra: buddha.mudra,
      mudraNote: buddha.mudraNote,
    },
    ...(buddha.variants || []).map((variant, index) => ({
      ...variant,
      id: variant.id || `variant-${index + 1}`,
      label: variant.label || `variant ${index + 1}`,
    })),
  ]
}

function isPoint(value) {
  return Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))
}

function describeBuddhaLook(buddha, look) {
  const isGuanyinOriginal = buddha.slug === 'guanyin' && look.id === 'image'
  const rawShift = isPoint(look.anchorShift) ? [Number(look.anchorShift[0]), Number(look.anchorShift[1])] : null
  const effectiveShift = rawShift || [0, 0]
  const explicitTarget = isPoint(look.targetOutputPixel) ? [Number(look.targetOutputPixel[0]), Number(look.targetOutputPixel[1])] : null
  const effectAnchor = BUDDHA_EFFECT_ANCHORS[buddha.slug]
  const targetOutputPixel = explicitTarget || (isPoint(effectAnchor)
    ? [effectAnchor[0] + effectiveShift[0], effectAnchor[1] + effectiveShift[1]]
    : null)
  const targetOutputPixelSource = explicitTarget
    ? 'data.targetOutputPixel'
    : targetOutputPixel
      ? 'dedication-v10 response anchor + anchorShift'
      : isGuanyinOriginal
        ? 'dynamic response (original Guanyin mouth emitter)'
        : buddha.slug === 'guanyin'
          ? 'static Guanyin variant (no fixed source anchor)'
          : 'dynamic response (no fixed source anchor)'
  return {
    id: look.id,
    label: look.label,
    image: look.image,
    anchorShift: rawShift,
    effectiveAnchorShift: effectiveShift,
    targetOutputPixel,
    targetOutputPixelSource,
    targetMeta: {
      targetOutputPixel,
      reason: targetOutputPixel ? undefined : isGuanyinOriginal
        ? 'Original Guanyin water response uses a dynamic mouth emitter'
        : buddha.slug === 'guanyin'
          ? 'Static Guanyin variant has no fixed source anchor metadata'
          : 'No fixed source anchor metadata',
    },
    mudra: look.mudra || '',
  }
}

function selectedBuddhaLook(buddha, looks, actualSrc, requestedLook) {
  const actual = pathFromSrc(actualSrc)
  const selected = looks.find(item => expectedPath(item.image) === actual) || requestedLook
  return {
    ...describeBuddhaLook(buddha, selected),
    selectionMatchedExpected: selected.id === requestedLook.id && actual === expectedPath(requestedLook.image),
    actualSrc: actual,
  }
}

function buildCaishenLooks(deity) {
  return getCaishenLooks(deity).map((look, index) => ({
    ...look,
    id: look.id || `look-${index + 1}`,
    label: look.label || (index === 0 ? '现有造型' : `新造型 ${index}`),
  }))
}

async function checkBuddhaLook(browser, buddha, look, index, count) {
  const randomValue = Math.min(0.999999, (index + 0.5) / count)
  const { context, page, state } = await openPage(browser, randomValue)
  const slug = buddha.slug
  const stem = `buddha-${safeName(slug)}-${String(index).padStart(2, '0')}-${safeName(look.label)}`
  const expected = expectedPath(look.image)
  const record = {
    category: 'buddha',
    slug,
    name: buddha.name,
    lookIndex: index,
    lookId: look.id,
    lookLabel: look.label,
    randomValue,
    url: new URL(`/buddha/${slug}/`, base).href,
    expectedSrc: expected,
    actualSrc: '',
    selectedLook: null,
    image: null,
    blessing: null,
    screenshots: {},
    diagnostics: null,
    status: 'error',
  }
  try {
    await page.goto(record.url, { waitUntil: 'domcontentloaded' })
    await waitForStage(page, '.stage')
    const image = withAspectCheck(await readImage(page.locator('.buddha-img')))
    record.image = image
    record.actualSrc = pathFromSrc(image.src)
    record.selectedLook = selectedBuddhaLook(buddha, buildBuddhaLooks(buddha), image.src, look)
    record.screenshots.idle = await capture(page.locator('.stage'), page, path.join(evidenceDir, `${stem}-idle.png`))
    record.blessing = await performBuddhaBlessing(page, state, path.join(evidenceDir, `${stem}-blessing.png`), record.selectedLook.targetMeta)
    record.diagnostics = {
      pageErrors: state.pageErrors,
      requestFailures: state.requestFailures,
      consoleErrors: state.consoleErrors,
      network: state.network,
    }
    const imageOk = image.loaded && record.actualSrc === expected && image.proportionOk
    const blessingOk = Boolean(record.blessing.triggered && record.blessing.canvas?.width && record.blessing.canvas?.height)
    record.status = imageOk && blessingOk ? 'passed' : 'failed'
  } catch (error) {
    record.error = error.message
    record.diagnostics = {
      pageErrors: state.pageErrors,
      requestFailures: state.requestFailures,
      consoleErrors: state.consoleErrors,
      network: state.network,
    }
  } finally {
    await context.close()
  }
  return record
}

async function checkCaishenLook(browser, deity, look, index, count) {
  const randomValue = Math.min(0.999999, (index + 0.5) / count)
  const { context, page, state } = await openPage(browser, randomValue)
  const slug = CAISHEN_SLUG[deity.key]
  const stem = `caishen-${safeName(deity.key)}-${String(index).padStart(2, '0')}-${safeName(look.label)}`
  const expected = expectedPath(look.image)
  const expectedBless = look.bless ? expectedPath(look.bless) : ''
  const expectedAvatar = look.avatar ? expectedPath(look.avatar) : ''
  const record = {
    category: 'caishen',
    key: deity.key,
    name: deity.name,
    slug,
    lookIndex: index,
    lookId: look.id,
    lookLabel: look.label,
    randomValue,
    url: new URL(`/qiucai/${slug}/`, base).href,
    expectedSrc: expected,
    expectedBlessSrc: expectedBless,
    expectedAvatarSrc: expectedAvatar,
    actualSrc: '',
    image: null,
    avatar: null,
    blessing: null,
    screenshots: {},
    diagnostics: null,
    status: 'error',
  }
  try {
    await page.goto(record.url, { waitUntil: 'domcontentloaded' })
    await waitForStage(page, '.qc-stage')
    const idleImage = withAspectCheck(await readImage(page.locator('.qc-stage__img').first()))
    const avatar = withAspectCheck(await readImage(page.locator('.qc-deity.active .qc-deity__seal').first()))
    record.image = idleImage
    record.avatar = avatar
    record.actualSrc = pathFromSrc(idleImage.src)
    record.screenshots.idle = await capture(page.locator('.qc-stage'), page, path.join(evidenceDir, `${stem}-idle.png`))
    record.blessing = await performCaishenBlessing(page, state, path.join(evidenceDir, `${stem}-blessing.png`))
    record.diagnostics = {
      pageErrors: state.pageErrors,
      requestFailures: state.requestFailures,
      consoleErrors: state.consoleErrors,
      network: state.network,
    }
    const imageOk = idleImage.loaded && record.actualSrc === expected && idleImage.proportionOk
    const avatarOk = avatar.loaded && pathFromSrc(avatar.src) === expectedAvatar && avatar.proportionOk
    const blessingImage = record.blessing.displayed
    const blessingOk = Boolean(
      record.blessing.resultShown &&
      record.blessing.showPose &&
      blessingImage.loaded &&
      pathFromSrc(blessingImage.src) === expectedBless &&
      blessingImage.proportionOk
    )
    record.status = imageOk && avatarOk && blessingOk ? 'passed' : 'failed'
  } catch (error) {
    record.error = error.message
    record.diagnostics = {
      pageErrors: state.pageErrors,
      requestFailures: state.requestFailures,
      consoleErrors: state.consoleErrors,
      network: state.network,
    }
  } finally {
    await context.close()
  }
  return record
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 30000
  let lastError = ''
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) throw new Error(`本地 Vite 已退出，exit=${child.exitCode}`)
    try {
      const response = await fetch(url)
      if (response.ok || response.status < 500) return
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error.message
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`本地页面未就绪：${url.href}（${lastError}）`)
}

async function ensureDevServer() {
  try {
    await waitForServer(base)
    return { child: null, started: false }
  } catch (existingError) {
    if (process.env.NO_START_SERVER === '1') throw existingError
    const port = base.port || (base.protocol === 'https:' ? '443' : '80')
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const child = spawn(command, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
      cwd: frontendDir,
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      windowsHide: true,
    })
    let serverOutput = ''
    child.stdout?.on('data', (chunk) => { serverOutput += chunk.toString() })
    child.stderr?.on('data', (chunk) => { serverOutput += chunk.toString() })
    try {
      await waitForServer(base, child)
      return { child, started: true, serverOutput: () => serverOutput }
    } catch (error) {
      stopDevServer(child)
      throw new Error(`${error.message}\n${serverOutput}`)
    }
  }
}

function stopDevServer(child) {
  if (!child || child.exitCode !== null) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' })
  } else {
    child.kill('SIGTERM')
  }
}

function summarize(results) {
  const all = [...results.buddhas, ...results.caishen]
  const networkViolations = all.flatMap((item) => item.diagnostics?.network?.networkViolations || [])
  const mockedPosts = all.reduce((sum, item) => sum + (item.diagnostics?.network?.mockedWishPosts || 0), 0)
  return {
    total: all.length,
    passed: all.filter((item) => item.status === 'passed').length,
    failed: all.filter((item) => item.status !== 'passed').length,
    pageErrors: all.reduce((sum, item) => sum + (item.diagnostics?.pageErrors?.length || 0), 0),
    requestFailures: all.reduce((sum, item) => sum + (item.diagnostics?.requestFailures?.length || 0), 0),
    mockedWishPosts: mockedPosts,
    networkViolations,
    strictPass: all.every((item) => item.status === 'passed') && networkViolations.length === 0,
  }
}

function markdownReport(results) {
  const pointText = value => Array.isArray(value) ? `[${value.map(item => Number(item).toFixed(3)).join(', ')}]` : 'none'
  const lines = [
    '# 佛像/财神造型本地浏览器验收',
    '',
    `- 时间：${results.generatedAt}`,
    `- 本地页面：\`${results.base}\``,
    `- Scope: ${results.scope}`,
    `- 运行模式：${results.strict ? 'strict（失败返回非零）' : 'evidence（采集证据，不因缺图退出）'}`,
    '- 网络边界：同源静态资源允许；`/wishes`、`/ancestor-wishes` POST 只由 Playwright route fulfill 本地 mock；`/api/wall`、`/api/stats` 只返回空本地假数据；外部 origin 全部阻断。',
    '- 重要区别：这是本地浏览器路由 mock，不代表真实 API、生产网络或真实心愿墙已验证。',
    '',
    `## 汇总：${results.summary.passed}/${results.summary.total} 通过；${results.summary.failed} 失败`,
    '',
    `- Wish POST observation: route-mocked=${results.summary.mockedWishPosts}; real-network=0. The form selected the local adapter, so no wish POST was emitted; any future same-origin record POST is fulfilled by the local route mock.`,
  ]
  for (const group of [results.buddhas, results.caishen]) {
    for (const item of group) {
      lines.push(`- **${item.category} / ${item.name} / ${item.lookLabel}**：${item.status}`)
      lines.push(`  - URL：\`${item.url}\``)
      lines.push(`  - 期望主图：\`${item.expectedSrc}\``)
      lines.push(`  - 实际主图：\`${item.actualSrc || '无'}\``)
      if (item.selectedLook) lines.push(`  - selected anchorShift=${pointText(item.selectedLook.anchorShift)}; targetOutputPixel=${pointText(item.selectedLook.targetOutputPixel)}; targetSource=${item.selectedLook.targetOutputPixelSource}`)
      if (item.image) lines.push(`  - natural：${item.image.naturalWidth}×${item.image.naturalHeight}；加载=${item.image.loaded}；比例=${item.image.proportionOk}`)
      if (item.avatar) lines.push(`  - avatar：\`${pathFromSrc(item.avatar.src) || '无'}\`；natural=${item.avatar.naturalWidth}×${item.avatar.naturalHeight}；加载=${item.avatar.loaded}`)
      if (item.blessing) lines.push(`  - bless：触发=${item.blessing.triggered ?? item.blessing.resultShown}；显示=${item.blessing.showPose ?? 'canvas'}；截图=\`${path.basename(item.blessing.screenshot)}\``)
      if (item.blessing?.alignment) {
        const alignment = item.blessing.alignment
        lines.push(`  - alignment targetScreen=${pointText(alignment.targetScreen)}; targetStage=${pointText(alignment.targetStage)}; deltaCentroid=${pointText(alignment.lightCentroidScreen)}; distancePx=${alignment.centroidDistancePx ?? 'none'}; captureDelayMs=${alignment.captureDelayMs ?? 'none'}`)
        if (typeof item.blessing.alignmentScreenshot === 'string') lines.push(`  - annotated alignment copy: \`${path.basename(item.blessing.alignmentScreenshot)}\``)
      }
      lines.push(`  - idle 截图：\`${path.basename(item.screenshots.idle || '')}\``)
      if (item.error) lines.push(`  - 错误：${item.error}`)
    }
  }
  lines.push('', '## 判读边界', '', '- 脚本确认的是实际 DOM `src`、图片加载/natural 尺寸、显示比例和回向流程是否启动。截图仍需人工查看，脚本不宣称脸、手指、手印或传统造型视觉合格。', '- 当前若存在素材缺失或零字节文件，strict 会失败；请在接入全部素材后重新运行 `node scripts/check-deity-looks.mjs --strict`。', '')
  return lines.join('\n')
}

async function main() {
  await fs.mkdir(evidenceDir, { recursive: true })
  const server = await ensureDevServer()
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) })
  const results = {
    generatedAt: new Date().toISOString(),
    base: base.href,
    strict,
    scope: responsiveSample ? 'responsive-sample' : (buddhaOnly ? 'buddha-only' : 'buddha-and-caishen'),
    serverStartedByScript: server.started,
    networkPolicy: {
      wishPost: 'Playwright route.fulfill({status: success, mocked: true})',
      publicWallPost: 'blocked',
      externalOrigin: 'blocked',
      productionNetwork: false,
    },
    buddhas: [],
    caishen: [],
    summary: null,
  }
  try {
    const buddhasToCheck = responsiveSample ? BUDDHAS.filter((buddha) => buddha.slug === 'guanyin') : BUDDHAS
    for (const buddha of buddhasToCheck) {
      const allLooks = buildBuddhaLooks(buddha)
      const lookEntries = allLooks.map((look, index) => ({ look, index })).filter(({ look }) => !responsiveSample || look.id !== 'image')
      for (const { look, index } of lookEntries) {
        results.buddhas.push(await checkBuddhaLook(browser, buddha, look, index, allLooks.length))
      }
    }
    if (!buddhaOnly) {
      const caishenToCheck = responsiveSample ? CAISHEN.filter((deity) => deity.key === 'wulu') : CAISHEN
      for (const deity of caishenToCheck) {
        const looks = buildCaishenLooks(deity)
        for (let index = 0; index < looks.length; index += 1) {
          results.caishen.push(await checkCaishenLook(browser, deity, looks[index], index, looks.length))
        }
      }
    }
  } finally {
    await browser.close()
    stopDevServer(server.child)
  }
  results.summary = summarize(results)
  await fs.writeFile(path.join(evidenceDir, 'deity-looks-results.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8')
  await fs.writeFile(path.join(evidenceDir, 'deity-looks-results.md'), `${markdownReport(results)}\n`, 'utf8')
  console.log(JSON.stringify({ evidenceDir, summary: results.summary, serverStartedByScript: results.serverStartedByScript }, null, 2))
  if (strict && !results.summary.strictPass) process.exitCode = 1
}

await main()
