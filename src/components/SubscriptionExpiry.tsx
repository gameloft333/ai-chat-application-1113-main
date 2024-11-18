import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SubscriptionExpiryProps {
    expiredAt: Date;
    themeColor: string;
}

const SubscriptionExpiry: React.FC<SubscriptionExpiryProps> = ({ expiredAt, themeColor }) => {
    const { t } = useLanguage();

    const calculateTimeLeft = () => {
        const now = new Date();
        const diffTime = expiredAt.getTime() - now.getTime();
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return { days, hours };
    };

    const { days, hours } = calculateTimeLeft();

    return (
        <div className="absolute right-4 -bottom-8">
            <span
                className="text-sm font-medium"
                style={{ color: themeColor }}
            >
                {t('subscription.timeLeft', { days, hours })}
            </span>
        </div>
    );
};

export default SubscriptionExpiry;