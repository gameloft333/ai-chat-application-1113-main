import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronDown } from 'lucide-react';

interface SubscriptionDropdownProps {
    planName: string;
    daysLeft: number;
    themeColor: string;
    onChangeSubscription: () => void;
}

const SubscriptionDropdown: React.FC<SubscriptionDropdownProps> = ({
    planName,
    daysLeft,
    themeColor,
    onChangeSubscription
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLanguage();

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                style={{ backgroundColor: themeColor }}
            >
                <span>{t(planName)}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
                    style={{ borderColor: themeColor }}
                >
                    <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                            {t('subscription.remaining', { days: daysLeft })}
                        </div>
                        <button
                            onClick={() => {
                                onChangeSubscription();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {t('subscription.changePlan')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionDropdown;