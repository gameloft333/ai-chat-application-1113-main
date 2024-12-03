import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PaymentRecordService } from '../services/payment-record-service';
import { PayPalService } from '../services/paypal-service';
import { TonService } from '../services/ton-service';
import { useTranslation } from 'react-i18next';

export const PaymentResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState<string>('正在处理支付结果...');
  const { t } = useTranslation();

  useEffect(() => {
    const handlePaymentResult = async () => {
      try {
        // 从 URL 获取支付相关参数
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const payerId = urlParams.get('PayerID');

        if (!token || !payerId) {
          // 如果没有支付参数，检查是否是从状态传递的消息
          const state = location.state as { paymentStatus?: string; message?: string };
          if (state?.message) {
            setMessage(state.message);
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 3000);
            return;
          }
          throw new Error('支付信息不完整');
        }

        if (!currentUser) {
          throw new Error('请先登录');
        }

        // 获取支付记录状态
        const paymentRecord = await PaymentRecordService.getPaymentRecordByOrderId(token);
        
        if (!paymentRecord) {
          throw new Error('未找到支付记录');
        }

        // 验证支付状态
        const paypalService = PayPalService.getInstance();
        console.log('Capturing payment...');
        const paymentSuccess = await paypalService.capturePayment(token, payerId);

        if (!paymentSuccess) {
          throw new Error('支付未完成，请重试');
        }

        // 获取支付详情
        const paymentDetails = await paypalService.getPaymentDetails(token);
        
        // 更新支付记录
        await PaymentRecordService.updatePaymentWithAccountInfo(
          token,
          paymentDetails?.payerEmail || '',
          'paypal',
          'completed'
        );

        // 获取订阅信息
        const subscription = await PaymentRecordService.getPaymentRecordByOrderId(token);
        if (subscription) {
          const now = new Date();
          const expiredAt = new Date(subscription.expiredAt);
          const remainingDays = Math.ceil((expiredAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          setMessage(`支付成功！
            到期日期：${expiredAt.toLocaleDateString('zh-CN')}
            剩余天数：${remainingDays} 天
            
            您现在可以享受所有会员特权了！`);

          // 触发支付成功事件
          await PaymentRecordService.handlePaymentSuccess(token, paymentDetails?.payerEmail || '');

          // 3秒后返回首页
          setTimeout(() => {
            navigate('/', { 
              replace: true,
              state: { 
                paymentStatus: 'success',
                message: '支付成功！'
              }
            });
          }, 3000);
        }
      } catch (error) {
        console.error('处理支付结果失败:', error);
        setMessage(error instanceof Error ? error.message : '处理支付时出现错误，请联系客服');
        
        // 3秒后返回首页
        setTimeout(() => {
          navigate('/', { 
            replace: true,
            state: { 
              paymentStatus: 'error',
              message: '支付失败，请重试'
            }
          });
        }, 3000);
      }
    };

    handlePaymentResult();
  }, [navigate, currentUser, location]);

  const handleTonPaymentResult = async (paymentId: string) => {
    try {
      const tonService = TonService.getInstance();
      const result = await tonService.getPaymentDetails(paymentId);
      
      if (result.status === 'success') {
        const subscription = await PaymentRecordService.getPaymentRecordByOrderId(paymentId);
        if (subscription) {
          const now = new Date();
          const expiredAt = new Date(subscription.expiredAt);
          const remainingDays = Math.ceil((expiredAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          setMessage(t('payment.ton.successDetails', {
            expireDate: expiredAt.toLocaleDateString(),
            remainingDays: remainingDays
          }));

          setTimeout(() => {
            navigate('/', { 
              replace: true,
              state: { 
                paymentStatus: 'success',
                message: t('payment.ton.success')
              }
            });
          }, 3000);
        }
      } else {
        throw new Error(t('payment.ton.failed'));
      }
    } catch (error) {
      console.error('处理 TON 支付结果失败:', error);
      setMessage(error instanceof Error ? error.message : t('payment.ton.error'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">支付结果</h2>
          <p className="text-gray-600 whitespace-pre-line">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;