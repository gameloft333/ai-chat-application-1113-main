import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements, /* StripeError */ } from '@stripe/react-stripe-js'; // StripeError can be imported if needed for more specific typing
import { useLanguage } from '../contexts/LanguageContext';
import { StripeService } from '../services/stripe-service';
import { PaymentRecord, SubscriptionDuration } from '../types/payment'; // Imported SubscriptionDuration
import { PaymentRecordService } from '../services/payment-record-service';
import { calculateExpiryDate } from '../utils/payment-utils';
import { PAYMENT_CONFIG } from '../config/payment-config';

// Helper function to map pricing plan durations to SubscriptionDuration type
// Duplicated from App.tsx for now, consider moving to a shared util
const mapToSubscriptionDuration = (pricingDuration: string): SubscriptionDuration => {
  switch (pricingDuration) {
    case '1month':
      return 'monthly';
    case '12months':
      return 'yearly';
    case '24months':
      return 'yearly'; 
    case '1week':
      return 'monthly'; 
    default:
      return 'monthly';
  }
};

interface StripePaymentFormProps {
  /** Stripe支付意向密钥，用于确认支付 */
  clientSecret: string;
  
  /** 支付金额 */
  amount: number;
  
  /** 货币类型 (例如: 'USD', 'CNY') */
  currency: string;
  
  /** 订阅计划ID (例如: 'basic', 'pro', 'premium') */
  planId: string;
  
  /** 订阅时长 (例如: '1month', '12months', '24months') */
  duration: string;
  
  /** 用户ID，用于创建支付记录 */
  userId: string;
  
  /** 用户邮箱，用于支付账单信息 */
  userEmail: string;
  
  /** 支付成功回调函数 */
  onSuccess: () => void;
  
  /** 支付错误回调函数，参数为错误信息 */
  onError: (error: string) => void;
  
  /** 关闭支付表单回调函数 */
  onClose: () => void;
  
  /** UI主题色，用于按钮等样式 */
  themeColor: string;
}

/**
 * Stripe支付表单组件
 * 
 * 用于处理信用卡支付流程，包括：
 * 1. 显示卡片输入界面
 * 2. 处理支付验证
 * 3. 创建支付记录
 * 4. 处理支付状态回调
 * 
 * @param props - 支付表单属性
 * @returns React组件
 */
export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  amount,
  currency,
  planId,
  duration,
  userId,
  userEmail,
  onSuccess,
  onError,
  onClose,
  themeColor
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  
  // 获取环境变量和支付配置
  const isProduction = import.meta.env.PROD;
  const isTestMode = PAYMENT_CONFIG.environments.stripe.testMode;

  // 只在非生产环境且为测试模式时显示测试信息
  const showTestInfo = !isProduction && isTestMode;

  useEffect(() => {
    // Extended logging
    console.log('StripePaymentForm mounted with props:', { clientSecret, amount, currency, planId, duration, userId, userEmail });
    if (!stripe) {
      console.error('Stripe.js has not loaded yet.');
    }
    if (!elements) {
      console.error('Stripe Elements has not loaded yet.');
    }
    if (!clientSecret) {
      console.error('ClientSecret is missing in StripePaymentForm.');
    }
  }, [clientSecret, amount, currency, planId, duration, userId, userEmail, stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    console.log('StripePaymentForm handleSubmit triggered.'); // Log submission attempt

    if (!stripe || !elements || !clientSecret) {
      console.error('Stripe 未初始化或缺少必要参数 (handleSubmit):', { 
        stripe: !!stripe,
        elements: !!elements,
        clientSecret: !!clientSecret 
      });
      onError(t('payment.errors.initializationFailed')); // Use translated message
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('支付表单未加载完成');
        }

        console.log(`尝试处理支付... (第 ${retryCount + 1} 次)`);
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: userEmail,
            },
          },
        });

        if (error) {
          if (error.type === 'api_connection_error') {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`连接失败，${retryCount}秒后重试...`);
              await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
              continue;
            }
          }
          console.error('支付确认错误:', error);
          
          // 首先处理测试卡在生产环境的情况
          if (error.type === 'card_error' && error.decline_code === 'live_mode_test_card') {
            const errorMessage = t('payment.errors.liveTestCard');
            setErrorMessage(errorMessage);
            onError(errorMessage);
            setIsProcessing(false);
            return;
          }
          
          // 处理其他错误类型
          let userErrorMessage = t('payment.errors.processingFailed');
          if (error.type === 'card_error') {
            switch (error.code) {
              case 'card_declined':
                userErrorMessage = t('payment.errors.cardDeclined');
                break;
              default:
                userErrorMessage = t('payment.errors.cardValidationFailed');
            }
          } else if (error.type === 'api_connection_error') {
            userErrorMessage = t('payment.errors.connectionFailed');
          }
          
          throw new Error(userErrorMessage);
        }

        if (paymentIntent.status === 'succeeded') {
          console.log('支付成功，创建支付记录...');
          try {
            // 支付记录创建
            await PaymentRecordService.createPaymentRecord({
              uid: userId,
              userEmail,
              planId,
              duration: mapToSubscriptionDuration(duration), // Mapped duration
              orderId: paymentIntent.id,
              amount,
              currency,
              status: 'completed',
              createdAt: new Date(),
              expiredAt: calculateExpiryDate(duration),
              paymentChannel: 'stripe',
              paymentAccount: userEmail
            });
            
            console.log('支付记录创建成功，订单ID:', paymentIntent.id);
          } catch (error) {
            console.error('支付记录创建失败:', {
              error,
              userId,
              paymentIntentId: paymentIntent.id,
              timestamp: new Date().toISOString()
            });
            
            // 添加重试机制
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
              try {
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                await PaymentRecordService.createPaymentRecord({
                  uid: userId,
                  userEmail,
                  planId,
                  duration: mapToSubscriptionDuration(duration), // Mapped duration
                  orderId: paymentIntent.id,
                  amount,
                  currency,
                  status: 'completed',
                  createdAt: new Date(),
                  expiredAt: calculateExpiryDate(duration),
                  paymentChannel: 'stripe',
                  paymentAccount: userEmail
                });
                console.log('支付记录重试创建成功');
                break;
              } catch (retryError) {
                retryCount++;
                console.error(`支付记录重试失败 (${retryCount}/${maxRetries}):`, retryError);
                if (retryCount === maxRetries) {
                  // 达到最大重试次数，记录错误但不中断支付流程
                  console.error('支付记录创建达到最大重试次数，将继续处理支付流程');
                }
              }
            }
          }
          
          console.log('支付记录创建成功，调用成功回调...');
          onSuccess();
          break;
        } else {
          throw new Error('支付未完成');
        }
      } catch (error: any) { // Typed error as any for now
        if (retryCount === maxRetries - 1) {
          console.error('支付处理错误:', error);
          const specificError = error as { type?: string; message?: string }; // Type assertion for more specific error properties
          const errorMessage = specificError.type === 'api_connection_error' 
            ? t('payment.errors.connectionFailed') // Use translated message
            : (specificError.message || t('payment.errors.processingFailed')); // Use translated message
          setErrorMessage(errorMessage);
          onError(errorMessage);
        }
      }
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-6">
      <h2 className="text-xl font-semibold mb-4">{t('payment.paymentConfirmTitle')}</h2>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('payment.cardInput')}
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: 'currentColor',
                '::placeholder': {
                  color: '#6B7280',
                },
              },
              invalid: {
                color: '#EF4444',
              },
            },
            hidePostalCode: false,
          }}
          className="w-full p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 
            border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 
            transition-all duration-200"
        />
      </div>
      
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
          {t(`payment.errors.${errorMessage}`) !== `payment.errors.${errorMessage}` ? t(`payment.errors.${errorMessage}`) : errorMessage}
        </div>
      )}
      
      {/* 仅在非生产环境且测试模式时显示测试信息 */}
      {showTestInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            {t('payment.testMode.notice')}
            <br />
            {Object.entries({
              cardNumber: '4242 4242 4242 4242',
              expiry: '12/25',
              cvc: '123',
              postal: '12345'
            }).map(([key, value]) => (
              <React.Fragment key={key}>
                {t(`payment.testMode.${key}`)}: {value}
                <br />
              </React.Fragment>
            ))}
          </p>
        </div>
      )}
      
      <div className="flex gap-4 mt-8">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-12 rounded-lg font-medium 
            bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 
            dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200
            transition-all duration-200"
        >
          {t('payment.cancel')}
        </button>
        
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          style={{ backgroundColor: themeColor }}
          className={`
            flex-1 h-12 rounded-lg font-medium
            flex items-center justify-center gap-2
            ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}
            disabled:opacity-50 disabled:cursor-not-allowed
            text-white transition-all duration-200
          `}
        >
          {isProcessing ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              {t('payment.processing')}
            </>
          ) : (
            <>
              <span>{t('payment.payAction')}</span>
              <span className="font-medium">
                {t('payment.amount').replace('{{amount}}', String(amount)).replace('{{currency}}', currency)}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};