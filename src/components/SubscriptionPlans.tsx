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

  // 获取可用的时长选项
  const getAvailableDurations = () => {
    return pricingPlans.durations;
  };

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

  // 获取套餐价格显示
  const getPlanPricing = (plan: any, duration: string) => {
    return plan.prices[duration];
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

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="relative bg-[#1E1F23] rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 标题区域 */}
        <div className="text-center pt-12 pb-8 px-6">
          <h2 className="text-3xl font-bold text-white mb-3">
            {t('subscription.title')}
          </h2>
          <p className="text-gray-400">{t('subscription.subtitle')}</p>
        </div>

        {/* 时长选择 */}
        <div className="flex justify-center gap-4 mb-10">
          {getAvailableDurations().map(duration => (
            <button
              key={duration.id}
              onClick={() => setSelectedDuration(duration.id)}
              className={`px-8 py-3 rounded-full transition-all ${
                selectedDuration === duration.id
                  ? 'bg-[#FF4B91] text-white shadow-lg shadow-pink-500/20'
                  : 'bg-[#27282D] text-gray-400 hover:bg-[#2C2D33] hover:text-gray-200'
              }`}
            >
              {t(`subscription.duration.${duration.id}`)}
            </button>
          ))}
        </div>

        {/* 套餐卡片容器 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
          {getAvailablePlans().map(plan => {
            const pricing = getPlanPricing(plan, selectedDuration);
            const isPopular = plan === calculateMostPopularPlan(getAvailablePlans(), selectedDuration);
            
            return (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative bg-[#27282D] rounded-2xl p-6 cursor-pointer transition-all hover:bg-[#2C2D33] ${
                  plan.id === selectedPlan ? 'ring-2 ring-[#FF4B91]' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#FF4B91] text-white px-3 py-1 rounded-full text-sm">
                      {t('subscription.popular')}
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {t(plan.name)}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {t(plan.description)}
                </p>

                {pricing && (
                  <div className="flex items-baseline mb-6">
                    <span className="text-3xl font-bold text-white">
                      {currentCurrency.symbol}{pricing.price}
                    </span>
                    <span className="text-gray-400 ml-2">
                      {selectedDuration === '1week' ? t('subscription.perWeek') : t('subscription.perMonth')}
                    </span>
                  </div>
                )}

                <ul className="space-y-3 mb-6">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center text-gray-300">
                      <Check className="w-5 h-5 text-[#FF4B91] mr-2" />
                      <span>{t(feature)}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSubscribe(plan.id, selectedDuration)}
                  className="w-full py-3 rounded-xl bg-[#FF4B91] text-white font-medium hover:bg-[#FF3381] transition-colors"
                >
                  {t('subscription.subscribe')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;