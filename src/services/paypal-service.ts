import { PAYPAL_CONFIG } from '../config/paypal-config';
import { PaymentRecordService } from './payment-record-service';

export class PayPalService {
    private static instance: PayPalService;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    private constructor() {}

    static getInstance(): PayPalService {
        if (!this.instance) {
            this.instance = new PayPalService();
        }
        return this.instance;
    }

    private async getAccessToken(): Promise<string> {
        try {
            if (this.accessToken && Date.now() < this.tokenExpiry) {
                console.log('使用缓存的 PayPal access token');
                return this.accessToken;
            }

            console.log('开始获取新的 PayPal access token');
            
            if (!PAYPAL_CONFIG.CLIENT_ID || !PAYPAL_CONFIG.CLIENT_SECRET) {
                console.error('PayPal 配置错误: 缺少凭证');
                throw new Error('PayPal credentials are not configured');
            }

            const credentials = btoa(
                `${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`
            );

            console.log('PayPal API URL:', PAYPAL_CONFIG.API_URL);
            
            const response = await fetch(`${PAYPAL_CONFIG.API_URL}/v1/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Language': 'en_US',
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('PayPal token error details:', errorData);
                throw new Error(`PayPal API error: ${errorData.error_description || 'Failed to get access token'}`);
            }

            const data = await response.json();
            if (!data.access_token) {
                throw new Error('No access token received from PayPal');
            }

            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + ((data.expires_in || 3600) * 1000);
            return this.accessToken;
        } catch (error) {
            console.error('获取 PayPal access token 失败:', error);
            throw error;
        }
    }

    async createPaymentOrder({ price, currency, description }: {
        price: number;
        currency: string;
        description: string;
    }): Promise<{orderId: string; approvalUrl: string}> {
        try {
            console.log('创建 PayPal 订单，参数:', {
                price: price,
                currency: currency,
                description: description
            });

            const accessToken = await this.getAccessToken();
            console.log('获取到 PayPal access token');
            
            // 确保金额大于等于 0.01
            if (price < 0.01) {
                throw new Error('金额必须大于等于 0.01');
            }

            // 确保货币代码存在
            if (!currency) {
                throw new Error('货币代码不能为空');
            }

            const response = await fetch(`${PAYPAL_CONFIG.API_URL}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    application_context: {
                        brand_name: 'Your App Name',
                        landing_page: 'LOGIN',
                        user_action: 'PAY_NOW',
                        return_url: `${window.location.origin}/payment-callback`,
                        cancel_url: `${window.location.origin}/payment-cancel`,
                        shipping_preference: 'NO_SHIPPING'
                    },
                    purchase_units: [{
                        amount: {
                            currency_code: currency.toUpperCase(),
                            value: price.toFixed(2)
                        },
                        description
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('PayPal API error:', errorData);
                throw new Error(`PayPal API error: ${errorData.message}`);
            }

            const data = await response.json();
            const approvalUrl = data.links.find((link: any) => link.rel === 'approve')?.href;
            
            if (!approvalUrl) {
                throw new Error('无法获取 PayPal 支付链接');
            }

            console.log('PayPal 订单创建响应:', data);
            
            return {
                orderId: data.id,
                approvalUrl
            };
        } catch (error) {
            console.error('PayPal 订单创建失败:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error('PayPal API error: ' + (error.response?.data?.message || error.message));
        }
    }

    async capturePayment(orderId: string, payerId: string): Promise<boolean> {
        try {
            const accessToken = await this.getAccessToken();
            console.log('Capturing payment for order:', orderId);
            
            const response = await fetch(
                `${PAYPAL_CONFIG.API_URL}/v2/checkout/orders/${orderId}/capture`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                        'PayPal-Request-Id': payerId
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('PayPal capture error:', errorData);
                throw new Error(errorData.message || '支付捕获失败');
            }

            const data = await response.json();
            console.log('Payment capture response:', data);
            return data.status === 'COMPLETED';
        } catch (error) {
            console.error('PayPal capturePayment error:', error);
            return false;
        }
    }

    async getPaymentDetails(orderId: string): Promise<{ payerEmail: string } | null> {
        try {
            const accessToken = await this.getAccessToken();
            console.log('Getting payment details for order:', orderId);
            
            const response = await fetch(
                `${PAYPAL_CONFIG.API_URL}/v2/checkout/orders/${orderId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('PayPal get details error:', errorData);
                throw new Error('获取支付详情失败');
            }

            const data = await response.json();
            console.log('Payment details response:', data);
            
            return {
                payerEmail: data.payer?.email_address || ''
            };
        } catch (error) {
            console.error('获取 PayPal 支付详情失败:', error);
            return null;
        }
    }

    async validateBuyerAccount(email: string): Promise<boolean> {
        try {
            const accessToken = await this.getAccessToken();
            const response = await fetch(`${PAYPAL_CONFIG.API_URL}/v1/customer/accounts/${email}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                }
            });

            if (!response.ok) {
                console.error('买家账户验证失败');
                return false;
            }

            const data = await response.json();
            return data.account_status === 'ACTIVE';
        } catch (error) {
            console.error('验证买家账户时出错:', error);
            return false;
        }
    }

    async handlePaymentSuccess(orderId: string, payerEmail: string): Promise<void> {
        try {
            await PaymentRecordService.handlePaymentSuccess(orderId, payerEmail);
            // 支付成功后立即刷新订阅状态
            window.dispatchEvent(new CustomEvent('subscription-updated'));
        } catch (error) {
            console.error('处理 PayPal 支付成功失败:', error);
            throw error;
        }
    }
}