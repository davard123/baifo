// 屏幕常亮：拜佛、祭祖、求财时人在叩拜、不碰手机，系统很快就熄屏。
// 网页改不了系统熄屏时间，只能用 Screen Wake Lock 暂时不让它熄；
// 最后一次触碰后 idleMs 内保持常亮，过了就放开，交回系统设置（免得忘了关一直亮着耗电）。
// 不支持的浏览器（部分微信内置浏览器、旧 iOS）什么也不做。
import { onBeforeUnmount, onMounted } from 'vue'

export function useWakeLock({ idleMs = 5 * 60 * 1000 } = {}) {
  let lock = null
  let timer = null
  let alive = true

  async function acquire() {
    if (!alive || lock || document.visibilityState !== 'visible') return
    try {
      lock = await navigator.wakeLock?.request('screen')
      lock?.addEventListener('release', () => { lock = null })
    } catch {
      lock = null
    }
  }

  function release() {
    lock?.release().catch(() => {})
    lock = null
  }

  function poke() {
    acquire()
    clearTimeout(timer)
    timer = setTimeout(release, idleMs)
  }

  function onVisible() {
    // 切回页面时系统会自动收回常亮，要重新申请
    if (document.visibilityState === 'visible') poke()
  }

  const EVENTS = ['pointerdown', 'keydown', 'touchstart']

  onMounted(() => {
    if (!('wakeLock' in navigator)) return
    EVENTS.forEach((e) => window.addEventListener(e, poke, { passive: true }))
    document.addEventListener('visibilitychange', onVisible)
    poke()
  })

  onBeforeUnmount(() => {
    alive = false
    clearTimeout(timer)
    EVENTS.forEach((e) => window.removeEventListener(e, poke))
    document.removeEventListener('visibilitychange', onVisible)
    release()
  })

  return { poke, release }
}
