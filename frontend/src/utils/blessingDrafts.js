const SUGGESTIONS = {
  caishen: ['愿自己事业顺遂，正财稳进，收支有度。', '愿家人生计安稳，衣食无忧。', '愿生意诚信兴旺，往来和顺。'],
  jikang: ['愿父母身体康健，平安顺遂。', '愿自己身心安稳，早日恢复精神。', '愿家人健康常伴，日常起居安宁。'],
  pingan: ['愿家人出入平安，诸事顺遂。', '愿自己旅途平安，往返顺利。', '愿亲友平安喜乐，远离意外。'],
  xueye: ['愿孩子学业进步，专注勤勉。', '愿自己备考顺利，所学有所成。', '愿家中学子心定志坚，日日精进。'],
  shou: ['愿父母健康长寿，安享晚年。', '愿家中长辈精神康健，岁岁安宁。', '愿自己珍重身体，福寿绵长。'],
  yinyuan: ['愿自己遇见良缘，真诚相待。', '愿伴侣彼此体谅，长久相守。', '愿有情人心意相通，相伴和顺。'],
  siling: ['愿我们身心安康，迎接新生命。', '愿家中母子平安，照护周全。', '愿孩子平安成长，家庭温暖和睦。'],
  xiaozai: ['愿家人远离灾厄，平安度过难关。', '愿自己心安有力，从容应对困境。', '愿亲友诸事安稳，困厄渐消。'],
  gongming: ['愿自己工作顺遂，才有所用。', '愿家人求职顺利，遇见合适机会。', '愿自己勤勉有成，事业稳步向前。'],
  fulu: ['愿家人福气常伴，生活安稳。', '愿自己心怀善意，诸事和顺。', '愿亲友衣食丰足，福禄绵长。'],
  heping: ['愿世界和平，众生安乐。', '愿家人与邻里和睦，少争多谅。', '愿身处纷争的人们平安，早日团圆。'],
  jiaqin: ['愿家宅和睦，亲友康宁，团圆美满。', '愿远方亲人平安，彼此常有牵挂。', '愿一家人互相体谅，日子温暖安稳。'],
}

const draftKey = (theme) => `blessing_target_v1_${theme}`

export function getBlessingSuggestions(theme) {
  return Object.hasOwn(SUGGESTIONS, theme) ? SUGGESTIONS[theme] : []
}

export function getBlessingTarget(theme, storage) {
  if (!Object.hasOwn(SUGGESTIONS, theme)) return ''
  try {
    const saved = (storage ?? globalThis.localStorage)?.getItem(draftKey(theme))
    if (typeof saved === 'string' && saved.trim()) return saved.trim().slice(0, 50)
  } catch {
    // Private browsing / blocked storage must not prevent prayer entry.
  }
  return getBlessingSuggestions(theme)[0]
}

export function saveBlessingTarget(theme, value, storage) {
  if (!Object.hasOwn(SUGGESTIONS, theme)) return
  const text = String(value ?? '').trim().slice(0, 50)
  try {
    const local = storage ?? globalThis.localStorage
    if (text) local?.setItem(draftKey(theme), text)
    else local?.removeItem(draftKey(theme))
  } catch {
    // Input remains usable even when the browser cannot persist it.
  }
}
