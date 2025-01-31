import { UserService } from './user-service';
import { SubscriptionService } from './subscription-service';

export class WebhookService {
  static async handleCheckoutCompleted(session: any) {
    try {
      const userId = session.client_reference_id;
      const subscriptionId = session.subscription;
      
      // 更新用户订阅状态
      await UserService.updateSubscription(userId, {
        subscriptionId,
        status: 'active',
        planId: session.metadata.planId,
        expiresAt: new Date(session.expires_at * 1000)
      });
      
      // 记录订阅历史
      await SubscriptionService.createSubscriptionHistory({
        userId,
        subscriptionId,
        planId: session.metadata.planId,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed'
      });
      
    } catch (error) {
      console.error('处理 checkout.session.completed 失败:', error);
      throw error;
    }
  }
  
  // 其他 webhook 事件处理方法...
} 