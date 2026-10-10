// 愿景图：按职业给不同的成功场景。prompt 是给生图模型的英文描述（图上不出字），
// blessing 是印在图片下方的中文祝福语（由前端画上去）。
export const PROFESSIONS = [
  {
    key: 'office',
    label: '上班族',
    scenes: [
      {
        key: 'promotion',
        label: '升职加薪',
        prompt: 'stands in a bright modern office being congratulated on a promotion, colleagues applauding and shaking hands, a bouquet of flowers on the desk, city skyline through the windows.',
        blessing: '步步高升，升职加薪，前程似锦',
      },
      {
        key: 'award',
        label: '年度表彰',
        prompt: 'stands on a stage at a company annual gala holding a golden trophy, confetti falling, the audience cheering, festive red and gold decorations.',
        blessing: '才华被看见，年年拿大奖',
      },
    ],
  },
  {
    key: 'restaurant',
    label: '餐馆老板',
    scenes: [
      {
        key: 'opening',
        label: '开业大吉',
        prompt: 'is the owner of a newly opened restaurant, standing at the entrance on grand opening day cutting a red ribbon with smiling staff, flower baskets, red lanterns, lion dance performers and a line of happy customers.',
        blessing: '开业大吉，生意兴隆，客似云来',
      },
      {
        key: 'fullhouse',
        label: '天天满座',
        prompt: 'is the owner of a busy restaurant, standing proudly in the dining room where every table is full of happy diners, waiters carrying delicious dishes, warm lively evening.',
        blessing: '日日满座，口碑传四方',
      },
    ],
  },
  {
    key: 'shop',
    label: '开店做生意',
    scenes: [
      {
        key: 'busy',
        label: '顾客盈门',
        prompt: 'is the owner of a beautiful small shop, smiling behind the counter while a crowd of happy customers shop and line up to pay, shelves full of goods.',
        blessing: '顾客盈门，财源滚滚',
      },
      {
        key: 'opening',
        label: '新店开张',
        prompt: 'is opening a new shop, standing at the shop door with a big smile on opening day, festive flower baskets and red balloons, neighbours and customers celebrating.',
        blessing: '新店开张，红红火火',
      },
    ],
  },
  {
    key: 'realestate',
    label: '房地产经纪',
    scenes: [
      {
        key: 'closing',
        label: '成交交钥匙',
        prompt: 'is a successful real estate agent handing a set of house keys to a delighted young couple holding their small child, standing in front of a beautiful house with a manicured lawn, everyone smiling, sunny day.',
        blessing: '单单成交，客户满意，业绩长红',
      },
      {
        key: 'signing',
        label: '签约大单',
        prompt: 'is a successful real estate agent at a bright office table shaking hands with happy clients after signing the purchase contract, champagne glasses raised, celebration mood.',
        blessing: '大单连连，佣金丰厚',
      },
    ],
  },
  {
    key: 'sales',
    label: '销售 / 业务',
    scenes: [
      {
        key: 'deal',
        label: '签下大单',
        prompt: 'is a top salesperson in a glass-walled boardroom shaking hands firmly with an important client after closing a big deal, the team clapping in the background.',
        blessing: '签单如流水，业绩冲第一',
      },
    ],
  },
  {
    key: 'ecommerce',
    label: '网店 / 电商',
    scenes: [
      {
        key: 'orders',
        label: '订单爆满',
        prompt: 'runs a successful online store, standing happily in a tidy warehouse stacked with packed parcels ready to ship, a laptop open nearby, staff busy packing orders.',
        blessing: '订单爆满，好评如潮',
      },
    ],
  },
  {
    key: 'boss',
    label: '公司 / 工厂老板',
    scenes: [
      {
        key: 'team',
        label: '公司蒸蒸日上',
        prompt: 'is the founder of a growing company, standing proudly in front of a modern office building with a large cheerful team celebrating together.',
        blessing: '事业蒸蒸日上，宏图大展',
      },
      {
        key: 'factory',
        label: '订单满产',
        prompt: 'is the owner of a modern clean factory, walking proudly along a busy production line with workers smiling, trucks loading goods outside.',
        blessing: '订单满产，财源广进',
      },
    ],
  },
  {
    key: 'investor',
    label: '投资理财',
    scenes: [
      {
        key: 'freedom',
        label: '财务自由',
        prompt: 'relaxes on the balcony of a beautiful home overlooking the sea at sunset, holding a cup of tea, calm, confident and financially free.',
        blessing: '稳稳增值，财务自由',
      },
    ],
  },
  {
    key: 'student',
    label: '学生 / 考试',
    scenes: [
      {
        key: 'admission',
        label: '金榜题名',
        prompt: 'celebrates at a graduation ceremony in cap and gown, tossing the cap into the air with classmates, family cheering on a sunny campus lawn.',
        blessing: '金榜题名，前程远大',
      },
    ],
  },
  {
    key: 'other',
    label: '其他行业',
    scenes: [
      {
        key: 'success',
        label: '事业有成',
        prompt: 'has achieved great success working in {industry}, celebrating that success at the workplace with colleagues and customers, proud and happy.',
        blessing: '事业有成，心想事成',
      },
    ],
  },
]
