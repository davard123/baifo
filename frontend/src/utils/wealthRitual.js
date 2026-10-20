export function wealthRitualProgress(bows) {
  const count = Math.min(3, Math.max(0, Math.floor(Number(bows) || 0)))
  const complete = count === 3
  return {
    count,
    complete,
    nextCount: Math.min(3, count + 1),
    label: complete ? '礼成 · 领取财神赐福' : `叩首（${count}/3）`,
    hint: complete ? '三叩首已完成，点右侧按钮礼成。' : '每点一次叩首一次，共三次。',
  }
}

export function nextWealthDeity(deities, key) {
  if (!deities.length) return null
  const index = deities.findIndex((item) => item.key === key)
  return deities[(index + 1) % deities.length]
}
