import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Clock, Eye, EyeOff, Copy, Check, Mail, Key, Crown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PaymentRecordService } from '../services/payment-record-service';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';
// import { Crown } from 'lucide-react';

export interface UserProfileDropdownProps {
  firebaseUser: User; // Or whatever the prop is actually named and typed
  onLogout: () => Promise<void>;
  themeColor: string;
  onOpenSubscription: () => void;
  // any other props
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiredAt?: Date;
  remainingDays?: number;
  planLevel?: 'trial' | 'basic' | 'pro' | 'premium';
  duration?: string;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ 
  themeColor,
  onOpenSubscription 
}) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false
  });
  const [isOpen, setIsOpen] = useState(false);
  const [showUid, setShowUid] = useState(false);
  const [copied, setCopied] = useState(false);
  const { currentUser, logout } = useAuth();
  const { t, language } = useLanguage();
  const { openSubscriptionModal } = useSubscription();
  const { t: tTranslation } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSubscriptionStatus = async () => {
      if (!currentUser?.uid) {
        console.log('未找到当前用户ID，跳过订阅状态更新');
        return;
      }

      try {
        const status = await PaymentRecordService.getSubscriptionStatus(
          currentUser.uid,
          currentUser.email || undefined
        );
        console.log('订阅状态更新成功:', status);
        setSubscriptionStatus(status);
      } catch (error) {
        console.error('更新订阅状态失败:', error);
        // 设置默认状态
        setSubscriptionStatus({ isSubscribed: false });
      }
    };

    // 初始加载
    updateSubscriptionStatus();

    const handlePaymentUpdate = () => {
      console.log('收到支付更新事件，延迟 1 秒更新状态');
      setTimeout(updateSubscriptionStatus, 1000);
    };

    window.addEventListener('subscription-updated', handlePaymentUpdate);
    return () => {
      window.removeEventListener('subscription-updated', handlePaymentUpdate);
    };
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // 添加全局点击事件监听
    document.addEventListener('mousedown', handleClickOutside);
    
    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('退出登录失败:', error);
      alert(t('alerts.error.logoutFailed'));
    }
  };

  const handleSubscriptionClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止冒泡
    onOpenSubscription(); // 使用传入的函数
    setIsOpen(false); // 关闭下拉菜单
  };

  const getSubscriptionDisplay = () => {
    if (subscriptionStatus.isSubscribed && subscriptionStatus.expiredAt) {
      return (
        <>
          <span className="text-sm">
            {t('subscription.remainingTime')}：{subscriptionStatus.remainingDays} {t('subscription.days')}
          </span>
          <span className="text-xs text-gray-500">
            {t('subscription.expiryDate')}：{subscriptionStatus.expiredAt.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
          </span>
        </>
      );
    }
    return (
      <span 
        className="text-sm z-40 text-blue-500 cursor-pointer hover:text-blue-600"
        onClick={handleSubscriptionClick}
      >
        {t('subscription.subscribe')}
      </span>
    );
  };

  const getMaskedUid = () => {
    if (!currentUser?.uid) return '********';
    if (showUid) return currentUser.uid;
    return currentUser.uid.slice(0, 8) + '*'.repeat(Math.max(0, currentUser.uid.length - 8));
  };

  const handleCopyUid = async () => {
    if (currentUser?.uid) {
      try {
        await navigator.clipboard.writeText(currentUser.uid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  };

  const getPlanLevelColor = (planLevel?: string) => {
    if (!planLevel || planLevel === 'normal') {
      return 'text-gray-500'; // 普通用户使用灰色
    }
    
    switch(planLevel) {
      case 'trial': return 'text-green-500'; // 体验会员
      case 'basic': return 'text-blue-500'; // 基础会员
      case 'pro': return 'text-purple-500'; // 专业会员
      case 'premium': return 'text-orange-500'; // 至尊会员
      default: return 'text-gray-500'; // 普通用户
    }
  };

/**
 * 获取会员等级显示名称
 * @param planLevel 会员等级: normal(普通用户), trial(体验会员), basic(基础会员), pro(专业会员), premium(至尊会员)
 * @param duration 会员时长: 1month, 12months, 24months
 * @returns 会员等级的本地化显示名称
 */
const getPlanLevelName = (planLevel?: string, duration?: string) => {
  // 普通用户
  if (!planLevel) return tTranslation('memberLevel.normal');
  
  // 体验会员
  if (planLevel === 'trial') return tTranslation('memberLevel.trial');
  
  // 如果没有 duration，先尝试从剩余天数判断
  if (!duration && subscriptionStatus?.remainingDays) {
    if (subscriptionStatus.remainingDays > 365) {
      duration = '24months';
    } else if (subscriptionStatus.remainingDays > 180) {
      duration = '12months';
    } else {
      duration = '1month';
    }
  }
  
  const currentDuration = duration || '1month';
  console.log('当前会员信息:', { planLevel, duration: currentDuration, remainingDays: subscriptionStatus?.remainingDays });

  // 根据会员时长和等级返回对应的显示名称
  const durationMap = {
    // 1个月会员
    '1month': {
      'basic': tTranslation('memberLevel.basic'),    // 基础会员
      'pro': tTranslation('memberLevel.pro'),        // 专业会员
      'premium': tTranslation('memberLevel.premium')  // 至尊会员
    },
    // 12个月会员
    '12months': {
      'basic': tTranslation('memberLevel.excellent'), // 卓越会员
      'pro': tTranslation('memberLevel.flagship'),    // 旗舰会员
      'premium': tTranslation('memberLevel.legendary')// 传奇会员
    },
    // 24个月会员
    '24months': {
      'basic': tTranslation('memberLevel.noble'),     // 尊贵会员
      'pro': tTranslation('memberLevel.peak'),        // 巅峰会员
      'premium': tTranslation('memberLevel.invincible')// 无敌会员
    }
  };

  return durationMap[currentDuration]?.[planLevel] || tTranslation('memberLevel.normal');
};

  // console.log('当前订阅状态:', subscriptionStatus);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:opacity-80 transition-opacity"
        style={{ backgroundColor: themeColor }}
      >
        <User className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-60">
          <div className="px-4 py-2 space-y-3">
            {/* 会员等级显示 */}
            <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
              <Crown className="w-4 h-4 mr-2" />
              <span className={`text-sm ${getPlanLevelColor(subscriptionStatus?.isSubscribed ? subscriptionStatus?.planLevel : 'normal')}`}>
                {subscriptionStatus?.isSubscribed 
                  ? getPlanLevelName(subscriptionStatus?.planLevel)
                  : t('memberLevel.normal')}
              </span>
            </div>

            {/* 邮箱显示 */}
            <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
              <Mail className="w-4 h-4 mr-2" />
              <span className="text-sm">{currentUser?.email || '未知邮箱'}</span>
            </div>

            {/* UID显示 */}
            <div className="flex flex-col text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center min-w-0 flex-1">
                  <Key className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className={`text-sm ${showUid ? 'break-all' : 'truncate'}`}>{getMaskedUid()}</span>
                </div>
                <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                  <button
                    onClick={() => setShowUid(!showUid)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title={showUid ? t('common.hide') : t('common.show')}
                  >
                    {showUid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleCopyUid}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title={t('common.copy')}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 订阅状态显示 */}
            <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
              <Clock className="w-4 h-4 mr-2" />
              <div className="flex flex-col">
                {subscriptionStatus?.isSubscribed ? (
                  <>
                    <span className="text-sm">
                      {t('subscription.remainingTime')}：{subscriptionStatus.remainingDays} {t('subscription.days')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t('subscription.expiryDate')}：{subscriptionStatus.expiredAt?.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
                    </span>
                  </>
                ) : (
                  <button 
                    onClick={handleSubscriptionClick}
                    className="text-sm text-blue-500 cursor-pointer hover:text-blue-600"
                  >
                    {t('subscription.choosePlan')}
                  </button>
                )}
              </div>
            </div>

            {/* 退出登录按钮 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('auth.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;