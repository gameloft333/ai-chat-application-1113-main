export const STRIPE_LINK_CONFIG = {
  // 支付模式优先级配置
  paymentMode: {
    stripeLink: {
      enabled: true,
      priority: 1  // 数字越小优先级越高
    },
    paymentServer: {
      enabled: true, 
      priority: 2
    }
  },

  // Stripe Link 配置
  links: {
    trial: {
      '1week': {
        price: 9.9,
        currency: 'USD',
        stripeLinkId: process.env.VITE_STRIPE_LINK_TRIAL_1WEEK
      }
    },
    basic: {
      '24months': {
        price: 19.00,
        save: 50,
        extraMonths: 2,
        stripeLinkId: process.env.VITE_STRIPE_LINK_BASIC_24MONTHS
      },
      '12months': {
        price: 29.00,
        save: 45,
        extraMonths: 1,
        stripeLinkId: process.env.VITE_STRIPE_LINK_BASIC_12MONTHS
      },
      '1month': {
        price: 39.00,
        stripeLinkId: process.env.VITE_STRIPE_LINK_BASIC_1MONTH
      }
    },
    pro: {
      '24months': {
        price: 25.00,
        save: 70,
        extraMonths: 4,
        stripeLinkId: process.env.VITE_STRIPE_LINK_PRO_24MONTHS
      },
      '12months': {
        price: 35.00,
        save: 55,
        extraMonths: 2,
        stripeLinkId: process.env.VITE_STRIPE_LINK_PRO_12MONTHS
      },
      '1month': {
        price: 45.00,
        stripeLinkId: process.env.VITE_STRIPE_LINK_PRO_1MONTH
      }
    },
    premium: {
      '24months': {
        price: 35.00,
        save: 75,
        extraMonths: 4,
        stripeLinkId: process.env.VITE_STRIPE_LINK_PREMIUM_24MONTHS
      },
      '12months': {
        price: 45.00,
        save: 65,
        extraMonths: 3,
        stripeLinkId: process.env.VITE_STRIPE_LINK_PREMIUM_12MONTHS
      },
      '1month': {
        price: 60.00,
        stripeLinkId: process.env.VITE_STRIPE_LINK_PREMIUM_1MONTH
      }
    }
  }
}; 