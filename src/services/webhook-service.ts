import { FieldValue } from 'firebase/firestore';
import { db } from '../firebase-config';
import { calculateExpiredAt } from '../utils/payment-utils';
import { PaymentRecordService } from './payment-record-service';

export class WebhookService {
  static async handlePaymentWebhook(event: any) {
    const { type, data } = event;
    
    if (type === 'payment_intent.succeeded') {
      const paymentIntent = data.object;
      const { orderId, userId, planId, duration } = paymentIntent.metadata;
      
      try {
        // 1. 更新支付记录状态
        await PaymentRecordService.updatePaymentStatus(orderId, 'completed');
        
        // 2. 更新用户会员信息
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          planLevel: planId,
          planDuration: duration,
          expiredAt: calculateExpiredAt(duration),
          updatedAt: new Date(),
          paymentHistory: FieldValue.arrayUnion({
            orderId,
            planId,
            duration,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paidAt: new Date()
          })
        });
        
        console.log('Payment webhook processed successfully:', orderId);
      } catch (error) {
        console.error('Error processing payment webhook:', error);
        throw error;
      }
    }
  }

  static async handleSubscriptionCreated(data: {
    userId: string;
    email: string;
    subscriptionId: string;
    planId: string;
    duration: string;
    status: string;
  }) {
    try {
      const userRef = db.collection('users').doc(data.userId);
      const expiredAt = calculateExpiredAt(data.duration);

      await userRef.update({
        planLevel: data.planId,
        planDuration: data.duration,
        expiredAt,
        subscriptionId: data.subscriptionId,
        subscriptionStatus: data.status,
        updatedAt: new Date(),
        email: data.email
      });

      // 触发前端更新
      const event = new CustomEvent('subscription-updated');
      window.dispatchEvent(event);

      console.log('Subscription created successfully:', data);
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }
} 