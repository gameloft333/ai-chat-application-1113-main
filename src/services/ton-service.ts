import { PaymentRecordService } from './payment-record-service';
import { TonConnect } from '@tonconnect/sdk';

export class TonService {
  private static instance: TonService;
  private tonConnect: TonConnect;
  private apiBaseUrl: string;
  
  private constructor() {
    this.apiBaseUrl = import.meta.env.VITE_TON_PAYMENT_SERVER_URL || 'http://localhost:4243';
    this.tonConnect = new TonConnect({
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
      apiKey: import.meta.env.VITE_TON_API_KEY,
      network: import.meta.env.VITE_TON_NETWORK
    });
  }
  
  public static getInstance(): TonService {
    if (!TonService.instance) {
      TonService.instance = new TonService();
    }
    return TonService.instance;
  }

  async createPaymentIntent(amount: number, currency: string): Promise<string> {
    try {
      console.log('创建 TON 支付意向:', { amount, currency, apiUrl: this.apiBaseUrl });
      
      const response = await fetch(`${this.apiBaseUrl}/api/ton/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ amount, currency })
      });

      console.log('支付服务响应状态:', response.status);
      const responseText = await response.text();
      console.log('支付服务响应内容:', responseText);

      if (!response.ok) {
        throw new Error(`支付服务错误: ${response.status} ${responseText}`);
      }

      const data = JSON.parse(responseText);
      return data.paymentId;
    } catch (error) {
      console.error('创建 TON 支付意向失败:', error);
      throw error;
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'success' | 'failed';
    walletAddress?: string;
    tonAmount?: string;
    deepLink?: string;
  }> {
    try {
      console.log('检查支付状态:', { paymentId, apiUrl: this.apiBaseUrl });
      
      const response = await fetch(`${this.apiBaseUrl}/api/ton/check-payment/${paymentId}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('检查支付状态失败');
      }
      
      const data = await response.json();
      console.log('支付状态检查结果:', data);
      
      return {
        status: data.status,
        walletAddress: data.walletAddress,
        tonAmount: data.tonAmount,
        deepLink: data.deepLink
      };
    } catch (error) {
      console.error('检查支付状态失败:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(orderId: string, walletAddress: string): Promise<void> {
    try {
      await PaymentRecordService.handlePaymentSuccess(orderId, walletAddress);
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (error) {
      console.error('处理 TON 支付成功失败:', error);
      throw error;
    }
  }
}