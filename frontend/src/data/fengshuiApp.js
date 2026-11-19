// 「九宫风水」App（iPhone）的下载入口：财神方位页和入宅吉日页各放一张小卡片。
// 文案放在这里，页面组件（FengshuiAppCard.vue）和预渲染脚本（scripts/prerender.js）共用，两边内容保持一致。
// App 只有简体界面，繁体页（/zh-hant/）不放这张卡片。

export const FENGSHUI_APP = {
  name: '九宫风水',
  url: 'https://apps.apple.com/us/app/id6779891043',
  button: '到 App Store 下载 →',
}

// kind：'fangwei'（财神方位页，direction 是当天的财神方位，如「西南」）或 'ruzhai'（入宅吉日页）
export function fengshuiAppCopy(kind, direction = '') {
  if (kind === 'ruzhai') {
    return {
      title: '搬家前，先看看新家的坐向',
      text: '搬家前想看看新家的坐向和九宫？用「九宫风水」App 在手机上实测：罗盘量坐向，再给自家房子做一份九宫评估。iPhone 免费下载。',
    }
  }
  return {
    title: direction ? `在家里找到${direction}方` : '在家里找到财神方位',
    text: `${direction ? `不确定家里哪边是${direction}？` : '不确定家里的方位怎么看？'}「九宫风水」App 里有罗盘，打开就能看方位。iPhone 免费下载。`,
  }
}

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

// 预渲染用的 HTML，结构和 FengshuiAppCard.vue 的模板一致
export function fengshuiAppCardHtml(kind, direction = '') {
  const copy = fengshuiAppCopy(kind, direction)
  return [
    '<aside class="app-card" aria-label="九宫风水 App">',
    `  <p class="app-card-title">${escapeHtml(copy.title)}</p>`,
    `  <p class="app-card-text">${escapeHtml(copy.text)}</p>`,
    `  <a class="app-card-btn" href="${FENGSHUI_APP.url}" target="_blank" rel="noopener">${escapeHtml(FENGSHUI_APP.button)}</a>`,
    '</aside>',
  ].join('\n')
}
