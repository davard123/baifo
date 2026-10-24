const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const base=process.env.TEST_BASE || 'http://127.0.0.1:5174'
const output=process.env.TEST_EVIDENCE || 'evidence-local'
await fs.mkdir(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE})
const key='fopusha.private-records.v1',results=[]
try {
for(const [width,height] of [[390,844],[844,390],[667,320],[1366,768]]) {
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'})
 await context.addInitScript(({key})=>{
  const original=Storage.prototype.setItem
  Storage.prototype.setItem=function(k,v){if(k===key && window.failRecords)throw new DOMException('Quota','QuotaExceededError');return original.call(this,k,v)}
 },{key})
 const page=await context.newPage(), network=[],errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url())
  if(!['GET','HEAD','OPTIONS'].includes(route.request().method())) {network.push({url:url.href,method:route.request().method()});return route.abort()}
  if(/\/(wishes|ancestor-wishes)(?:$|[/?])/.test(url.pathname)) {network.push({url:url.href,method:route.request().method()});return route.abort()}
  if(url.origin!==new URL(base).origin) return route.abort()
  if(url.pathname.startsWith('/api')) return route.fulfill({json:{status:'ok'}})
  return route.continue()
 })
 let count=0
 for(const kind of ['blessing','buddha','ancestor','wealth']) {
  const path={blessing:'/',buddha:'/buddha/shakyamuni/',ancestor:'/ancestor/father/',wealth:'/qiucai/'}[kind]
  await page.goto(base+path)
  if(kind==='blessing'){await page.locator('.blessing-item').nth(1).click();await page.locator('.bm-toggle').click()}
  else if(kind==='wealth') await page.locator('.qc-info-toggle').click()
  else await page.locator('.panel-toggle').click()
  const form=page.locator({blessing:'#blessing-form',buddha:'.wish-form form',ancestor:'.wish-form form',wealth:'.qc-form'}[kind])
  const radio=form.locator('input[type=radio][value=local]')
  assert.equal(await radio.isChecked(),false,'choice must start empty every time')
  assert.equal(await form.locator('input[type=radio][disabled]').count(),1)
  const name={blessing:'#blessing-name',buddha:'#wish-name',ancestor:'#ancestor-name',wealth:'#qc-name'}[kind]
  await page.locator(name).fill('Synthetic '+kind)
  const age={blessing:'#blessing-age',buddha:'#wish-age',ancestor:'#ancestor-age'}[kind]
  if(age)await page.locator(age).fill('33')
  const submit=kind==='blessing'?page.locator('.bm-completion button'):form.locator('button[type=submit]')
  await submit.click()
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'[]').length,key),count,'unselected must not save')
  await radio.check()
  await page.evaluate(()=>window.failRecords=true)
  await submit.click()
  await page.waitForFunction(()=>document.body.textContent.includes('未保存'))
  assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'[]').length,key),count)
  assert.equal(await page.locator(name).inputValue(),'Synthetic '+kind)
  await page.screenshot({path:`${output}/${kind}-${width}x${height}.png`})
  await page.evaluate(()=>window.failRecords=false)
  await form.evaluate(el=>{el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})
  count++
  await page.waitForFunction(({key,count})=>JSON.parse(localStorage.getItem(key)||'[]').length===count,{key,count})
  if(kind==='blessing') await page.waitForFunction(()=>document.querySelector('.bm-toggle')?.textContent.includes('查看回向'))
  else if(kind==='wealth') await page.waitForFunction(()=>document.querySelector('.qc-result')?.textContent.includes('本机'))
  else await page.waitForFunction(()=>document.querySelector('.dedication-done')?.textContent.includes('本机'))
  // A fresh page/session must not inherit the previous consent choice.
  await page.goto(base+path)
  if(kind==='blessing'){await page.locator('.blessing-item').nth(1).click();await page.locator('.bm-toggle').click()}
  else if(kind==='wealth')await page.locator('.qc-info-toggle').click()
  else await page.locator('.panel-toggle').click()
  assert.equal(await page.locator('input[type=radio][value=local]').isChecked(),false)
 }
 await page.goto(base+'/')
 for(const kind of ['blessing','buddha','ancestor','wealth']) assert((await page.locator('.record-grid').innerText()).includes('Synthetic '+kind))
 await page.goto(base+'/qiucai/')
 await page.locator('.qc-info-toggle').click()
 assert((await page.locator('.qc-wall').textContent()).includes('Synthetic wealth'))
 assert(!(await page.locator('.qc-wall').textContent()).includes('Synthetic buddha'))
 assert.deepEqual(network,[],'no record GET or POST permitted')
 assert.deepEqual(errors,[])
 results.push({width,height,status:'passed',recordCount:count,recordNetworkRequests:network.length,tests:'four flows, explicit fresh choice, disabled public choice, quota failure retains input, retry, duplicate prevention, reload, local personal records'})
 await context.close()
}
const isolated=await browser.newContext()
const fresh=await isolated.newPage()
await fresh.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort())
await fresh.goto(base+'/')
assert.equal(await fresh.evaluate(k=>localStorage.getItem(k),key),null)
assert(!(await fresh.locator('.record-grid').innerText()).includes('Synthetic '))
await isolated.close()
await fs.writeFile(`${output}/results.json`,JSON.stringify(results,null,2))
console.log(JSON.stringify(results,null,2))
}finally{await browser.close()}
