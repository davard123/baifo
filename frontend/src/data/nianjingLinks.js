// 从首页、佛菩萨页、专题文章链到经咒全文页 /nianjing/<slug>/ 用的小表。
// 单独放一个文件、不引 nianjing.js：首页和佛菩萨页不用为了几条链接加载注音字表。
// 经名和 src/data/nianjing.js 里的 title 一致。
export const NIANJING_LINK_TITLES = {
  xinjing: '心经',
  dabeizhou: '大悲咒',
  jingang: '金刚经',
  pumen: '普门品',
  dizang: '地藏经',
  'yaoshi-zhenyan': '药师灌顶真言',
  yaoshi: '药师经',
  wangsheng: '往生咒',
  lengyan: '楞严咒',
  amituo: '阿弥陀经',
  puxian: '普贤行愿品',
}

// 首页直接列出的经咒全文页
export const HOME_NIANJING_SLUGS = ['xinjing', 'dabeizhou', 'jingang', 'pumen', 'dizang', 'yaoshi-zhenyan', 'wangsheng', 'lengyan']

// 佛菩萨页「礼敬时常念」的经咒全文页，每位最多两部
export const BUDDHA_NIANJING = {
  guanyin: ['dabeizhou', 'pumen'],
  ksitigarbha: ['dizang'],
  medicine: ['yaoshi', 'yaoshi-zhenyan'],
  amitabha: ['amituo', 'wangsheng'],
  samantabhadra: ['puxian'],
  shakyamuni: ['jingang'],
}

// 链接文字：简体「心经全文（带拼音）」，繁体「心经全文（注音版）」（写简体，繁体页再整体转换）
export function nianjingLinkLabel(slug, hant = false) {
  const title = NIANJING_LINK_TITLES[slug]
  return title ? `${title}全文${hant ? '（注音版）' : '（带拼音）'}` : ''
}
