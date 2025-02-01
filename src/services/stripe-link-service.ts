import { STRIPE_LINK_CONFIG } from '../config/stripe-link-config';
import { PaymentRecordService } from './payment-record-service';
import { calculateExpiredAt } from '../utils/payment-utils';
import { STRIPE_CONFIG } from '../config/stripe-config';

export class StripeLinkService {
  private static instance: StripeLinkService;

  private constructor() {}

  public static getInstance(): StripeLinkService {
    if (!StripeLinkService.instance) {
      StripeLinkService.instance = new StripeLinkService();
    }
    return StripeLinkService.instance;
  }

  // 获取支付模式
  public getPaymentMode() {
    console.log('Payment mode config:', {
      mode: STRIPE_CONFIG.PAYMENT_MODE,
      stripeLinkEnabled: STRIPE_LINK_CONFIG.paymentMode.stripeLink.enabled,
      paymentServerEnabled: STRIPE_LINK_CONFIG.paymentMode.paymentServer.enabled
    });
    
    return STRIPE_CONFIG.PAYMENT_MODE === 'stripe_link' ? 'stripeLink' : 'paymentServer';
  }

  // 获取 Stripe Link URL
  public getStripeLinkUrl(planId: string, duration: string): string | null {
    const linkConfig = STRIPE_LINK_CONFIG.links[planId]?.[duration];
    return linkConfig?.stripeLinkId || null;
  }

  // 处理支付成功回调
  public async handlePaymentSuccess(
    planId: string,
    duration: string,
    userId: string,
    userEmail: string,
    sessionId: string
  ): Promise<void> {
    const linkConfig = STRIPE_LINK_CONFIG.links[planId]?.[duration];
    if (!linkConfig) {
      throw new Error('Invalid plan configuration');
    }

    // 创建支付记录
    const paymentRecord = {
      uid: userId,
      userEmail: userEmail,
      planId: planId,
      duration: duration,
      orderId: sessionId,
      amount: linkConfig.price,
      currency: linkConfig.currency || 'USD',
      status: 'completed',
      createdAt: new Date(),
      expiredAt: calculateExpiredAt(duration),
      paymentChannel: 'stripe_link',
      completedAt: new Date()
    };

    await PaymentRecordService.createPaymentRecord(paymentRecord);
  }
} 