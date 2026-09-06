import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { BUDDHAS } from '../src/data/buddhas.js';
import { ANCESTORS } from '../src/data/ancestors.js';
import { BLESSINGS } from '../src/data/blessings.js';
const root=new URL('../',import.meta.url);
const refs=[...BUDDHAS.flatMap(x=>[x.image,x.thumb]),...ANCESTORS.map(x=>x.image),...BLESSINGS.flatMap(x=>[x.icon,x.bg])];
for(const ref of refs) assert(fs.existsSync(new URL('public'+ref.split('?')[0],root)),ref);
const source=fs.readFileSync(new URL('src/utils/tabletCanvas.js',root),'utf8').replaceAll('export async function','async function').replaceAll('export function','function');
const ctx=vm.createContext({});vm.runInContext(source,ctx);
for(const a of ANCESTORS){
 const current=vm.runInContext(`getTabletSlot(${JSON.stringify(a.image)})`,ctx);
 const original=vm.runInContext(`getTabletSlot(${JSON.stringify('/ancestors/'+a.slug+'.png')})`,ctx);
 assert.equal(JSON.stringify(current),JSON.stringify(original),`Tablet alignment changed: ${a.slug}`);
}
assert(BLESSINGS.find(x=>x.key==='yinyuan').bg.includes('marriage'));
assert(BLESSINGS.find(x=>x.key==='jiaqin').bg.includes('family'));
console.log(`PASS: ${refs.length} image references, 8 unchanged tablet coordinate maps, prayer-theme mappings.`);
