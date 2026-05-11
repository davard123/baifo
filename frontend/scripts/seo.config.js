import { BUDDHAS } from '../src/data/buddhas.js'
import { ANCESTORS } from '../src/data/ancestors.js'
import { TOPICS, getTopicEntries } from '../src/data/topics.js'

export const SITE = {
  name: '礼佛祈愿',
  shortName: 'Fopusha',
  baseUrl: 'https://www.fopusha.com',
  defaultImage: '/devotee.png',
  defaultLocale: 'zh_CN',
  themeColor: '#2f2216',
  datePublished: '2024-10-01',
  keywords: [
    '拜佛',
    '祈愿',
    '礼佛',
    '在线礼佛',
    '在线拜佛',
    '佛菩萨',
    '释迦牟尼佛',
    '阿弥陀佛',
    '药师佛',
    '弥勒佛',
    '文殊菩萨',
    '普贤菩萨',
    '观音菩萨',
    '地藏菩萨',
    '供花',
    '点灯',
    '上香',
    '回向文',
    '功德回向',
    '拜祭先人',
    '在线祭祖',
    '佛教祈福',
  ],
}

const BUILD_DATE = new Date().toISOString().split('T')[0]

const BUDDHA_WIKI = {
  shakyamuni: 'https://zh.wikipedia.org/wiki/释迦牟尼',
  amitabha: 'https://zh.wikipedia.org/wiki/阿弥陀佛',
  medicine: 'https://zh.wikipedia.org/wiki/药师佛',
  maitreya: 'https://zh.wikipedia.org/wiki/弥勒菩萨',
  manjushri: 'https://zh.wikipedia.org/wiki/文殊菩萨',
  samantabhadra: 'https://zh.wikipedia.org/wiki/普贤菩萨',
  guanyin: 'https://zh.wikipedia.org/wiki/观世音菩萨',
  ksitigarbha: 'https://zh.wikipedia.org/wiki/地藏菩萨',
}

const BUDDHA_WIKIDATA = {
  shakyamuni: 'https://www.wikidata.org/wiki/Q9441',
  amitabha: 'https://www.wikidata.org/wiki/Q236242',
  medicine: 'https://www.wikidata.org/wiki/Q18683181',
  maitreya: 'https://www.wikidata.org/wiki/Q193461',
  manjushri: 'https://www.wikidata.org/wiki/Q471696',
  samantabhadra: 'https://www.wikidata.org/wiki/Q868306',
  guanyin: 'https://www.wikidata.org/wiki/Q193849',
  ksitigarbha: 'https://www.wikidata.org/wiki/Q604687',
}

const BUDDHA_EN = {
  shakyamuni: 'Shakyamuni Buddha',
  amitabha: 'Amitabha Buddha',
  medicine: 'Medicine Buddha (Bhaisajyaguru)',
  maitreya: 'Maitreya Bodhisattva',
  manjushri: 'Manjushri Bodhisattva',
  samantabhadra: 'Samantabhadra Bodhisattva',
  guanyin: 'Guanyin (Avalokitesvara)',
  ksitigarbha: 'Ksitigarbha Bodhisattva',
}

const BUDDHA_LOCATIONS = {
  shakyamuni: '释迦牟尼佛是娑婆世界教主，佛教传统中并不对应单一道场圣地，而是被视为一切佛法修行的根本依止。',
  amitabha: '阿弥陀佛对应西方极乐世界信仰，汉传佛教中常与净土法门和念佛往生的修持传统相联系。',
  medicine: '药师佛对应东方净琉璃世界，汉传佛教礼敬药师佛时，常围绕健康、消灾、延寿与身心安稳发愿。',
  maitreya: '弥勒菩萨现居兜率内院，佛教传统中常与未来下生、慈悲欢喜和希望光明相联系。',
  manjushri: '文殊菩萨在汉传佛教中常与五台山道场相联系，象征大智、善巧与学修精进。',
  samantabhadra: '普贤菩萨在汉传佛教中常与峨眉山道场相联系，象征大行、大愿与实践菩提道。',
  guanyin: '观音菩萨在汉传佛教中常与普陀山道场相联系，最常见的主题是慈悲救苦、护念平安与寻声应愿。',
  ksitigarbha: '地藏菩萨在汉传佛教中常与九华山道场相联系，常见礼敬主题包括超荐回向、追思先人和救度亡灵。',
}

const GUIDE_FAQS = {
  overview: [
    {
      q: '第一次使用 Fopusha 应该先看哪里？',
      a: '第一次使用 Fopusha，建议先看使用说明页，再根据自己是想礼佛祈愿还是想祭祖追思，进入对应的功能页面。',
    },
    {
      q: '功能页和专题说明页有什么区别？',
      a: '功能页更适合直接完成礼佛、祭祖与回向操作；专题说明页更适合先了解某个主题是什么意思、适合什么场景以及应该怎样开始。',
    },
    {
      q: '祭祖页面里的姓名和照片会公开吗？',
      a: '不会。个性化姓名和照片只保存在当前设备本地，用于本机显示，不会上传到服务器。',
    },
    {
      q: 'Fopusha 更适合礼佛还是祭祖？',
      a: 'Fopusha 同时覆盖在线礼佛祈愿与在线祭祖追思，两类入口都可以独立使用，也可以结合功德回向一起完成。',
    },
  ],
  worship: [
    {
      q: '在线礼佛网站通常可以做什么？',
      a: '在线礼佛网站通常可以选择佛菩萨页面，完成供花、点灯、上香等供养动作，并填写祈愿内容后提交功德回向。',
    },
    {
      q: '第一次在线礼佛建议先从哪个页面开始？',
      a: '如果没有特别明确的祈愿主题，可以先从释迦牟尼佛页面开始，再根据健康、平安、智慧、超荐等主题进入相应佛菩萨页面。',
    },
    {
      q: '观音菩萨、药师佛、地藏菩萨分别适合什么主题？',
      a: '观音菩萨常见于慈悲、平安、消灾与求助；药师佛更常见于健康、延寿、消灾；地藏菩萨则更常见于超荐、回向与亡灵救度。',
    },
    {
      q: '在线礼佛的基本步骤是什么？',
      a: '在线礼佛通常分为四步：选择佛菩萨页面、完成供花点灯上香、填写祈愿内容、提交功德回向。',
    },
  ],
  ancestors: [
    {
      q: '在线祭祖页面一般怎么使用？',
      a: '在线祭祖通常先选择对应先人牌位或相关页面，再完成供奉动作，填写追思或回向内容，最后提交祭拜记录。',
    },
    {
      q: '照片和姓名会不会上传到服务器？',
      a: '不会。个性化照片和姓名设置仅保存在本地设备，用于当前设备显示。',
    },
    {
      q: '在线祭祖和在线礼佛有什么不同？',
      a: '在线礼佛更偏向佛菩萨礼敬与日常祈福；在线祭祖更偏向追思祖先、超荐亡灵和家族回向。',
    },
    {
      q: '在线祭祖的基本步骤是什么？',
      a: '在线祭祖通常分为四步：选择先人牌位、完成上香献花等供奉、填写追思或回向内容、提交祭拜记录。',
    },
  ],
}

const GUIDE_ARTICLE_BODIES = {
  overview:
    '使用说明页用于帮助第一次使用 Fopusha 的访客理解礼佛祈愿页面、祭祖追思页面和专题说明页分别适合什么场景，并快速找到正确入口。',
  worship:
    '在线礼佛指南说明如何在 Fopusha 中选择佛菩萨、完成供花点灯上香等供养动作、填写祈愿内容并提交功德回向，也说明不同佛菩萨常见的祈愿主题。',
  ancestors:
    '在线祭祖指南说明如何在 Fopusha 中选择先人牌位、完成上香献花奠酒烧纸等祭拜动作、填写追思或回向内容，并解释个性化姓名与照片设置的隐私边界。',
}

const HOWTO_META = {
  'how-to-worship-buddha': {
    totalTime: 'PT10M',
    supply: ['清净之心', '祈愿内容'],
  },
  'offering-flowers': {
    totalTime: 'PT5M',
    supply: ['鲜花', '供养之心'],
  },
  'offering-light': {
    totalTime: 'PT5M',
    supply: ['灯烛或灯明', '祈愿内容'],
  },
  'offering-incense': {
    totalTime: 'PT5M',
    supply: ['清香', '恭敬之心'],
  },
  'how-to-dedicate-merit': {
    totalTime: 'PT5M',
    supply: ['回向对象', '回向内容'],
  },
}

function absoluteUrl(pagePath) {
  return `${SITE.baseUrl}${pagePath}`
}

function orgRef() {
  return {
    '@type': 'Organization',
    '@id': `${SITE.baseUrl}/#organization`,
    name: '礼佛祈愿 Fopusha',
    url: SITE.baseUrl,
  }
}

function publisherRef() {
  return {
    '@type': 'Organization',
    '@id': `${SITE.baseUrl}/#organization`,
    name: '礼佛祈愿',
    url: SITE.baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.baseUrl}/favicon.svg`,
    },
  }
}

function buildSpeakable(cssSelector) {
  return {
    '@type': 'SpeakableSpecification',
    cssSelector,
  }
}

function buildFaqSchema(title, items = [], aboutName = title) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: `${title}常见问题`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question || item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer || item.a,
      },
    })),
    about: {
      '@type': 'Thing',
      name: aboutName,
    },
  }
}

function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

function buildWebPageSchema({
  path,
  name,
  description,
  breadcrumbItems,
  about,
  selectors = ['h1', '.hero-text', '.copy-section p:first-child'],
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    name,
    url: absoluteUrl(path),
    description,
    inLanguage: 'zh-CN',
    isPartOf: { '@id': `${SITE.baseUrl}/#website` },
    breadcrumb: breadcrumb(breadcrumbItems),
    about,
    mainEntity: about,
    speakable: buildSpeakable(selectors),
  }
}

function buildArticleSchema({
  type = 'Article',
  idSuffix = 'article',
  path,
  headline,
  name,
  description,
  about,
  step,
  articleBody,
  totalTime,
  supply,
  tool,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${absoluteUrl(path)}#${idSuffix}`,
    headline,
    name,
    url: absoluteUrl(path),
    description,
    inLanguage: 'zh-CN',
    datePublished: SITE.datePublished,
    dateModified: BUILD_DATE,
    author: orgRef(),
    publisher: publisherRef(),
    isPartOf: { '@id': `${SITE.baseUrl}/#website` },
    mainEntityOfPage: { '@id': `${absoluteUrl(path)}#webpage` },
    about,
    ...(articleBody ? { articleBody } : {}),
    ...(step ? { step } : {}),
    ...(totalTime ? { totalTime } : {}),
    ...(supply
      ? {
          supply: supply.map((item) => ({
            '@type': 'HowToSupply',
            name: item,
          })),
        }
      : {}),
    ...(tool
      ? {
          tool: tool.map((item) => ({
            '@type': 'HowToTool',
            name: item,
          })),
        }
      : {}),
  }
}

function homePage() {
  return {
    path: '/',
    title: '礼佛祈愿 | 八位佛菩萨在线礼佛祈愿平台',
    description: '选择一位佛菩萨，以虔诚之心礼敬供养，发愿回向。站内覆盖释迦牟尼佛、阿弥陀佛、药师佛、观音菩萨等八位佛菩萨，也提供在线祭祖、供花、点灯、上香和功德回向。',
    heading: '礼佛祈愿',
    summary: '在线礼佛祈愿平台，提供八位佛菩萨礼敬、供花、点灯、上香、祈愿回向与在线祭祖追思。',
    image: SITE.defaultImage,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE.baseUrl}/#website`,
        name: SITE.name,
        alternateName: SITE.shortName,
        url: absoluteUrl('/'),
        inLanguage: 'zh-CN',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE.baseUrl}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': `${SITE.baseUrl}/#webapp`,
        name: 'Fopusha 在线礼佛祈愿',
        url: absoluteUrl('/'),
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        inLanguage: 'zh-CN',
        description: 'Fopusha 提供在线礼佛祈愿、供花、点灯、上香、在线祭祖和功德回向，也整理礼佛步骤与佛教主题说明。',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${absoluteUrl('/')}#collection`,
        name: SITE.name,
        url: absoluteUrl('/'),
        description: '八位佛菩萨在线礼佛祈愿与功德回向平台。',
        inLanguage: 'zh-CN',
        speakable: buildSpeakable(['h1', '.hero-text', '.copy-section p:first-child']),
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: BUDDHAS.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: absoluteUrl(`/buddha/${item.slug}`),
            name: item.name,
          })),
        },
      },
      buildFaqSchema('礼佛祈愿', [
        {
          q: 'Fopusha 是什么网站？',
          a: 'Fopusha 是一个在线礼佛、祈愿、祭祖追思与功德回向网站，用户可以选择佛菩萨页面完成供花、点灯、上香与回向，也可以进入先人牌位页面进行追思祭拜。',
        },
        {
          q: '这个网站可以做什么？',
          a: '这个网站可以完成在线礼佛、供花、点灯、上香、填写祈愿、提交功德回向，以及在线祭祖追思等操作。',
        },
        {
          q: '这个网站适合哪些祈愿主题？',
          a: '常见祈愿主题包括平安、健康、智慧、学业、事业、家庭和顺、祭祖追思、超荐回向以及为家人和众生发愿。',
        },
        {
          q: '第一次使用这个网站应该先看哪里？',
          a: '第一次使用这个网站，建议先看使用说明页，再根据需要进入礼佛祈愿页面或在线祭祖追思页面。',
        },
      ]),
    ],
  }
}

function buddhaPage(item) {
  const sameAs = [BUDDHA_WIKI[item.slug], BUDDHA_WIKIDATA[item.slug]].filter(Boolean)
  const about = {
    '@type': 'Thing',
    name: item.name,
    description: item.desc,
    alternateName: BUDDHA_EN[item.slug],
    sameAs,
  }

  return {
    path: `/buddha/${item.slug}`,
    title: `${item.namo} | 在线礼佛祈愿`,
    description: `虔诚礼敬${item.name}，${item.subtitle}。${item.desc}在线发愿祈福，功德回向一切众生。`,
    heading: item.namo,
    summary: `${item.name}，${item.subtitle}。${item.desc}`,
    image: item.image,
    schema: [
      buildWebPageSchema({
        path: `/buddha/${item.slug}`,
        name: item.namo,
        description: item.desc,
        breadcrumbItems: [
          { name: '礼佛祈愿', path: '/' },
          { name: item.name, path: `/buddha/${item.slug}` },
        ],
        about,
        selectors: ['h1', '.hero-text', '.copy-section p:first-child', 'article.faq-item'],
      }),
      buildArticleSchema({
        path: `/buddha/${item.slug}`,
        headline: item.namo,
        name: `${item.name}礼佛指南`,
        description: item.desc,
        about,
        articleBody: `${item.name}，${item.subtitle}。${item.desc}此页适合在线供花、点灯、上香、填写祈愿内容并提交功德回向。`,
      }),
      {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: item.name,
        alternateName: BUDDHA_EN[item.slug],
        description: item.desc,
        inDefinedTermSet: { '@type': 'DefinedTermSet', name: '佛教词汇' },
        sameAs,
      },
      buildFaqSchema(item.name, [
        {
          q: `${item.name}是谁？`,
          a: `${item.name}，${item.subtitle}。${item.desc}`,
        },
        {
          q: `${item.name}适合什么祈愿主题？`,
          a: `${item.name}${item.subtitle ? `，${item.subtitle}` : ''}。${item.desc}常见祈愿主题包括平安、健康、智慧、消灾、家庭和顺、学业事业以及功德回向。`,
        },
        {
          q: `如何在网上礼敬${item.name}？`,
          a: `进入${item.name}页面后，可以依次完成供花、点灯、上香，再填写祈愿内容并提交功德回向。`,
        },
        {
          q: `${item.name}的道场在哪里？`,
          a: BUDDHA_LOCATIONS[item.slug],
        },
      ], item.name),
    ],
  }
}

function ancestorsPage() {
  return {
    path: '/ancestors',
    title: '拜祭先人 | 在线祭拜先人',
    description: '追思先人，超荐亡灵，虔诚祭拜，祈愿庇佑后代。可选择不同亲属牌位，完成在线祭祖、追思回向与祈愿记录。',
    heading: '拜祭先人',
    summary: '在线祭祖追思页面，覆盖先父、先母、祖父、祖母、列祖列宗、亡偶、亡子女与一切亡灵。',
    image: '/ancestors/ancestors.png',
    schema: [
      buildWebPageSchema({
        path: '/ancestors',
        name: '拜祭先人',
        description: '在线祭祖、追思祖先、超荐亡灵的页面集合。',
        breadcrumbItems: [
          { name: '礼佛祈愿', path: '/' },
          { name: '拜祭先人', path: '/ancestors' },
        ],
        about: {
          '@type': 'Thing',
          name: '在线祭祖',
          description: '在线祭祖、追思祖先、先人牌位选择与功德回向。',
        },
        selectors: ['h1', '.hero-text', '.copy-section p:first-child', 'article.faq-item'],
      }),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${absoluteUrl('/ancestors')}#collection`,
        name: '拜祭先人',
        url: absoluteUrl('/ancestors'),
        description: '在线祭拜先人、追思祖先、超荐亡灵的页面集合。',
        inLanguage: 'zh-CN',
        speakable: buildSpeakable(['h1', '.hero-text', '.copy-section p:first-child', 'article.faq-item']),
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: ANCESTORS.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: absoluteUrl(`/ancestor/${item.slug}`),
            name: item.name,
          })),
        },
      },
      buildFaqSchema('拜祭先人', [
        {
          q: '在线祭祖适合哪些场景？',
          a: '在线祭祖适合追思父母、祖父祖母、列祖列宗、亡偶、亡子女以及一切亡灵，也适合日常追思、忌日纪念、家族回向和超荐亡灵。',
        },
        {
          q: '牌位上的姓名和照片会上传吗？',
          a: '个性化牌位姓名和照片设置仅保存在当前设备本地，用于本机显示，不会上传到服务器。',
        },
        {
          q: '第一次使用在线祭祖应该怎么开始？',
          a: '可以先进入先人选择页，选择对应牌位，再进入正式祭拜页面完成上香、献花、奠酒、烧纸和回向。',
        },
        {
          q: '在线祭祖和礼佛祈愿有什么区别？',
          a: '在线祭祖更偏向追思祖先、家族回向和超荐亡灵；礼佛祈愿则更偏向佛菩萨礼敬、发愿祈福与日常修持。',
        },
      ]),
    ],
  }
}

function ancestorPage(item) {
  const about = {
    '@type': 'Thing',
    name: item.name,
    description: item.desc,
  }

  return {
    path: `/ancestor/${item.slug}`,
    title: `${item.name}祭拜 | 在线祭拜先人`,
    description: `虔诚祭拜${item.name}，${item.subtitle}。${item.desc}在线发愿，功德回向先人。`,
    heading: item.title,
    summary: `${item.name}，${item.subtitle}。${item.desc}`,
    image: item.image,
    schema: [
      buildWebPageSchema({
        path: `/ancestor/${item.slug}`,
        name: `${item.name}祭拜`,
        description: item.desc,
        breadcrumbItems: [
          { name: '礼佛祈愿', path: '/' },
          { name: '拜祭先人', path: '/ancestors' },
          { name: item.name, path: `/ancestor/${item.slug}` },
        ],
        about,
        selectors: ['h1', '.hero-text', '.copy-section p:first-child', 'article.faq-item'],
      }),
      buildArticleSchema({
        path: `/ancestor/${item.slug}`,
        headline: `${item.name}祭拜`,
        name: `${item.name}祭祖说明`,
        description: item.desc,
        about,
      }),
      buildFaqSchema(item.name, [
        {
          q: `这个页面适合祭拜${item.name}吗？`,
          a: `${item.name}页面适合追思${item.name}、完成上香献花等供奉动作，并写下回向内容。${item.desc}`,
        },
        {
          q: '正式祭拜时一般要做哪些步骤？',
          a: '正式祭拜时通常可以依次完成上香、献花、奠酒、烧纸，再填写追思或回向内容并提交祭拜记录。',
        },
        {
          q: '页面中的牌位姓名和照片会公开吗？',
          a: '页面支持提交祭拜祈愿记录，但个性化照片和姓名设置仅保存在当前设备，不会上传到服务器。',
        },
        {
          q: '如果想重新选择不同牌位怎么办？',
          a: '可以返回先人选择页重新选择牌位，正式祭拜页会自动带入你刚选择的牌位信息。',
        },
      ], item.name),
    ],
  }
}

function guidePage({ slug, title, description, heading }) {
  const pagePath = `/guide/${slug}`
  const faqs = GUIDE_FAQS[slug] || []
  const about = {
    '@type': 'Thing',
    name: heading,
    description,
  }

  return {
    path: pagePath,
    title,
    description,
    heading,
    summary: description,
    image: SITE.defaultImage,
    schema: [
      buildWebPageSchema({
        path: pagePath,
        name: heading,
        description,
        breadcrumbItems: [
          { name: SITE.shortName, path: '/' },
          { name: heading, path: pagePath },
        ],
        about,
        selectors: ['h1', '.hero-text', '.copy-section p:first-child', 'article.faq-item'],
      }),
      buildArticleSchema({
        path: pagePath,
        headline: heading,
        name: title,
        description,
        about,
        articleBody: GUIDE_ARTICLE_BODIES[slug] || description,
      }),
      buildFaqSchema(title, faqs, heading),
    ],
  }
}

function topicPage({ path, slug }) {
  const topic = TOPICS[slug]
  const isRitual = path.startsWith('/rituals/')
  const isDefinitionPage = isRitual || path.startsWith('/prayers/') || path.startsWith('/texts/')
  const howToMeta = HOWTO_META[slug]
  const about = {
    '@type': 'Thing',
    name: topic.heading,
    description: topic.description,
  }
  const steps = isRitual
    ? (topic.sections || []).map((section, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: section.title,
        text: (section.paragraphs || []).join(' '),
      }))
    : undefined

  return {
    path,
    title: topic.title,
    description: topic.description,
    heading: topic.heading,
    summary: topic.intro,
    image: SITE.defaultImage,
    schema: [
      buildWebPageSchema({
        path,
        name: topic.heading,
        description: topic.description,
        breadcrumbItems: [
          { name: SITE.shortName, path: '/' },
          { name: topic.heading, path },
        ],
        about,
        selectors: ['h1', '.hero-text', '.copy-section p:first-child', 'article.faq-item'],
      }),
      buildArticleSchema({
        type: isRitual ? 'HowTo' : 'Article',
        idSuffix: 'main',
        path,
        headline: topic.heading,
        name: topic.title,
        description: topic.description,
        about,
        step: steps,
        articleBody: [topic.intro, ...(topic.sections || []).flatMap((section) => [section.title, ...(section.paragraphs || [])])]
          .filter(Boolean)
          .join('\n'),
        totalTime: howToMeta?.totalTime,
        supply: howToMeta?.supply,
        tool: isRitual ? ['Fopusha 在线礼佛平台'] : undefined,
      }),
      ...(isDefinitionPage
        ? [{
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            name: topic.title,
            description: topic.intro,
            inDefinedTermSet: { '@type': 'DefinedTermSet', name: '礼佛祈愿术语与仪式说明' },
          }]
        : []),
      buildFaqSchema(topic.title, topic.faqs, topic.heading),
    ],
  }
}

export function getStaticPages() {
  return [
    homePage(),
    guidePage({
      slug: 'overview',
      title: '使用说明 | 礼佛祈愿',
      heading: '使用说明与礼佛流程',
      description: '汇总礼佛祈愿、祭祖追思、供花点灯、上香回向与隐私说明，帮助用户快速了解网站主要功能与使用方式。',
    }),
    guidePage({
      slug: 'worship',
      title: '在线礼佛指南',
      heading: '在线礼佛步骤与适用祈愿指南',
      description: '说明如何在线礼佛、供花、点灯、上香和发愿回向，也整理不同佛菩萨更常见的祈愿侧重。',
    }),
    guidePage({
      slug: 'ancestors',
      title: '在线祭祖指南',
      heading: '祭祖追思、回向步骤与隐私说明',
      description: '说明如何在线祭祖、追思先人、进行回向，以及个性化照片与姓名设置的隐私边界。',
    }),
    ...getTopicEntries().map(topicPage),
    ...BUDDHAS.map(buddhaPage),
    ancestorsPage(),
    ...ANCESTORS.map(ancestorPage),
  ]
}

export function getSeoByPath(path) {
  return getStaticPages().find((page) => page.path === path) ?? homePage()
}
