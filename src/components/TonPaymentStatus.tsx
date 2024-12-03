import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TonService } from '../services/TonService';
import { PaymentRecordService } from '../services/PaymentRecordService';

interface TonPaymentStatusProps {
  paymentId: string;
  onError: (error: string) => void;
}

export const TonPaymentStatus: React.FC<TonPaymentStatusProps> = ({ 
  paymentId, 
  onError 
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  useEffect(() => {
    let hasRedirected = false;
    
    const checkPaymentStatus = async () => {
      try {
        const tonService = TonService.getInstance();
        const result = await tonService.checkPaymentStatus(paymentId);
        console.log('支付状态检查:', result);
        
        if (result.status === 'success') {
          setStatus('success');
          await PaymentRecordService.handlePaymentSuccess(paymentId, result.walletAddress);
          
          if (!hasRedirected) {
            hasRedirected = true;
            setTimeout(() => {
              navigate('/payment-result', {
                state: { 
                  status: 'success',
                  paymentId,
                  paymentMethod: 'ton'
                }
              });
            }, 2000);
          }
        } else if (result.status === 'failed') {
          setStatus('failed');
          onError(t('payment.ton.failed'));
        }
      } catch (error) {
        console.error('检查支付状态失败:', error);
        setStatus('failed');
        onError(t('payment.ton.error'));
      }
    };

    const intervalId = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(intervalId);
  }, [paymentId, navigate, t, onError]);

  return null; // 状态检查组件不需要UI
}; 