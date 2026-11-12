import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = path => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
assert.doesNotMatch(source('style.css'), /animation:\s*pf-show|\.pf-js\s+\.prerender-fallback/)
assert.doesNotMatch(source('App.vue'), /warmApi/)
assert.match(source('main.js'), /scheduleNonCritical\(warmApi\)/)
const video = source('pages/Home.vue').match(/<video[\s\S]*?<\/video>/)[0]
assert.doesNotMatch(video, /autoplay|:src=/)
assert.match(video, /preload="none"/)
assert.match(source('pages/Home.vue'), /IntersectionObserver/)

const listeners = {}, idle = [], scripts = []
const context = vm.createContext({
  window: {
    location: { hostname: 'fopusha.com' },
    addEventListener: (name, callback) => { listeners[name] = callback },
    requestIdleCallback: callback => idle.push(callback),
  },
  document: { readyState: 'loading', createElement: () => ({}), head: { appendChild: script => scripts.push(script) } },
})
vm.runInContext(source('utils/analytics.js').replaceAll('export function', 'function'), context)
vm.runInContext("initAnalytics(); track('early_click', {target:'home'}); initAnalytics()", context)
assert.equal(scripts.length, 0, 'No analytics network script before load')
assert.equal(context.window.dataLayer.length, 3, 'Early event queued without duplicate config')
listeners.load()
assert.equal(scripts.length, 0, 'Wait for idle after load')
idle[0]()
assert.equal(scripts.length, 1)
assert.match(scripts[0].src, /^https:\/\/www.googletagmanager.com\/gtag\/js/)
console.log('Startup performance: PASS (visible fallback, lazy video, deferred warmup, early analytics queue)')
