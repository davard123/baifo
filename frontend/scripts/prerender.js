import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, canonicalUrl } from './seo.config.js'
import { getStaticPages } from './seo.jing.js'
import { getStaticNavigation } from './static-navigation.js'
import { SOUND_HELP } from '../src/data/soundHelp.js'
import { GUIDES } from '../src/data/guides.js'
import { NIANJING, toUnits, decorateUnits } from '../src/data/nianjing.js'
import { hantSutraText, tidyHantCopy } from '../src/i18n/hantSutra.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const indexPath = path.join(distDir, 'index.html')

if (!fs.existsSync(indexPath)) {
  throw new Error(`Cannot prerender without build output: ${indexPath}`)
}

// 繁体版：内容与简体共用，构建时用 OpenCC 转成台湾正体，输出到 dist/zh-hant/
const OpenCC = (await import('opencc-js/cn2t')).default
const toHantText = OpenCC.Converter({ from: 'cn', to: 'tw' })
const HANT_DIR = 'zh-hant'

function hantUrl(url) {
  return url.replace(SITE.baseUrl, `${SITE.baseUrl}/${HANT_DIR}`)
}

function toHantPage(page) {
  // 繁体页有专用文案的（念经页：注音版）先换上，再整体转繁体
  const tidy = page.hantCopy ? tidyHantCopy : (value) => value
  if (page.hantCopy) page = { ...page, ...page.hantCopy }
  return {
    ...page,
    hant: true,
    title: tidy(toHantText(page.title)),
    description: tidy(toHantText(page.description)),
    heading: tidy(toHantText(page.heading)),
    summary: tidy(toHantText(page.summary || '')),
    schema: JSON.parse(tidy(toHantText(JSON.stringify(page.schema ?? [])))),
  }
}

// 念经页：经文全文写进 HTML（搜索引擎和没开 JS 的人能读到）。繁体每个字配注音、简体配拼音；
// 太长的经（地藏经、仁王经）只放字，免得页面过大。
const NIANJING_RUBY_MAX = 6000
const nianjingTexts = new Map()
for (const item of NIANJING) {
  const data = (await item.load()).default
  nianjingTexts.set(item.slug, { item, data })
}

function nianjingFullText(slug, hant) {
  const entry = nianjingTexts.get(slug)
  if (!entry) return ''
  const { item, data } = entry
  const rawLines = data.lines
  const hantLines = hant ? rawLines.map((l) => hantSutraText(l.text, toHantText, l.pinyin)) : null
  const units = decorateUnits(toUnits(rawLines), hantLines)
  const withRuby = units.chars.length <= NIANJING_RUBY_MAX
  const out = []
  const name = hant ? toHantText(item.title) : item.title
  out.push(`<section class="nj-fulltext" lang="${hant ? 'zh-Hant' : 'zh-Hans'}">`)
  out.push(`  <h2>${escapeHtml(name)}${hant ? '全文（注音）' : '全文（拼音）'}</h2>`)
  let heading = ''
  let para = []
  const flush = () => {
    if (para.length) out.push(`  <p>${para.join('')}</p>`)
    para = []
  }
  units.lines.forEach((ln) => {
    if (ln.heading && ln.heading !== heading) {
      flush()
      heading = ln.heading
      out.push(`  <h3>${escapeHtml(hant ? toHantText(heading) : heading)}</h3>`)
    }
    const html = ln.tokens.map((t) => {
      const ch = escapeHtml(t.dch || t.ch)
      if (t.u === undefined || !withRuby) return ch
      const rt = hant ? t.zy : t.py
      return rt ? `<ruby>${ch}<rt>${escapeHtml(rt)}</rt></ruby>` : ch
    }).join('')
    para.push(html)
    if (/[。！？」』]$/.test(ln.text) || ln.stanza) flush()
  })
  flush()
  out.push('</section>')
  return out.join('\n')
}

const template = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n').replace(/^[ \t]+$/gm, '')

function ensureTrailingSlashless(url) {
  return url === '/' ? '/' : url.replace(/\/+$/, '')
}

function buildMetaTags(page) {
  const hansCanonical = canonicalUrl(page.path)
  const canonical = page.hant ? hantUrl(hansCanonical) : hansCanonical
  const image = `${SITE.baseUrl}${page.image || SITE.defaultImage}`
  const keywords = SITE.keywords.join(',')

  return [
    `<title>${escapeHtml(page.title)} - ${SITE.baseUrl.replace(/^https?:\/\//, '')}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<meta name="keywords" content="${keywords}" />`,
    `<meta name="author" content="${SITE.baseUrl.replace(/^https?:\/\//, '')}" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${page.hant ? 'zh_TW' : SITE.defaultLocale}" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="alternate" hreflang="zh-Hans" href="${hansCanonical}" />`,
    `<link rel="alternate" hreflang="zh-Hant" href="${hantUrl(hansCanonical)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${hansCanonical}" />`,
  ].join('\n    ')
}

function buildJsonLd(page) {
  return `<script type="application/ld+json" id="ld-webpage">${JSON.stringify(page.schema)}</script>`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildFallbackContent(page, staticPages) {
  // 放在 #app 内部，Vue mount 时整体替换；对无 JS 的爬虫/访客是真实可见内容。
  // 之前是 position:absolute;left:-9999px 的离屏隐藏块 —— 属于 Google 明确
  // 列为作弊信号的 hidden text，且内容与页面可见 FAQ 重复。
  const lines = [
    '<div class="prerender-fallback">',
    `  <h1>${page.heading}</h1>`,
    `  <p>${page.summary}</p>`,
  ]
  if (page.leadLink) {
    const href = page.hant ? hantUrl(canonicalUrl(page.leadLink.path)) : canonicalUrl(page.leadLink.path)
    const label = page.hant ? toHantText(page.leadLink.label) : page.leadLink.label
    lines.push(`  <p><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`)
  }

  // Visible help content, without adding FAQ rich-result markup.
  const convert = page.hant ? toHantText : value => value
  if (page.path === '/nianfo') {
    lines.push('<section id="sound-help">', '<h2>'+escapeHtml(convert(SOUND_HELP.title))+'</h2>',
      '<p>'+escapeHtml(convert(SOUND_HELP.intro))+'</p>')
    for (const faq of SOUND_HELP.faqs) lines.push('<h3>'+escapeHtml(convert(faq.q))+'</h3>', '<p>'+escapeHtml(convert(faq.a))+'</p>')
    lines.push('<p>'+escapeHtml(convert(SOUND_HELP.disclaimer))+'</p>', '</section>')
  }
  if (page.path === '/guide/ancestors') {
    lines.push('<section id="memorial-writing"><h2>'+escapeHtml(convert('追思的话怎么写'))+'</h2></section>')
    for (const faq of GUIDES.ancestors.faqs) lines.push('<h3>'+escapeHtml(convert(faq.q))+'</h3>', '<p>'+escapeHtml(convert(faq.a))+'</p>')
  }
  if (page.nianjingSlug) lines.push(nianjingFullText(page.nianjingSlug, page.hant))
  // Flatten schema array (some entries may themselves be arrays)
  const schemas = [page.schema].flat(2).filter(Boolean)

  // Inject articleBody if present and different from summary
  const articleSchema = schemas.find((s) => s['@type'] === 'Article' || s['@type'] === 'BlogPosting')
  if (articleSchema?.articleBody && articleSchema.articleBody !== page.summary) {
    lines.push(`  <p>${articleSchema.articleBody}</p>`)
  }

  // Inject FAQ Q&A as HTML <dl> so Google sees the text directly
  const faqSchema = schemas.find((s) => s['@type'] === 'FAQPage')
  if (faqSchema?.mainEntity?.length) {
    lines.push('  <dl>')
    for (const q of faqSchema.mainEntity) {
      lines.push(`    <dt>${q.name}</dt>`)
      lines.push(`    <dd>${q.acceptedAnswer?.text ?? ''}</dd>`)
    }
    lines.push('  </dl>')
  }

  // Keep bounded, relevant navigation available before JavaScript loads.
  const navigation = getStaticNavigation(page, staticPages)
  if (navigation.length) {
    lines.push(`  <nav aria-label="${page.hant ? '相關內容' : '相关内容'}">`)
    for (const group of navigation) {
      const groupLabel = page.hant ? toHantText(group.label) : group.label
      lines.push(`    <section><h2>${escapeHtml(groupLabel)}</h2><ul>`)
      for (const link of group.links) {
        const href = page.hant ? hantUrl(canonicalUrl(link.path)) : canonicalUrl(link.path)
        const label = page.hant ? toHantText(link.label) : link.label
        lines.push(`      <li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`)
      }
      lines.push('    </ul></section>')
    }
    lines.push('  </nav>')
  }
  lines.push('</div>')
  return lines.join('\n')
}

function renderPage(page, staticPages) {
  const head = buildMetaTags(page)
  const jsonLd = buildJsonLd(page)
  const fallbackContent = buildFallbackContent(page, staticPages)

  return template
    // The homepage hero otherwise becomes discoverable only after the lazy Vue route loads.
    .replace('</head>', page.path === '/'
      ? '    <link rel="preload" as="image" href="/qiucai/caishen-hero.webp?v=2" fetchpriority="high" />\n  </head>'
      : '</head>')
    .replace('<html lang="zh-CN">', page.hant ? '<html lang="zh-Hant">' : '<html lang="zh-CN">')
    .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:300,max-video-preview:-1" />')
    .replace(/<!-- SEO_META_START -->[\s\S]*?<!-- SEO_META_END -->/, `<!-- SEO_META_START -->\n    ${head}\n    <!-- SEO_META_END -->`)
    .replace(/<script type="application\/ld\+json" id="ld-webpage">[\s\S]*?<\/script>/, jsonLd)
    .replace(/<script>\s*const baseUrl = 'https:\/\/(?:www\.)?fopusha\.com\/'[\s\S]*?document\.getElementById\('ld-webpage'\)\.textContent = JSON\.stringify\(schema\);\s*<\/script>/, '')
    .replace(/<div id="app">[\s\S]*?<\/div><\/div>/, `<div id="app">${fallbackContent}</div>`)
}

const staticPages = getStaticPages()

for (const page of staticPages) {
  const normalizedPath = ensureTrailingSlashless(page.path)
  const filePath = normalizedPath === '/'
    ? indexPath
    : path.join(distDir, normalizedPath.slice(1), 'index.html')

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, renderPage(page, staticPages).replace(/^[ \t]+$/gm, ''), 'utf8')

  const hantPath = normalizedPath === '/'
    ? path.join(distDir, HANT_DIR, 'index.html')
    : path.join(distDir, HANT_DIR, normalizedPath.slice(1), 'index.html')
  fs.mkdirSync(path.dirname(hantPath), { recursive: true })
  fs.writeFileSync(hantPath, renderPage(toHantPage(page), staticPages).replace(/^[ \t]+$/gm, ''), 'utf8')
}
