import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { StripeLinkService } from '../services/stripe-link-service';
import { useAuth } from '../contexts/AuthContext';

export const StripeSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const planId = searchParams.get('planId');
        const duration = searchParams.get('duration');

        if (!sessionId || !planId || !duration || !currentUser) {
          throw new Error('Missing required parameters');
        }

        const stripeLinkService = StripeLinkService.getInstance();
        await stripeLinkService.handlePaymentSuccess(
          planId,
          duration,
          currentUser.uid,
          currentUser.email || '',
          sessionId
        );

        navigate('/payment-success');
      } catch (error) {
        console.error('处理支付成功回调失败:', error);
        navigate('/payment-error');
      }
    };

    handleSuccess();
  }, [searchParams, navigate, currentUser]);

  return <div>处理支付结果中...</div>;
}; 