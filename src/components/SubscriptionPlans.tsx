import React, { useState, useEffect } from 'react';
import { pricingPlans, currentCurrency } from '../config/pricing-config';
import { Check, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PaymentRecord } from '../types/payment';
import { PaymentRecordService } from '../services/payment-record-service';
import { SubscriptionModal } from './SubscriptionModal';
import { SUBSCRIPTION_CONFIG } from '../config/subscription-config';
import { PAYMENT_CONFIG } from '../config/payment-config';
import { StripeLinkService } from '../services/stripe-link-service';

interface SubscriptionPlansProps {
  onClose: () => void;
  onSubscribe: (planId: string, duration: string, method: 'paypal' | 'stripe' | 'ton') => void;
  currentPlanId?: string;
  themeColor: string;
  userEmail?: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onClose, onSubscribe, currentPlanId, themeColor, userEmail }) => {
  const { t } = useLanguage();
  const [currentSubscription, setCurrentSubscription] = useState<PaymentRecord | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Array<'paypal' | 'stripe' | 'ton'>>([]);
  
  // 获取最大优惠的套餐和时长
  const getMaxDiscountPlan = () => {
    const allPlans = pricingPlans.plans;
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
      planId: maxDiscountPlan?.id || (currentPlanId ? 'pro' : 'trial'),
      duration: maxDiscountDuration || (currentPlanId ? '12months' : '1week')
    };
  };

  const defaultSelection = getMaxDiscountPlan();
  const [selectedDuration, setSelectedDuration] = useState(defaultSelection.duration);
  const [selectedPlan, setSelectedPlan] = useState(defaultSelection.planId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanInfo, setSelectedPlanInfo] = useState<{
    planId: string;
    duration: string;
  } | null>(null);

  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      if (userEmail) {
        try {
          const subscription = await PaymentRecordService.getActiveSubscriptionByEmail(userEmail);
          setCurrentSubscription(subscription);
        } catch (error) {
          console.error('获取当前订阅失败:', error);
        }
      }
    };

    fetchCurrentSubscription();
  }, [userEmail]);

  
  // 在显示支付模态框时获取启用的支付方式
  useEffect(() => {
    if (showPaymentModal) {
      const enabledMethods = PAYMENT_CONFIG.getEnabledMethods();
      setPaymentMethods(enabledMethods.sort(() => Math.random() - 0.5)); // 在显示支付模态框时随机排序支付方式
    }
  }, [showPaymentModal]);

  useEffect(() => {
    console.log('状态更新:', {
      showPaymentModal,
      selectedPlanInfo
    });
  }, [showPaymentModal, selectedPlanInfo]);

  // 获取可用的时长选项
  const getAvailableDurations = () => {
    return pricingPlans.durations.filter(duration => 
      SUBSCRIPTION_CONFIG.durationTabs[duration.id]
    );
  };

  // 获取可显示的套餐列表
  const getAvailablePlans = () => {
    const regularPlans = pricingPlans.plans;
    if (!currentPlanId) {
      return [pricingPlans.trialPlan, ...regularPlans];
    }
    return regularPlans;
  };

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

  // 判断是否是当前套餐
  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.planId === planId;
  };

  const getPlanName = (plan: any, duration: string) => {
    if (plan.id === 'trial') {
      return t('memberLevel.trial');
    }
    
    const levelMap = {
      '1month': {
        'basic': 'memberLevel.basic',
        'pro': 'memberLevel.pro',
        'premium': 'memberLevel.premium'
      },
      '12months': {
        'basic': 'memberLevel.excellent',
        'pro': 'memberLevel.flagship',
        'premium': 'memberLevel.legendary'
      },
      '24months': {
        'basic': 'memberLevel.noble',
        'pro': 'memberLevel.peak',
        'premium': 'memberLevel.invincible'
      }
    };

    return t(levelMap[duration]?.[plan.id] || plan.name);
  };

  const handlePlanSelect = async (planId: string) => {
    console.log('选择套餐:', planId); // 添加日志
    
    try {
      setSelectedPlanInfo({
        planId,
        duration: selectedDuration
      });
      console.log('设置选中套餐信息:', { planId, duration: selectedDuration }); // 添加日志
      
      setShowPaymentModal(true);
      console.log('显示支付模态框状态:', true); // 添加日志
    } catch (error) {
      console.error('选择套餐失败:', error);
      alert(error instanceof Error ? error.message : '选择套餐失败');
    }
  };

  const handlePaymentSelect = async (method: 'paypal' | 'stripe' | 'ton') => {
    console.log('选择支付方式:', method); // 添加日志
    if (!selectedPlanInfo) {
      console.error('未选择套餐信息'); // 添加日志
      return;
    }
    
    try {
      console.log('调用订阅函数，参数:', {
        planId: selectedPlanInfo.planId,
        duration: selectedPlanInfo.duration,
        method
      }); // 添加日志
      
      await onSubscribe(selectedPlanInfo.planId, selectedPlanInfo.duration, method);
      setShowPaymentModal(false);
    } catch (error) {
      console.error('支付失败:', error);
      alert(error instanceof Error ? error.message : '支付失败，请重试');
    }
  };

  // 添加防止冒泡
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // 添加函数来过滤显示的套餐
  const getFilteredPlans = (duration: string) => {
    console.log('当前选择的时长:', duration); // 调试日志
    
    let availablePlans = [];
    
    if (duration === '1week') {
      // 如果是一周套餐，添加试用套餐
      if (pricingPlans.trialPlan && pricingPlans.trialPlan.prices['1week']) {
        availablePlans.push(pricingPlans.trialPlan);
      }
    }
    
    // 添加其他有对应时长价格的套餐
    pricingPlans.plans.forEach(plan => {
      if (plan.prices[duration]) {
        availablePlans.push(plan);
      }
    });
    
    console.log('可用套餐:', availablePlans); // 调试日志
    return availablePlans;
  };

  const availablePlans = getFilteredPlans(selectedDuration);
  console.log('Available plans:', availablePlans);

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#1E1F23] rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={handleModalClick}
      >
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
                  ? 'text-white shadow-lg'
                  : 'bg-[#27282D] text-gray-400 hover:bg-[#2C2D33] hover:text-gray-200'
              }`}
              style={{
                backgroundColor: selectedDuration === duration.id ? themeColor : undefined
              }}
            >
              {t(`subscription.duration.${duration.id}`)}
            </button>
          ))}
        </div>

        {/* 套餐卡片容器 */}
        <div className="flex justify-center p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {getFilteredPlans(selectedDuration).map(plan => {
              const pricing = getPlanPricing(plan, selectedDuration);
              const isPopular = plan === calculateMostPopularPlan(getAvailablePlans(), selectedDuration);
              const isPlanCurrent = isCurrentPlan(plan.id);
              
              return (
                <div 
                  key={plan.id}
                  onClick={() => !isPlanCurrent && setSelectedPlan(plan.id)}
                  className={`relative bg-[#27282D] rounded-2xl p-6 transition-all 
                    ${!isPlanCurrent ? 'cursor-pointer hover:bg-[#2C2D33]' : 'cursor-default'} 
                    ${plan.id === selectedPlan ? 'ring-2' : ''}`}
                  style={{
                    ...(plan.id === selectedPlan && { ringColor: themeColor })
                  }}
                >
                  {isPopular && !isPlanCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="text-white px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: themeColor }}>
                        {t('subscription.popular')}
                      </span>
                    </div>
                  )}
                  
                  {isPlanCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        {t('subscription.currentPlan')}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-white mb-2">
                    {getPlanName(plan, selectedDuration)}
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
                        <Check className="w-5 h-5 mr-2" style={{ color: themeColor }} />
                        <span>{t(feature)}</span>
                      </li>
                    ))}
                  </ul>

                  {isPlanCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-green-500 text-white cursor-not-allowed"
                    >
                      {t('subscription.currentPlan')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlanSelect(plan.id)}
                      disabled={isProcessing}
                      className="w-full py-3 rounded-xl text-white font-medium transition-colors hover:opacity-90"
                      style={{ backgroundColor: themeColor }}
                    >
                      {t('subscription.subscribe')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 支付方式选择模态框 */}
        {showPaymentModal && selectedPlanInfo && (
          console.log('渲染支付模态框:', { showPaymentModal, selectedPlanInfo }), // 添加日志
          <div className="fixed inset-0 flex items-center justify-center z-[60]">
            <div className="bg-[#1E1F23] rounded-2xl p-6 w-full max-w-md relative">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-6">
                {t('payment.selectMethod')}
              </h3>
              
              <div className={`grid gap-4 ${paymentMethods.length === 1 ? 'grid-cols-1' : 
                paymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {paymentMethods.map(method => (
                  <button
                    key={method}
                    onClick={() => handlePaymentSelect(method)}
                    className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    {t(`payment.methods.${method}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlans;