// 财神方位（/caishen-fangwei/）与入宅吉日（/ruzhai-jiri/）的 SEO。
// 和诵经页一样不进主包：构建脚本静态 import，浏览器只在访问这两组页面时由 getSeoByPath 动态加载。
//
// 按日期的方位页：预渲染「构建日前 3 天 ～ 后 120 天」和这段时间里的节日，其余日期仍可在浏览器里打开（不进 sitemap）。
import {
  FANGWEI_ARTICLE, FANGWEI_FAQS, FANGWEI_PATH, CAI_RHYME,
  dateKey, dayLabel, getFangweiDay, inAlmanacRange, keyDays, shiftDateKey,
} from '../src/data/fangwei.js'
import {
  RUZHAI_FAQS, RUZHAI_PATH, RUZHAI_STEPS, currentMonthKey, isMonthKey, monthDays, monthKeys, monthLabel, monthSummary,
} from '../src/data/ruzhai.js'
import { SITE, buildArticleSchema, buildFaqSchema, buildWebPageSchema } from './seo.config.js'

const PAST_DAYS = 3
const FUTURE_DAYS = 120

function fangweiIndexPage() {
  const path = FANGWEI_PATH
  const heading = '今日财神方位'
  const description = `今天财神在哪个方位？按通行黄历的日干口诀推算，${CAI_RHYME}。打开即按你手机上的日期显示今天的财神方位、喜神方位和农历日期，也能查 2027 年除夕、大年初一、正月初五迎财神的方位。`
  const about = { '@type': 'Thing', name: '财神方位', description: '按日天干推算的每日财神所在方位，民间迎财神、上香时参考。' }
  return {
    path,
    title: '今日财神方位查询｜今天财神在哪个方位、喜神方位，正月初五迎财神方位',
    description,
    heading,
    summary: description,
    image: '/qiucai/caishen-hero.webp',
    schema: [
      buildWebPageSchema({
        path,
        name: heading,
        description,
        breadcrumbItems: [
          { name: SITE.shortName, path: '/' },
          { name: '求财祈福', path: '/qiucai' },
          { name: heading, path },
        ],
        about,
        selectors: ['h1', '.fw-answer'],
      }),
      buildArticleSchema({
        path,
        headline: heading,
        name: '财神方位怎么算、怎么用',
        description,
        about,
        articleBody: FANGWEI_ARTICLE.flatMap((block) => [block.title, ...block.paragraphs]).join('\n'),
      }),
      buildFaqSchema(path, FANGWEI_FAQS),
    ].filter(Boolean),
  }
}

export function fangweiDayPage(key) {
  const day = getFangweiDay(key)
  if (!day) return null
  const path = `${FANGWEI_PATH}/${key}`
  const label = dayLabel(day)
  // 「正月初五迎财神」里已经有农历日期，括号里只补「迎财神」
  const extraLabel = label.replace(day.lunarShort, '')
  const extra = extraLabel ? ` · ${extraLabel}` : ''
  const when = `${day.solar}（${day.lunarShort}${extra}）`
  const heading = `${day.solar}财神方位`
  const answer = `${when}是${day.ganzhi}，财神在${day.cai}，喜神在${day.xi}。`
  const description = `${answer}按通行黄历的日干口诀推算，上香、迎财神时可以面朝${day.cai}。`
  const titleHead = label ? `${day.solar}${label}` : `${day.solar}财神方位`
  return {
    path,
    title: `${titleHead}：财神在${day.cai}、喜神在${day.xi}｜${day.lunar}`,
    description,
    heading,
    summary: description,
    image: '/qiucai/caishen-hero.webp',
    schema: [
      buildWebPageSchema({
        path,
        name: heading,
        description,
        breadcrumbItems: [
          { name: SITE.shortName, path: '/' },
          { name: '今日财神方位', path: FANGWEI_PATH },
          { name: day.solar, path },
        ],
        about: { '@type': 'Thing', name: '财神方位', description: '按日天干推算的每日财神所在方位。' },
        selectors: ['h1', '.fw-answer'],
      }),
      buildFaqSchema(path, [
        { q: `${day.solar}财神在哪个方位？`, a: answer },
        { q: '财神方位是怎么算的？', a: `按当天的日天干推算：${CAI_RHYME}。` },
      ]),
    ].filter(Boolean),
  }
}

function ruzhaiIndexPage() {
  const path = RUZHAI_PATH
  const heading = '入宅吉日'
  const description = '新房入宅、搬家、开业挑日子：按月列出黄历上宜入宅、宜搬家（移徙）、宜开业（开市）的日子，标出星期几和当天冲哪个生肖，并整理在美国新居入伙的步骤和注意事项。'
  const about = { '@type': 'Thing', name: '入宅吉日', description: '黄历中宜入宅、宜移徙的日子，华人新居入伙时参考。' }
  return {
    path,
    title: '入宅吉日查询｜2026–2027 搬家吉日、开业吉日，新房入伙怎么做',
    description,
    heading,
    summary: description,
    image: SITE.defaultImage,
    schema: [
      buildWebPageSchema({
        path,
        name: heading,
        description,
        breadcrumbItems: [
          { name: SITE.shortName, path: '/' },
          { name: heading, path },
        ],
        about,
        selectors: ['h1', '.rz-lead'],
      }),
      buildArticleSchema({
        path,
        headline: '新房入伙怎么做',
        name: '新房入宅的步骤',
        description,
        about,
        articleBody: RUZHAI_STEPS.map((step) => `${step.title}：${step.text}`).join('\n'),
      }),
      buildFaqSchema(path, RUZHAI_FAQS),
    ].filter(Boolean),
  }
}

export function ruzhaiMonthPage(month) {
  if (!isMonthKey(month)) return null
  const path = `${RUZHAI_PATH}/${month}`
  const label = monthLabel(month)
  const sum = monthSummary(month)
  const ruzhai = monthDays(month, 'R')
  const heading = `${label}入宅吉日`
  const list = ruzhai.map((day) => `${day.solar}（${day.week}，冲${day.chong}）`).join('、')
  const description = `${label}共有 ${sum.ruzhai} 天宜入宅、${sum.banjia} 天宜搬家、${sum.kaiye} 天宜开业。宜入宅的日子：${list || '本月没有'}。`
  return {
    path,
    title: `${label}入宅吉日、搬家吉日、开业吉日一览（附冲煞生肖）`,
    description,
    heading,
    summary: description,
    image: SITE.defaultImage,
    schema: [
      buildWebPageSchema({
        path,
        name: heading,
        description,
        breadcrumbItems: [
          { name: SITE.shortName, path: '/' },
          { name: '入宅吉日', path: RUZHAI_PATH },
          { name: label, path },
        ],
        about: { '@type': 'Thing', name: '入宅吉日', description: '黄历中宜入宅、宜移徙的日子。' },
        selectors: ['h1', '.rz-lead'],
      }),
      buildFaqSchema(path, [
        { q: `${label}哪天适合入宅？`, a: description },
        ...RUZHAI_FAQS.slice(0, 2),
      ]),
    ].filter(Boolean),
  }
}

function prerenderDayKeys(today) {
  const keys = new Set()
  for (let i = -PAST_DAYS; i <= FUTURE_DAYS; i += 1) {
    const key = shiftDateKey(today, i)
    if (inAlmanacRange(key)) keys.add(key)
  }
  for (const day of keyDays(today, 12)) keys.add(day.key)
  return [...keys].sort()
}

// 构建脚本用：要预渲染、进 sitemap 的页面
export function getFangweiPages(today = dateKey()) {
  const month = currentMonthKey(new Date())
  return [
    fangweiIndexPage(),
    ...prerenderDayKeys(today).map(fangweiDayPage),
    ruzhaiIndexPage(),
    ...monthKeys().filter((key) => key >= month).map(ruzhaiMonthPage),
  ].filter(Boolean)
}

// 浏览器用：任何在数据范围内的日期、月份都能打开
export function getFangweiSeo(path) {
  if (path === FANGWEI_PATH) return fangweiIndexPage()
  if (path === RUZHAI_PATH) return ruzhaiIndexPage()
  if (path.startsWith(`${FANGWEI_PATH}/`)) return fangweiDayPage(path.slice(FANGWEI_PATH.length + 1))
  if (path.startsWith(`${RUZHAI_PATH}/`)) return ruzhaiMonthPage(path.slice(RUZHAI_PATH.length + 1))
  return null
}
