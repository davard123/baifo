// 繁体版的标题、H1、说明和链接文字：台湾惯用「線上」，不用「在線」「網上」（2026-11 台湾搜索量：線上拜拜、線上祭拜）。
// 只给 title、H1、meta description、链接和导航文字用；正文和经文不经过这里，简体版也不经过这里。
// 输入是已经转成繁体的文字。
export function hantTerms(text) {
  return String(text ?? '')
    .replace(/(在線|在網上|網上|線上)上香/g, '線上敬香') // 避免「線上上香」
    .replace(/在(線上|網上)/g, '線上') // 「如何在線上為先人…」「在網上為親人…」→「線上為…」
    .replace(/在線|網上/g, '線上')
    .replace(/線上線上/g, '線上')
    .replace(/註音/g, '注音')
}

// 指向繁体念经全文页（已改成「注音版」）的链接文字：「帶拼音」改成「注音版」
const NIANJING_HREF = /^(?:https?:\/\/[^/]+)?(?:\/zh-hant)?\/nianjing(?:\/|$)/

export function hantLinkText(text, href = '') {
  let out = hantTerms(text)
  if (NIANJING_HREF.test(String(href))) out = out.replace(/帶拼音/g, '注音版')
  return out
}
