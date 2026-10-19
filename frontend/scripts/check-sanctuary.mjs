import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate, compileStyle } from '@vue/compiler-sfc'

const root = fileURLToPath(new URL('../', import.meta.url))
const files = [
  'src/components/AncestorStage.vue',
  'src/components/BlessingPool.vue',
  'src/components/ritual/SanctuaryBackdrop.vue',
  'src/pages/AncestorPage.vue',
  'src/pages/QiucaiPage.vue',
]
let assetCount = 0
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  const { descriptor, errors } = parse(source, { filename: file })
  assert.deepEqual(errors, [], `${file}: parse`)
  const script = compileScript(descriptor, { id: file })
  const template = compileTemplate({ source: descriptor.template.content, filename: file, id: file,
    compilerOptions: { bindingMetadata: script.bindings } })
  assert.deepEqual(template.errors, [], `${file}: template`)
  for (const style of descriptor.styles) {
    assert.deepEqual(compileStyle({ source: style.content, filename: file, id: file, scoped: style.scoped }).errors, [], `${file}: style`)
  }
  for (const match of source.matchAll(/['"](\/sanctuary\/[^'"?]+)(?:\?[^'"]*)?['"]/g)) {
    const asset = fs.readFileSync(path.join(root, 'public', match[1]))
    assert.equal(asset.toString('ascii', 0, 4), 'RIFF', match[1])
    assert.equal(asset.toString('ascii', 8, 12), 'WEBP', match[1])
    assetCount++
  }
}
const ancestor = fs.readFileSync(path.join(root, files[0]), 'utf8')
assert(ancestor.includes('props.customName'), 'custom inscription remains supported')
assert(ancestor.includes(':src="customPhoto"'), 'local photo remains supported')
assert(!ancestor.includes('plain-stage'), 'no full-poster plain stage fallback')
const blessing = fs.readFileSync(path.join(root, files[1]), 'utf8')
assert(!blessing.includes(':src="active.bg"'), 'no flat blessing poster in immersive stage')
for (const key of ['jikang','pingan','xueye','shou','yinyuan','siling','xiaozai','gongming','fulu','heping','jiaqin']) {
  assert(blessing.includes(`${key}:`), `subject mapping: ${key}`)
}
console.log(`PASS: ${files.length} Vue SFCs, ${assetCount} sanctuary asset references, local customization and 11 blessing subjects.`)
