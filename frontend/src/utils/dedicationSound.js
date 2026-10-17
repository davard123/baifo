// A quiet, synthesized bowl-like hit. No audio file, network call or autoplay.
export function createDedicationSound({ storage, createContext } = {}) {
  const key = 'fopusha.dedication.muted.v1'
  const local = storage ?? (() => { try { return globalThis.localStorage } catch { return null } })()
  let muted = false
  try { muted = local?.getItem(key) === 'true' } catch { /* private browsing */ }
  let context = null, armed = false, played = false, destroyed = false
  const voices = new Set()
  function stop() {
    armed = false
    for (const voice of voices) {
      try { voice.osc.stop() } catch { /* already stopped */ }
      try { voice.osc.disconnect(); voice.gain.disconnect() } catch { /* unsupported */ }
    }
    voices.clear()
  }
  function unlock() {
    if (destroyed || muted) return
    try {
      if (!context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext
        context = createContext ? createContext() : Audio ? new Audio() : null
      }
      // Called synchronously from the form's user gesture. Resume is silent.
      if (context?.state === 'suspended') Promise.resolve(context.resume()).catch(() => {})
    } catch { context = null }
  }
  function setMuted(value) {
    muted = Boolean(value)
    try { local?.setItem(key, String(muted)) } catch { /* optional persistence */ }
    if (muted) stop()
  }
  function begin() { stop(); played = false; armed = !destroyed }
  function onFrame(seconds) {
    // Only an actually rendered peak frame can sound. A skipped/background
    // peak does not produce a delayed hit when the visitor returns.
    if (!armed || played || seconds < 1.28) return
    played = true
    if (seconds > 1.65 || muted || context?.state !== 'running') return
    try {
      const now = context.currentTime
      for (const [start, end, volume, tail] of [[138, 92, .07, .78], [276, 190, .016, .52]]) {
        const osc = context.createOscillator(), gain = context.createGain()
        const voice = { osc, gain }; voices.add(voice)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(start, now)
        osc.frequency.exponentialRampToValueAtTime(end, now + .14)
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(volume, now + .008)
        gain.gain.exponentialRampToValueAtTime(.0001, now + tail)
        osc.connect(gain); gain.connect(context.destination)
        osc.onended = () => { osc.disconnect(); gain.disconnect(); voices.delete(voice) }
        osc.start(now); osc.stop(now + tail + .03)
      }
    } catch { stop() }
  }
  function destroy() {
    stop(); destroyed = true
    try { Promise.resolve(context?.close()).catch(() => {}) } catch { /* optional audio */ }
    context = null
  }
  return { get muted() { return muted }, unlock, setMuted, begin, onFrame, stop, destroy }
}
