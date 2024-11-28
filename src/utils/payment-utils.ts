import { PAYPAL_CONFIG } from '../config/paypal-config';

export const validatePayPalConfig = () => {
  if (!PAYPAL_CONFIG.CLIENT_ID || !PAYPAL_CONFIG.CLIENT_SECRET) {
    throw new Error('PayPal Configuration Issues: Missing credentials');
  }

  if (!PAYPAL_CONFIG.SANDBOX_MODE && !PAYPAL_CONFIG.LIVE_MODE) {
    throw new Error('PayPal Configuration Issues: Invalid mode');
  }
};

export const calculateExpiryDate = (duration: string): Date => {
  const expiredAt = new Date();
  
  switch (duration) {
    case '1week':
      expiredAt.setDate(expiredAt.getDate() + 7);
      break;
    case '1month':
      expiredAt.setMonth(expiredAt.getMonth() + 1);
      break;
    case '12months':
      expiredAt.setMonth(expiredAt.getMonth() + 12);
      break;
    case '24months':
      expiredAt.setMonth(expiredAt.getMonth() + 24);
      break;
    default:
      throw new Error('Invalid duration');
  }

  return expiredAt;
};