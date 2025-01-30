import { PAYPAL_CONFIG } from '../config/paypal-config';

export const validatePayPalConfig = () => {
  if (!PAYPAL_CONFIG.CLIENT_ID || !PAYPAL_CONFIG.CLIENT_SECRET) {
    throw new Error('PayPal Configuration Issues: Missing credentials');
  }

  if (!PAYPAL_CONFIG.SANDBOX_MODE && !PAYPAL_CONFIG.LIVE_MODE) {
    throw new Error('PayPal Configuration Issues: Invalid mode');
  }
};

/**
 * 计算订阅到期时间
 * @param duration 订阅时长
 * @returns 到期日期
 */
export const calculateExpiredAt = (duration: string): Date => {
  const now = new Date();
  
  switch (duration) {
    case '1week':
      return new Date(now.setDate(now.getDate() + 7));
    case '1month':
      return new Date(now.setMonth(now.getMonth() + 1));
    case '12months':
      return new Date(now.setMonth(now.getMonth() + 12));
    case '24months':
      return new Date(now.setMonth(now.getMonth() + 24));
    default:
      console.warn(`Invalid duration: ${duration}, falling back to 1 month`);
      return new Date(now.setMonth(now.getMonth() + 1));
  }
};

// 为了保持向后兼容，添加别名
export const calculateExpiryDate = calculateExpiredAt;

export const validateDuration = (duration: string): boolean => {
  const validDurations = ['1week', '1month', '12months', '24months'];
  const isValid = validDurations.includes(duration);
  
  console.log('Duration validation:', {
    duration,
    isValid,
    validDurations
  });
  
  return isValid;
};