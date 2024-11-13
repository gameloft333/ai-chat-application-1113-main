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
    { id: '1week', label: '1 week', trialOnly: true },
    { id: '24months', label: '24 months' },
    { id: '12months', label: '12 months', popular: true },
    { id: '1month', label: '1 month' }
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
      'subscription.features.basicVoice'
    ]
  },
  plans: [
    {
      id: 'basic',
      name: 'subscription.basic',
      description: 'subscription.basicDesc',
      prices: {
        '24months': { price: 19.00, save: 50, extraMonths: 2 },
        '12months': { price: 29.00, save: 55, extraMonths: 2 },
        '1month': { price: 39.00, save: 0, extraMonths: 0 }
      },
      features: [
        'subscription.features.unlimitedChat',
        'subscription.features.basicCharacters',
        'subscription.features.basicVoice',
        'subscription.features.standardSupport'
      ]
    },
    {
      id: 'pro',
      name: 'subscription.pro',
      description: 'subscription.proDesc',
      popular: true,
      features: [
        'subscription.features.unlimitedChat',
        'subscription.features.allCharacters',
        'subscription.features.advancedVoice',
        'subscription.features.prioritySupport',
        'subscription.features.customCharacter',
        'subscription.features.advancedMemory'
      ],
      prices: {
        '24months': { price: 25.00, save: 70, extraMonths: 4 },
        '12months': { price: 29.00, save: 55, extraMonths: 2 },
        '1month': { price: 45.00, save: 0, extraMonths: 0 }
      }
    },
    {
      id: 'ultimate',
      name: 'subscription.ultimate',
      description: 'subscription.ultimateDesc',
      features: [
        'subscription.features.unlimitedChat',
        'subscription.features.allCharacters',
        'subscription.features.premiumVoice',
        'subscription.features.dedicatedSupport',
        'subscription.features.customCharacter',
        'subscription.features.permanentMemory',
        'subscription.features.exclusiveAccess',
        'subscription.features.apiAccess'
      ],
      prices: {
        '24months': { price: 35.00, save: 75, extraMonths: 4 },
        '12months': { price: 39.00, save: 60, extraMonths: 2 },
        '1month': { price: 60.00, save: 0, extraMonths: 0 }
      }
    }
  ]
};