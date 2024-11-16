import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PayPalService } from '../services/paypal-service';
import { PaymentRecordService } from '../services/payment-record-service';
import { useAuth } from '../contexts/AuthContext';

const PaymentResult: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const handlePaymentResult = async () => {
            const token = searchParams.get('token');
            const payerId = searchParams.get('PayerID');

            if (token && payerId && currentUser) {
                try {
                    const paypalService = PayPalService.getInstance();
                    const success = await paypalService.capturePayment(token, payerId);

                    if (success) {
                        // 更新支付记录状态
                        await PaymentRecordService.updatePaymentStatus(token, 'completed');
                        alert('支付成功！');
                        navigate('/');
                    } else {
                        alert('支付失败，请重试');
                        navigate('/subscription');
                    }
                } catch (error) {
                    console.error('处理支付结果时出错:', error);
                    alert('处理支付结果时出错');
                    navigate('/subscription');
                }
            } else {
                navigate('/');
            }
        };

        handlePaymentResult();
    }, [searchParams, navigate, currentUser]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-4">正在处理支付结果...</h1>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
        </div>
    );
};

export default PaymentResult;