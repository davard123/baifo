import { ANCESTORS } from '../src/data/ancestors.js'
import { BUDDHAS } from '../src/data/buddhas.js'
import { GUIDES } from '../src/data/guides.js'
import { TOPICS } from '../src/data/topics.js'

export const MAX_STATIC_NAV_LINKS = 40

const BUDDHA_LINKS = BUDDHAS.map((item) => ({
  path: `/buddha/${item.slug}`,
  label: item.name,
}))

const ANCESTOR_LINKS = ANCESTORS.map((item) => ({
  path: `/ancestor/${item.slug}`,
  label: item.name,
}))

const NIANFO_LINK = { path: '/nianfo', label: '念佛计数器' }

const WORSHIP_GUIDE_SLUGS = new Set([
  'worship',
  'online-worship',
  'overseas-worship',
  'home-worship',
  'online-worship-benefits',
  'overseas-worship-benefits',
  'home-worship-benefits',
])

const ANCESTOR_GUIDE_SLUGS = new Set([
  'ancestors',
  'dongzhi-2026',
  'chunjie-2027',
  'qingming-2027',
  'zhongyuan-2027',
])

// These are deliberately small entry points rather than a site-wide topic index.
const WORSHIP_TOPIC_LINKS = [
  ['/topic/online-worship', '网上拜佛怎么拜'],
  ['/topic/worship-vs-pray', '礼佛和拜佛有什么区别'],
  ['/topic/worship-for-family', '替家人祈福'],
  ['/topic/prostration', '礼佛中的叩拜'],
  ['/topic/offering-incense', '上香的意义'],
]

const ANCESTOR_TOPIC_LINKS = [
  ['/topic/online-ancestors', '网上祭祖怎么做'],
  ['/topic/ancestor-tablet', '先人牌位怎么写'],
  ['/topic/overseas-chinese', '海外华人礼佛祭祖'],
  ['/topic/qingming', '清明网上扫墓与祭祖'],
]

const QIUCAI_TOPIC_LINKS = [
  ['/topic/ying-caishen', '正月初五迎财神'],
  ['/topic/qiucai-bai-na-wei', '求财拜哪位财神'],
  ['/topic/bai-caishen-gongpin', '拜财神的供品与禁忌'],
]

// A couple of public articles only point to a landing page or a catalogue
// entry in their source data. Keep their raw-page graph connected without
// manufacturing a broad all-topics index.
const TOPIC_TOPIC_FALLBACKS = {
  ksitigarbha: [['/topic/online-ancestors', '网上祭祖怎么做']],
  'qiucai-bai-na-wei': [['/topic/bai-caishen-gongpin', '拜财神的供品与禁忌']],
}

function normalizePath(value) {
  const raw = String(value ?? '').trim().split(/[?#]/, 1)[0]
  if (!raw) return ''
  if (raw === '/') return '/'
  return raw.replace(/\/+$/, '')
}

function pageByPath(pages) {
  return new Map(
    (Array.isArray(pages) ? pages : [])
      .map((page) => [normalizePath(page?.path), page])
      .filter(([path]) => path),
  )
}

function routeCandidates(pages, paths) {
  const byPath = pageByPath(pages)
  return paths
    .map(([path, label]) => ({ path, label: label || byPath.get(normalizePath(path))?.heading }))
}

function relatedCandidates(pages, related) {
  const byPath = pageByPath(pages)
  return (Array.isArray(related) ? related : []).map((item) => ({
    path: item?.to,
    label: item?.label || byPath.get(normalizePath(item?.to))?.heading,
  }))
}

/**
 * Build bounded, same-language links for the no-JavaScript prerender fallback.
 * The page catalogue is passed in so this helper can drop stale/missing data
 * references without importing the SEO page builder or changing its metadata.
 */
export function getStaticNavigation(page, pages) {
  const byPath = pageByPath(pages)
  const currentPath = normalizePath(page?.path)
  if (!currentPath || !byPath.has(currentPath)) return []

  const groups = []
  const seen = new Set([currentPath])
  let linkCount = 0

  function addGroup(label, candidates) {
    if (linkCount >= MAX_STATIC_NAV_LINKS) return
    const links = []

    for (const candidate of candidates) {
      if (linkCount >= MAX_STATIC_NAV_LINKS) break
      const targetPath = normalizePath(candidate?.path)
      if (!targetPath || seen.has(targetPath) || !byPath.has(targetPath)) continue

      const linkLabel = String(candidate?.label ?? byPath.get(targetPath)?.heading ?? '').trim()
      if (!linkLabel) continue

      seen.add(targetPath)
      links.push({ path: targetPath, label: linkLabel })
      linkCount += 1
    }

    if (links.length) groups.push({ label, links })
  }

  function addRelated(label, related) {
    addGroup(label, relatedCandidates(pages, related))
  }

  const guideSlug = currentPath.startsWith('/guide/')
    ? currentPath.slice('/guide/'.length)
    : ''
  const topicSlug = currentPath.startsWith('/topic/')
    ? currentPath.slice('/topic/'.length)
    : ''
  const buddhaSlug = currentPath.startsWith('/buddha/')
    ? currentPath.slice('/buddha/'.length)
    : ''

  if (currentPath === '/') {
    addGroup('礼佛与念佛', [...BUDDHA_LINKS, NIANFO_LINK])
    addGroup('祭祖、求财与使用说明', routeCandidates(pages, [
      ['/guide/overview', '使用说明'],
      ['/guide/worship', '在线礼佛指南'],
      ['/guide/ancestors', '在线祭祖指南'],
      ['/ancestors', '拜祭先人'],
      ['/qiucai', '求财祈福'],
    ]))
  }

  if (currentPath === '/qiucai') {
    addGroup('在线拜财神', Array.from(byPath.entries())
      .filter(([path]) => path.startsWith('/qiucai/') && path !== currentPath)
      .map(([path, target]) => ({ path, label: target.heading })))
    addGroup('求财相关文章', routeCandidates(pages, QIUCAI_TOPIC_LINKS))
  }

  if (currentPath.startsWith('/qiucai/') && currentPath !== '/qiucai') {
    addGroup('求财祈福入口', routeCandidates(pages, [
      ['/qiucai', '求财祈福首页'],
      ...QIUCAI_TOPIC_LINKS,
    ]))
  }

  if (guideSlug && GUIDES[guideSlug]) {
    addRelated('相关指南', GUIDES[guideSlug].related)

    if (WORSHIP_GUIDE_SLUGS.has(guideSlug)) {
      addGroup('礼佛入口', [...BUDDHA_LINKS, NIANFO_LINK])
      addGroup('礼佛主题', routeCandidates(pages, WORSHIP_TOPIC_LINKS))
    }

    if (ANCESTOR_GUIDE_SLUGS.has(guideSlug)) {
      addGroup('祭祖牌位', ANCESTOR_LINKS)
      addGroup('祭祖主题', routeCandidates(pages, ANCESTOR_TOPIC_LINKS))
    }
  }

  if (topicSlug && TOPICS[topicSlug]) {
    addRelated('相关文章与指南', TOPICS[topicSlug].related)
    addGroup('相关主题', routeCandidates(pages, TOPIC_TOPIC_FALLBACKS[topicSlug] || []))

    // Every Buddha article has a direct, same-slug link back to its public
    // practice page even when a future data edit omits that related entry.
    const buddha = BUDDHAS.find((item) => item.slug === topicSlug)
    if (buddha) {
      addGroup('对应佛菩萨', [{
        path: `/buddha/${buddha.slug}`,
        label: `${buddha.name}页面`,
      }])
    }
  }

  if (buddhaSlug) {
    const buddha = BUDDHAS.find((item) => item.slug === buddhaSlug)
    if (buddha) {
      addGroup('礼佛入口', routeCandidates(pages, [
        ['/guide/worship', '在线礼佛指南'],
        ['/nianfo', '念佛计数器'],
      ]))
      addGroup('对应主题', routeCandidates(pages, [
        [`/topic/${buddha.slug}`, TOPICS[buddha.slug]?.heading || `${buddha.name}礼佛主题`],
      ]))
    }
  }

  if (currentPath === '/ancestors') {
    addGroup('先人牌位', ANCESTOR_LINKS)
    addGroup('祭祖指南与主题', routeCandidates(pages, [
      ['/guide/ancestors', '在线祭祖指南'],
      ...ANCESTOR_TOPIC_LINKS,
    ]))
  }

  if (currentPath.startsWith('/ancestor/') && currentPath !== '/ancestors') {
    addGroup('祭祖入口', routeCandidates(pages, [
      ['/ancestors', '拜祭先人总览'],
      ['/guide/ancestors', '在线祭祖指南'],
      ...ANCESTOR_TOPIC_LINKS.slice(0, 2),
    ]))
  }

  if (currentPath === '/nianfo') {
    addGroup('相关礼佛内容', routeCandidates(pages, [
      ['/guide/worship', '在线礼佛指南'],
      ['/guide/online-worship', '网上拜佛怎么拜'],
      ['/buddha/amitabha', '阿弥陀佛'],
      ['/topic/amitabha', TOPICS.amitabha?.heading || '阿弥陀佛主题'],
    ]))
  }

  return groups
}
