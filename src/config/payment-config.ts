export const PAYMENT_CONFIG = {
  minimumAmount: 0.01,  // 最小支付金额
  environments: {
    paypal: {
      sandbox: false,  // true: 沙箱环境, false: 生产环境
      apiUrl: process.env.REACT_APP_PAYPAL_API_URL,
      clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID,
      secretKey: process.env.REACT_APP_PAYPAL_SECRET_KEY
    },
    stripe: {
      testMode: false,  // true: 测试模式, false: 生产模式
      apiUrl: process.env.REACT_APP_STRIPE_API_URL,
      publicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY,
      secretKey: process.env.REACT_APP_STRIPE_SECRET_KEY
    },
    ton: {
      testnet: false,  // true: 测试网络, false: 主网络
      apiUrl: process.env.REACT_APP_TON_API_URL,
      apiKey: process.env.REACT_APP_TON_API_KEY
    }
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
  }
}; 