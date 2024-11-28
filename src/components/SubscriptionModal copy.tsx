import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { StripePaymentForm } from './StripePaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from '../config/stripe-config';
import { pricingPlans, currentCurrency } from '../config/pricing-config';
import { PaymentRecordService } from '../services/payment-record-service';
import { validatePayPalConfig, calculateExpiryDate } from '../utils/payment-utils';
import { PayPalService } from '../services/paypal-service';

const stripePromise = loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY);

interface SubscriptionModalProps {
  themeColor: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ themeColor }) => {
  const { isSubscriptionModalOpen, closeSubscriptionModal } = useSubscription();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | null>(null);

  const handlePaymentMethodSelect = (method: 'stripe' | 'paypal') => {
    setPaymentMethod(method);
  };

  const handleStripeSuccess = () => {
    alert(t('payment.stripeSuccess'));
    closeSubscriptionModal();
    window.dispatchEvent(new CustomEvent('subscription-updated'));
  };

  const handleStripeError = (error: string) => {
    alert(error);
  };

  const handleSubscribe = async (planId: string, duration: string) => {
    try {
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

      const expiredAt = calculateExpiryDate(duration);

      if (paymentMethod === 'stripe') {
        return;
      } else if (paymentMethod === 'paypal') {
        validatePayPalConfig();
        
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
          userEmail: currentUser.email || '',
          planId: planId,
          duration: duration,
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
      } else {
        throw new Error(t('alerts.error.selectPaymentMethod'));
      }
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
    <div className="modal-content">
      {!paymentMethod ? (
        <PaymentMethodSelector
          onSelect={handlePaymentMethodSelect}
          themeColor={themeColor}
        />
      ) : paymentMethod === 'stripe' ? (
        <Elements stripe={stripePromise}>
          <StripePaymentForm
            amount={pricing.price}
            currency={currentCurrency.code}
            planId={planId}
            duration={duration}
            userId={currentUser.uid}
            userEmail={currentUser.email || ''}
            onSuccess={handleStripeSuccess}
            onError={handleStripeError}
            themeColor={themeColor}
          />
        </Elements>
      ) : (
        <SubscriptionPlans
          onClose={closeSubscriptionModal}
          onSubscribe={handleSubscribe}
          currentPlanId={undefined}
          themeColor={themeColor}
        />
      )}
    </div>
  );
}; 