import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from '../config/stripe-config';

export class StripeService {
    private static instance: StripeService;
    private stripe: Stripe | null = null;
    private isInitializing: boolean = false;

    private constructor() {}

    public static getInstance(): StripeService {
        if (!StripeService.instance) {
            StripeService.instance = new StripeService();
        }
        return StripeService.instance;
    }

    private async ensureInitialized() {
        if (this.stripe) return;
        if (this.isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.ensureInitialized();
        }

        try {
            this.isInitializing = true;
            this.stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
            if (!this.stripe) throw new Error('Stripe 初始化失败');
        } finally {
            this.isInitializing = false;
        }
    }

    async createPaymentIntent(amount: number, currency: string): Promise<string> {
        console.log('开始创建支付意向...', { amount, currency });
        
        try {
            await this.ensureInitialized();
            console.log('Stripe 初始化完成');
            
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            console.log('请求支付服务:', apiUrl);
            
            const response = await fetch(`${apiUrl}/api/stripe/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount, currency }),
                credentials: 'include'  // 添加这行
            });

            console.log('支付服务响应状态:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('支付服务错误响应:', errorText);
                throw new Error(`支付服务请求失败: ${errorText}`);
            }

            const data = await response.json();
            console.log('支付意向创建成功:', data);
            return data.clientSecret;
        } catch (error) {
            console.error('Stripe 支付初始化失败:', error);
            console.error('错误详情:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    getStripe(): Stripe | null {
        return this.stripe;
    }
}