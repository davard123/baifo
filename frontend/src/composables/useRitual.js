// 礼佛 / 祭祀 / 祈福 三处共用的仪式状态。
// 第一步「供养」：上香、点灯、献花、供果（各做一次，留在供台上）；
// 第二步「礼敬」：叩拜、绕佛、奠酒、烧纸（不锁，没供养完也能点）。
import { computed, reactive } from 'vue'

export const OFFERINGS = [
  { key: 'incense', label: '上香', icon: '🪔' },
  { key: 'light', label: '点灯', icon: '🕯️' },
  { key: 'flower', label: '献花', icon: '🌸' },
  { key: 'fruit', label: '供果', icon: '🍑' },
]

const HOMAGE = {
  bow: { key: 'bow', label: '叩拜', icon: '🙏', repeat: true },
  circle: { key: 'circle', label: '绕佛', icon: '🔆', repeat: true },
  wine: { key: 'wine', label: '奠酒', icon: '🍶' },
  paper: { key: 'paper', label: '烧纸', icon: '🔥' },
}

export const HOMAGE_BY_MODE = {
  buddha: [HOMAGE.bow, HOMAGE.circle],
  ancestor: [HOMAGE.wine, HOMAGE.paper, HOMAGE.bow],
  blessing: [HOMAGE.bow],
}

const TOASTS = {
  buddha: {
    incense: '心香一炷，供养十方诸佛。',
    light: '灯烛已燃，愿慧灯常明。',
    flower: '鲜花供佛，愿心地清净。',
    fruit: '鲜果已供，愿福慧双增。',
    bow: '顶礼叩拜，礼敬十方诸佛。',
    circle: '绕佛三匝，消业增福。',
  },
  ancestor: {
    incense: '心香一炷，敬告先人。',
    light: '长明灯已点，照亮归途。',
    flower: '鲜花敬献，寄托思念。',
    fruit: '鲜果已供，聊表孝心。',
    wine: '清酒一杯，敬奠先人。',
    paper: '纸钱已化，愿先人安乐。',
    bow: '叩首拜祭，慎终追远。',
  },
  blessing: {
    incense: '心香一瓣，供养十方。',
    light: '慧灯常明，照破无明。',
    flower: '鲜花供养，愿所求如意。',
    fruit: '鲜果已供，愿福报圆满。',
    bow: '叩首礼拜，诚心祈福。',
  },
}

export function useRitual(mode = 'buddha') {
  const state = reactive({
    done: {},
    // 叩拜：大于 0 即开始循环叩首；绕佛：每点一次重播光环
    bowRun: 0,
    circleRun: 0,
    toast: '',
  })
  let toastTimer = null

  const offeringsDone = computed(() => OFFERINGS.every((item) => state.done[item.key]))
  const anyDone = computed(() => Object.keys(state.done).length > 0)

  function act(key) {
    const repeat = key === 'bow' || key === 'circle'
    if (!repeat && state.done[key]) return
    state.done = { ...state.done, [key]: true }
    if (key === 'bow') state.bowRun += 1
    if (key === 'circle') state.circleRun += 1

    clearTimeout(toastTimer)
    state.toast = TOASTS[mode]?.[key] || '已完成。'
    toastTimer = setTimeout(() => {
      state.toast = ''
    }, 2400)
  }

  function reset() {
    clearTimeout(toastTimer)
    state.done = {}
    state.bowRun = 0
    state.circleRun = 0
    state.toast = ''
  }

  return { state, act, reset, offeringsDone, anyDone, homage: HOMAGE_BY_MODE[mode] || [] }
}
