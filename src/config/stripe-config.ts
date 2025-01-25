import { loadEnv } from '../utils/env-utils';

const env = loadEnv();

const getApiUrl = () => {
    // 优先使用环境变量中的配置
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    
    // 根据环境判断默认值
    return process.env.NODE_ENV === 'production'
        ? 'https://payment.saga4v.com'
        : 'http://localhost:4242';
};

export const STRIPE_CONFIG = {
    PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    API_URL: getApiUrl(),
    IS_TEST_MODE: import.meta.env.VITE_STRIPE_MODE === 'test'
};