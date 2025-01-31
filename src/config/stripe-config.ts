import { loadEnv } from '../utils/env-utils';

const env = loadEnv();

export const STRIPE_CONFIG = {
    PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    API_URL: import.meta.env.VITE_PAYMENT_API_URL,
    IS_TEST_MODE: import.meta.env.VITE_STRIPE_MODE === 'test',
    PAYMENT_MODE: import.meta.env.VITE_STRIPE_PAYMENT_MODE || 'stripe_link', // 'stripe_link' | 'payment_server'
};

// 添加配置验证
if (!STRIPE_CONFIG.API_URL) {
    console.error('警告: VITE_PAYMENT_API_URL 未配置');
}