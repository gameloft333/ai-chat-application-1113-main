// 货币配置：定义支持的货币类型及其显示规则
export const currencyConfig = {
  CNY: {
    symbol: '¥',    // 货币符号
    code: 'CNY',    // 货币代码
    position: 'before'  // 货币符号显示位置：before=符号在前，after=符号在后
  },
  USD: {
    symbol: '$',
    code: 'USD',
    position: 'before'
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    position: 'after'
  }
};

// 当前使用的货币配置，修改这里可以切换默认货币
export const currentCurrency = currencyConfig.USD;

export const pricingPlans = {
  // 可选的订阅时长配置
  durations: [
    { id: 'test', name: 'Test' },          // 测试计划
    { id: '1week', name: '1 Week' },       // 一周计划
    { id: '24months', name: '24 Months' }, // 24个月计划
    { id: '12months', name: '12 Months' }, // 12个月计划
    { id: '1month', name: '1 Month' }      // 1个月计划
  ],

  // 试用计划配置
  trialPlan: {
    id: 'trial',
    name: 'subscription.trial',           // 多语言key
    description: 'subscription.trialDesc', // 多语言key
    prices: {
      // 价格配置：
      // price: 价格金额 - 这里控制显示的价格
      // save: 相比原价的节省百分比
      // extraMonths: 赠送的额外月份数
      '1week': { price: 9.9, save: 0, extraMonths: 0 }  // 这里的 9.90 就是显示的价格
    },
    features: [  // 功能列表，使用多语言key
      'subscription.features.unlimitedChat',
      'subscription.features.basicCharacters',
      // 'subscription.features.basicVoice' // 已注释的功能表示暂未开放
    ]
  },

  // 正式订阅计划列表
  plans: [
    {
      id: 'basic',  // 基础版
      name: 'memberLevel.basic',
      description: 'subscription.basicDesc',
      prices: {
        '24months': { price: 19.00, save: 50, extraMonths: 2 }, // 24个月方案
        '12months': { price: 29.00, save: 45, extraMonths: 1 }, // 12个月方案
        '1month': { price: 39.00, save: 0, extraMonths: 0 }     // 1个月方案
      },
      features: [
        'subscription.features.unlimitedChat',
        'subscription.features.basicCharacters',
        //'subscription.features.basicVoice',
        //'subscription.features.standardSupport'
      ]
    },
    {
      id: 'pro',    // 专业版
      name: 'memberLevel.pro',
      description: 'subscription.proDesc',
      popular: true,  // 标记为推荐方案
      prices: {
        '24months': { price: 25.00, save: 70, extraMonths: 4 },
        '12months': { price: 35.00, save: 55, extraMonths: 2 },
        '1month': { price: 45.00, save: 0, extraMonths: 0 }
      },
      features: [
        'subscription.features.unlimitedChat',
        'subscription.features.basicCharacters',
        //'subscription.features.allCharacters',
        //'subscription.features.advancedVoice',
        'subscription.features.prioritySupport',
        //'subscription.features.customCharacter',
        'subscription.features.advancedMemory'
      ]
    },
    {
      id: 'premium', // 高级版
      name: 'memberLevel.premium',
      description: 'subscription.premiumDesc',
      prices: {
        '24months': { price: 35.00, save: 75, extraMonths: 4 },
        '12months': { price: 45.00, save: 65, extraMonths: 3 },
        '1month': { price: 60.00, save: 0, extraMonths: 0 }
      },
      features: [
        'subscription.features.unlimitedChat',
        'subscription.features.allCharacters',
        //'subscription.features.premiumVoice',
        'subscription.features.dedicatedSupport',
        //'subscription.features.customCharacter',
        'subscription.features.permanentMemory',
        'subscription.features.exclusiveAccess',
        //'subscription.features.apiAccess'
      ]
    }
  ],

  // 测试计划配置
  testPlan: {
    id: 'test',
    name: 'Test Plan',
    description: 'subscription.testPlanDesc',
    features: [
      'feature 1',
      'feature 2',
      'feature 3'
    ],
    prices: {
      test: {
        price: 9.90,    // 测试价格
        save: 0,        // 无折扣
        extraMonths: 0  // 无赠送月份
      }
    }
  }
};