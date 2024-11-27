import { PAYPAL_CONFIG } from '../config/paypal-config';

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
                return this.accessToken;
            }

            if (!PAYPAL_CONFIG.CLIENT_ID || !PAYPAL_CONFIG.CLIENT_SECRET) {
                throw new Error('PayPal credentials are not configured');
            }

            const credentials = btoa(
                `${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.CLIENT_SECRET}`
            );

            console.log('Using PayPal API URL:', PAYPAL_CONFIG.API_URL);
            
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
            console.error('获取 PayPal token 失败:', error);
            throw error;
        }
    }

    async createPaymentOrder(params: { price: number; currency: string; description: string }): Promise<string> {
        try {
            const accessToken = await this.getAccessToken();
            
            const response = await fetch(`${PAYPAL_CONFIG.API_URL}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'PayPal-Request-Id': `order_${Date.now()}`
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    application_context: {
                        return_url: `${window.location.origin}/payment-callback`,
                        cancel_url: `${window.location.origin}/payment-cancel`,
                        user_action: 'PAY_NOW'
                    },
                    purchase_units: [{
                        amount: {
                            currency_code: params.currency,
                            value: params.price.toString()
                        },
                        description: params.description
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('PayPal order error:', errorData);
                throw new Error(`PayPal API error: ${errorData.message || 'Failed to create order'}`);
            }

            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error('PayPal createPaymentOrder error:', error);
            throw error;
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