import { loadEnv } from '../utils/env-utils';

const env = loadEnv();

export const STRIPE_CONFIG = {
    PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    IS_TEST_MODE: import.meta.env.VITE_STRIPE_MODE === 'test'
};