const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE})
await fs.mkdir('evidence', {recursive:true})
const results=[]
try {
for (const [width,height,motion] of [[390,844,'no-preference'],[844,390,'no-preference'],[667,320,'reduce'],[1366,768,'no-preference']]) {
 const context=await browser.newContext({viewport:{width,height},reducedMotion:motion})
 const page=await context.newPage()
 let posts=0, mode='failure', pending
 const errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/*',async route=>{
   const u=new URL(route.request().url())
   if(u.origin!=='http://127.0.0.1:5173') return route.abort()
   if(!u.pathname.startsWith('/api')) return route.continue()
   if(route.request().method()==='POST') {
     posts++
     if(mode==='pending') {pending=route; return}
     if(mode==='http') return route.fulfill({status:503,json:{status:'error'}})
     if(mode==='network') return route.abort()
     if(mode==='json') return route.fulfill({body:'not json'})
     return route.fulfill({json:{status:mode==='failure'?'error':'success'}})
   }
   return route.fulfill({json:u.pathname==='/api/'?{status:'ok'}:[]})
 })
 await page.goto('http://127.0.0.1:5173/')
 await page.locator('.blessing-item').nth(1).click()
 await page.locator('.bm-toggle').click()
 await page.locator('#blessing-name').fill('Synthetic A')
 await page.locator('#blessing-age').fill('30')
 await page.locator('#blessing-target').fill('Synthetic only')
 const button=page.locator('.bm-completion button')
 const box=await button.boundingBox()
 assert(box && box.y>=0 && box.y+box.height<=height && box.height>=44)
 await page.screenshot({path:`evidence/blessing-${width}x${height}.png`})
 await button.click()
 await page.waitForFunction(()=>document.querySelector('.modal-toast')?.textContent.includes('失败'))
 assert(await page.locator('.bm-drawer.open').count()===1)
 assert(await page.locator('#blessing-name').inputValue()==='Synthetic A')
 for(const failure of ['http','network','json']) {
   mode=failure
   await button.click()
   await page.waitForFunction(()=>!document.querySelector('.bm-completion button')?.disabled)
   assert.equal(await page.locator('.bm-drawer.open').count(),1)
   assert.equal(await page.locator('.scene-result').count(),0)
 }
 mode='pending'
 await button.click()
 await page.waitForFunction(()=>document.querySelector('.bm-completion button')?.disabled)
 const before=posts
 await page.locator('#blessing-form').evaluate(el=>{el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));el.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))})
 assert.equal(posts,before)
 await page.locator('.bm-back').click()
 await page.locator('.blessing-item').nth(2).click()
 await pending.fulfill({json:{status:'success'}}).catch(()=>{})
 await page.locator('.bm-toggle').click()
 assert.equal(await page.locator('.scene-result').count(),0,'cancelled A must not finish B')
 mode='success'
 await page.locator('#blessing-name').fill('Synthetic B')
 await page.locator('#blessing-age').fill('31')
 await button.click()
 await page.waitForFunction(()=>document.querySelector('.bm-toggle')?.textContent.includes('查看回向'))
 assert.equal(await page.locator('.bm-drawer.open').count(),0)
 await page.locator('.bm-toggle').click()
 await page.waitForFunction(()=>document.querySelector('.scene-result')?.textContent.includes('Synthetic B'))
 assert.equal(await page.locator('.bm-completion').count(),0)
 await page.locator('.bm-back').click()
 await page.locator('.blessing-item').nth(1).click()
 await page.locator('.bm-toggle').click()
 await page.locator('.r-btn').filter({hasText:'叩拜'}).click()
 await page.waitForFunction(()=>!document.querySelector('.bm-drawer.open'))
 assert.deepEqual(errors,[])
 results.push({width,height,motion,tests:'visible completion, business failure, retry, duplicate submit, cancel A/reopen B, success closes, result reopens, bow closes',posts,status:'passed'})
 await context.close()
}
await fs.writeFile('evidence/browser-results.json',JSON.stringify(results,null,2))
console.log(JSON.stringify(results,null,2))
} finally {await browser.close()}



