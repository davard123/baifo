import fs from 'node:fs'
import assert from 'node:assert/strict'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import { BUDDHAS } from './src/data/buddhas.js'
import { createDedicationSound } from './src/utils/dedicationSound.js'
import { fileURLToPath } from 'node:url'
process.chdir(fileURLToPath(new URL('.', import.meta.url)))
globalThis.document = { title: '', querySelector: () => null }
const route = Vue.reactive({ params: { slug: BUDDHAS[0].slug } })
const players = []
const motion = { matches: false, addEventListener() {}, removeEventListener() {} }
globalThis.window = { matchMedia: () => motion }
class FakeDedication {
  constructor(options) { this.options = options; this.ready = Promise.resolve(); this.playCount = 0; this.destroyed = false; players.push(this) }
  playAfterSuccess() { this.playCount++; return new Promise((resolve,reject) => { this.resolve=resolve; this.reject=reject }) }
  stop() { this.resolve?.({ status: 'cancelled' }) }
  destroy() { this.stop(); this.destroyed = true }
}
let pending = [], calls = 0
const apiFetch = (path, options) => { calls++; return new Promise((resolve, reject) => pending.push({ resolve, reject, options })) }
const renderer = Vue.createRenderer({
  createElement: tag => ({ tag, style: {} }), createText: () => ({}), createComment: () => ({}),
  setText() {}, setElementText() {}, parentNode() {}, nextSibling() {},
  insert() {}, remove() {}, patchProp() {},
})
function component(file) {
  const { descriptor } = parse(fs.readFileSync(file, 'utf8'))
  const script = compileScript(descriptor, { id: 'test' })
  let code = script.content
  const deps = { ...Object.fromEntries(Object.entries(Vue).filter(([key]) => /^[a-zA-Z_$][\w$]*$/.test(key))), BUDDHAS, useRoute: () => route, apiFetch,
    useRitual: () => ({ reset() {} }), FopushaDedication: FakeDedication, createDedicationSound }
  code = code.replace(/^import (.+) from ['"](.+)['"];?$/gm, (_, binding) => {
    if (!binding.startsWith('{') && !(binding in deps)) deps[binding] = { render: () => null }
    return ''
  }).replace('export default', 'return')
  const result = new Function(...Object.keys(deps), code)(...Object.values(deps))
  if (file.endsWith('PrayerStage.vue')) {
    const compiled = compileTemplate({ source: descriptor.template.content, filename: file, id: 'test', compilerOptions: { bindingMetadata: script.bindings } })
    assert.equal(compiled.errors.length, 0)
    const helpers = {}
    const templateCode = compiled.code.replace(/^import \{([^}]+)\} from "vue"$/gm, (_, imports) => {
      for (const pair of imports.split(',')) { const [name, alias] = pair.trim().split(/\s+as\s+/); helpers[alias || name] = Vue[name] }
      return ''
    }).replace('export function render', 'return function render')
    result.render = new Function(...Object.keys(helpers), templateCode)(...Object.values(helpers))
  }
  return result
}
function mount(comp, props = {}) {
  let state
  const setup = comp.setup
  const app = renderer.createApp({ ...comp, setup(p, ctx) { state = setup(p, ctx); return state }, render: () => null }, props)
  app.mount({})
  return { state, app }
}
const Page = component('./src/pages/BuddhaPage.vue')
const payload = { username: 'Preview User', age: 30, wish: 'Local simulation only' }
const response = (ok = true, status = 'success') => ({ ok, json: async () => ({ status, message: 'simulated failure' }) })
const originalSetTimeout = globalThis.setTimeout, originalClearTimeout = globalThis.clearTimeout
const timers = new Map()
let timerId = 0
globalThis.setTimeout = (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id }
globalThis.clearTimeout = (id) => timers.delete(id)
function advanceDrawer() {
  const entries = [...timers.entries()].filter(([, timer]) => timer.ms === 320)
  assert.equal(entries.length, 1)
  for (const [id, timer] of entries) { timers.delete(id); timer.fn() }
}
for (const buddha of BUDDHAS) {
  route.params.slug = buddha.slug
  const { state, app } = mount(Page)
  assert.equal(state.blessingId.value, 0)
  const before = calls
  const job = state.onSubmit(payload)
  await state.onSubmit(payload)
  assert.equal(calls, before + 1, 'duplicate blocked')
  pending.shift().resolve(response())
  await job
  assert.equal(state.blessingPhase.value, 'closing')
  assert.equal(state.blessingId.value, 0, 'no animation while closing')
  state.toggleDrawer()
  assert.equal(state.drawerOpen.value, false, 'cannot reopen while closing')
  const target = {}
  state.onDrawerTransitionEnd({ target: {}, currentTarget: target, propertyName: 'transform' })
  state.onDrawerTransitionEnd({ target, currentTarget: target, propertyName: 'opacity' })
  assert.equal(state.blessingId.value, 0, 'ignore unrelated transitions')
  state.onDrawerTransitionEnd({ target, currentTarget: target, propertyName: 'transform' })
  assert.equal(state.blessingId.value, 1)
  assert.equal(timers.size, 0, 'transition cancels fallback')
  assert.equal(state.blessingPhase.value, 'playing')
  state.toggleDrawer()
  assert.equal(state.drawerOpen.value, false)
  assert.equal(route.params.slug, buddha.slug)
  await state.onSubmit(payload)
  assert.equal(calls, before + 1, 'post-success duplicate blocked')
  state.onBlessingEnd()
  assert.equal(state.drawerOpen.value, true)
  assert.equal(state.drawerLocked.value, false)
  state.onBlessingEnd()
  assert.equal(state.blessingId.value, 1, 'end never restarts')
  app.unmount()
}
console.log('PASS all 8: idle, success, duplicate prevention, stay on page')
for (const kind of ['business', 'http', 'network', 'json']) {
  const { state, app } = mount(Page)
  const job = state.onSubmit(payload)
  const req = pending.shift()
  if (kind === 'network') req.reject(new Error('network'))
  else if (kind === 'json') req.resolve({ ok: true, json: async () => { throw new Error('json') } })
  else req.resolve(response(kind !== 'http', 'error'))
  await assert.rejects(job)
  assert.equal(state.blessingId.value, 0)
  assert.equal(state.submitted.value, null)
  const retry = state.onSubmit(payload)
  pending.shift().resolve(response())
  await retry
  advanceDrawer()
  assert.equal(state.blessingId.value, 1)
  app.unmount()
}
console.log('PASS business/HTTP/network/JSON failure: no animation; retry succeeds')
for (const unmount of [false, true]) {
  const { state, app } = mount(Page)
  const job = state.onSubmit(payload), req = pending.shift()
  if (unmount) app.unmount()
  else { route.params.slug = route.params.slug === BUDDHAS[0].slug ? BUDDHAS[1].slug : BUDDHAS[0].slug; await Vue.nextTick() }
  assert.equal(req.options.signal.aborted, true)
  req.resolve(response())
  await job
  assert.equal(state.blessingId.value, 0)
  if (!unmount) app.unmount()
}
console.log('PASS navigation/unmount abort and ignore late response')
for (const phase of ['closing', 'playing']) {
  for (const unmount of [false, true]) {
    const { state, app } = mount(Page)
    const job = state.onSubmit(payload)
    pending.shift().resolve(response()); await job
    if (phase === 'playing') advanceDrawer()
    const before = state.blessingId.value
    const callbacks = [...timers.values()].map(timer => timer.fn)
    if (unmount) app.unmount()
    else { route.params.slug = route.params.slug === BUDDHAS[0].slug ? BUDDHAS[1].slug : BUDDHAS[0].slug; await Vue.nextTick() }
    assert.equal(timers.size, 0)
    assert.equal(state.blessingPhase.value, 'idle')
    callbacks.forEach(fn => fn())
    state.onBlessingEnd()
    assert.equal(state.blessingId.value, before)
    assert.equal(state.drawerOpen.value, false)
    if (!unmount) app.unmount()
  }
}
console.log('PASS closing/playing x navigation/unmount: clear delay, ignore stale start/end')
const Stage = component('./src/components/PrayerStage.vue')
let stageState, ended = 0
const stageProps = Vue.reactive({ buddha: BUDDHAS[0], ritual: { anyDone: { value: false } }, blessingId: 0, onBlessingEnd: () => ended++ })
const setup = Stage.setup
const StageCapture = { ...Stage, setup(p,c) { stageState = setup(p,c); return stageState } }
const app = renderer.createApp({ render: () => Vue.h(StageCapture, stageProps) })
app.mount({})
assert.equal(players.at(-1).options.canvas.tag, 'canvas', 'real compiled template supplies canvas ref')
assert.equal(players.at(-1).options.originalImage.tag, 'img', 'real compiled template supplies original ref')
assert.equal(stageState.blessingActive.value, false)
assert.equal(players.at(-1).playCount, 0, 'never autoplay')
stageProps.blessingId++; await Vue.nextTick()
assert.equal(stageState.blessingActive.value, true)
assert.equal(players.at(-1).playCount, 1)
players.at(-1).resolve({ status: 'completed' }); await Vue.nextTick()
assert.equal(stageState.blessingActive.value, false); assert.equal(ended, 1)
assert.equal(timers.size, 0)
stageProps.blessingId++; await Vue.nextTick()
const prior = players.at(-1)
stageProps.buddha = BUDDHAS[1]; await Vue.nextTick()
assert.equal(stageState.blessingActive.value, false); assert.equal(prior.destroyed, true)
assert.equal(ended, 1)
stageProps.blessingId++; await Vue.nextTick()
players.at(-1).reject(new Error('asset failure')); await Vue.nextTick()
assert.equal(stageState.effectError.value, true); assert.equal(ended, 2)
motion.matches = true
const plays = players.at(-1).playCount
stageProps.blessingId++; await Vue.nextTick()
assert.equal(players.at(-1).playCount, plays); assert.equal(ended, 3)
assert.equal(stageState.blessingActive.value, false)
motion.matches = false
stageProps.blessingId++; await Vue.nextTick()
stageState.onMotionChange({ matches: true }); await Vue.nextTick()
assert.equal(stageState.blessingActive.value, false); assert.equal(ended, 4)
stageProps.blessingId++; await Vue.nextTick()
const watchdogs = [...timers.values()].filter(timer => timer.ms === 10000)
assert.equal(watchdogs.length, 1); watchdogs[0].fn(); await Vue.nextTick()
assert.equal(stageState.blessingActive.value, false); assert.equal(ended, 5)
stageProps.blessingId++; await Vue.nextTick()
app.unmount(); await Vue.nextTick()
assert.equal(timers.size, 0); assert.equal(players.at(-1).destroyed, true); assert.equal(ended, 5)
globalThis.setTimeout = originalSetTimeout; globalThis.clearTimeout = originalClearTimeout
const source = fs.readFileSync('./src/components/PrayerStage.vue','utf8')
assert.doesNotMatch(source, /@keyframes|animation: blessing/)
assert.match(source, /prefers-reduced-motion: reduce/)
assert.match(source, /pointer-events: none/)
assert.match(source, /<canvas ref="canvasElement" class="dedication-canvas"/)
assert.match(source, /<img ref="imageElement"/)
assert.match(source, /<div ref="sceneElement"/)
console.log('PASS Canvas stage: no autoplay, completion, asset failure, route/unmount cleanup, reduced motion, preference change, watchdog')
console.log('PASS no CSS animation duplication; browser visual verification remains pending')
