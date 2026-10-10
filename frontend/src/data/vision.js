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
    prompt: 'Heavenly beams of golden light break through swirling auspicious clouds, flying cranes, glowing ruyi scepters and floating golden ingots, a sacred sunrise behind; a flowing golden imperial robe floats majestically on a cloud platform like a banner of honor.',
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

// 画面里不放人：职业就是画面的主角（subjects 每次随机挑一种风格），主题是环绕主角的祥瑞氛围
export const PROFESSIONS = [
  {
    key: 'office', label: '上班族', wish: '升职加薪，前程似锦',
    subjects: [
      'a gleaming modern office tower whose top floor glows with golden light, a staircase of golden clouds rising to its summit',
      'an elegant executive office with a grand desk bathed in golden light, a city skyline beyond the windows',
    ],
  },
  {
    key: 'restaurant', label: '餐馆老板', wish: '生意兴隆，客似云来',
    subjects: [
      'a magnificent traditional Chinese palace-style restaurant with red pillars, golden roofs and rows of red lanterns',
      'a stylish modern glass-front restaurant glowing warmly at night, tables set and lights shining',
      'a cozy bustling Chinese noodle house with steaming bowls on the counter and lanterns at the door',
    ],
  },
  {
    key: 'shop', label: '开店做生意', wish: '顾客盈门，财源滚滚',
    subjects: [
      'a charming storefront with a glowing display window and shelves full of beautiful goods',
      'a grand traditional Chinese shop building with carved wooden doors, red lanterns and a golden-lit interior',
    ],
  },
  {
    key: 'realestate', label: '房地产经纪', wish: '单单成交，业绩长红',
    subjects: [
      'a luxurious modern white villa with floor-to-ceiling windows and an infinity pool',
      'a grand traditional Chinese courtyard house (siheyuan) with red gates, gray tiled roofs and a blooming garden',
      'an elegant Mediterranean mansion with terracotta roofs, arches and palm trees',
      'a beautiful two-storey family house with a green lawn and a white picket fence',
      'a sleek penthouse atop a skyscraper glowing above the city',
    ],
  },
  {
    key: 'sales', label: '销售 / 业务', wish: '大单连连，业绩第一',
    subjects: [
      'a stack of glowing golden scrolls tied with red ribbons and sealed with red wax (no writing), resting on a carved pedestal',
    ],
  },
  {
    key: 'ecommerce', label: '网店 / 电商', wish: '订单爆满，好评如潮',
    subjects: [
      'a huge mountain of beautifully wrapped golden gift parcels with red ribbons, more parcels raining down from the sky',
    ],
  },
  {
    key: 'boss', label: '公司 / 工厂老板', wish: '宏图大展，蒸蒸日上',
    subjects: [
      'a towering golden skyscraper headquarters crowned with light',
      'a vast modern clean factory complex glowing with golden light, trucks lined up ready to ship',
    ],
  },
  {
    key: 'investor', label: '投资理财', wish: '稳稳增值，财务自由',
    subjects: [
      'a giant golden money tree heavy with gold coins, its roots wrapped around a treasure chest',
    ],
  },
  {
    key: 'student', label: '学生 / 考试', wish: '金榜题名，前程远大',
    subjects: [
      'a majestic ancient Chinese academy gate on the clouds, a golden scroll and an ink brush glowing before it',
      'a grand university hall with a golden bell tower in the morning sun',
    ],
  },
  {
    key: 'other', label: '其他行业', wish: '事业有成，心想事成',
    subjects: ['glowing golden symbols of great success in {industry}'],
  },
]
