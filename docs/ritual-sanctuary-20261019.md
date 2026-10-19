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
