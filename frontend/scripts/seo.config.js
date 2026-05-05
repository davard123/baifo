import { BUDDHAS } from '../src/data/buddhas.js'
import { ANCESTORS } from '../src/data/ancestors.js'

export const SITE = {
  name: '礼佛祈愿',
  shortName: 'baifo',
  baseUrl: 'https://www.fopusha.com',
  defaultImage: '/devotee.png',
  defaultLocale: 'zh_CN',
  themeColor: '#2f2216',
  keywords: [
    '拜佛',
    '祈愿',
    '礼佛',
    '在线礼佛',
    '佛菩萨',
    '释迦牟尼佛',
    '阿弥陀佛',
    '药师佛',
    '弥勒佛',
    '文殊菩萨',
    '普贤菩萨',
    '观音菩萨',
    '地藏菩萨',
    '拜祭先人',
    '在线祭祖',
    '佛教祈福'
  ]
}

function absoluteUrl(path) {
  return `${SITE.baseUrl}${path}`
}

function buildFaqSchema(title, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
    about: {
      '@type': 'Thing',
      name: title,
    },
  }
}

function homePage() {
  return {
    path: '/',
    title: '礼佛祈愿 | 八位佛菩萨在线礼佛',
    description: '选择一位佛菩萨，以虔诚之心礼敬供养，发愿回向。收录释迦牟尼佛、阿弥陀佛、药师佛、观音菩萨等八位佛菩萨在线礼佛祈愿，功德回向十方众生。',
    heading: '礼佛祈愿',
    summary: '在线礼佛祈愿平台，提供八位佛菩萨礼敬、供花点灯上香与祈愿回向。',
    image: SITE.defaultImage,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '礼佛祈愿',
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
        '@type': 'CollectionPage',
        name: '礼佛祈愿',
        url: absoluteUrl('/'),
        description: '八位佛菩萨在线礼佛祈愿与回向平台。',
        inLanguage: 'zh-CN',
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
          question: '这个网站可以做什么？',
          answer: '这个网站提供在线礼佛祈愿、供花、点灯、上香和回向，也提供拜祭先人的页面。'
        },
        {
          question: '适合哪些祈愿主题？',
          answer: '用户可以围绕平安、健康、智慧、学业、事业、家运与超荐回向等主题进行祈愿。'
        }
      ])
    ]
  }
}

function buddhaPage(item) {
  return {
    path: `/buddha/${item.slug}`,
    title: `${item.namo} | 在线礼佛祈愿`,
    description: `虔诚礼敬${item.name}，${item.subtitle}。${item.desc}在线发愿祈福，功德回向一切众生。`,
    heading: item.namo,
    summary: `${item.name}，${item.subtitle}。${item.desc}`,
    image: item.image,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: item.namo,
        url: absoluteUrl(`/buddha/${item.slug}`),
        description: item.desc,
        inLanguage: 'zh-CN',
        about: {
          '@type': 'Thing',
          name: item.name,
          description: item.desc,
        },
        mainEntity: {
          '@type': 'Thing',
          name: item.name,
          description: item.desc,
        },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '礼佛祈愿', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: item.name, item: absoluteUrl(`/buddha/${item.slug}`) }
          ]
        }
      },
      buildFaqSchema(item.name, [
        {
          question: `${item.name}适合什么祈愿主题？`,
          answer: `${item.name}${item.subtitle ? `，${item.subtitle}` : ''}。${item.desc}`
        },
        {
          question: `如何在网上礼敬${item.name}？`,
          answer: `进入${item.name}页面后，可以进行供花、点灯、上香并填写祈愿内容，再提交回向。`
        }
      ])
    ]
  }
}

function ancestorsPage() {
  return {
    path: '/ancestors',
    title: '拜祭先人 | 在线祭拜先人',
    description: '追思先人，超荐亡灵，虔诚祭拜，庇荫后代。选择不同亲属或历代祖先进行在线祭拜与祈愿回向。',
    heading: '拜祭先人',
    summary: '在线祭祖与追思页面，覆盖先父、先母、祖父、祖母、列祖列宗、亡偶、亡子女与一切亡灵。',
    image: '/ancestors/ancestors.png',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '拜祭先人',
        url: absoluteUrl('/ancestors'),
        description: '在线祭拜先人、追思祖先、超荐亡灵的页面集合。',
        inLanguage: 'zh-CN',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: ANCESTORS.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: absoluteUrl(`/ancestor/${item.slug}`),
            name: item.name,
          })),
        },
      }
    ]
  }
}

function guidePage({
  slug,
  title,
  description,
  heading,
}) {
  return {
    path: `/guide/${slug}`,
    title,
    description,
    heading,
    summary: description,
    image: SITE.defaultImage,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: heading,
        name: title,
        url: absoluteUrl(`/guide/${slug}`),
        description,
        inLanguage: 'zh-CN',
        author: {
          '@type': 'Organization',
          name: SITE.name,
        },
      }
    ]
  }
}

function topicPage({
  slug,
  title,
  heading,
  description,
}) {
  return {
    path: `/topic/${slug}`,
    title,
    description,
    heading,
    summary: description,
    image: SITE.defaultImage,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: heading,
        name: title,
        url: absoluteUrl(`/topic/${slug}`),
        description,
        inLanguage: 'zh-CN',
        author: {
          '@type': 'Organization',
          name: SITE.name,
        },
      }
    ]
  }
}

function ancestorPage(item) {
  return {
    path: `/ancestor/${item.slug}`,
    title: `${item.name}拜祭 | 在线祭拜先人`,
    description: `虔诚祭拜${item.name}，${item.subtitle}。${item.desc}在线发愿，功德回向先人。`,
    heading: item.title,
    summary: `${item.name}，${item.subtitle}。${item.desc}`,
    image: item.image,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${item.name}拜祭`,
        url: absoluteUrl(`/ancestor/${item.slug}`),
        description: item.desc,
        inLanguage: 'zh-CN',
        about: {
          '@type': 'Thing',
          name: item.name,
          description: item.desc,
        },
        mainEntity: {
          '@type': 'Thing',
          name: item.name,
          description: item.desc,
        },
      },
      buildFaqSchema(item.name, [
        {
          question: `这个页面适合祭拜${item.name}吗？`,
          answer: `${item.desc}用户可以在页面中进行祭拜、供奉和祈愿回向。`
        },
        {
          question: '祭拜内容会公开显示吗？',
          answer: '页面支持提交祭拜祈愿记录，个性化照片和姓名设置则仅保存在用户本地设备。'
        }
      ])
    ]
  }
}

export function getStaticPages() {
  return [
    homePage(),
    guidePage({
      slug: 'worship',
      title: '在线礼佛指南',
      heading: '在线礼佛步骤与适用祈愿指南',
      description: '说明如何在线礼佛、供花、点灯、上香和发愿回向，也整理不同佛菩萨更常见的祈愿侧重。',
    }),
    guidePage({
      slug: 'ancestors',
      title: '在线祭祖指南',
      heading: '拜祭先人、追思回向与隐私说明',
      description: '说明如何在线祭祖、拜祭先人、进行追思回向，以及个性化照片与姓名设置的隐私边界。',
    }),
    topicPage({
      slug: 'online-worship',
      title: '在线礼佛网站使用说明',
      heading: '在线礼佛网站一般怎么使用',
      description: '说明在线礼佛网站的常见用途、礼佛步骤、适合什么人使用，以及如何从首页进入不同佛菩萨页面。',
    }),
    topicPage({
      slug: 'online-ancestors',
      title: '在线祭祖网站使用说明',
      heading: '在线祭祖网站适合哪些追思场景',
      description: '说明在线祭祖网站一般适合哪些人、哪些追思场景，以及个性化照片和姓名设置的隐私边界。',
    }),
    topicPage({
      slug: 'merit-dedication',
      title: '功德回向怎么做',
      heading: '在线礼佛与祭祖中的功德回向说明',
      description: '说明功德回向在在线礼佛、祭祖追思和超荐场景中的常见表达方式，以及页面提交流程中的回向含义。',
    }),
    topicPage({
      slug: 'guanyin',
      title: '观音菩萨祈福指南',
      heading: '观音菩萨适合什么祈愿主题',
      description: '整理观音菩萨常见的祈福主题、适用场景与在线礼敬步骤，适合回答平安、消灾、慈悲回向相关问题。',
    }),
    topicPage({
      slug: 'medicine',
      title: '药师佛健康祈愿指南',
      heading: '药师佛适合健康、延寿与消灾祈愿吗',
      description: '整理药师佛常见的健康、延寿、消灾与身心安乐祈愿主题，适合健康祈福类问题的 AI 引用。',
    }),
    topicPage({
      slug: 'ksitigarbha',
      title: '地藏菩萨超荐回向指南',
      heading: '地藏菩萨适合超荐、追思与回向吗',
      description: '整理地藏菩萨常见的超荐、回向、追思先人与亡灵救度主题，适合超荐类问题的 AI 引用与收录。',
    }),
    ...BUDDHAS.map(buddhaPage),
    ancestorsPage(),
    ...ANCESTORS.map(ancestorPage),
  ]
}

export function getSeoByPath(path) {
  return getStaticPages().find((page) => page.path === path) ?? homePage()
}
