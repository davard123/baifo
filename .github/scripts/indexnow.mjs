#!/usr/bin/env node
// 上线后通知 IndexNow（Bing、Yandex 等）：只报「内容真的变了」的网址。
//
// 做法：等这次提交的 Cloudflare Pages 部署完成 → 读线上站点地图 → 逐个抓线上 HTML（预渲染内容）
// → 去掉每次构建/每次请求都会变的噪音（打包文件名里的哈希、Cloudflare 注入的标记）后算哈希
// → 和上一次成功运行保存的哈希表比：变了的、新出现的、从站点地图消失的，才提交。
// 哈希表由 workflow 用 actions/cache 存取（不往仓库提交文件，免得又触发一次 push）。
// 没有旧哈希表（第一次运行，或缓存过期被清）时：只建表、不提交。
//
// 环境变量：
//   INDEXNOW_HOST / INDEXNOW_KEY   站点域名与密钥（密钥本来就公开在网站的 keyLocation 文件里）
//   HASH_FILE                      哈希表路径（读旧表、写新表），默认 .indexnow-cache/hashes.json
//   DRY_RUN=1                      只打印要提交的网址，不真的提交（新哈希表照样写出）
//   DEPLOY_SHA + GITHUB_TOKEN + GITHUB_REPOSITORY
//                                  有就先等这个提交的「Cloudflare Pages」检查跑完再抓页面
//   SITEMAP_FALLBACK               线上站点地图取不到时用的仓库内文件（逗号分隔）
//   CONCURRENCY                    同时抓几个页面，默认 5
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { pathToFileURL } from 'node:url'

const UA = 'Mozilla/5.0 (compatible; fopusha-indexnow-diff/1.0; +https://fopusha.com/)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- 纯函数（测试用） ----------

// 去掉和页面内容无关、却每次构建或每次请求都会变的部分
export function normalizeHtml(html) {
  return html
    // Cloudflare 每次请求注入的隐藏链接 /cdn-cgi/content?id=…、邮箱保护、统计脚本
    .replace(/<a\b[^>]*\/cdn-cgi\/[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<script\b[^>]*\/cdn-cgi\/[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b(?:(?!<\/script>)[\s\S])*?(?:__CF\$cv\$params|cloudflareinsights|cf-beacon)(?:(?!<\/script>)[\s\S])*<\/script>/gi, '')
    .replace(/\sdata-cf-beacon=(["'])[^"']*\1/gi, '')
    .replace(/\sdata-cfemail=(["'])[^"']*\1/gi, '')
    .replace(/\/cdn-cgi\/l\/email-protection#[0-9a-f]*/gi, '/cdn-cgi/l/email-protection')
    // Vite 打包出来的 /assets/xxx-哈希.js|css：任何一处代码改动都会让所有页面的这几行变
    .replace(/<script\b[^>]*\bsrc=(["'])[^"']*\/assets\/[^"']*\1[^>]*>\s*<\/script>/gi, '')
    .replace(/<link\b[^>]*\bhref=(["'])[^"']*\/assets\/[^"']*\.(?:m?js|css)(?:\?[^"']*)?\1[^>]*>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const hashHtml = (html) => crypto.createHash('sha256').update(normalizeHtml(html)).digest('hex')

export function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'))
}

// oldMap / newHashes：{ url: hash }；failed：这次没抓到的网址集合
// 返回要提交的网址和要保存的新表。没抓到的网址不算变，沿用旧哈希。
export function diffTables(oldMap, urls, newHashes, failed = new Set()) {
  const changed = [], added = [], removed = []
  const table = {}
  for (const u of urls) {
    if (failed.has(u)) { if (oldMap[u]) table[u] = oldMap[u]; continue }
    const h = newHashes[u]
    table[u] = h
    if (!(u in oldMap)) added.push(u)
    else if (oldMap[u] !== h) changed.push(u)
  }
  const inSitemap = new Set(urls)
  for (const u of Object.keys(oldMap)) if (!inSitemap.has(u)) removed.push(u)
  const submit = [...new Set([...changed, ...added, ...removed])]
  return { changed, added, removed, submit, table }
}

// ---------- 网络 ----------

async function fetchText(url, { tries = 3, timeoutMs = 20000 } = {}) {
  let last = ''
  for (let i = 0; i < tries; i++) {
    if (i) await sleep(2000 * i * i)
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, 'cache-control': 'no-cache', accept: 'text/html,application/xml;q=0.9,*/*;q=0.8' },
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (res.status === 200) return { ok: true, text: await res.text() }
      last = `HTTP ${res.status}`
      if (res.status >= 300 && res.status < 500 && res.status !== 429 && res.status !== 408) break // 跳转/404 重试也没用
    } catch (e) {
      last = e.name === 'TimeoutError' ? 'timeout' : String(e.message || e)
    }
  }
  return { ok: false, error: last }
}

async function pool(items, n, fn) {
  let i = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; await fn(items[k], k) }
  }))
}

// 等这个提交的 Cloudflare Pages 部署跑完。返回 'success' | 'failed:<结论>' | 'timeout' | 'skipped'
async function waitForDeploy(sha, { maxMinutes = 15 } = {}) {
  const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPOSITORY
  if (!sha || !token || !repo) return 'skipped'
  const deadline = Date.now() + maxMinutes * 60000
  let seen = false
  while (Date.now() < deadline) {
    const res = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}/check-runs?per_page=100`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': 'indexnow-workflow' },
    }).catch(() => null)
    if (res?.ok) {
      const runs = (await res.json()).check_runs || []
      const cf = runs.find((r) => /cloudflare pages/i.test(r.name))
      if (cf) {
        if (!seen) { console.log(`Cloudflare Pages 部署已开始（${cf.status}）`); seen = true }
        if (cf.status === 'completed') return cf.conclusion === 'success' ? 'success' : `failed:${cf.conclusion}`
      }
    } else if (res) {
      console.log(`查部署状态失败：HTTP ${res.status}`)
    }
    await sleep(20000)
  }
  return 'timeout'
}

async function getSitemapUrls(base) {
  const urls = []
  const main = await fetchText(`${base}/sitemap.xml`)
  if (main.ok) {
    urls.push(...parseSitemap(main.text))
    // robots.txt 里还列了英文的 sitemap-en.xml，一起读
    const r = await fetchText(`${base}/sitemap-en.xml`, { tries: 2 })
    if (r.ok && r.text.includes('<urlset')) urls.push(...parseSitemap(r.text))
  } else {
    console.log(`线上站点地图取不到（${main.error}），改读仓库文件`)
    for (const f of (process.env.SITEMAP_FALLBACK || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      if (fs.existsSync(f)) urls.push(...parseSitemap(fs.readFileSync(f, 'utf8')))
    }
  }
  // 只要本站的网页地址，去重
  return [...new Set(urls.filter((u) => u.startsWith(base + '/')))]
}

async function submit(host, key, urls) {
  const statuses = []
  for (let i = 0; i < urls.length; i += 10000) {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls.slice(i, i + 10000) }),
    })
    const body = (await res.text().catch(() => '')).slice(0, 300)
    console.log(`IndexNow 返回 ${res.status}${body ? '：' + body : ''}`)
    statuses.push(res.status)
  }
  return statuses
}

// ---------- 主流程 ----------

export async function main() {
  const host = process.env.INDEXNOW_HOST, key = process.env.INDEXNOW_KEY
  if (!host || !key) throw new Error('需要 INDEXNOW_HOST 和 INDEXNOW_KEY')
  const base = `https://${host}`
  const dry = process.env.DRY_RUN === '1'
  const hashFile = process.env.HASH_FILE || '.indexnow-cache/hashes.json'
  const conc = Math.max(1, Math.min(8, Number(process.env.CONCURRENCY) || 5))

  const sha = process.env.DEPLOY_SHA
  if (sha) {
    const st = await waitForDeploy(sha)
    console.log(`部署状态（${sha.slice(0, 7)}）：${st}`)
    if (st.startsWith('failed')) {
      // 部署失败/被后面的提交取消：线上还是旧内容，这次不比对、不改哈希表，由下一次成功部署的运行接手
      console.log('这次提交没有部署成功，跳过。')
      return { skipped: true }
    }
    if (st === 'timeout') console.log('等部署超时，按当前线上内容比对（如果其实还没上线，变化会在下一次运行时检出）。')
    if (st === 'success') await sleep(15000) // 部署刚完成，留几秒让边缘节点切到新版本
  }

  let old = null
  if (fs.existsSync(hashFile)) {
    try { old = JSON.parse(fs.readFileSync(hashFile, 'utf8')) } catch { old = null }
  }
  const oldMap = old?.urls || null

  const urls = await getSitemapUrls(base)
  if (!urls.length) throw new Error('站点地图里没有网址（线上和仓库文件都没取到）')

  const t0 = Date.now()
  const hashes = {}, failed = new Set(), failReasons = {}
  await pool(urls, conc, async (u) => {
    const r = await fetchText(u)
    if (r.ok) hashes[u] = hashHtml(r.text)
    else { failed.add(u); failReasons[u] = r.error }
  })
  console.log(`抓取完成：${urls.length} 个网址，用时 ${Math.round((Date.now() - t0) / 1000)} 秒，失败 ${failed.size} 个`)
  for (const u of [...failed].slice(0, 20)) console.log(`  抓取失败 ${u}（${failReasons[u]}）`)
  // 大面积失败多半是被拦了（如防机器人），这时比对没有意义，报错且不覆盖旧表
  if (failed.size > urls.length * 0.2) throw new Error(`抓取失败太多（${failed.size}/${urls.length}），不比对、不保存`)

  const d = diffTables(oldMap || {}, urls, hashes, failed)
  const save = () => {
    fs.mkdirSync(path.dirname(path.resolve(hashFile)), { recursive: true })
    fs.writeFileSync(hashFile, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), sha: sha || null, urls: d.table }))
  }

  if (!oldMap) {
    console.log(`没有旧哈希表（首次运行或缓存已过期）：只建表，不提交。总网址 ${urls.length}，已记录 ${Object.keys(d.table).length} 个，提交 0 个`)
    save()
    return { firstRun: true, ...d }
  }

  console.log(`总网址 ${urls.length}｜内容变了 ${d.changed.length}｜新增 ${d.added.length}｜已删除 ${d.removed.length}｜要提交 ${d.submit.length}`)
  const show = (label, list) => list.slice(0, 50).forEach((u) => console.log(`  [${label}] ${u}`))
  show('变了', d.changed); show('新增', d.added); show('删除', d.removed)

  if (!d.submit.length) { console.log('没有内容变化，不提交。'); save(); return d }
  if (dry) { console.log(`DRY_RUN：本应提交 ${d.submit.length} 个网址，未提交`); save(); return d }

  const statuses = await submit(host, key, d.submit)
  const bad = statuses.filter((s) => s !== 200 && s !== 202)
  console.log(`实际提交 ${d.submit.length} 个网址，返回码 ${statuses.join(',')}`)
  if (bad.length) {
    // 429 太频繁 / 403 密钥无效 / 422 网址不属于本站 等：报错退出，不保存哈希表，下次运行会重新提交这些网址
    throw new Error(`IndexNow 提交失败（${bad.join(',')}）`)
  }
  save()
  return d
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { console.error('错误：' + (e.message || e)); process.exit(1) })
}
