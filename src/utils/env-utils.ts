export const loadEnv = () => {
  const currentMode = import.meta.env.MODE;
  const isProduction = currentMode === 'production';
  
  console.log('当前环境:', {
    mode: currentMode,
    isProduction,
    apiUrl: import.meta.env.VITE_PAYMENT_API_URL,
    paypalMode: import.meta.env.VITE_PAYPAL_SANDBOX_MODE,
    stripeMode: import.meta.env.VITE_STRIPE_MODE,
    tonNetwork: import.meta.env.VITE_TON_NETWORK
  });

  return {
    STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    STRIPE_MODE: import.meta.env.VITE_STRIPE_MODE || 'test',
    NODE_ENV: currentMode,
    IS_PRODUCTION: isProduction
  };
};