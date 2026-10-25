// 同一 raw 生成的主图、赐福图与头像必须成组使用，避免随机造型时串图。
const makeVariant = ({ id, label, stem, faceDescription, note }) => ({
  id,
  label,
  image: `/qiucai/${stem}.webp`,
  bless: `/qiucai/${stem}-bless.webp`,
  avatar: `/qiucai/${stem}-avatar.webp`,
  faceDescription,
  note,
})

const ZHAO_FACE = '同尊固定脸：中年黑面武将相，方阔脸，浓黑上扬眉、深陷锐目、宽直鼻，长黑须与分叉髭须，深褐肤色，神情威严。'
const GUAN_FACE = '同尊固定脸：中年赤红长脸，卧蚕眉、狭长锐眼、高直鼻，浓密长黑髯垂胸，红铜肤色，神情肃穆。'
const WEN_FACE = '同尊固定脸：约48岁，菱形略长脸，高颧骨、窄下巴，细弯眉、小杏眼，暖浅棕肤色，修长分束黑褐胡须，神情温和精干。'
const WULU_FACE = '五人固定脸组：中心赵公明沿用黑面武将脸；左外白须老人、左内圆脸短须文官、右内方脸青年武将、右外高龄白须文官各自保持独立面相，不互换。'
const FUXING_FACE = '同尊固定脸：中老年圆方脸，宽弯眉、慈和圆眼，白眉、白色唇髭与尖须，红润肤色，开口欢笑。'
const LUXING_FACE = '同尊固定脸：中年清瘦长脸，细长眉、机敏眼、窄直鼻，修整黑髭与下巴须，浅橄榄肤色，端正精干。'
const SHOUXING_FACE = '同尊固定脸：高龄仙翁相，极高额头，弯眉慈眼，白色长眉与长须，金黄偏红肤色，笑意温厚。'
const HUANG_FACE = '同尊固定脸：金黄圆阔脸，宽弧眉、深色下垂眼、饱满鼻翼，黑色小髭与尖下巴须，金棕肤色，神情沉稳。'
const FACE_BY_KEY = Object.freeze({
  zhaogongming: ZHAO_FACE,
  guangong: GUAN_FACE,
  wencaishen: WEN_FACE,
  wulu: WULU_FACE,
  fuxing: FUXING_FACE,
  luxing: LUXING_FACE,
  shouxing: SHOUXING_FACE,
  huangcaishen: HUANG_FACE,
})

export const CAISHEN_LOOKS = Object.freeze({
  zhaogongming: [
    makeVariant({ id: 'tiger-ingot', label: '骑虎托元宝', stem: 'zhaogongming-tiger-ingot-20261024', faceDescription: ZHAO_FACE, note: '黑面长须、钢鞭与黑虎为民间武财神常见组合；主图与赐福图同一 raw 生成，仅构图尺寸不同。' }),
    makeVariant({ id: 'standing-basin', label: '持鞭聚宝盆', stem: 'zhaogongming-standing-basin-20261024', faceDescription: ZHAO_FACE, note: '站像配钢鞭与聚宝盆为民间常见组合；主图与赐福图同一 raw 生成，仅构图尺寸不同。' }),
  ],
  guangong: [
    makeVariant({ id: 'reading', label: '坐像读书', stem: 'guangong-reading-20261024', faceDescription: GUAN_FACE, note: '红面长须、绿袍与青龙偃月刀是传统关公武将形象，夜读书册为民间题材；主图与赐福图同一 raw 生成。' }),
    makeVariant({ id: 'standing-blade', label: '单人持刀', stem: 'guangong-standing-blade-20261024', faceDescription: GUAN_FACE, note: '无字单人持刀暂拟，周仓安排待确认；主图与赐福图同一 raw 生成，仅构图尺寸不同。' }),
  ],
  wencaishen: [
    makeVariant({ id: 'ruyi-seated', label: '如意坐像', stem: 'wencaishen-ruyi-seated-20261024', faceDescription: WEN_FACE, note: '文官冠、如意与元宝为民间文财神常见吉祥物组合；主图与赐福图同一 raw 生成。' }),
    makeVariant({ id: 'fanli-abacus', label: '儒商算盘', stem: 'wencaishen-fanli-abacus-20261024', faceDescription: WEN_FACE, note: '儒商装与算盘取自范蠡（陶朱公）民间题材；主图与赐福图同一 raw 生成，仅构图尺寸不同。' }),
  ],
  wulu: [
    makeVariant({ id: 'seated', label: '五路坐像', stem: 'wulu-seated-20261024', faceDescription: WULU_FACE, note: '赵公明居中、四位伴像分列两侧的五路财神民间组合；主图与赐福图同一 raw 生成。' }),
    makeVariant({ id: 'standing-treasures', label: '五路聚宝', stem: 'wulu-standing-treasures-20261024', faceDescription: WULU_FACE, note: '五人群像与各持聚宝物为民间组合；主图与赐福图同一 raw 生成，仅构图尺寸不同。' }),
  ],
  fuxing: [
    makeVariant({ id: 'blank-scroll', label: '空白卷轴', stem: 'fuxing-blank-scroll-20261024', faceDescription: FUXING_FACE, note: '天官展开空白卷轴，按无字硬性要求暂拟，文字待确认；主图与赐福图同一 raw 生成。' }),
    makeVariant({ id: 'ruyi-bat', label: '如意蝙蝠', stem: 'fuxing-ruyi-bat-20261024', faceDescription: FUXING_FACE, note: '天官持如意、蝙蝠取“福”谐音的民间题材；主图与赐福图同一 raw 生成，仅构图尺寸不同。' }),
  ],
  luxing: [
    makeVariant({ id: 'deer', label: '如意梅鹿', stem: 'luxing-deer-20261024', faceDescription: LUXING_FACE, note: '官服、如意与鹿为禄星民间常见题材；主图与赐福图同一 raw 生成。' }),
    makeVariant({ id: 'child', label: '怀抱婴孩', stem: 'luxing-child-20261024', faceDescription: LUXING_FACE, note: '官服官帽怀抱婴孩，为禄星民间送子题材；衣饰仅保留花纹无文字，主图与赐福图同一 raw 生成。' }),
  ],
  shouxing: [
    makeVariant({ id: 'deer', label: '骑鹿寿星', stem: 'shouxing-deer-20261024', faceDescription: SHOUXING_FACE, note: '高额白须、寿桃、龙头杖与梅花鹿为寿星民间题材；主图与赐福图同一 raw 生成。' }),
    makeVariant({ id: 'pine-crane', label: '松鹤寿桃', stem: 'shouxing-pine-crane-20261024', faceDescription: SHOUXING_FACE, note: '寿桃、松树与仙鹤为寿星民间题材；主图与赐福图同一 raw 生成，仅构图尺寸不同。' }),
  ],
  huangcaishen: [
    makeVariant({ id: 'thangka-conch', label: '唐卡白螺', stem: 'huangcaishen-thangka-conch-20261024', faceDescription: HUANG_FACE, note: '金黄身、摩尼宝、吐宝鼠、白海螺与莲座是藏传黄财神常见图像要素；主图与赐福图同一 raw 生成。' }),
    makeVariant({ id: 'gilt-mongoose', label: '鎏金吐宝鼠', stem: 'huangcaishen-gilt-mongoose-20261024', faceDescription: HUANG_FACE, note: '鎏金黄财神持摩尼宝与吐宝鼠；主图与赐福图同一 raw 生成，仅构图尺寸不同。' }),
  ],
})

function originalLook(deity) {
  if (!deity?.image) return null
  return {
    id: 'original',
    label: '现有造型',
    image: deity.image,
    bless: deity.pose,
    avatar: deity.avatar,
    faceDescription: FACE_BY_KEY[deity.key] || '',
  }
}

/**
 * 返回某位财神的完整造型列表。
 * 原图从 qiucai.js 传入，保证新资源尚未接入时页面行为不变；新增造型只需放进 CAISHEN_LOOKS。
 */
export function getCaishenLooks(deity) {
  if (!deity) return []
  const original = originalLook(deity)
  const variants = CAISHEN_LOOKS[deity.key] || []
  return original ? [original, ...variants] : variants
}

/** 每次页面初始化或切换财神时调用一次，不要放进 computed，避免响应式重算导致造型跳动。 */
export function pickCaishenLook(deity) {
  const looks = getCaishenLooks(deity)
  return looks[Math.floor(Math.random() * looks.length)] || null
}
