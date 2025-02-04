// import { db, withRetry } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

class WebhookService {
  static async handlePaymentSuccess(paymentIntent) {
    try {
      console.log('开始处理支付成功:', paymentIntent.id);
      
      // 1. 记录支付状态
      const paymentRecord = await this.updatePaymentRecord(paymentIntent);
      
      // 2. 如果支付成功，更新用户信息
      if (paymentRecord.status === 'completed') {
        const { userId, planId, duration } = paymentIntent.metadata;
        
        // 更新用户信息
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          planLevel: planId,
          planDuration: duration,
          expiredAt: calculateExpiredAt(duration),
          updatedAt: new Date().toISOString()
        });
        
        // 3. 发送 WebSocket 消息通知前端
        global.io.to(userId).emit('payment:success', {
          orderId: paymentIntent.id,
          planId,
          duration
        });
      }

      return { success: true, orderId: paymentIntent.id };
    } catch (error) {
      console.error('处理支付失败:', error);
      throw error;
    }
  }

  static async updatePaymentRecord(paymentIntent) {
    await withRetry(async () => {
      const paymentSnapshot = await db.collection('paymentRecords')
        .where('orderId', '==', paymentIntent.id)
        .get();

      if (paymentSnapshot.empty) {
        await db.collection('paymentRecords').add({
          orderId: paymentIntent.id,
          status: 'completed',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
      } else {
        await paymentSnapshot.docs[0].ref.update({
          status: 'completed',
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
      }
    });
  }

  static async updateUserInfo(paymentIntent) {
    const { userId, planId, duration } = paymentIntent.metadata;
    if (!userId) {
      throw new Error('缺少用户ID，无法更新用户信息');
    }

    await withRetry(async () => {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        planLevel: planId,
        planDuration: duration,
        expiredAt: calculateExpiredAt(duration),
        updatedAt: new Date().toISOString(),
        paymentHistory: FieldValue.arrayUnion({
          orderId: paymentIntent.id,
          planId,
          duration,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          paidAt: new Date().toISOString()
        })
      });
    });
  }

  static async handleCheckoutCompleted(session) {
    try {
      console.log('处理结账完成:', session.id);
      // 实现结账完成的处理逻辑
    } catch (error) {
      console.error('处理结账完成事件失败:', error);
      throw error;
    }
  }

  static async handleSubscriptionCreated(data) {
    try {
      console.log('处理订阅创建:', data);
      // 实现订阅创建的处理逻辑
    } catch (error) {
      console.error('处理订阅创建事件失败:', error);
      throw error;
    }
  }

  static async addToOfflineQueue(type, data) {
    try {
      await db.collection('offlineQueue').add({
        type,
        data,
        createdAt: new Date().toISOString(),
        status: 'pending',
        retryCount: 0
      });
    } catch (error) {
      console.error('添加离线队列失败:', error);
      // 如果连离线队列都无法添加，则写入本地文件
      this.writeToLocalFile(type, data);
    }
  }

  static writeToLocalFile(type, data) {
    // 实现本地文件写入逻辑
  }
}

// 添加计算过期时间的工具函数
const calculateExpiredAt = (duration) => {
  const now = new Date();
  switch(duration) {
    case 'month':
      return new Date(now.setMonth(now.getMonth() + 1));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    case 'week':
      return new Date(now.setDate(now.getDate() + 7));
    default:
      return new Date(now.setMonth(now.getMonth() + 1)); // 默认一个月
  }
};

export default WebhookService; 