export const PAYMENT_CONFIG = {
  minimumAmount: 0.01,  // 最小支付金额
  environments: {
    paypal: {
      sandbox: false,  // true: 沙箱环境, false: 生产环境
      apiUrl: import.meta.env.VITE_PAYPAL_API_URL,
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
      secretKey: import.meta.env.VITE_PAYPAL_CLIENT_SECRET
    },
    stripe: {
      testMode: import.meta.env.VITE_STRIPE_MODE === 'test',  // true: 测试模式, false: 生产模式
      publicKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY
    },
    ton: {
      testnet: import.meta.env.TON_NETWORK === 'testnet',  // true: 测试网络, false: 主网络
      apiKey: import.meta.env.VITE_TON_API_KEY
    }
  },
  enabledMethods: {
    paypal: false,  // change to true to enable PayPal payment method during payment modal selection on choose your plan page
    stripe: true,   // change to true to enable Stripe payment method during payment modal selection on choose your plan page
    ton: false      // change to true to enable TON payment method during payment modal selection on choose your plan page
  },
  
  // 获取支付环境状态的工具函数
  getEnvironmentStatus: (paymentMethod: 'paypal' | 'stripe' | 'ton') => {
    const config = PAYMENT_CONFIG.environments[paymentMethod];
    switch (paymentMethod) {
      case 'paypal':
        return config.sandbox;
      case 'stripe':
        return config.testMode;
      case 'ton':
        return config.testnet;
      default:
        return true;
    }
  },
  
  // 获取启用的支付方式列表
  getEnabledMethods: () => {
    return Object.entries(PAYMENT_CONFIG.enabledMethods)
      .filter(([_, enabled]) => enabled)
      .map(([method]) => method as 'paypal' | 'stripe' | 'ton');
  }
}; 