import { computed, ref } from 'vue'
import {
  CHANTS, GOALS, createWoodblock, effectiveStreak,
  increment, loadState, recentDays, saveState, todayCount,
} from '../utils/nianfo.js'

// 单例：全站抽屉和 /nianfo/ 页共用同一份状态。
// 如果各自持有一份，在抽屉里念完再打开整页会看到过期数字。
const state = ref(loadState())
const floats = ref([])
const pressed = ref(false)
let play = null

function persist() {
  saveState(state.value)
}

export function useNianfo() {
  const chant = computed(() => CHANTS.find((c) => c.key === state.value.chant) ?? CHANTS[0])
  const today = computed(() => todayCount(state.value))
  const streak = computed(() => effectiveStreak(state.value))
  const goal = computed(() => state.value.goal || 108)
  const progress = computed(() => Math.min(1, today.value / goal.value))
  const reached = computed(() => today.value >= goal.value)
  const days = computed(() => recentDays(state.value, 14))

  function tap() {
    state.value = increment(state.value)
    persist()

    if (state.value.sound) {
      if (!play) play = createWoodblock()
      play()
    }

    pressed.value = true
    setTimeout(() => { pressed.value = false }, 110)

    const id = Date.now() + Math.random()
    floats.value.push({ id, left: 42 + Math.random() * 16 })
    setTimeout(() => {
      floats.value = floats.value.filter((f) => f.id !== id)
    }, 1100)
  }

  function pickChant(key) {
    state.value = { ...state.value, chant: key }
    persist()
  }

  function pickGoal(value) {
    state.value = { ...state.value, goal: value }
    persist()
  }

  function toggleSound() {
    state.value = { ...state.value, sound: !state.value.sound }
    persist()
    if (state.value.sound) {
      if (!play) play = createWoodblock()
      play()
    }
  }

  return {
    CHANTS, GOALS,
    state, floats, pressed,
    chant, today, streak, goal, progress, reached, days,
    tap, pickChant, pickGoal, toggleSound,
  }
}
