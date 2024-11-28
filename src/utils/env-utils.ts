export const loadEnv = () => {
    return {
      STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
      STRIPE_SECRET_KEY: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
      STRIPE_MODE: import.meta.env.VITE_STRIPE_MODE || 'test',
      NODE_ENV: import.meta.env.MODE || 'development'
    };
  };