// 每日财神方位、喜神方位（/caishen-fangwei/）。
// 财神方位统一用 qiucai.js 的 caishenDirection()，和求财页顶上那行一致；
// 农历日期、喜神方位、节日节气来自 almanac-days.js（scripts/generate-almanac.cjs 预先算好）。
import ALMANAC from './almanac-days.js'
import { caishenDirection } from './qiucai.js'

export const FANGWEI_PATH = '/caishen-fangwei'
export const ALMANAC_START = ALMANAC.start
export const ALMANAC_END = ALMANAC.end

const WEEK = '日一二三四五六'
const pad = (n) => String(n).padStart(2, '0')

// 罗盘角度：正北 0°，顺时针
export const DIRECTION_DEGREES = {
  正北: 0, 东北: 45, 正东: 90, 东南: 135, 正南: 180, 西南: 225, 正西: 270, 西北: 315,
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '')
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function shiftDateKey(key, days) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + days)
  return dateKey(date)
}

export function inAlmanacRange(key) {
  return isDateKey(key) && key >= ALMANAC_START && key <= ALMANAC_END && !!ALMANAC.days[key]
}

export function getFangweiDay(key) {
  if (!inAlmanacRange(key)) return null
  const date = parseDateKey(key)
  const [lunar, xi, marks] = ALMANAC.days[key]
  const { ganzhi, direction } = caishenDirection(date)
  return {
    key,
    year: date.getFullYear(),
    solar: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
    shortSolar: `${date.getMonth() + 1}月${date.getDate()}日`,
    week: `星期${WEEK[date.getDay()]}`,
    lunar,
    lunarShort: lunar.replace(/^.{3}/, ''),
    ganzhi,
    cai: direction,
    xi,
    marks: marks ? marks.split('、') : [],
  }
}

// 春节前后最常被问的几天，单独做专题入口
const KEY_MARKS = ['除夕', '春节', '迎财神', '元宵节', '冬至', '清明', '腊八节', '寒衣节', '中元节']
export function keyDays(fromKey = ALMANAC_START, limit = 8) {
  return Object.keys(ALMANAC.days)
    .filter((key) => key >= fromKey)
    .map(getFangweiDay)
    .filter((day) => day.marks.some((mark) => KEY_MARKS.includes(mark)))
    .slice(0, limit)
}

// 页面标题里的叫法：初五写「正月初五迎财神」，春节写「大年初一」
export function dayLabel(day) {
  if (day.marks.includes('迎财神')) return '正月初五迎财神'
  if (day.marks.includes('春节')) return '大年初一'
  return day.marks[0] || ''
}

export const CAI_RHYME = '甲乙日在东北，丙丁日在西南，戊己日在正北，庚辛日在正东，壬癸日在正南'
export const XI_RHYME = '甲己在艮乙庚乾，丙辛坤位喜神安，丁壬只在离宫坐，戊癸原在巽上眠'

export const FANGWEI_ARTICLE = [
  {
    title: '财神方位是怎么算出来的',
    paragraphs: [
      `通行黄历按当天的日天干推算财神方位：${CAI_RHYME}。天干十天一轮，所以财神方位也是十天一个循环，每两天换一个方向，只会落在这五个方位上。`,
      `喜神方位也按日天干推，口诀是「${XI_RHYME}」，艮是东北、乾是西北、坤是西南、离是正南、巽是东南。`,
      '各地流传的黄历说法不完全相同，这里用的是最通行的日干口诀，并且和本站求财页顶上显示的财神方位用的是同一套算法。',
    ],
  },
  {
    title: '知道方位以后怎么用',
    paragraphs: [
      '在家拜财神、上香时，可以面朝当天的财神方位；正月初五迎财神，传统做法是开门放鞭炮、出门先朝财神方位走一段，取「迎财神进门」的意思。',
      '找方向用手机自带的指南针就可以。住公寓或方向不好对，也不必勉强，心意到了最要紧。',
      '这些都是民间习俗，图的是一个好彩头，不代表一定能发财，也不能替代实实在在的努力。',
    ],
  },
  {
    title: '在海外按哪一天算',
    paragraphs: [
      '一般按你所在地当天的日期来看。人在美国、加拿大、澳洲，就看当地日历上的今天，不必换算成北京时间。页面打开时显示的也是你手机上的日期。',
    ],
  },
]

export const FANGWEI_FAQS = [
  { q: '今天财神在哪个方位？', a: `按通行黄历的日干口诀推算：${CAI_RHYME}。打开本页会按你手机上的日期直接显示今天的财神方位和喜神方位。` },
  { q: '2027 年正月初五财神在哪个方位？', a: '2027 年 2 月 10 日是正月初五，庚申日，财神在正东，喜神在西北。迎财神时可以面朝正东上香，或出门先往东走一段。' },
  { q: '2027 年大年初一财神在哪个方位？', a: '2027 年 2 月 6 日是大年初一，丙辰日，财神在西南，喜神也在西南。' },
  { q: '财神方位为什么每天不一样？', a: '财神方位按当天的日天干推算，天干十天一轮，所以每两天换一个方向，十天一个循环。' },
  { q: '在美国、加拿大看财神方位，要换算成北京时间吗？', a: '一般按你所在地当天的日期来看，不需要换算成北京时间。' },
  { q: '按财神方位拜了就一定会发财吗？', a: '不会。财神方位是民间习俗，图个好彩头、讨个吉利，不能保证结果。' },
]
