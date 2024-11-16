import { PAYPAL_CONFIG } from '../config/paypal-config';

export class PayPalService {
    private static instance: PayPalService;
    private accessToken: string | null = null;

    private constructor() { }

    public static getInstance(): PayPalService {
        if (!PayPalService.instance) {
            PayPalService.instance = new PayPalService();
        }
        return PayPalService.instance;
    }

    private async getAccessToken(): Promise<string> {
        if (this.accessToken) return this.accessToken;

        const auth = btoa(
            `${PAYPAL_CONFIG.CLIENT_ID}:${PAYPAL_CONFIG.SECRET_KEY}`
        );

        const response = await fetch(`${PAYPAL_CONFIG.API_URL}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${auth}`,
            },
            body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
            throw new Error(`PayPal API error: ${response.status}`);
        }

        const data = await response.json();
        this.accessToken = data.access_token;
        return this.accessToken;
    }

    async createPaymentOrder(plan: any): Promise<string> {
        try {
            const accessToken = await this.getAccessToken();

            const response = await fetch(`${PAYPAL_CONFIG.API_URL}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [
                        {
                            amount: {
                                currency_code: plan.currency,
                                value: plan.price.toFixed(2),
                            },
                            description: plan.description,
                        },
                    ],
                    application_context: {
                        return_url: `${window.location.origin}/payment-success`,
                        cancel_url: `${window.location.origin}/payment-cancel`,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'PayPal API error');
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
            const response = await fetch(
                `${PAYPAL_CONFIG.API_URL}/v2/checkout/orders/${orderId}/capture`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                        'PayPal-Request-Id': payerId
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('PayPal 捕获支付错误:', errorData);
                throw new Error(errorData.message || '支付捕获失败');
            }

            const data = await response.json();
            return data.status === 'COMPLETED';
        } catch (error) {
            console.error('PayPal capturePayment error:', error);
            return false;
        }
    }
}