import assert from 'node:assert/strict'
import { BLESSINGS } from '../src/data/blessings.js'

const drafts = await import('../src/utils/blessingDrafts.js').catch(() => null)
assert(drafts, '祈福主题推荐词和本机草稿模块尚未实现')
const { getBlessingSuggestions, getBlessingTarget, saveBlessingTarget } = drafts
const values = new Map()
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
}

for (const blessing of BLESSINGS) {
  const suggestions = getBlessingSuggestions(blessing.key)
  assert(suggestions.length >= 3, `${blessing.key}: 至少三条推荐词`)
  assert.equal(new Set(suggestions).size, suggestions.length)
  assert(suggestions.every((text) => text.length > 0 && text.length <= 50))
  assert.equal(getBlessingTarget(blessing.key, storage), suggestions[0], '首次自动填入推荐词')
}
saveBlessingTarget('jikang', '  愿父母身体康健，平安顺遂。  ', storage)
assert.equal(getBlessingTarget('jikang', storage), '愿父母身体康健，平安顺遂。', '未提交的修改也可恢复')
assert.equal(getBlessingTarget('caishen', storage), getBlessingSuggestions('caishen')[0], '主题之间不串词')
saveBlessingTarget('jikang', getBlessingSuggestions('jikang')[1], storage)
assert.equal(getBlessingTarget('jikang', storage), getBlessingSuggestions('jikang')[1], '点选推荐词也保留')
saveBlessingTarget('jikang', '   ', storage)
assert.equal(getBlessingTarget('jikang', storage), getBlessingSuggestions('jikang')[0], '清空后下次恢复主题推荐')
assert.equal(getBlessingTarget('unknown', storage), '')
const unavailable = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') }, removeItem() { throw new Error('denied') } }
assert.equal(getBlessingTarget('pingan', unavailable), getBlessingSuggestions('pingan')[0])
assert.doesNotThrow(() => saveBlessingTarget('pingan', '愿家人平安', unavailable))
console.log('PASS: 12 themes, recommendations, last-input priority, theme isolation, clearing and unavailable storage.')
