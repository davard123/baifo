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
const sanctuaryRefs = new Set()
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
    sanctuaryRefs.add(match[1])
  }
}
const assetCount = sanctuaryRefs.size
const blessingKeys = [
  'caishen', 'jikang', 'pingan', 'xueye', 'shou', 'yinyuan',
  'siling', 'xiaozai', 'gongming', 'fulu', 'heping', 'jiaqin',
]
const blessingAssetPaths = blessingKeys.map((key) => '/sanctuary/blessing-' + key + '-20261019-v2.webp')
const ancestor = fs.readFileSync(path.join(root, files[0]), 'utf8')
assert(ancestor.includes('props.customName'), 'custom inscription remains supported')
assert(ancestor.includes(':src="customPhoto"'), 'local photo remains supported')
assert(!ancestor.includes('plain-stage'), 'no full-poster plain stage fallback')
const blessing = fs.readFileSync(path.join(root, files[1]), 'utf8')
assert(!blessing.includes(':src="active.bg"'), 'no flat blessing poster in immersive stage')
const blessingData = fs.readFileSync(path.join(root, 'src/data/blessings.js'), 'utf8')
const subjectBlock = blessing.match(/const blessingSubjects = \{[\s\S]*?\n\}/)?.[0] || ''
assert.equal(blessingAssetPaths.length, 12, '12 blessing assets are required')
for (const [index, assetPath] of blessingAssetPaths.entries()) {
  const key = blessingKeys[index]
  assert(blessing.includes(assetPath), `stage asset mapping: ${key}`)
  assert(blessingData.includes(assetPath), `selection asset mapping: ${key}`)
}
for (const reused of ['/qiucai/', 'mandarin-ducks-20261019', 'harmony-tree-20261019', ...Array.from({ length: 8 }, (_, index) => '/a' + (index + 1) + '-20260906')]) {
  assert(!subjectBlock.includes(reused), `reused blessing subject asset: ${reused}`)
}
const missingAssets = [...sanctuaryRefs].filter((assetPath) => !fs.existsSync(path.join(root, 'public', assetPath)))
assert.deepEqual(missingAssets, [], 'missing sanctuary assets: ' + missingAssets.join(', '))
for (const assetPath of sanctuaryRefs) {
  const asset = fs.readFileSync(path.join(root, 'public', assetPath))
  assert.equal(asset.toString('ascii', 0, 4), 'RIFF', assetPath)
  assert.equal(asset.toString('ascii', 8, 12), 'WEBP', assetPath)
}
console.log('PASS: ' + files.length + ' Vue SFCs, ' + assetCount + ' sanctuary assets, local customization, and 12 generated blessing subjects/icons.')
