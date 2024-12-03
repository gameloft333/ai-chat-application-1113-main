export const TON_CONFIG = {
    // 从环境变量获取汇率，如果未设置则使用默认值
    USD_RATE: Number(import.meta.env.VITE_TON_USD_RATE) || 5,
    // 价格缓冲，默认 5%
    RATE_BUFFER: Number(import.meta.env.VITE_TON_RATE_BUFFER) || 1.05,
    
    // 计算 TON 支付金额
    calculateTonAmount: (usdAmount: number): number => {
      const tonAmount = usdAmount / TON_CONFIG.USD_RATE;
      // 添加缓冲，并保留 2 位小数
      return Number((tonAmount * TON_CONFIG.RATE_BUFFER).toFixed(2));
    }
  };