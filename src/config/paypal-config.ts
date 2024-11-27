const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_PAYPAL_CLIENT_SECRET;
const SANDBOX_MODE = import.meta.env.VITE_PAYPAL_SANDBOX_MODE === 'true';
const API_URL = SANDBOX_MODE 
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

console.log('PayPal Configuration:', {
    hasClientId: !!CLIENT_ID,
    hasClientSecret: !!CLIENT_SECRET,
    sandboxMode: SANDBOX_MODE,
    apiUrl: API_URL
});

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('PayPal credentials are missing! Please check your environment variables.');
}

export const PAYPAL_CONFIG = {
    CLIENT_ID: CLIENT_ID || '',
    CLIENT_SECRET: CLIENT_SECRET || '',
    SANDBOX_MODE,
    API_URL,
    VERSION: '2.0',
    CURRENCY: 'USD',
    INTENT: 'CAPTURE'
};

export const validatePayPalConfig = () => {
    const issues = [];
    if (!PAYPAL_CONFIG.CLIENT_ID) issues.push('Missing CLIENT_ID');
    if (!PAYPAL_CONFIG.CLIENT_SECRET) issues.push('Missing CLIENT_SECRET');
    if (!PAYPAL_CONFIG.API_URL) issues.push('Missing API_URL');
    
    if (issues.length > 0) {
        console.error('PayPal Configuration Issues:', issues);
        throw new Error(`PayPal Configuration Issues:\n${issues.join('\n')}`);
    }
    
    console.log('PayPal configuration validated successfully');
    return true;
};