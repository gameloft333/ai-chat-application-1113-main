import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from '../config/stripe-config';
import { loadEnv } from '../utils/env-utils';

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
            
            const API_URL = STRIPE_CONFIG.API_URL;
            if (!API_URL) {
                throw new Error('支付服务地址未配置');
            }
            console.log('请求支付服务:', API_URL);
            
            // 添加更多请求头和错误处理
            try {
                const response = await fetch(`${API_URL}/api/stripe/create-payment-intent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ 
                        amount, 
                        currency,
                        // 添加额外的请求参数
                        timestamp: new Date().getTime(),
                        origin: window.location.origin
                    }),
                    credentials: 'include',
                    mode: 'cors'  // 明确指定CORS模式
                });
    
                console.log('支付服务响应状态:', response.status);
                
                // 详细的错误处理
                if (!response.ok) {
                    let errorMessage;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || `支付服务错误: ${response.status}`;
                        console.error('支付服务错误详情:', errorData);
                    } catch (e) {
                        errorMessage = `支付服务错误: ${response.status}`;
                    }
                    throw new Error(errorMessage);
                }
                
                const data = await response.json();
                console.log('支付意向创建成功');
                return data.clientSecret;
            } catch (fetchError) {
                console.error('支付服务请求失败:', fetchError);
                
                // 检查是否是 SSL 错误
                if (fetchError.message.includes('SSL') || 
                    fetchError.toString().includes('ERR_SSL_PROTOCOL_ERROR') ||
                    fetchError.toString().includes('Failed to fetch')) {
                    console.error('检测到 SSL 连接问题，可能是证书配置错误');
                    
                    // 尝试使用备用 URL
                    const backupUrl = API_URL.replace('https://', 'http://');
                    console.log('尝试使用备用 URL:', backupUrl);
                    
                    const backupResponse = await fetch(`${backupUrl}/api/stripe/create-payment-intent`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ 
                            amount, 
                            currency,
                            timestamp: new Date().getTime(),
                            origin: window.location.origin,
                            isBackupRequest: true
                        }),
                        credentials: 'include',
                        mode: 'cors'
                    });
                    
                    if (!backupResponse.ok) {
                        throw new Error(`备用支付服务错误: ${backupResponse.status}`);
                    }
                    
                    const backupData = await backupResponse.json();
                    console.log('备用支付意向创建成功');
                    return backupData.clientSecret;
                }
                
                throw fetchError;
            }
        } catch (error) {
            console.error('Stripe 支付初始化失败:', { error });
            throw error;
        }
    }

    // 添加重试逻辑
    private shouldRetry(error: any): boolean {
        return error instanceof TypeError || 
               error.message.includes('NetworkError') ||
               error.message.includes('Failed to fetch');
    }

    private async retryCreatePaymentIntent(amount: number, currency: string, retries = 3): Promise<string> {
        for (let i = 0; i < retries; i++) {
            try {
                // 延迟重试，避免立即重试
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                return await this.createPaymentIntent(amount, currency);
            } catch (error) {
                if (i === retries - 1) throw error;
                console.log(`重试失败 ${i + 1}/${retries}:`, error);
            }
        }
        throw new Error('重试次数已达上限');
    }

    getStripe(): Stripe | null {
        return this.stripe;
    }
}