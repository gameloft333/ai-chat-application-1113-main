import React, { useState } from 'react';
import { pricingPlans, currentCurrency } from '../config/pricing-config';
import { Check, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SubscriptionPlansProps {
  onClose: () => void;
  onSubscribe: (planId: string, duration: string) => void;
  isPaidUser?: boolean;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onClose, onSubscribe, isPaidUser = false }) => {
  const { t } = useLanguage();

  // 获取可显示的套餐列表
  const getAvailablePlans = () => {
    const regularPlans = pricingPlans.plans;
    if (!isPaidUser) {
      return [pricingPlans.trialPlan, ...regularPlans];
    }
    return regularPlans;
  };

  // 获取最大优惠的套餐和时长
  const getMaxDiscountPlan = () => {
    const allPlans = getAvailablePlans();
    let maxDiscount = 0;
    let maxDiscountPlan = null;
    let maxDiscountDuration = '';

    allPlans.forEach(plan => {
      Object.entries(plan.prices).forEach(([duration, pricing]) => {
        if (pricing.save > maxDiscount) {
          maxDiscount = pricing.save;
          maxDiscountPlan = plan;
          maxDiscountDuration = duration;
        }
      });
    });

    return {
      planId: maxDiscountPlan?.id || (isPaidUser ? 'pro' : 'trial'),
      duration: maxDiscountDuration || (isPaidUser ? '12months' : '1week')
    };
  };

  const defaultSelection = getMaxDiscountPlan();
  const [selectedDuration, setSelectedDuration] = useState(defaultSelection.duration);
  const [selectedPlan, setSelectedPlan] = useState(defaultSelection.planId);

  // 获取可用的时长选项
  const getAvailableDurations = () => {
    return pricingPlans.durations.filter(duration => {
      if (isPaidUser) {
        return !duration.trialOnly;
      }
      return true;
    });
  };

  // 计算最受欢迎的套餐
  const calculateMostPopularPlan = (plans: any[], duration: string) => {
    // 首先检查是否有任何套餐在当前时长下有折扣
    const hasAnyDiscount = plans.some(plan => {
      const pricing = plan.prices[duration];
      return pricing && pricing.save > 0;
    });

    if (hasAnyDiscount) {
      // 如果有折扣，选择折扣最大的套餐
      return plans.reduce((popular, current) => {
        const currentPrice = current.prices[duration]?.price || 0;
        const currentSave = current.prices[duration]?.save || 0;
        const popularPrice = popular.prices[duration]?.price || 0;
        const popularSave = popular.prices[duration]?.save || 0;

        if (currentSave > popularSave) {
          return current;
        } else if (currentSave === popularSave && currentPrice > popularPrice) {
          return current;
        }
        return popular;
      });
    } else {
      // 如果没有折扣，选择价格居中的套餐
      const availablePlans = plans.filter(plan => plan.prices[duration]);
      const sortedPlans = availablePlans.sort((a, b) => 
        (a.prices[duration]?.price || 0) - (b.prices[duration]?.price || 0)
      );
      
      // 选择中间的套餐
      const middleIndex = Math.floor(sortedPlans.length / 2);
      return sortedPlans[middleIndex];
    }
  };

  const getPlanPricing = (plan: any, duration: string) => {
    // 如果是体验套餐，只返回一周的价格
    if (plan.id === 'trial') {
      return plan.prices['1week'];
    }
    // 其他套餐返回对应时长的价格
    return plan.prices[duration];
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatPrice = (price: number) => {
    const { symbol, position } = currentCurrency;
    return position === 'before' ? `${symbol}${price}` : `${price}${symbol}`;
  };

  const renderPlans = () => {
    const plans = getAvailablePlans();
    const mostPopularPlan = calculateMostPopularPlan(plans, selectedDuration);

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
        {plans.map(plan => {
          const pricing = getPlanPricing(plan, selectedDuration);
          if (!pricing) return null; // 如果没有对应的价格方案，不显示该选项
          
          const isPopular = plan === mostPopularPlan;
          const isSelected = plan.id === selectedPlan;
          const isDisabled = isPaidUser && plan.id === 'trial';
          
          return (
            <div
              key={plan.id}
              onClick={() => !isDisabled && setSelectedPlan(plan.id)}
              className={`relative rounded-2xl p-6 cursor-pointer transition-all min-h-[520px] flex flex-col ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 
                isSelected
                  ? 'border-2 border-indigo-500 shadow-lg transform scale-105'
                  : 'border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm">
                    {t('subscription.popular')}
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t(plan.name)}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t(plan.description)}</p>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(pricing.price)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {t(`subscription.${plan.id === 'trial' ? 'perWeek' : 'perMonth'}`)}
                  </span>
                </div>
                {pricing.save > 0 && (
                  <div className="text-green-500 text-sm mt-1">
                    {t('subscription.save')} {pricing.save}%
                  </div>
                )}
                {pricing.extraMonths > 0 && (
                  <div className="text-indigo-500 text-sm mt-1">
                    {t('subscription.extraMonths')} {pricing.extraMonths} {t('subscription.months')}
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">{t(feature)}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDisabled) {
                    onSubscribe(plan.id, selectedDuration);
                  }
                }}
                disabled={isDisabled}
                className={`w-full py-2 px-4 rounded-lg transition-colors mt-auto ${
                  isDisabled ? 'bg-gray-300 cursor-not-allowed' :
                  isSelected
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {isDisabled ? t('subscription.notAvailable') : t('subscription.subscribe')}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOutsideClick}
    >
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('subscription.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('subscription.subtitle')}</p>
        </div>

        {!isPaidUser && (
          <div className="flex justify-center gap-2 mb-8">
            {getAvailableDurations().map(duration => (
              <button
                key={duration.id}
                onClick={() => setSelectedDuration(duration.id)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedDuration === duration.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {t(`subscription.duration.${duration.id}`)}
              </button>
            ))}
          </div>
        )}

        {renderPlans()}
      </div>
    </div>
  );
};

export default SubscriptionPlans;