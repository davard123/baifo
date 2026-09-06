import { GUIDES } from '../src/data/guides.js'
import { BUDDHAS } from '../src/data/buddhas.js'
import { ANCESTORS } from '../src/data/ancestors.js'
import { TOPICS, getTopicEntries } from '../src/data/topics.js'

export const SITE = {
  name: '礼佛祈愿',
  shortName: 'Fopusha',
  baseUrl: 'https://fopusha.com',
  defaultImage: '/devotee-og.jpg',
  defaultLocale: 'zh_CN',
  themeColor: '#2f2216',
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
    '海外华人礼佛',
    '海外祭祖',
    '清明网上祭祖',
    '清明在线扫墓',
    '海外华人祭祀',
    '全球华人在线礼佛',
  ],
}


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

export function withTrailingSlash(pagePath) {
  if (!pagePath || pagePath === '/') return '/'
  return pagePath.endsWith('/') ? pagePath : `${pagePath}/`
}

function absoluteUrl(pagePath) {
  return `${SITE.baseUrl}${withTrailingSlash(pagePath)}`
}

export function canonicalUrl(pagePath) {
  return absoluteUrl(pagePath)
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
    title: '礼佛祈愿 | 在线礼佛、念佛计数与祭祖追思',
    description: '选择佛菩萨供花、点灯、上香，或为思念的亲人设立牌位。也可以用念佛计数器记录今日功课。',
    heading: '礼佛祈愿',
    summary: '选择佛菩萨供花、点灯、上香，或为思念的亲人设立牌位。也可以用念佛计数器记录今日功课。',
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
        description: 'www.fopusha.com 是一个在线拜佛、祭祀追思与祈福回向的网站，提供在线礼佛祈愿、供花、点灯、上香、在线祭祖和功德回向，也整理礼佛步骤与佛教主题说明。',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${absoluteUrl('/')}#collection`,
        name: SITE.name,
        url: absoluteUrl('/'),
        description: 'www.fopusha.com 是一个在线拜佛、祭祀追思与祈福回向的网站，提供八位佛菩萨礼佛祈愿与功德回向入口。',
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
    summary: `${item.title}，${item.subtitle}。`,
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
        articleBody: `在${item.name}页面，可在线完成供花、点灯、上香，并填写祈愿内容、提交功德回向；适合日常礼佛、节日礼敬与发愿祈福。`,
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
    summary: `${item.title}，${item.subtitle}。`,
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

    ],
  }
}

function guidePage({ slug, title, description, heading }) {
  const pagePath = `/guide/${slug}`
  const content = GUIDES[slug]
  title = content.title
  heading = content.heading
  description = content.description
  const faqs = content.faqs
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
        articleBody: content.sections.flatMap(section => [section.title, ...section.paragraphs]).join("\n"),
      }),

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
        type: 'Article',
        idSuffix: 'main',
        path,
        headline: topic.heading,
        name: topic.title,
        description: topic.description,
        about,

        articleBody: (topic.sections || [])
          .flatMap((section) => [section.title, ...(section.paragraphs || [])])
          .filter(Boolean)
          .join('\n'),



      }),


    ],
  }
}


function nianfoPage() {
  const path = '/nianfo'
  return {
    path,
    title: '念佛计数器 | 在线木鱼与每日功课',
    description:
      '在线念佛计数器与电子木鱼，支持南无阿弥陀佛、观世音菩萨、地藏王菩萨等佛号，记录每日念诵数量、连续天数与每日目标，计数仅保存在本机。',
    heading: '念佛计数器与在线木鱼',
    summary:
      '每日念佛计数工具，轻触木鱼记一声佛号，可选佛号与每日目标，记录今日数量、累计数量与连续天数。',
    image: SITE.defaultImage,
    schema: [
      buildWebPageSchema({
        path,
        name: '念佛计数器',
        description: '在线念佛计数与电子木鱼，用于记录每日称念佛号的数量。',
        breadcrumbItems: [
          { name: '礼佛祈愿', path: '/' },
          { name: '念佛计数', path },
        ],
        about: {
          '@type': 'Thing',
          name: '念佛计数',
          description: '称念佛号并计数的日常修持方式，传统上以一百零八颗念珠计数。',
        },
        selectors: ['h1', '.lead', '.explain p:first-child'],
      }),
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': `${absoluteUrl(path)}#app`,
        name: '念佛计数器',
        url: absoluteUrl(path),
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        inLanguage: 'zh-CN',
        description: '在线念佛计数器与电子木鱼，记录每日念诵数量与连续天数，数据保存在本机。',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
      },

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
    nianfoPage(),
    ...ANCESTORS.map(ancestorPage),
  ]
}

export function getSeoByPath(path) {
  const normalizedPath = !path || path === '/' ? '/' : path.replace(/\/+$/, '')
  return getStaticPages().find((page) => page.path === normalizedPath) ?? null
}

