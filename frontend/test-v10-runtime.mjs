import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
const root = path.dirname(fileURLToPath(import.meta.url))
const sourceRoot = path.join(root, 'vendor/dedication-v10')
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
for (let i=1;i<=8;i++) assert.equal(hash(path.join(root,`public/a${i}-20260906.webp`)),JSON.parse(fs.readFileSync(path.join(sourceRoot,'asset-hashes.json'),'utf8'))[`a${i}-original.webp`])
console.log('PASS all 8 original images byte-identical to V10; no replacement faces')
function canvas(width=1180,height=664) {
  const c={width,height,clientWidth:width,clientHeight:height,getBoundingClientRect:()=>({left:0,top:0,width:c.width,height:c.height})}
  const context=new Proxy({ canvas:c,drawImage(){},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:10}) },{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)})
  c.getContext=()=>context;return c
}
const modules=new Map()
function requireSource(name) {
  if(name==='@napi-rs/canvas') return {createCanvas:canvas}
  const file=path.resolve(sourceRoot,name)
  if(modules.has(file))return modules.get(file)
  if(file.endsWith('.json')) return JSON.parse(fs.readFileSync(file,'utf8'))
  const m={exports:{}};modules.set(file,m.exports)
  new Function('require','module','exports',fs.readFileSync(file,'utf8'))(requireSource,m,m.exports)
  modules.set(file,m.exports);return m.exports
}
const engine=requireSource('./engine.cjs')
assert.equal(engine.motionState(.67).scale,1)
assert.ok(engine.effectState(.1).env>0)
assert.equal(engine.cameraState(.67).dx,0)
assert.ok(engine.motionState(1.32).scale>1.7)
assert.notEqual(engine.cameraState(1.32).dx,0)
for(const t of [0,2.8,3]) { assert.equal(engine.motionState(t).scale,1);assert.equal(engine.motionState(t).blur,0);assert.equal(engine.cameraState(t).dx,0) }
const effects=requireSource('./effects.cjs')
assert.equal(effects.flowerGroups.length,48)
assert.ok(effects.mistState(3.2,0,4).y<effects.mistState(2.2,0,4).y)
console.log('PASS light precedes zoom/shake, peak >1.7, identity endpoints, 48 lotus groups, upward mist')
let now=0,next=0,frames=new Map(),failed=false
class ImageMock {
  naturalWidth=1672;naturalHeight=941;complete=true
  set src(value){this._src=value;queueMicrotask(()=>failed?this.onerror?.():this.onload?.())}
  get src(){return this._src}
}
const sandbox={console,AbortController,Promise,Image:ImageMock,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}},
  document:{createElement:()=>canvas(1,1)},window:{addEventListener(){},removeEventListener(){}},
  performance:{now:()=>now},requestAnimationFrame:fn=>{const id=++next;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),
  getComputedStyle:img=>({objectFit:'contain',objectPosition:img.position||'50% 0%',borderLeftWidth:'0',borderRightWidth:'0',borderTopWidth:'0',borderBottomWidth:'0',paddingLeft:'0',paddingRight:'0',paddingTop:'0',paddingBottom:'0'}),}
vm.createContext(sandbox)
vm.runInContext(fs.readFileSync(path.join(root,'src/vendor/dedication-v10/runtime.js'),'utf8').replace('export default globalThis.FopushaDedication;',''),sandbox)
const Player=sandbox.FopushaDedication
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()}
function image(box,offsetWidth=box.width,position='50% 0%') {
  const styles=new Map()
  return {naturalWidth:1672,naturalHeight:941,complete:true,offsetWidth,offsetHeight:box.height,position,getBoundingClientRect:()=>box,
    style:{getPropertyValue:k=>styles.get(k)?.value||'',getPropertyPriority:k=>styles.get(k)?.priority||'',setProperty:(k,value,priority)=>styles.set(k,{value,priority}),removeProperty:k=>styles.delete(k)},
    addEventListener(){},removeEventListener(){},getAttribute:()=>'/original.webp'}
}
for (let i=1;i<=8;i++) {
  const img=image({left:40,top:20,width:1100,height:500},1180),c=canvas()
  let frameCalls=0
  const p=new Player({canvas:c,originalImage:img,id:`a${i}`,assetBase:'/local/',onFrame:()=>frameCalls++})
  await p.ready
  assert.equal(p.busy,false);assert.equal(img.style.getPropertyValue('visibility'),'')
  const rect=p._imageRect(),w=500*1672/941
  assert.ok(Math.abs(rect[0]-(40+(1100-w)/2))<.001);assert.equal(rect[1],20);assert.ok(Math.abs(rect[3]-500)<.001)
  const run=p.playAfterSuccess();assert.equal(p.playAfterSuccess(),run)
  await flush();assert.equal(img.style.getPropertyValue('visibility'),'hidden')
  for(const t of [.1,.67,1.32,2.8,3]) { now=p._run.started+t*1000;const tasks=[...frames.values()];frames.clear();tasks.forEach(fn=>fn(now)) }
  assert.equal((await run).status,'completed');assert.equal(img.style.getPropertyValue('visibility'),'');assert.equal(frames.size,0)
  assert.ok(frameCalls>5)
  const cancel=p.playAfterSuccess();await flush();p.stop();assert.equal((await cancel).status,'cancelled');assert.equal(img.style.getPropertyValue('visibility'),'')
  p.destroy();assert.equal(frames.size,0)
}
console.log('PASS actual bundled renderer all 8: geometry, duplicate promise, sample-frame execution, completion, cancellation, visibility restore')
const mobile=image({left:-90,top:90,width:600,height:338},600,'50% 50%')
const p=new Player({canvas:canvas(390,844),originalImage:mobile,id:'a1'})
await p.ready;const r=p._imageRect();assert.ok(Math.abs(r[0]+90)<.01);assert.ok(Math.abs(r[2]-600)<.01);p.destroy()
failed=true
const bad=new Player({canvas:canvas(),originalImage:image({left:0,top:0,width:500,height:500})})
await assert.rejects(bad.playAfterSuccess());assert.equal(bad.originalImage.style.getPropertyValue('visibility'),'');assert.equal(bad.busy,false);bad.destroy()
console.log('PASS mobile translated geometry and load-failure restoration')
console.log('NOTE canvas drawing is a recording/no-op context, not browser pixels or visual acceptance')
