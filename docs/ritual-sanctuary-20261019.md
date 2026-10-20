# 礼佛风格统一：祭祀、财神与祈福

## 状态
- 2026-10-19：本地实现及集成验收完成，尚未提交、推送或部署。
- 基线：origin/master `4942686`。独立工作树：`C:/Users/wuxis/.codex/worktrees/ritual-immersive/xiaoxinpad8085_termux_html`，未覆盖原工作目录的既有修改。
- 本机预览：`http://127.0.0.1:5186/`（Vite 开发服务，仅本机可访问）。

## 交付
- 保留原拜佛页面。祭祀八类牌位改用独立写实雕木牌位、实时姓名/本地照片、殿堂背景、供桌和现有香火/礼拜动作。
- 财神全宽适配横屏，保留八位财神的原透明像及赐福姿势、原供养操作。
- 十一项祈福去掉整张不透明文字海报。健康/平安/学业等复用现有相关佛像；长寿用寿星，福禄用福星与禄星，姻缘用鸳鸯摆件，家亲/和平用长青树与白鸽。不是逐张重绘全部人物，部分原海报人物已替换为上述主题主体，待用户审美确认。
- 这是分层 2.5D 视觉，不是可旋转的 WebGL 三维模型。物体/背景分离，香烟、烛光及礼拜沿用实时动效；支持减少动态效果。

## 源码与素材
- `frontend/src/components/AncestorStage.vue`
- `frontend/src/pages/AncestorPage.vue`
- `frontend/src/components/BlessingPool.vue`
- `frontend/src/pages/QiucaiPage.vue`
- 新增 `frontend/src/components/ritual/SanctuaryBackdrop.vue`
- 新增 `frontend/scripts/check-sanctuary.mjs`
- 新增 `frontend/public/sanctuary/` 五个带版本名 WebP，合计约 1.60 MB。背景约 279 KB，由用户指定 ChatGPT 网页生成；其余牌位、供桌、鸳鸯、和合树由内置图像工具生成，保留透明通道。原素材未覆盖。

## 验证
两项 Luna worker 包（祭祀；财神与祈福）均完成；父线程检查真实 diff，完成视觉迭代及最终集成验证。

在 `frontend` 执行：
- `npm run build`：通过。
- `node scripts/check-sanctuary.mjs`：5 个 Vue SFC 的脚本/模板/样式、8 个新素材引用、11 项祈福映射通过。
- `npm run check:images`：48 引用和 8 组原牌位坐标通过。原选择页继续使用原牌位图片，坐标映射未改。
- `node scripts/check-seo-output.mjs`：71 简体页面检查通过。
- `node scripts/check-static-navigation.mjs`：142 简繁页面、894 内链、两语言各 71 页可达通过。
- `git diff --check`：通过。

浏览器：1280×800 横屏、390×844 竖屏；八类牌位路由与铭文检查；十一项祈福两种尺寸逐项截图和资源/横向溢出检查；八财神切换及两种尺寸全宽检查。代表场景视觉检查通过。实际点击祭祀上香/点灯/献花/供果/奠酒/叩拜、财神供养/叩拜、祈福上香/点灯；修复禁用按钮失焦后 Escape 无效和手机鸳鸯裁切。10 字测试铭文及非人物测试照片通过，测试姓名和照片已清除。繁体先母页检查通过。模拟 reduced-motion 下财神场景活动 CSS 动画数为零。

截图目录：`C:/Users/wuxis/.codex/visualizations/2026/10/19/01a154d5-9991-7d02-a8e9-cfd7a0e0edf6`。

## 边界与下一步
- 未进行真实 Pad/Safari 硬件测试；当前为浏览器尺寸模拟。
- 未向后端提交测试祈愿，未测试真实提交邮件/祝福卡服务；相关业务代码和存储协议未变。
- 构建仍有既有繁体字库大于 500 KB 的分包提示，本次未调整依赖或分包。
- 本地预览不是生产上线。用户确认视觉与主题主体替换后再单独批准部署；发布应重新构建。构建产生的已跟踪 dist/sitemap 文件已恢复，不混入源代码改动。

## 第二轮：求财抽屉与先人姓名
- 两个 Luna worker 包（wealth_drawer_v2、memorial_name_v2）完成，父线程审查实际代码后修正指针焦点阻止自动关闭、旧姓名元数据与全文冲突、手机竖屏铭文裁切，并复验通过。
- QiucaiPage.vue：供奉/财神选择为覆盖式底部抽屉，默认收起，点击拉手展开；指针操作结束约4秒收起，键盘打开保留操作时间；Escape、点击舞台、收起按钮均可关闭。不是手势拖拽面板。
- AncestorPage.vue、AncestorStage.vue：舞台直接填写/修改先人姓名；按关系生成可编辑模板，也可保存完整牌位文字。标题与祭拜对象使用已保存铭文，不再以菩萨圣号代替先人。字号根据实际牌位尺寸和字数适配。新增 memorialInscription.js 与 test-memorial-inscription.mjs。
- 父线程最终执行 build、check-sanctuary、test-memorial-inscription、check:images、check-seo-output、check-static-navigation、git diff --check 全通过；既有繁体字库大分包警告不变。
- 浏览器1280×800/390×844：默认收起、供奉后自动收起、切换财神后自动收起、键盘打开保持展开和Escape关闭；姓名输入焦点、保存及刷新保留、全文模式重开不重复加称谓、普通及较长姓名竖排完整显示通过。示例姓名已清空，未提交后端祈愿。
- 本轮未重复照片上传、未故障注入本地存储异常、未测试真实Pad硬件。仍仅本地预览，未提交或部署。

## 正式发布验收（2026-10-19；取代上文未发布状态）
- 用户明确批准上线；发布代码 commit `ac195188273b7b0348fe7421ab7114b6c7280359`，从4942686快进推送master，无强推、无后端/数据迁移。
- Cloudflare Pages部署 `b8e4f7f7-970a-49b6-a016-69a9c960695a` success；GitHub validate运行39311201448 success。沿用Git集成，没有重复手动上传部署。
- 独立Luna发布审查完成；唯一门禁发现是新增helper末尾空行，主线程修正后cached diff check通过。父线程重新执行build、图片检查、71页SEO、142页894内链检查均通过。
- 正式域名五张sanctuary WebP全部200、image/webp，SHA256逐一与发布本地源文件相同。
- 线上1280×800横屏、390×844手机竖屏、800×1280 Pad竖屏检查：祭祀、财神、姻缘祈福代表场景无横向溢出/主体裁切，素材正常加载；姓名输入保存刷新持久化、供养标题、清空恢复默认正常；求财上香后约4秒自动收起；祈福供养与Escape正常。测试姓名已清空，未向后端提交测试祈愿。
- 线上截图保存在既有截图目录，文件名production-ancestor/wealth/blessing-landscape/portrait.png。为浏览器尺寸模拟，不冒充真实Pad/Safari硬件验收。既有繁体字库chunk warning未改。

## 第三轮交互纠正（历史本地阶段，发布状态见末尾）
- 用户指出此前ac19518求财只是100dvh首屏，仍是可滚长页，不符合独立拜神场景；祭祀抽屉滚动后收起按钮离屏，奠酒/烧纸被面板遮挡且器物过小。此前代表场景检查未覆盖这些滚动场景，不能据此认为全部交互无误。
- 两个Luna包wealth_fullscreen_v3、ancestor_controls_v3完成，父线程检查真实diff并修复语言切换/隐藏控件焦点导致滚动的边界。
- QiucaiPage.vue：固定视口，说明、心愿、愿景图和FAQ移入侧栏；侧栏固定头部、内部滚动、焦点循环，打开时主场景inert，底部供奉抽屉保留。增加全屏按钮及拒绝/不支持提示。简繁链接使用整页导航。App.vue排除求财页底部语言链接，避免额外滚高和焦点目标。
- AncestorPage.vue：收起固定在不滚动头部，祭祀动作提前显示；按语义wine/paper调用后收起，不依赖简繁体按钮文字；手机打开时隐藏外部浮动toggle，关闭恢复焦点。AncestorStage.vue：酒爵/火盆尺寸提高到56–96px。
- 父线程build、check-sanctuary、test-memorial-inscription、check:images、71页SEO、142页894内链、diff check全通过。仅保留既有cn2t大chunk warning。
- 浏览器390×844/1280×800：抽屉滚到底后收起仍在顶部；财神End键及末尾Tab后scrollY=0/frameTop=0；手机文档高度=844；底部供奉自动收起正常；简繁切换和退出页面滚动恢复正常。祭祀奠酒、烧纸自动收起并可见，繁体燒紙同样通过；未提交后端祈愿。全屏按钮状态可进入/退出，本机嵌入浏览器未作为实体Pad全屏验收。
- 截图：v3-ancestor-actions-mobile.png、v3-ancestor-pinned-close-mobile.png、v3-wealth-side-drawer-landscape.png、v3-wealth-pinned-close-mobile.png，位于既有截图目录。此轮未commit/push/deploy，线上仍ac19518。

## 第四轮遮挡修复与第三轮合并发布（2026-10-19）
- 用户明确要求全部修复后上线。本轮合并此前第三轮修复，不只报告问题。
- 祭祖手机拉手移到侧边中部，求财说明入口也远离底部人物；求财舞台为44px加安全区的底部拉手预留独立空间，两个姿态均不被拉手遮盖。两页叩拜立即收起操作抽屉，不再等4秒动画结束才收起。
- 深入键盘验收发现：求财关闭的底抽屉经transform移出后，会让overflow:hidden的qc-frame成为可隐式滚动容器；聚焦侧栏末尾链接时frame.scrollTop约208，导致固定头部消失。改用overflow:clip禁止框架隐式滚动，正文仍在侧栏内部滚动。回归验证frame.scrollTop=0、收起按钮top约10px。
- 本地390×844、1280×800、800×1280及求财844×390检查通过；祭祖奠酒/烧纸/叩拜自动收起、侧栏末尾收起按钮可见；求财End不推动主画面。最终build、sanctuary、memorial-inscription、images、71页SEO、142页894内链全部通过。既有cn2t分包提示仍存在。
- 未向后端提交测试祈愿、未改变数据协议；尺寸模拟不等同真实Pad/Safari硬件测试。
