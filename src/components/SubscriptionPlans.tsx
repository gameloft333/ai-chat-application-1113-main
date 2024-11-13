import React, { useState } from 'react';
import { pricingPlans, currentCurrency } from '../config/pricing-config';
import { Check, X } from 'lucide-react';

interface SubscriptionPlansProps {
  onClose: () => void;
  onSubscribe: (planId: string, duration: string) => void;
  isPaidUser?: boolean;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onClose, onSubscribe, isPaidUser = false }) => {
  const [selectedDuration, setSelectedDuration] = useState(isPaidUser ? '12months' : '1week');
  const [selectedPlan, setSelectedPlan] = useState(isPaidUser ? 'pro' : 'trial');

  // 根据用户状态过滤显示的时长选项
  const availableDurations = pricingPlans.durations.filter(duration => 
    isPaidUser ? !duration.trialOnly : true
  );

  // 获取可显示的套餐列表
  const getAvailablePlans = () => {
    const regularPlans = pricingPlans.plans;
    if (!isPaidUser) {
      // 非付费用户可以看到所有套餐（包括体验套餐）
      return [pricingPlans.trialPlan, ...regularPlans];
    }
    // 付费用户只能看到常规套餐
    return regularPlans;
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
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
        {plans.map(plan => {
          const pricing = getPlanPricing(plan, selectedDuration);
          if (!pricing) return null; // 如果没有对应的价格方案，不显示该选项
          
          const isSelected = selectedPlan === plan.id;
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
              {isSelected && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm">
                    最受欢迎
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(pricing.price)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {plan.id === 'trial' ? '/周' : '/月'}
                  </span>
                </div>
                {pricing.save > 0 && (
                  <div className="text-green-500 text-sm mt-1">
                    节省 {pricing.save}%
                  </div>
                )}
                {pricing.extraMonths > 0 && (
                  <div className="text-indigo-500 text-sm mt-1">
                    额外赠送 {pricing.extraMonths} 个月
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300">{feature}</span>
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
                {isDisabled ? '不可订阅' : '立即订阅'}
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">选择会员方案</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">解锁全部高级功能，享受完整AI陪伴体验</p>
        </div>

        {!isPaidUser && (
          <div className="flex justify-center gap-2 mb-8">
            {availableDurations.map(duration => (
              <button
                key={duration.id}
                onClick={() => setSelectedDuration(duration.id)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedDuration === duration.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {duration.label}
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