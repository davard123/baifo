import assert from 'node:assert/strict'
import fs from 'node:fs'
import { readLocalRecords, saveLocalRequest, LOCAL_RECORDS_KEY } from '../src/utils/localRecords.js'
const values = new Map()
globalThis.localStorage = { getItem:k=>values.get(k) ?? null, setItem:(k,v)=>values.set(k,v) }
globalThis.fetch = () => { throw new Error('Network must never be called') }
const save = (name, extra={}) => saveLocalRequest('/wishes', {method:'POST',body:JSON.stringify({username:name,wish:'synthetic',storageChoice:'local',...extra})})
await assert.rejects(save('A',{storageChoice:''}),/本次/)
assert.equal(readLocalRecords().length,0)
// 公开到心愿墙：只把打码所需字段发到 /wall；失败时本机也不保存，避免重复。
let wallBody=null
globalThis.fetch = async (url, init) => { assert.match(String(url),/\/wall$/); wallBody=JSON.parse(init.body); return { ok:false, json: async()=>({detail:'测试失败'}) } }
await assert.rejects(save('张三',{storageChoice:'public',buddha:'guanyin',age:40,email:'x@example.invalid'}),/没有公开成功/)
assert.equal(readLocalRecords().length,0)
assert.deepEqual(Object.keys(wallBody).sort(),['deity','kind','name','topic','wish'])
assert.equal(wallBody.kind,'buddha'); assert.equal(wallBody.deity,'观音菩萨')
globalThis.fetch = async (u,init) => { wallBody=JSON.parse(init.body); return { ok:true, json: async()=>({status:'success'}) } }
await save('王小明',{storageChoice:'public',blessing:'caishen',target:'生意兴隆',wish:'【关公·生意兴隆】愿王小明开门红'})
assert.equal(wallBody.wish,'愿王**开门红'); assert.equal(wallBody.deity,'关公'); assert.equal(wallBody.kind,'caishen')
values.delete(LOCAL_RECORDS_KEY)
globalThis.fetch = async () => ({ ok:true, json: async()=>({status:'success'}) })
const pub = await (await save('李四',{storageChoice:'public',blessing:'caishen',target:'生意兴隆',wish:'【关公·生意兴隆】合伙顺利'})).json()
assert.equal(pub.published,true)
assert.equal(readLocalRecords().length,1)
values.delete(LOCAL_RECORDS_KEY)
globalThis.fetch = () => { throw new Error('Network must never be called for local-only records') }
await save('A',{email:'synthetic@example.invalid',remind:true})
await save('B')
assert.equal(readLocalRecords().length,2)
assert.equal(readLocalRecords()[0].email,undefined)
assert.equal(readLocalRecords()[0].remind,undefined)
assert.equal(readLocalRecords()[0].storageChoice,undefined)
const original=values.get(LOCAL_RECORDS_KEY)
localStorage.setItem=()=>{throw new Error('quota')}
await assert.rejects(save('C'),/未保存/)
assert.equal(values.get(LOCAL_RECORDS_KEY),original)
values.set(LOCAL_RECORDS_KEY,'corrupt')
await assert.rejects(save('C'),/现有数据未被覆盖/)
assert.equal(values.get(LOCAL_RECORDS_KEY),'corrupt')
localStorage.getItem=()=>{throw new Error('blocked')}
assert.throws(readLocalRecords,/无法读取/)
await assert.rejects(save('C'),/无法读取/)
const controller=new AbortController();controller.abort()
await assert.rejects(saveLocalRequest('/wishes',{method:'POST',signal:controller.signal}),{name:'AbortError'})
// All production record submitters must explicitly import the local adapter.
for(const name of ['pages/BuddhaPage.vue','pages/AncestorPage.vue','pages/QiucaiPage.vue','components/BlessingPool.vue']) {
 const source=fs.readFileSync(new URL('../src/'+name,import.meta.url),'utf8')
 assert(source.includes('saveLocalRequest as apiFetch'),name)
 assert(!source.includes("apiFetch } from '../api.js'"),name)
}
const source=fs.readFileSync(new URL('../src/api.js',import.meta.url),'utf8').replace('import.meta.env.VITE_API_BASE', "'/api'")
const api=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
for(const path of ['/wishes','/wishes?limit=50','/ancestor-wishes']) await assert.rejects(api.apiFetch(path,{method:'POST',body:'private'}),/旧记录网络接口已停用/)
console.log('PASS local records: explicit choice, public wall publish (fields/failure),  allowlist, persistence, blocked/quota/corrupt preservation, cancellation, all four adapters, network denial')
