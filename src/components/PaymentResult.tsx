import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PayPalService } from '../services/paypal-service';
import { PaymentRecordService } from '../services/payment-record-service';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const PaymentResult: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        const handlePaymentResult = async () => {
            try {
                if (!currentUser) {
                    throw new Error('用户未登录');
                }

                const token = searchParams.get('token');
                if (!token) {
                    throw new Error(t('payment.invalidToken'));
                }

                // 获取支付记录
                const record = await PaymentRecordService.getPaymentRecordByOrderId(token);
                if (!record) {
                    throw new Error('支付记录不存在');
                }

                // 验证用户身份
                if (record.uid !== currentUser.uid) {
                    throw new Error('无效的支付记录');
                }

                // 根据支付渠道获取支付详情
                if (record.paymentChannel === 'paypal') {
                    const paypalService = PayPalService.getInstance();
                    const paymentDetails = await paypalService.getPaymentDetails(token);
                    
                    if (paymentDetails) {
                        await PaymentRecordService.updatePaymentWithAccountInfo(
                            token,
                            paymentDetails.payerEmail,
                            'paypal',
                            'completed'
                        );
                    }
                }

                navigate('/', {
                    replace: true,
                    state: { 
                        paymentStatus: 'success',
                        message: t('payment.success')
                    }
                });
            } catch (error) {
                console.error('支付处理错误:', error);
                navigate('/', {
                    replace: true,
                    state: { 
                        paymentStatus: 'error',
                        message: t('payment.error')
                    }
                });
            }
        };

        handlePaymentResult();
    }, [currentUser, searchParams, navigate, t]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-lg">{t('payment.processing')}</p>
        </div>
    );
};

export default PaymentResult;