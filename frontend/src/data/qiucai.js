// 求财专区：财神、祈福方式、祝福语库、今日财神方位
// 图片暂用现有求财场景图，三维财神形象出图后按 key 替换 image 字段即可。

export const QIUCAI_IMAGE = '/thumbs/blessing-caishen.webp?v=20260518b'
// 供台背景（无人物）；三维财神像为透明 PNG 转的 webp，叠在背景上
export const QIUCAI_BG = '/qiucai/altar-bg.webp?v=1'
export const QIUCAI_GROUP = '/qiucai/fulushou-group.webp?v=1'
export const QIUCAI_HERO = '/qiucai/caishen-hero.webp?v=1'

export const CAISHEN = [
  {
    key: 'zhaogongming',
    name: '赵公明',
    title: '武财神 · 正财神',
    short: '主正财，管生意本业、正当收入。',
    desc: '赵公明是民间最常供奉的正财神，黑面持鞭、骑黑虎，统领招宝、纳珍、招财、利市四位神仙。求本业兴旺、正当收入，多拜赵公明。',
    day: '民间多以农历三月十五为赵公明圣诞。',
    image: '/qiucai/zhaogongming.webp?v=1',
    avatar: '/qiucai/zhaogongming-avatar.webp?v=1',
    pose: '/qiucai/zhaogongming-bless.webp?v=1',
  },
  {
    key: 'guangong',
    name: '关公',
    title: '武财神',
    short: '重信守义，商家、合伙做生意常拜。',
    desc: '关公忠义诚信，被商家奉为武财神。生意讲信用、合伙求和气、出门求平安，常请关公坐镇。',
    day: '台湾等地多以农历六月廿四为关圣帝君圣诞。',
    image: '/qiucai/guangong.webp?v=1',
    avatar: '/qiucai/guangong-avatar.webp?v=1',
    pose: '/qiucai/guangong-bless.webp?v=1',
  },
  {
    key: 'wencaishen',
    name: '文财神',
    title: '比干 · 范蠡',
    short: '以德聚财，适合上班族、做学问、求稳财。',
    desc: '文财神常指比干与范蠡。比干无心而公正，范蠡经商致富又散财济人，代表"以德聚财、以财济世"。求工作稳定、升职加薪、稳健理财，可拜文财神。',
    day: '',
    image: '/qiucai/wencaishen.webp?v=1',
    avatar: '/qiucai/wencaishen-avatar.webp?v=1',
    pose: '/qiucai/wencaishen-bless.webp?v=1',
  },
  {
    key: 'wulu',
    name: '五路财神',
    title: '东南西北中五方之财',
    short: '出门五路皆得财，正月初五迎财神。',
    desc: '五路财神意为东西南北中五方之财都能招来，适合跑业务、做外贸、多渠道收入的人。民间正月初五"迎财神"，拜的就是五路财神。',
    day: '农历正月初五迎财神。',
    image: '/qiucai/wulu.webp?v=1',
    avatar: '/qiucai/wulu-avatar.webp?v=1',
    pose: '/qiucai/wulu-bless.webp?v=1',
  },
  {
    key: 'fuxing',
    name: '福星',
    title: '赐福 · 五福临门',
    short: '求福气、好运、家庭美满。',
    desc: '福星主赐福，手抱婴孩或捧"福"字，寓意五福临门：长寿、富贵、康宁、好德、善终。求福气好运、家庭和美，拜福星。',
    day: '',
    image: '/qiucai/fuxing.webp?v=1',
    avatar: '/qiucai/fuxing-avatar.webp?v=1',
    pose: '/qiucai/fuxing-bless.webp?v=1',
  },
  {
    key: 'luxing',
    name: '禄星',
    title: '主官禄 · 加官进爵',
    short: '求升官、考试、仕途与功名。',
    desc: '禄星身穿官服、手持如意，掌管功名利禄。求升职、考公考编、仕途顺利、功名有成，拜禄星。',
    day: '',
    image: '/qiucai/luxing.webp?v=1',
    avatar: '/qiucai/luxing-avatar.webp?v=1',
    pose: '/qiucai/luxing-bless.webp?v=1',
  },
  {
    key: 'shouxing',
    name: '寿星',
    title: '南极仙翁 · 主长寿',
    short: '求健康长寿，为长辈祝寿。',
    desc: '寿星即南极仙翁，额头高隆、白须飘飘、手持寿桃和拐杖。为父母长辈祈求健康长寿、福寿绵长，拜寿星。',
    day: '',
    image: '/qiucai/shouxing.webp?v=1',
    avatar: '/qiucai/shouxing-avatar.webp?v=1',
    pose: '/qiucai/shouxing-bless.webp?v=1',
  },
  {
    key: 'huangcaishen',
    name: '黄财神',
    title: '佛教财神',
    short: '佛教的财神，愿众生离贫得乐。',
    desc: '黄财神是藏传佛教中的财神，手持吐宝鼠。佛教求财讲究布施与正念，愿自己和众生远离贫困、安乐生活。',
    day: '',
    image: '/qiucai/huangcaishen.webp?v=1',
    avatar: '/qiucai/huangcaishen-avatar.webp?v=1',
    pose: '/qiucai/huangcaishen-bless.webp?v=1',
  },
]

// 多种祈福方式：once=只做一次，repeat=可反复点；qi=财气值
export const QIUCAI_WAYS = [
  { key: 'incense', label: '上香', icon: '🪔', img: '/qiucai/prop-incense.webp?v=1', qi: 8, effect: 'smoke', toast: '三炷清香升起，诚心敬告财神。' },
  { key: 'lamp', label: '点财神灯', icon: '🏮', img: '/qiucai/prop-lamp.webp?v=1', qi: 8, effect: 'glow', toast: '财神灯已亮，愿前路明亮、财路通达。' },
  { key: 'fruit', label: '供五果', icon: '🍊', img: '/qiucai/prop-fruit.webp?v=1', qi: 8, effect: 'fruit', toast: '五果供上：大吉大利，圆满富足。' },
  { key: 'ingot', label: '献元宝', icon: '💰', img: '/qiucai/prop-ingot.webp?v=1', qi: 10, effect: 'ingot', toast: '元宝敬献，愿招财进宝、金玉满堂。' },
  { key: 'coin', label: '投金币', icon: '🪙', img: '/qiucai/prop-coin.webp?v=1', qi: 4, repeat: true, effect: 'coin', toast: '金币落进聚宝盆，叮——财气又旺一分。' },
  { key: 'tree', label: '摇钱树', icon: '🌳', img: '/qiucai/prop-tree.webp?v=1', qi: 6, repeat: true, effect: 'tree', toast: '摇一摇钱树，金叶纷纷落。' },
  { key: 'bow', label: '叩拜', icon: '🙏', qi: 5, repeat: true, effect: 'bow', toast: '叩首礼拜，诚心求财，福至心灵。' },
]

export const PROP = (key) => `/qiucai/prop-${key}.webp?v=1`

export const BOWL_FULL = 88

// 求财方向：每个方向一组祝福，{name} 会替换成用户名字
export const QIUCAI_SCENES = [
  {
    key: 'business',
    label: '生意兴隆',
    wishes: [
      '{name}，愿你生意兴隆通四海，财源茂盛达三江，门前客似云来，店里货如轮转。',
      '愿{name}的生意一年好过一年，老客常回头，新客不断来，账上进项稳稳增长。',
      '{name}，愿你买卖公平、诚信生财，每一笔生意都顺顺当当，每一位客人都满意而归。',
      '愿{name}开门红、月月红、年年红，财路越走越宽，生意越做越大。',
    ],
  },
  {
    key: 'career',
    label: '升职加薪',
    wishes: [
      '{name}，愿你的努力被看见，升职加薪水到渠成，贵人提携、同事和睦。',
      '愿{name}工作顺心、收入渐丰，能力一年比一年强，机会一个接一个来。',
      '{name}，愿你在岗位上步步高升，薪水年年见涨，事业与生活两不误。',
      '愿{name}遇到好领导、好平台，付出都有回报，前程似锦。',
    ],
  },
  {
    key: 'opening',
    label: '开业大吉',
    wishes: [
      '{name}，恭贺开业大吉！愿你开张红火、顾客盈门，日进斗金、财源广进。',
      '愿{name}的新事业一帆风顺，开门迎客、关门数钱，早日回本、年年盈利。',
      '{name}，愿你鸿图大展、宏业日新，好口碑传遍四方。',
      '愿{name}开业即旺，合伙同心，伙计得力，事事顺遂。',
    ],
  },
  {
    key: 'invest',
    label: '投资理财',
    wishes: [
      '{name}，愿你眼光长远、心态平稳，理财稳中有进，积少成多。',
      '愿{name}的每一分钱都放在踏实的地方，遇事冷静、远离风险，财富稳步增长。',
      '{name}，愿你守得住本、等得到时，复利慢慢开花，家底越来越厚。',
      '愿{name}量入为出、开源节流，财库日渐充盈。',
    ],
  },
  {
    key: 'windfall',
    label: '偏财好运',
    wishes: [
      '{name}，愿你好运常伴，意外之喜不期而至，小确幸天天有。',
      '愿{name}财运亨通，正财稳、偏财旺，惊喜多多。',
      '{name}，愿你时来运转、喜从天降，好事一桩接一桩。',
      '愿{name}心想事成，所求皆如愿，所行化坦途。',
    ],
  },
  {
    key: 'debt',
    label: '还清债务',
    wishes: [
      '{name}，愿你早日还清欠款、无债一身轻，从此收入有余、心里踏实。',
      '愿{name}渡过眼前难关，进项一天天多起来，压力一天天轻下去。',
      '{name}，愿你收支渐渐平衡，每月都能多存一点，日子越过越宽裕。',
      '愿{name}遇事有贵人相帮，难处都能找到出路。',
    ],
  },
  {
    key: 'job',
    label: '求职顺利',
    wishes: [
      '{name}，愿你面试顺利、早得好工作，待遇满意、同事友善。',
      '愿{name}简历投出去就有回音，找到能发挥所长、收入稳定的岗位。',
      '{name}，愿你在新工作里站稳脚跟，一路向上。',
      '愿{name}所学有所用，所求有所得，前程光明。',
    ],
  },
  {
    key: 'official',
    label: '仕途高升',
    wishes: [
      '{name}，愿你禄星高照、加官进爵，仕途顺遂、步步高升。',
      '愿{name}考试金榜题名，考公考编一举上岸，前程远大。',
      '{name}，愿你德才兼备、众望所归，升迁之路一帆风顺。',
      '愿{name}贵人相扶、机遇常临，官运亨通、功成名就。',
    ],
  },
  {
    key: 'fortune',
    label: '纳福转运',
    wishes: [
      '{name}，愿你福星高照、五福临门，好运连连、喜事不断。',
      '愿{name}时来运转，否极泰来，从此事事顺心、天天开心。',
      '{name}，愿你福气满满、平安喜乐，所遇皆良善，所行皆坦途。',
      '愿{name}吉星高照、福满乾坤，家和万事兴。',
    ],
  },
  {
    key: 'longevity',
    label: '健康长寿',
    wishes: [
      '{name}，愿你寿比南山、福如东海，身体康健、精神矍铄。',
      '愿{name}与家中长辈福寿绵长、无病无灾，年年岁岁共团圆。',
      '{name}，愿你身强体健、百病不侵，健康就是最大的财富。',
      '愿{name}松鹤长春、福寿安康，天天好心情。',
    ],
  },
  {
    key: 'family',
    label: '家宅兴旺',
    wishes: [
      '{name}，愿你家宅兴旺、福禄双全，一家老小平安康健、和和美美。',
      '愿{name}家中财源广进、人丁兴旺，老人长寿、孩子有出息。',
      '{name}，愿你家庭和睦、收入丰足，福满门、财满仓。',
      '愿{name}福星高照、禄星临门、寿星常伴，福禄寿三全。',
    ],
  },
]

// 吉祥对联（传统用语）
export const QIUCAI_COUPLETS = [
  ['生意兴隆通四海', '财源茂盛达三江', '招财进宝'],
  ['一帆风顺年年好', '万事如意步步高', '吉星高照'],
  ['财源广进家兴旺', '福运亨通事业昌', '福禄双全'],
  ['天增岁月人增寿', '春满乾坤福满门', '福寿双全'],
  ['和气生财财似水', '诚心待客客如云', '财源滚滚'],
  ['金玉满堂添富贵', '吉祥如意纳千祥', '金玉满堂'],
]

// 四字吉语：叩拜、投币等动作时随机弹出
export const QIUCAI_GREETINGS = [
  '招财进宝', '财源广进', '日进斗金', '金玉满堂', '吉祥如意', '大吉大利',
  '财运亨通', '福禄双全', '五福临门', '富贵吉祥', '一本万利', '财源滚滚',
  '马到成功', '心想事成', '步步高升', '年年有余',
]

export const QIUCAI_STREAK_MILESTONES = [
  { days: 3, text: '连拜 3 天：心诚则灵，财气渐旺。' },
  { days: 7, text: '连拜 7 天：七日圆满，送你一张"招财进宝"祝福卡。' },
  { days: 15, text: '连拜 15 天：恒心可贵，愿财源如流水不断。' },
  { days: 30, text: '连拜 30 天：一月圆满，福禄双全。' },
]

export const QIUCAI_FAQS = [
  { q: '求财拜什么神？', a: '求生意本业的正财，多拜赵公明；做生意讲信用、合伙求和气，拜关公；上班族求升职加薪、稳健理财，拜文财神；跑业务、多渠道收入，拜五路财神；求福气好运拜福星，求升官考试拜禄星，求健康长寿拜寿星；佛教信众可拜黄财神。' },
  { q: '福禄寿三星分别管什么？', a: '福星赐福，管福气好运、家庭美满；禄星掌官禄，管升官、考试、功名；寿星即南极仙翁，管健康长寿。求升官拜禄星，求福拜福星，为长辈祝寿拜寿星，三星一起拜就是福禄寿三全。' },
  { q: '在线拜财神怎么拜？', a: '先选一位财神，依次上香、点财神灯、供五果、献元宝，再投金币、摇钱树、叩拜，最后写下你的求财心愿。提交后会生成一张带你名字的求财祝福卡，可以保存分享。' },
  { q: '拜财神要准备什么供品？', a: '传统上常供橘子（大吉）、苹果（平安）、香蕉（招财）、发糕、元宝和清茶，以三样或五样为多。在线拜财神不用准备实物，心诚即可。' },
  { q: '什么时候拜财神最好？', a: '农历正月初五迎财神最隆重；每月初一、十五，以及各位财神的圣诞日也常拜。平时早上开工前拜一拜，求一天顺利，也很好。' },
  { q: '拜财神有什么禁忌？', a: '心要诚，不要许害人的愿，不贪不义之财；供品要新鲜完整；拜完照样要踏实做事。财神保佑的是勤劳诚信的人。' },
  { q: '在线拜财神有用吗？', a: '拜财神是表达心愿、给自己打气的方式，可以帮助安定心神、坚定目标。它不能保证发财，钱还是要靠踏实做事、量入为出来挣、来守。' },
]

export const QIUCAI_ARTICLE = [
  {
    title: '在线求财祈福，几分钟就能完成',
    paragraphs: [
      '不用跑庙、不用排队，选一位财神，上香、点灯、供果、献元宝，再投几枚金币进聚宝盆、摇一摇钱树，写下心愿，就完成了一次完整的求财祈福。',
      '每个动作都会给你一句吉语回应，聚宝盆会随着财气慢慢装满。提交心愿后，还会生成一张专属的求财祝福卡。',
    ],
  },
  {
    title: '各路财神，各管一方',
    paragraphs: [
      '中国民间的财神很多：赵公明主正财，关公重信义，文财神比干、范蠡讲以德聚财，五路财神招五方之财，福星、禄星、寿星分管福气、官禄和长寿。佛教也有黄财神。按你想求的方向，选一位最相应的财神礼拜即可。',
    ],
  },
  {
    title: '求财的心态',
    paragraphs: [
      '自古讲"君子爱财，取之有道"。拜财神求的是机会和顺遂，真正的财富还是来自勤劳、诚信和长期的积累。带着这份心去拜，心更安，路也更稳。',
    ],
  },
]

// 今日财神方位：按日天干推算（甲乙东北、丙丁西南、戊己正北、庚辛正东、壬癸正南）
const STEMS = '甲乙丙丁戊己庚辛壬癸'
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
const DIRECTION_BY_STEM = ['东北', '东北', '西南', '西南', '正北', '正北', '正东', '正东', '正南', '正南']

export function caishenDirection(date = new Date()) {
  // 1949-10-01 为甲子日
  const days = Math.round(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1949, 9, 1)) / 86400000
  )
  const stem = ((days % 10) + 10) % 10
  const branch = ((days % 12) + 12) % 12
  return {
    ganzhi: `${STEMS[stem]}${BRANCHES[branch]}日`,
    direction: DIRECTION_BY_STEM[stem],
  }
}

export function pickWish(sceneKey, name) {
  const scene = QIUCAI_SCENES.find((item) => item.key === sceneKey) || QIUCAI_SCENES[0]
  const text = scene.wishes[Math.floor(Math.random() * scene.wishes.length)]
  return text.replaceAll('{name}', name || '你')
}

export function pickCouplet() {
  return QIUCAI_COUPLETS[Math.floor(Math.random() * QIUCAI_COUPLETS.length)]
}

export function pickGreeting() {
  return QIUCAI_GREETINGS[Math.floor(Math.random() * QIUCAI_GREETINGS.length)]
}
