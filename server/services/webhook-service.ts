import { UserService } from './user-service';
import { SubscriptionService } from './subscription-service';

export class WebhookService {
  static async handlePaymentSuccess(paymentIntent: any) {
    console.log('处理支付成功:', paymentIntent);
  }

  static async handleCheckoutCompleted(session: any) {
    console.log('处理结账完成:', session);
  }

  static async handleSubscriptionUpdate(subscription: any) {
    console.log('处理订阅更新:', subscription);
  }

  static async handleSubscriptionCanceled(subscription: any) {
    console.log('处理订阅取消:', subscription);
  }
} 