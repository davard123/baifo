#!/usr/bin/env node

/**
 * Regression checks for the dedication-v10 Guanyin variant branch.
 *
 * The runtime is browser-oriented and intentionally has no Node canvas
 * dependency in this repository.  A no-op canvas shim lets this test exercise
 * the actual engine/wrapper branching and asset plumbing without installing a
 * new dependency or changing product code.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const Module = require('node:module')
const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const engineFile = path.join(frontendDir, 'vendor', 'dedication-v10', 'engine.cjs')
const rigFile = path.join(frontendDir, 'vendor', 'dedication-v10', 'rig-motion.cjs')
const wrapperFile = path.join(frontendDir, 'vendor', 'dedication-v10', 'browser-wrapper.js')
const bundledRuntimeFile = path.join(frontendDir, 'src', 'vendor', 'dedication-v10', 'runtime.js')

const drawLog = []
const canvases = []

function gradient() {
  return { addColorStop() {} }
}

function makeCanvas(width = 1, height = 1) {
  const state = { drawImages: [] }
  const canvas = {
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    parentElement: null,
    getBoundingClientRect() {
      return { left: 0, top: 0, width: this.width, height: this.height, right: this.width, bottom: this.height }
    },
  }
  const context = new Proxy({
    canvas,
    state,
    globalAlpha: 1,
    createLinearGradient: gradient,
    createRadialGradient: gradient,
    drawImage(...args) {
      state.drawImages.push(args[0])
      drawLog.push({ canvas, source: args[0], args })
    },
    measureText() { return { width: 0 } },
  }, {
    get(target, property) {
      if (property in target) return target[property]
      return () => {}
    },
    set(target, property, value) {
      target[property] = value
      return true
    },
  })
  canvas.getContext = () => context
  canvas._state = state
  canvases.push(canvas)
  return canvas
}

const originalLoad = Module._load
Module._load = function loadWithCanvasShim(request, parent, isMain) {
  if (request === '@napi-rs/canvas') return { createCanvas: makeCanvas }
  return originalLoad.call(this, request, parent, isMain)
}
const engine = require(engineFile)
const rig = require(rigFile)
Module._load = originalLoad

const assets = Object.fromEntries(
  ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'clean', 'pose']
    .map(id => [id, { id }]),
)
const imageRect = [0, 0, 1672, 941]
const outputContext = () => makeCanvas(960, 1200).getContext('2d')
const resetLog = () => { drawLog.length = 0 }
const assetDraws = id => drawLog.filter(entry => entry.source === assets[id]).length

const calls = { statue: 0, waterMotion: 0, glows: [] }
const originalStatue = rig.statue
const originalWaterMotion = rig.waterMotion
const originalGlow = rig.glow
rig.statue = (...args) => {
  calls.statue += 1
  return originalStatue(...args)
}
rig.waterMotion = (...args) => {
  calls.waterMotion += 1
  return originalWaterMotion(...args)
}
rig.glow = (...args) => {
  if (args[4] === '223,248,228') calls.glows.push({ x: args[1], y: args[2] })
  return originalGlow(...args)
}

try {
  // The original a7 keeps its existing animated wrist rig and water response.
  resetLog()
  calls.statue = 0
  calls.waterMotion = 0
  calls.glows = []
  engine.draw(outputContext(), 0.8, 'a7', assets, {
    imageRect,
    transparentBackground: true,
    anchorShift: [0, 0],
    guanyinVariant: null,
  })
  assert.ok(calls.statue > 0, 'original a7 must retain the animated statue rig')
  assert.ok(calls.waterMotion > 0, 'original a7 must retain dynamic water')
  assert.ok(assetDraws('clean') > 0 && assetDraws('pose') > 0, 'original a7 may use bundled clean/pose rig assets')

  // New silhouettes must not borrow the original Guanyin raster slices.
  resetLog()
  calls.statue = 0
  calls.waterMotion = 0
  calls.glows = []
  engine.draw(outputContext(), 0.8, 'a7', assets, {
    imageRect,
    transparentBackground: true,
    anchorShift: [46.096, -57.64],
    guanyinVariant: 'static',
  })
  assert.equal(calls.statue, 0, 'static a7 variant must not call the legacy statue rig')
  assert.equal(calls.waterMotion, 0, 'static a7 variant must not call the legacy water rig')
  assert.equal(assetDraws('clean'), 0, 'static a7 variant must not draw clean-base.png')
  assert.equal(assetDraws('pose'), 0, 'static a7 variant must not draw pouring-pose.png')
  assert.ok(assetDraws('a7') > 0, 'static a7 variant must still draw the selected a7 image')
  assert.equal(calls.glows.length, 1, 'static a7 variant should use one bottleGlow source')
  const shiftedGlow = calls.glows[0]

  // pointFor() must apply anchorShift to the static bottle glow.
  resetLog()
  calls.glows = []
  engine.draw(outputContext(), 0.8, 'a7', assets, {
    imageRect,
    transparentBackground: true,
    anchorShift: [0, 0],
    guanyinVariant: 'static',
  })
  assert.equal(calls.glows.length, 1, 'unshifted static a7 should expose one bottleGlow source')
  const baseGlow = calls.glows[0]
  const motionScale = engine.motionState(0.8).scale
  assert.ok(Math.abs((shiftedGlow.x - baseGlow.x) - 46.096 * motionScale) < 1e-6, 'anchorShift x must move static bottleGlow')
  assert.ok(Math.abs((shiftedGlow.y - baseGlow.y) + 57.64 * motionScale) < 1e-6, 'anchorShift y must move static bottleGlow')

  // Compile the browser wrapper as CommonJS in memory.  The project is type=module,
  // while this vendor source intentionally uses CommonJS for the browser bundler.
  globalThis.window = { addEventListener() {}, removeEventListener() {} }
  globalThis.ResizeObserver = undefined
  class FakeImage {
    constructor() {
      this.complete = false
      this.naturalWidth = 0
      this.naturalHeight = 0
      this._listeners = {}
    }
    addEventListener(type, handler) { this._listeners[type] = handler }
    removeEventListener(type) { delete this._listeners[type] }
    getAttribute() { return this._src || '' }
    set src(value) {
      this._src = value
      this.complete = true
      this.naturalWidth = 1672
      this.naturalHeight = 941
      queueMicrotask(() => {
        this.onload?.()
        this._listeners.load?.()
      })
    }
    get src() { return this._src || '' }
  }
  globalThis.Image = FakeImage

  const wrapperModule = new Module(wrapperFile, null)
  wrapperModule.filename = wrapperFile
  wrapperModule.paths = Module._nodeModulePaths(path.dirname(wrapperFile))
  wrapperModule._compile(fs.readFileSync(wrapperFile, 'utf8'), wrapperFile)
  const Wrapper = wrapperModule.exports

  const originalEngineDraw = engine.draw
  let wrapperOptions = null
  engine.draw = (...args) => {
    wrapperOptions = args[4]
    return originalEngineDraw(...args)
  }
  const wrapper = new Wrapper({
    canvas: makeCanvas(960, 1200),
    id: 'a7',
    anchorShift: [-49.071267, -76.08],
    guanyinVariant: 'static',
    assetSources: Object.fromEntries(Object.keys(assets).map(id => [id, `/test/${id}.png`])),
  })
  await wrapper.ready
  wrapper._render(0.8)
  assert.equal(wrapperOptions?.guanyinVariant, 'static', 'browser wrapper must pass guanyinVariant to engine.draw')
  assert.deepEqual(wrapperOptions?.anchorShift, [-49.071267, -76.08], 'browser wrapper must pass anchorShift to engine.draw')
  wrapper.destroy()
  engine.draw = originalEngineDraw

  const bundledRuntime = fs.readFileSync(bundledRuntimeFile, 'utf8')
  assert.match(bundledRuntime, /guanyinVariant/, 'rebuilt browser runtime must include guanyinVariant')
  assert.match(bundledRuntime, /anchorShift: this\.anchorShift/, 'rebuilt browser runtime must include anchorShift in draw options')

  console.log('test-guanyin-variants: passed (original dynamic rig; static variant no clean/pose rig; anchorShift; wrapper passthrough; rebuilt bundle)')
} finally {
  rig.statue = originalStatue
  rig.waterMotion = originalWaterMotion
  rig.glow = originalGlow
}
