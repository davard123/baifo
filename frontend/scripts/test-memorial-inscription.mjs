import assert from 'node:assert/strict'
import {
  buildInscription,
  hasInscription,
  matchesTemplateInscription,
  normalizeInscription,
  relationshipLabel,
} from '../src/utils/memorialInscription.js'

const sampleName = '示例姓名'

assert.equal(buildInscription('father', sampleName), '先父 示例姓名 大人之位')
assert.equal(buildInscription('mother', sampleName), '先母 示例姓名 大人之位')
assert.equal(buildInscription('grandfather', sampleName), '先祖父 示例姓名 大人之位')
assert.equal(buildInscription('grandmother', sampleName), '先祖母 示例姓名 大人之位')
assert.equal(buildInscription('spouse', sampleName), '故人 示例姓名 之位')
assert.equal(buildInscription('child', sampleName), '故人 示例姓名 之位')
assert.equal(buildInscription('ancestors', '示例'), '示例氏列祖列宗之位')
assert.equal(buildInscription('general', sampleName), '有缘故人 示例姓名 之位')

assert.equal(buildInscription('father', '', '目录中的先父之位'), '目录中的先父之位')
assert.equal(buildInscription('unknown', ''), '先人之位')
assert.equal(
  matchesTemplateInscription('father', sampleName, '先父 示例姓名 大人之位'),
  true,
)
assert.equal(
  matchesTemplateInscription('father', sampleName, '先父 旧牌位全文'),
  false,
)
assert.equal(matchesTemplateInscription('father', sampleName, ''), false)
assert.equal(normalizeInscription('  牌位全文  '), '牌位全文')
assert.equal(hasInscription('  牌位全文  '), true)
assert.equal(hasInscription('   '), false)
assert.equal(relationshipLabel('spouse'), '配偶')
assert.equal(relationshipLabel('unknown'), '其他')

console.log('memorial inscription helper tests passed')
