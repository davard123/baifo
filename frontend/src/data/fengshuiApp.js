// 「九宫风水」App（iPhone）的下载入口：财神方位页和入宅吉日页的标题下面各放一条紧凑的横条（图标 + 一句话 + 下载按钮）。
// 文案放在这里，页面组件（FengshuiAppCard.vue）和预渲染脚本（scripts/prerender.js）共用，两边内容保持一致。
// App 只有简体界面，繁体页（/zh-hant/）不放这条横条。

export const FENGSHUI_APP = {
  name: '九宫风水',
  url: 'https://apps.apple.com/us/app/id6779891043',
  icon: '/app-icon-fengshui.jpg',
  iconAlt: '九宫风水 App 图标',
  tag: '免费下载 App',
  buttonStore: 'App Store ',
  button: '免费下载',
}

// 按钮左边的白色苹果图形（内联 SVG，不外链图片）
export const APPLE_LOGO_PATH = 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701'

// kind：'fangwei'（财神方位页，direction 是当天的财神方位，如「西南」）或 'ruzhai'（入宅吉日页）
export function fengshuiAppText(kind, direction = '') {
  if (kind === 'ruzhai') return '搬家前想看新家的坐向和九宫？用「九宫风水」App 实测，iPhone 免费下载。'
  const ask = direction ? `不确定家里哪边是${direction}？` : '不确定财神方位在家里哪一边？'
  return `${ask}用「九宫风水」App 的罗盘看方位，iPhone 免费下载。`
}

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

// 预渲染用的 HTML，结构和 FengshuiAppCard.vue 的模板一致
export function fengshuiAppBarHtml(kind, direction = '') {
  return [
    `<a class="app-bar" href="${FENGSHUI_APP.url}" target="_blank" rel="noopener" aria-label="九宫风水 App，到 App Store 免费下载">`,
    `  <img class="app-bar-icon" src="${FENGSHUI_APP.icon}" width="44" height="44" alt="${escapeHtml(FENGSHUI_APP.iconAlt)}" />`,
    `  <span class="app-bar-head"><span class="app-bar-tag">${escapeHtml(FENGSHUI_APP.tag)}</span><span class="app-bar-name">${escapeHtml(FENGSHUI_APP.name)}</span></span>`,
    `  <span class="app-bar-text">${escapeHtml(fengshuiAppText(kind, direction))}</span>`,
    `  <span class="app-bar-btn"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="${APPLE_LOGO_PATH}"/></svg><span class="app-bar-btn-store">${escapeHtml(FENGSHUI_APP.buttonStore)}</span>${escapeHtml(FENGSHUI_APP.button)}</span>`,
    '</a>',
  ].join('\n')
}
