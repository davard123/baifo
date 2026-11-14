// 繁体版用词：台湾惯用「線上」，不用「在線」「網上」（2026-11 台湾搜索量：線上拜拜、線上祭拜）；
// 「視頻」写成「影片」（视频通话写「視訊」）。
// 用在繁体页的 title、H1、meta description、导航、链接、按钮和页面说明文字上；简体版不经过这里。
// 经文正文不经过这里（经文里也没有这些词）。
// 输入是已经转成繁体的文字。
export function hantTerms(text) {
  return String(text ?? '')
    .replace(/在(線上|網上)(?!牌位)/g, '線上') // 「在線上牌位前」保留「在」（David 2026-11-14）； 「如何在線上為先人…」「在網上為親人…」→「線上為…」
    .replace(/在線(?!上牌位)|網上/g, '線上') // 「網上上香」→「線上上香」（David 2026-11-14 定：用「線上上香」）
    .replace(/線上線上/g, '線上')
    .replace(/視頻通話/g, '視訊通話')
    .replace(/電話或視頻/g, '電話或視訊')
    .replace(/視頻/g, '影片')
    .replace(/註音/g, '注音')
}

// 指向繁体念经全文页（已改成「注音版」）的链接文字：「帶拼音」改成「注音版」；
// 导航分组标题「帶拼音唸經」写成「注音唸經」（「注音版唸經」读着别扭）
const NIANJING_HREF = /^(?:https?:\/\/[^/]+)?(?:\/zh-hant)?\/nianjing(?:\/|$)/

export function hantLinkText(text, href = '') {
  let out = hantTerms(text)
  if (NIANJING_HREF.test(String(href))) {
    out = out.replace(/帶拼音(唸|念)經/g, '注音$1經').replace(/帶拼音/g, '注音版')
  }
  return out
}
