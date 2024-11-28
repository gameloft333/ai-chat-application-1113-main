import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLanguage } from '../contexts/LanguageContext';
import { StripeService } from '../services/stripe-service';
import { PaymentRecord } from '../types/payment';
import { PaymentRecordService } from '../services/payment-record-service';
import { calculateExpiryDate } from '../utils/payment-utils';

interface StripePaymentFormProps {
  amount: number;
  currency: string;
  planId: string;
  duration: string;
  userId: string;
  userEmail: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  themeColor: string;
}

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
  themeColor
}) => {
  const { t } = useLanguage();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    console.log('StripePaymentForm mounted with:', { clientSecret, amount, currency });
  }, [clientSecret, amount, currency]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      console.error('Stripe 未初始化或缺少必要参数:', { stripe, elements, clientSecret });
      onError('支付服务初始化失败');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('支付表单未加载完成');
      }

      console.log('开始处理支付...');
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: userEmail,
          },
        },
      });

      if (error) {
        console.error('支付确认错误:', error);
        throw error;
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('支付成功，创建支付记录...');
        await PaymentRecordService.createPaymentRecord({
          uid: userId,
          userEmail,
          planId,
          duration,
          orderId: paymentIntent.id,
          amount,
          currency,
          status: 'completed',
          createdAt: new Date(),
          expiredAt: calculateExpiryDate(duration),
          paymentChannel: 'stripe',
          paymentAccount: userEmail
        });
        
        console.log('支付记录创建成功，调用成功回调...');
        onSuccess();
      } else {
        throw new Error('支付未完成');
      }
    } catch (error) {
      console.error('支付处理错误:', error);
      const errorMessage = error instanceof Error ? error.message : '支付处理失败';
      setErrorMessage(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg space-y-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
            hidePostalCode: false,
          }}
        />
      </div>
      
      {errorMessage && (
        <div className="text-red-500 text-sm">
          {errorMessage === 'Your postal code is incomplete.' ? '请输入完整的邮政编码' : errorMessage}
        </div>
      )}
      
      <div className="text-sm text-gray-500">
        测试卡号：4242 4242 4242 4242
        <br />
        有效期：任意未来日期（如：12/25）
        <br />
        CVC：任意三位数（如：123）
        <br />
        邮编：任意五位数（如：12345）
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-2 px-4 rounded-lg text-white ${
          isProcessing ? 'bg-gray-400' : `bg-[${themeColor}]`
        }`}
      >
        {isProcessing ? '处理中...' : `支付 ${amount} ${currency}`}
      </button>
    </form>
  );
};