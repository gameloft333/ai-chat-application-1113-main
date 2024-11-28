import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PaymentMethodSelectorProps {
    onSelect: (method: 'stripe' | 'paypal') => void;
    themeColor: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ 
    onSelect,
    themeColor 
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col space-y-4 p-6">
            <h3 className="text-xl font-semibold text-center text-white mb-6">
                {t('payment.selectMethod')}
            </h3>
            <button
                onClick={() => onSelect('stripe')}
                className="w-full py-3 px-4 rounded-lg bg-[#635BFF] text-white hover:bg-[#4B45C6] transition-colors flex items-center justify-center space-x-2"
            >
                <span>{t('payment.stripe')}</span>
            </button>
            <button
                onClick={() => onSelect('paypal')}
                className="w-full py-3 px-4 rounded-lg text-white hover:opacity-90 transition-colors flex items-center justify-center space-x-2"
                style={{ backgroundColor: themeColor }}
            >
                <span>{t('payment.paypal')}</span>
            </button>
        </div>
    );
};