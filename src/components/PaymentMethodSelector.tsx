import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SocketService } from '../services/socket-service';
import logger from '../utils/logger';
import { PAYMENT_CONFIG } from '../config/payment-config';
import { PaymentChannel } from '../types/payment';
import { PaymentRecordService } from '../services/payment-record-service';

interface PaymentMethodSelectorProps {
    onSelect: (method: 'stripe' | 'paypal') => void;
    themeColor: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ 
    onSelect,
    themeColor 
}) => {
    const { t } = useLanguage();
    const [error, setError] = useState<string>('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // 检查支付方式是否启用
        const enabledMethods = PAYMENT_CONFIG.getEnabledMethods();
        logger.debug('启用的支付方式:', enabledMethods);
        setIsVisible(enabledMethods.length > 0);
    }, []);

    const handleMethodSelect = async (method: 'stripe' | 'paypal') => {
        logger.debug('选择支付方式:', method);
        try {
            // 检查支付方式是否启用
            if (!PAYMENT_CONFIG.enabledMethods[method]) {
                throw new Error(t('payment.methodDisabled'));
            }

            // 检查Socket连接状态
            const socket = SocketService.getSocket();
            logger.debug('Socket连接状态:', {
                connected: socket?.connected,
                id: socket?.id
            });

            if (!socket?.connected) {
                logger.error('Socket未连接');
                throw new Error(t('payment.connectionError'));
            }

            // 调用选择方法
            onSelect(method);
        } catch (error) {
            logger.error('支付方法选择失败:', error);
            setError(error instanceof Error ? error.message : t('payment.unknownError'));
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex flex-col space-y-4 p-6">
                    {error && (
                        <div className="text-red-500 text-center mb-4">
                            {error}
                        </div>
                    )}
                    <h3 className="text-xl font-semibold text-center text-white mb-6">
                        {t('payment.selectMethod')}
                    </h3>
                    {PAYMENT_CONFIG.enabledMethods.stripe && (
                        <button
                            onClick={() => handleMethodSelect('stripe')}
                            className="w-full py-3 px-4 rounded-lg bg-[#635BFF] text-white hover:bg-[#4B45C6] transition-colors"
                        >
                            {t('payment.stripe')}
                        </button>
                    )}
                    {PAYMENT_CONFIG.enabledMethods.paypal && (
                        <button
                            onClick={() => handleMethodSelect('paypal')}
                            className="w-full py-3 px-4 rounded-lg text-white hover:opacity-90 transition-colors"
                            style={{ backgroundColor: themeColor }}
                        >
                            {t('payment.paypal')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};