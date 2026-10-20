import assert from 'node:assert/strict'
import fs from 'node:fs'

const helpers = await import('../src/utils/wealthRitual.js').catch(() => null)
assert(helpers, '拜财神缺少明确的三叩首进度和礼成状态')
const { wealthRitualProgress, nextWealthDeity } = helpers
for (let count = 0; count < 3; count++) {
  const progress = wealthRitualProgress(count)
  assert.equal(progress.count, count)
  assert.equal(progress.complete, false)
  assert.equal(progress.nextCount, count + 1)
  assert(progress.label.includes(`${count}/3`))
  assert(progress.hint.includes('三'))
}
for (const count of [3, 4, 99]) {
  const progress = wealthRitualProgress(count)
  assert.equal(progress.count, 3)
  assert.equal(progress.nextCount, 3)
  assert.equal(progress.complete, true)
  assert.equal(progress.label, '礼成 · 领取财神赐福')
}
const deities = [{ key: 'a' }, { key: 'b' }, { key: 'c' }]
assert.equal(nextWealthDeity(deities, 'a').key, 'b')
assert.equal(nextWealthDeity(deities, 'c').key, 'a')
assert.equal(nextWealthDeity([], 'a'), null)
const source = fs.readFileSync(new URL('../src/pages/QiucaiPage.vue', import.meta.url), 'utf8')
for (const text of ['finishCeremony', 'qc-ritual-progress', '结束返回首页', '拜下一位', '礼敬已完成']) assert(source.includes(text), text)
console.log('PASS: three-bow progression, capped counts, explicit completion and next/exit actions.')
