import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, getStaticPages } from './seo.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const baseOrigin = new URL(SITE.baseUrl).origin
const HANT_PREFIX = '/zh-hant'
const EXPECTED_HREFLANGS = ['zh-Hans', 'zh-Hant', 'x-default']
const MAX_NAV_LINKS = 40

const failures = []
const warnings = []

function fail(message) {
  failures.push(message)
}

function warn(message) {
  warnings.push(message)
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function stripNonContent(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
}

function textContent(html) {
  return decodeHtml(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function tagMatches(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, 'gi')
  return [...html.matchAll(re)].map((match) => match[0])
}

function contentMatches(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}\\s*>`, 'gi')
  return [...html.matchAll(re)].map((match) => ({ tag: match[0], content: match[1] }))
}

function parseAttrs(tag) {
  const body = tag
    .replace(/^<\s*[^\s/>]+/, '')
    .replace(/\/?>\s*$/, '')
  const attrs = new Map()
  const re = /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  for (const match of body.matchAll(re)) {
    const key = match[1].toLowerCase()
    const value = match[2] ?? match[3] ?? match[4] ?? ''
    attrs.set(key, decodeHtml(value))
  }
  return attrs
}

function attr(tag, name) {
  return parseAttrs(tag).get(name.toLowerCase()) ?? null
}

function normalizeRoute(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

function isHantPath(pathname) {
  return pathname === HANT_PREFIX || pathname.startsWith(`${HANT_PREFIX}/`)
}

function routeBasePath(pathname) {
  if (!isHantPath(pathname)) return normalizeRoute(pathname)
  return normalizeRoute(pathname.slice(HANT_PREFIX.length) || '/')
}

function routeUrl(pathname, hant = isHantPath(pathname)) {
  const basePath = routeBasePath(pathname)
  return `${SITE.baseUrl}${hant ? HANT_PREFIX : ''}${basePath}`
}

function expectedHantUrl(basePath) {
  return routeUrl(basePath, true)
}

function parseCli() {
  const args = process.argv.slice(2)
  let distArg = null
  let json = false
  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/check-static-navigation.mjs [--json] [dist-directory]')
      process.exit(0)
    }
    if (arg === '--json') {
      json = true
      continue
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
    if (distArg) throw new Error('Only one dist-directory argument is supported')
    distArg = arg
  }
  const candidates = distArg
    ? [path.resolve(process.cwd(), distArg)]
    : [path.resolve(process.cwd(), 'dist'), path.resolve(projectRoot, 'dist')]
  const distRoot = candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]
  return { distRoot, json }
}

function expectedRoutes() {
  const basePages = getStaticPages()
  const basePaths = basePages.map((page) => normalizeRoute(page.path))
  const uniqueBasePaths = new Set(basePaths)
  if (basePages.length !== 71 || uniqueBasePaths.size !== 71) {
    fail(`seo.config expected 71 unique Hans pages, found ${basePages.length} entries / ${uniqueBasePaths.size} unique paths`)
  }

  const expected = new Map()
  for (const basePath of uniqueBasePaths) {
    const hans = routeUrl(basePath, false)
    const hant = expectedHantUrl(basePath)
    expected.set(hans, { url: hans, basePath, hant: false })
    expected.set(hant, { url: hant, basePath, hant: true })
  }
  return { basePaths, expected }
}

function sitemapLocs(sitemap) {
  return [...sitemap.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/gi)]
    .map((match) => decodeHtml(match[1].trim()))
    .filter(Boolean)
}

function pathPartsForFile(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '')
  return clean ? clean.split('/').filter(Boolean) : []
}

function htmlCandidates(distRoot, url) {
  const pathname = new URL(url).pathname
  const parts = pathPartsForFile(pathname)
  const nested = path.join(distRoot, ...parts, 'index.html')
  const direct = parts.length ? path.join(distRoot, `${parts.join(path.sep)}.html`) : path.join(distRoot, 'index.html')
  return pathname === '/' ? [path.join(distRoot, 'index.html')] : [nested, direct]
}

function findHtmlFile(distRoot, url) {
  return htmlCandidates(distRoot, url).find((candidate) => fs.existsSync(candidate)) ?? null
}

function resolveInternalHref(href, pageUrl, expected) {
  const value = href.trim()
  if (!value || value.startsWith('#') || value.startsWith('?')) return { kind: 'skip' }
  if (/^(?:mailto:|tel:|javascript:|data:|blob:|file:)/i.test(value)) return { kind: 'skip' }

  let parsed
  try {
    parsed = new URL(value, pageUrl)
  } catch {
    return { kind: 'invalid', value }
  }
  if (parsed.origin !== baseOrigin) return { kind: 'external' }

  const canonical = routeUrl(parsed.pathname)
  return {
    kind: expected.has(canonical) ? 'known' : 'unknown',
    canonical,
    pathname: parsed.pathname,
    value,
  }
}

function extractAnchors(html) {
  return tagMatches(stripNonContent(html), 'a').map((tag) => ({
    tag,
    href: attr(tag, 'href'),
  })).filter((anchor) => anchor.href !== null)
}

function routeLabel(url) {
  const parsed = new URL(url)
  return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

function checkSitemap(distRoot, expected) {
  const sitemapPath = path.join(distRoot, 'sitemap.xml')
  if (!fs.existsSync(sitemapPath)) {
    fail(`Missing generated sitemap: ${sitemapPath}`)
    return []
  }

  const locs = sitemapLocs(fs.readFileSync(sitemapPath, 'utf8'))
  const uniqueLocs = new Set(locs)
  const hans = locs.filter((loc) => {
    try { return !isHantPath(new URL(loc).pathname) } catch { return false }
  })
  const hant = locs.filter((loc) => {
    try { return isHantPath(new URL(loc).pathname) } catch { return false }
  })

  if (locs.length !== 142) fail(`Sitemap must contain 142 <loc> entries (71 Hans + 71 Hant), found ${locs.length}`)
  if (uniqueLocs.size !== locs.length) fail(`Sitemap contains ${locs.length - uniqueLocs.size} duplicate <loc> entries`)
  if (hans.length !== 71) fail(`Sitemap must contain 71 Hans locs, found ${hans.length}`)
  if (hant.length !== 71) fail(`Sitemap must contain 71 Hant locs, found ${hant.length}`)

  const actualSet = new Set(locs)
  const expectedSet = new Set(expected.keys())
  const missing = [...expectedSet].filter((url) => !actualSet.has(url))
  const extra = [...actualSet].filter((url) => !expectedSet.has(url))
  if (missing.length) fail(`Sitemap missing expected locs: ${missing.slice(0, 8).map(routeLabel).join(', ')}${missing.length > 8 ? ', …' : ''}`)
  if (extra.length) fail(`Sitemap has unknown locs: ${extra.slice(0, 8).map(routeLabel).join(', ')}${extra.length > 8 ? ', …' : ''}`)

  for (const loc of locs) {
    try {
      const parsed = new URL(loc)
      if (parsed.origin !== baseOrigin) fail(`Sitemap loc has unexpected origin: ${loc}`)
    } catch {
      fail(`Sitemap loc is not an absolute URL: ${loc}`)
    }
  }
  return locs
}

function checkMeta(record, html) {
  const content = stripNonContent(html)
  const htmlTag = tagMatches(html, 'html')[0]
  const lang = htmlTag ? attr(htmlTag, 'lang') : null
  const langPattern = record.hant ? /^zh-(?:tw|hant)(?:-tw)?$/i : /^zh-(?:cn|hans)(?:-cn)?$/i
  if (!lang || !langPattern.test(lang)) {
    fail(`${routeLabel(record.url)}: expected ${record.hant ? 'Traditional' : 'Simplified'} lang, found ${lang ?? '(missing)'}`)
  }

  const robots = tagMatches(html, 'meta').filter((tag) => (attr(tag, 'name') ?? '').toLowerCase() === 'robots')
  if (robots.length !== 1) fail(`${routeLabel(record.url)}: expected exactly one robots meta tag, found ${robots.length}`)
  const robotsContent = robots[0] ? (attr(robots[0], 'content') ?? '').toLowerCase() : ''
  if (!/\bindex\b/.test(robotsContent) || !/\bfollow\b/.test(robotsContent) || /\bno(?:index|follow)\b/.test(robotsContent)) {
    fail(`${routeLabel(record.url)}: robots must allow index,follow (found ${robotsContent || '(missing)'})`)
  }

  const canonicalTags = tagMatches(html, 'link').filter((tag) => (attr(tag, 'rel') ?? '').toLowerCase().split(/\s+/).includes('canonical'))
  if (canonicalTags.length !== 1) fail(`${routeLabel(record.url)}: expected exactly one canonical link, found ${canonicalTags.length}`)
  const canonical = canonicalTags[0] ? attr(canonicalTags[0], 'href') : null
  if (canonical !== record.url) fail(`${routeLabel(record.url)}: canonical must be self (${record.url}), found ${canonical ?? '(missing)'}`)

  const alternateTags = tagMatches(html, 'link').filter((tag) => {
    const rel = (attr(tag, 'rel') ?? '').toLowerCase().split(/\s+/)
    return rel.includes('alternate') && attr(tag, 'hreflang')
  })
  const alternates = new Map()
  for (const tag of alternateTags) {
    const hreflang = attr(tag, 'hreflang')
    const href = attr(tag, 'href')
    if (hreflang) {
      if (alternates.has(hreflang)) fail(`${routeLabel(record.url)}: duplicate hreflang ${hreflang}`)
      alternates.set(hreflang, href)
    }
  }
  const hans = routeUrl(record.basePath, false)
  const hant = expectedHantUrl(record.basePath)
  const expectedAlternates = { 'zh-Hans': hans, 'zh-Hant': hant, 'x-default': hans }
  for (const hreflang of EXPECTED_HREFLANGS) {
    if (alternates.get(hreflang) !== expectedAlternates[hreflang]) {
      fail(`${routeLabel(record.url)}: hreflang ${hreflang} must be ${expectedAlternates[hreflang]}, found ${alternates.get(hreflang) ?? '(missing)'}`)
    }
  }
  for (const hreflang of alternates.keys()) {
    if (!EXPECTED_HREFLANGS.includes(hreflang)) fail(`${routeLabel(record.url)}: unexpected hreflang ${hreflang}`)
  }
  if (alternateTags.length !== EXPECTED_HREFLANGS.length) {
    fail(`${routeLabel(record.url)}: expected exactly ${EXPECTED_HREFLANGS.length} alternate hreflang links, found ${alternateTags.length}`)
  }

  const h1s = contentMatches(content, 'h1')
  const h1Text = h1s.map(({ content: h1Content }) => textContent(h1Content)).filter(Boolean)
  if (h1Text.length !== 1) fail(`${routeLabel(record.url)}: expected one non-empty H1, found ${h1Text.length}`)
}

function checkLinks(record, html, expected) {
  const anchors = extractAnchors(html)
  const edges = new Set()
  const navBlocks = contentMatches(stripNonContent(html), 'nav')
  const navGroups = navBlocks.length ? navBlocks.map(({ content }) => extractAnchors(content)) : [anchors]
  let pageInternalCount = 0
  let pageNavCount = 0

  const inspect = (anchor) => {
    const result = resolveInternalHref(anchor.href, record.url, expected)
    if (result.kind === 'skip' || result.kind === 'external') return null
    if (result.kind === 'invalid') {
      fail(`${routeLabel(record.url)}: malformed internal href ${JSON.stringify(result.value)}`)
      return null
    }
    if (result.kind === 'unknown') {
      fail(`${routeLabel(record.url)}: internal href targets unknown generated page ${result.value}`)
      return null
    }
    const target = expected.get(result.canonical)
    if (target.hant !== record.hant) {
      fail(`${routeLabel(record.url)}: internal href crosses language boundary (${result.value})`)
      return null
    }
    pageInternalCount += 1
    if (result.canonical !== record.url) edges.add(result.canonical)
    return result.canonical
  }

  for (const anchor of anchors) inspect(anchor)

  for (const navAnchors of navGroups) {
    const targets = []
    for (const anchor of navAnchors) {
      const result = resolveInternalHref(anchor.href, record.url, expected)
      if (result.kind !== 'known') continue
      const targetInfo = expected.get(result.canonical)
      if (targetInfo?.hant !== record.hant) continue
      pageNavCount += 1
      targets.push(result.canonical)
    }
    const duplicates = [...new Set(targets.filter((target, index) => targets.indexOf(target) !== index))]
    for (const duplicate of duplicates) fail(`${routeLabel(record.url)}: duplicate generated nav target ${routeLabel(duplicate)}`)
    if (targets.includes(record.url)) fail(`${routeLabel(record.url)}: generated nav contains a self-link`)
  }

  if (pageNavCount > MAX_NAV_LINKS) {
    fail(`${routeLabel(record.url)}: generated nav has ${pageNavCount} internal links (max ${MAX_NAV_LINKS})`)
  }

  return { edges, pageInternalCount, pageNavCount, navBlockCount: navGroups.length }
}

function checkFamilies(pageRecords, basePaths) {
  const records = new Map(pageRecords.map((record) => [record.url, record]))
  const topicPaths = basePaths.filter((basePath) => basePath.startsWith('/topic/'))
  const buddhaPaths = basePaths.filter((basePath) => basePath.startsWith('/buddha/'))
  const ancestorPaths = basePaths.filter((basePath) => basePath.startsWith('/ancestor/'))

  for (const hant of [false, true]) {
    const suffix = hant ? ' (zh-hant)' : ''
    const page = (basePath) => records.get(routeUrl(basePath, hant))
    const candidatePages = [page('/'), page('/guide/worship')].filter(Boolean)
    const candidateTargets = new Set(candidatePages.flatMap((record) => [...record.edges]))
    const required = [...buddhaPaths.map((basePath) => routeUrl(basePath, hant)), routeUrl('/nianfo', hant)]
    const missing = required.filter((target) => !candidateTargets.has(target))
    if (missing.length) {
      fail(`Home or worship guide is missing Buddha/nianfo navigation${suffix}: ${missing.map(routeLabel).join(', ')}`)
    }

    const ancestors = page('/ancestors')
    const missingAncestors = ancestors
      ? ancestorPaths.map((basePath) => routeUrl(basePath, hant)).filter((target) => !ancestors.edges.has(target))
      : ancestorPaths.map((basePath) => routeUrl(basePath, hant))
    if (missingAncestors.length) {
      fail(`Ancestors landing page is missing detail navigation${suffix}: ${missingAncestors.map(routeLabel).join(', ')}`)
    }

    for (const topicPath of topicPaths) {
      const topic = page(topicPath)
      const related = topic
        ? [...topic.edges].filter((target) => target !== topic.url && topicPaths.some((pathValue) => routeUrl(pathValue, hant) === target))
        : []
      if (!related.length) fail(`Topic page has no related topic link${suffix}: ${routeLabel(routeUrl(topicPath, hant))}`)
    }
  }
}

function graphReport(pageRecords, expected) {
  const incoming = new Map([...expected.keys()].map((url) => [url, 0]))
  for (const record of pageRecords) {
    for (const target of record.edges) incoming.set(target, (incoming.get(target) ?? 0) + 1)
  }
  const incomingZeros = [...incoming.entries()].filter(([, count]) => count === 0).map(([url]) => url)

  const reachable = {}
  for (const hant of [false, true]) {
    const home = routeUrl('/', hant)
    const seen = new Set([home])
    const queue = [home]
    while (queue.length) {
      const source = queue.shift()
      const record = pageRecords.find((candidate) => candidate.url === source)
      if (!record) continue
      for (const target of record.edges) {
        const targetInfo = expected.get(target)
        if (targetInfo?.hant === hant && !seen.has(target)) {
          seen.add(target)
          queue.push(target)
        }
      }
    }
    reachable[hant ? 'zh-Hant' : 'zh-Hans'] = seen.size
    if (seen.size !== 71) fail(`${hant ? 'zh-Hant' : 'zh-Hans'} route graph reaches ${seen.size}/71 generated pages`)
  }
  if (incomingZeros.length) fail(`Route graph has ${incomingZeros.length} zero-incoming pages: ${incomingZeros.slice(0, 12).map(routeLabel).join(', ')}${incomingZeros.length > 12 ? ', …' : ''}`)
  return { incomingZeros, reachable }
}

function main() {
  const { distRoot, json } = parseCli()
  const { basePaths, expected } = expectedRoutes()
  const locs = checkSitemap(distRoot, expected)
  const records = []

  for (const url of expected.keys()) {
    const file = findHtmlFile(distRoot, url)
    if (!file) {
      fail(`Missing generated HTML for ${routeLabel(url)} (looked below ${distRoot})`)
      continue
    }
    const html = fs.readFileSync(file, 'utf8')
    const info = expected.get(url)
    const record = { ...info, file, edges: new Set() }
    checkMeta(record, html)
    const links = checkLinks(record, html, expected)
    record.edges = links.edges
    record.pageInternalCount = links.pageInternalCount
    record.pageNavCount = links.pageNavCount
    record.navBlockCount = links.navBlockCount
    records.push(record)
  }

  if (records.length === expected.size) checkFamilies(records, basePaths)
  const graph = graphReport(records, expected)
  const maxInternal = records.reduce((best, record) => record.pageInternalCount > best.count ? { count: record.pageInternalCount, url: record.url } : best, { count: 0, url: null })
  const maxNav = records.reduce((best, record) => record.pageNavCount > best.count ? { count: record.pageNavCount, url: record.url } : best, { count: 0, url: null })
  const edgeCount = new Set(records.flatMap((record) => [...record.edges].map((target) => `${record.url} -> ${target}`))).size

  const hansLocs = locs.filter((loc) => {
    try { return !isHantPath(new URL(loc).pathname) } catch { return false }
  })
  const hantLocs = locs.filter((loc) => {
    try { return isHantPath(new URL(loc).pathname) } catch { return false }
  })
  const summary = {
    distRoot,
    sitemap: { locs: locs.length, unique: new Set(locs).size, hans: hansLocs.length, hant: hantLocs.length },
    pagesChecked: records.length,
    expectedPages: expected.size,
    uniqueInternalEdges: edgeCount,
    incomingZeros: graph.incomingZeros.map(routeLabel),
    reachable: graph.reachable,
    maxInternalLinks: { count: maxInternal.count, url: maxInternal.url ? routeLabel(maxInternal.url) : null },
    maxNavLinks: { count: maxNav.count, url: maxNav.url ? routeLabel(maxNav.url) : null },
    warnings,
    failures,
    pass: failures.length === 0,
  }
  if (json) {
    console.log(JSON.stringify(summary, null, 2))
  } else {
    console.log(`Static navigation audit: ${distRoot}`)
    console.log(`Sitemap locs: ${locs.length} total (${hansLocs.length} Hans / ${hantLocs.length} Hant), unique ${new Set(locs).size}`)
    console.log(`Pages checked: ${records.length}/${expected.size}; unique internal edges: ${edgeCount}`)
    console.log(`Incoming zeros: ${graph.incomingZeros.length ? graph.incomingZeros.map(routeLabel).join(', ') : 'none'}`)
    console.log(`Language graph reachable: zh-Hans ${graph.reachable['zh-Hans']}/71, zh-Hant ${graph.reachable['zh-Hant']}/71`)
    console.log(`Max generated links/page: ${maxInternal.count}${maxInternal.url ? ` (${routeLabel(maxInternal.url)})` : ''}; max nav links/block: ${maxNav.count}${maxNav.url ? ` (${routeLabel(maxNav.url)})` : ''}`)

    if (warnings.length) {
      console.log(`WARNINGS (${warnings.length}):`)
      for (const message of warnings) console.log(`- ${message}`)
    }
    if (failures.length) {
      console.error(`FAILURES (${failures.length}):`)
      for (const message of failures) console.error(`- ${message}`)
      process.exitCode = 1
      return
    }
    console.log('PASS: sitemap, static HTML metadata, same-language generated links, navigation families, and link graph checks.')
  }
  if (failures.length) process.exitCode = 1
}

try {
  main()
} catch (error) {
  console.error(`FAILURE: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
