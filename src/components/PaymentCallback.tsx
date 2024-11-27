import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayPalService } from '../services/paypal-service';
import { PaymentRecordService } from '../services/payment-record-service';
import { useAuth } from '../contexts/AuthContext';

export const PaymentCallback: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // 从 URL 获取支付相关参数
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const payerId = urlParams.get('PayerID');

        if (!token || !payerId || !currentUser) {
          throw new Error('Missing payment information');
        }

        // 验证支付状态
        const paypalService = PayPalService.getInstance();
        const success = await paypalService.capturePayment(token, payerId);

        if (success) {
          // 获取支付详情
          const paymentDetails = await paypalService.getPaymentDetails(token);
          
          // 更新支付记录
          await PaymentRecordService.updatePaymentWithAccountInfo(
            token,
            paymentDetails?.payerEmail || '',
            'paypal',
            'completed'
          );

          // 触发支付成功事件
          window.dispatchEvent(new CustomEvent('payment-success'));

          // 导航到成功页面
          navigate('/payment-success', {
            state: { 
              paymentStatus: 'success',
              message: '支付成功！'
            }
          });
        } else {
          throw new Error('Payment capture failed');
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        navigate('/', {
          state: { 
            paymentStatus: 'error',
            message: '支付失败，请重试'
          }
        });
      }
    };

    handlePaymentCallback();
  }, [navigate, currentUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">正在处理支付...</h2>
        <p className="text-gray-600">请稍候，不要关闭此页面</p>
      </div>
    </div>
  );
}; 