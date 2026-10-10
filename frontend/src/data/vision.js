// 愿景图：画面以祥瑞寓意为主（龙凤、祥云、金光、元宝……），人物只是画中一个小身影。
// THEMES 决定整体画面，PROFESSIONS 在画面里加一个与职业相关的象征物。
// prompt 是给生图模型的英文描述（图上不出字），blessing / wish 由前端印在图片下方。

export const THEMES = [
  {
    key: 'longfeng',
    label: '龙凤呈祥',
    prompt: 'A majestic golden dragon and a radiant phoenix spiral together through the sky above a celebrating city, fireworks bursting, red lanterns, a rain of gold coins and confetti.',
    blessing: '龙凤呈祥，喜事连连，好运当头',
  },
  {
    key: 'huangpao',
    label: '黄袍加身',
    prompt: 'Heavenly beams of golden light break through swirling auspicious clouds, flying cranes, glowing ruyi scepters and floating golden ingots, a sacred sunrise behind; the person wears a flowing golden imperial robe and stands on a cloud platform.',
    blessing: '天降祥瑞，鸿运当头，贵人相助',
  },
  {
    key: 'jinyin',
    label: '金银满屋',
    prompt: 'A vast treasure hall overflowing with mountains of gold ingots, gold coins, jewels and open treasure chests, a giant glowing cornucopia bowl in the center radiating light, golden coins pouring like a waterfall from the ceiling.',
    blessing: '金银满屋，财源广进，富贵满堂',
  },
  {
    key: 'liyu',
    label: '鲤跃龙门',
    prompt: 'A giant golden carp leaps over a glowing dragon gate above a waterfall of light, auspicious clouds and golden sparks all around, a sense of soaring breakthrough.',
    blessing: '鲤跃龙门，步步高升，一飞冲天',
  },
  {
    key: 'ziqi',
    label: '紫气东来',
    prompt: 'Purple and golden auspicious clouds roll in from the east at sunrise, a magnificent golden palace rises on the clouds, rays of light and flying cranes, everything glowing with good fortune.',
    blessing: '紫气东来，吉星高照，万事亨通',
  },
  {
    key: 'caiyuan',
    label: '财源滚滚',
    prompt: 'A shining river of gold coins and gold ingots flows from the horizon through red and gold auspicious clouds, a golden cornucopia overflowing, coins tumbling like waves of light.',
    blessing: '财源滚滚，日进斗金，生生不息',
  },
]

export const PROFESSIONS = [
  { key: 'office', label: '上班族', symbol: 'A shining staircase of golden clouds rises toward a radiant golden halo of light high in the sky.', wish: '升职加薪，前程似锦' },
  { key: 'restaurant', label: '餐馆老板', symbol: 'A magnificent golden restaurant palace with red lanterns floats on the clouds, streams of tiny glowing guests flowing toward its doors.', wish: '生意兴隆，客似云来' },
  { key: 'shop', label: '开店做生意', symbol: 'A golden shop front glows with light, an endless line of tiny glowing customers winding toward it.', wish: '顾客盈门，财源滚滚' },
  { key: 'realestate', label: '房地产经纪', symbol: 'Golden houses and mansions float on the clouds, a giant glowing golden key hovering among them.', wish: '单单成交，业绩长红' },
  { key: 'sales', label: '销售 / 业务', symbol: 'Glowing golden scrolls sealed with red seals (no writing on them) fly through the sky like a flock of birds.', wish: '大单连连，业绩第一' },
  { key: 'ecommerce', label: '网店 / 电商', symbol: 'Golden gift parcels rain from the sky like shooting stars.', wish: '订单爆满，好评如潮' },
  { key: 'boss', label: '公司 / 工厂老板', symbol: 'A towering golden skyscraper crowned with light rises among the clouds.', wish: '宏图大展，蒸蒸日上' },
  { key: 'investor', label: '投资理财', symbol: 'A giant golden money tree heavy with gold coins grows on the clouds.', wish: '稳稳增值，财务自由' },
  { key: 'student', label: '学生 / 考试', symbol: 'A golden scroll and an ink brush glow like a second sun above a ladder of clouds leading to a heavenly gate.', wish: '金榜题名，前程远大' },
  { key: 'other', label: '其他行业', symbol: 'Glowing golden symbols of great success in {industry} float in the sky.', wish: '事业有成，心想事成' },
]
