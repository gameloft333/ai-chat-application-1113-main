// 货币配置
export const currencyConfig = {
  CNY: {
    symbol: '¥',
    code: 'CNY',
    position: 'before'
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

// 当前使用的货币，只需修改这里即可切换货币
export const currentCurrency = currencyConfig.USD;

export const pricingPlans = {
  durations: [
    { id: 'test', name: 'Test' },
    { id: '1week', name: '1 Week' },
    { id: '24months', name: '24 Months' },
    { id: '12months', name: '12 Months' },
    { id: '1month', name: '1 Month' }
  ],
  trialPlan: {
    id: 'trial',
    name: 'subscription.trial',
    description: 'subscription.trialDesc',
    prices: {
      '1week': { price: 9.90, save: 0, extraMonths: 0 }
    },
    features: [
      'subscription.features.unlimitedChat',
      'subscription.features.basicCharacters',
      // 'subscription.features.basicVoice'
    ]
  },
  plans: [
    {
      id: 'basic',
      name: 'memberLevel.basic',
      description: 'subscription.basicDesc',
      prices: {
        '24months': { price: 19.00, save: 50, extraMonths: 2 },
        '12months': { price: 29.00, save: 45, extraMonths: 1 },
        '1month': { price: 39.00, save: 0, extraMonths: 0 }
      },
      features: [
        'subscription.features.unlimitedChat',
        'subscription.features.basicCharacters',
        //'subscription.features.basicVoice',
        //'subscription.features.standardSupport'
      ]
    },
    {
      id: 'pro',
      name: 'memberLevel.pro',
      description: 'subscription.proDesc',
      popular: true,
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
      id: 'premium',
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
        price: 9.90,
        save: 0,
        extraMonths: 0
      }
    }
  }
};