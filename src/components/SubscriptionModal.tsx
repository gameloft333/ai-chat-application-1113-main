import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import SubscriptionPlans from './SubscriptionPlans';
import { useAuth } from '../contexts/AuthContext';
import { PaymentRecordService } from '../services/payment-record-service';
import { PayPalService } from '../services/paypal-service';
import { pricingPlans, currentCurrency } from '../config/pricing-config';
import { useLanguage } from '../contexts/LanguageContext';
import { PAYPAL_CONFIG, validatePayPalConfig } from '../config/paypal-config';

interface SubscriptionModalProps {
  themeColor: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ themeColor }) => {
  const { isSubscriptionModalOpen, closeSubscriptionModal } = useSubscription();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const handleSubscribe = async (planId: string, duration: string) => {
    try {
      // 验证 PayPal 配置
      validatePayPalConfig();
      
      if (!currentUser) {
        throw new Error(t('alerts.error.loginRequired'));
      }

      let plan;
      if (planId === 'trial') {
        plan = pricingPlans.trialPlan;
      } else {
        plan = pricingPlans.plans.find(p => p.id === planId);
      }
      
      if (!plan) {
        throw new Error(t('alerts.error.subscriptionNotFound'));
      }
      
      const pricing = plan.prices[duration] || plan.prices['1week'];
      if (!pricing) {
        throw new Error(t('alerts.error.priceNotFound'));
      }

      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + parseInt(duration) * 7);

      const paypalService = PayPalService.getInstance();
      console.log('Creating PayPal order with config:', {
        price: pricing.price,
        currency: currentCurrency.code,
        description: plan.description
      });
      
      const orderId = await paypalService.createPaymentOrder({
        price: pricing.price,
        currency: currentCurrency.code,
        description: plan.description
      });
      console.log('PayPal order created:', orderId);

      await PaymentRecordService.createPaymentRecord({
        uid: currentUser.uid,
        planId: planId,
        orderId: orderId,
        amount: pricing.price,
        currency: currentCurrency.code,
        status: 'pending',
        createdAt: new Date(),
        expiredAt: expiredAt,
        paymentChannel: 'paypal'
      });

      closeSubscriptionModal();
      
      const paypalBaseUrl = PAYPAL_CONFIG.SANDBOX_MODE 
        ? 'https://www.sandbox.paypal.com' 
        : 'https://www.paypal.com';
        
      const returnUrl = `${window.location.origin}/payment-callback`;
      const cancelUrl = `${window.location.origin}/payment-cancel`;
      
      const paypalUrl = `${paypalBaseUrl}/checkoutnow?token=${orderId}&returnUrl=${encodeURIComponent(returnUrl)}&cancelUrl=${encodeURIComponent(cancelUrl)}`;
      
      alert(`请使用以下测试买家账户登录：
      邮箱：sb-6vbqu34102045@personal.example.com
      密码：请使用开发者平台提供的密码
      
      注意事项：
      1. 请确保已退出所有 PayPal 账户
      2. 建议使用无痕模式
      3. 如果遇到错误，请清除浏览器缓存后重试`);
      
      window.location.href = paypalUrl;
      
    } catch (error) {
      console.error('创建订阅失败:', error);
      let errorMessage = '创建订阅失败';
      if (error instanceof Error) {
        if (error.message.includes('PayPal Configuration Issues')) {
          errorMessage = 'PayPal 配置错误，请联系管理员';
        } else if (error.message.includes('PayPal API error')) {
          errorMessage = 'PayPal 服务暂时不可用，请稍后再试';
        } else {
          errorMessage = error.message;
        }
      }
      alert(errorMessage);
    }
  };

  if (!isSubscriptionModalOpen) return null;

  return (
    <SubscriptionPlans
      onClose={closeSubscriptionModal}
      onSubscribe={handleSubscribe}
      currentPlanId={undefined}
      themeColor={themeColor}
    />
  );
}; 