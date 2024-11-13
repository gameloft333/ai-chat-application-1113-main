import { TelegramPayment, SubscriptionPlan } from '../types/payment';

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_PAYMENT_PROVIDER_TOKEN = import.meta.env.VITE_TELEGRAM_PAYMENT_PROVIDER_TOKEN;

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
}

export class PaymentService {
  private static instance: PaymentService;
  
  private constructor() {}
  
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async createInvoiceLink(plan: SubscriptionPlan, userId: string): Promise<string> {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_PAYMENT_PROVIDER_TOKEN) {
      console.error('支付配置未完成，请检查环境变量设置');
      throw new Error('支付系统配置未完成，请联系客服');
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: plan.name,
          description: plan.description,
          payload: JSON.stringify({
            userId,
            planId: plan.id,
            subscriptionType: plan.duration,
          }),
          provider_token: TELEGRAM_PAYMENT_PROVIDER_TOKEN,
          currency: plan.currency,
          prices: [{
            label: plan.name,
            amount: Math.round(plan.price * 100),
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.description || '创建支付链接失败');
      }

      return data.result;
    } catch (error) {
      console.error('创建支付链接失败:', error);
      throw error;
    }
  }

  async verifyPayment(paymentData: any): Promise<boolean> {
    try {
      // 验证支付信息
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pre_checkout_query_id: paymentData.id,
          ok: true,
        }),
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('支付验证失败:', error);
      return false;
    }
  }
}