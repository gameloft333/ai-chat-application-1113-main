import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PayPalService } from '../services/paypal-service';
import { PaymentRecordService } from '../services/payment-record-service';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const PaymentResult: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        const handlePaymentResult = async () => {
            const token = searchParams.get('token');
            const payerId = searchParams.get('PayerID');
            const status = searchParams.get('status');

            let paymentResult = {
                status: 'error',
                message: t('payment.invalidToken')
            };

            if (token && payerId && currentUser) {
                try {
                    const paypalService = PayPalService.getInstance();
                    const success = await paypalService.capturePayment(token, payerId);

                    if (success) {
                        await PaymentRecordService.updatePaymentStatus(token, 'completed');
                        paymentResult = {
                            status: 'success',
                            message: t('payment.success')
                        };
                        await currentUser.reload();
                    } else {
                        await PaymentRecordService.updatePaymentStatus(token, 'failed');
                        paymentResult = {
                            status: 'failed',
                            message: t('payment.failed')
                        };
                    }
                } catch (error) {
                    console.error('处理支付结果时出错:', error);
                    await PaymentRecordService.updatePaymentStatus(token, 'error');
                    paymentResult = {
                        status: 'error',
                        message: t('payment.error')
                    };
                }
            } else if (status === 'CANCEL') {
                if (token) {
                    await PaymentRecordService.updatePaymentStatus(token, 'cancelled');
                }
                paymentResult = {
                    status: 'cancelled',
                    message: t('payment.cancelled')
                };
            }

            // 显示支付结果提示
            alert(paymentResult.message);

            // 导航到主页并清除状态
            navigate('/', { replace: true });
        };

        handlePaymentResult();
    }, [searchParams, navigate, currentUser, t]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-4">
                    {t('payment.processing')}
                </h1>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
        </div>
    );
};

export default PaymentResult;