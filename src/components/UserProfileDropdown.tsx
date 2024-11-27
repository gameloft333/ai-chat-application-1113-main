import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Clock, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { PaymentRecordService } from '../services/payment-record-service';
import { useSubscription } from '../contexts/SubscriptionContext';

interface UserProfileDropdownProps {
  themeColor: string;
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  expiredAt?: Date;
  remainingDays?: number;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ themeColor }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isSubscribed: false
  });
  const [isOpen, setIsOpen] = useState(false);
  const [showUid, setShowUid] = useState(false);
  const [copied, setCopied] = useState(false);
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const { openSubscriptionModal } = useSubscription();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (currentUser?.uid) {
        console.log('Fetching subscription status for user:', currentUser.uid);
        const status = await PaymentRecordService.getSubscriptionStatus(currentUser.uid);
        console.log('Subscription status:', status);
        setSubscriptionStatus(status);
      }
    };

    fetchSubscriptionStatus();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('退出登录失败:', error);
      alert(t('alerts.error.logoutFailed'));
    }
  };

  const handleSubscriptionClick = () => {
    if (!subscriptionStatus.isSubscribed) {
      openSubscriptionModal();
    }
  };

  const getSubscriptionDisplay = () => {
    if (subscriptionStatus.isSubscribed && subscriptionStatus.expiredAt) {
      return (
        <>
          <span className="text-sm">
            剩余时间：{subscriptionStatus.remainingDays} 天
          </span>
          <span className="text-xs text-gray-500">
            到期日期：{subscriptionStatus.expiredAt.toLocaleDateString('zh-CN')}
          </span>
        </>
      );
    }
    return (
      <span 
        className="text-sm text-blue-500 cursor-pointer hover:text-blue-600"
        onClick={handleSubscriptionClick}
      >
        {t('subscription.startSubscription')}
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

  const updateSubscriptionStatus = async () => {
    if (currentUser?.uid) {
      const status = await PaymentRecordService.getSubscriptionStatus(currentUser.uid);
      setSubscriptionStatus(status);
    }
  };

  useEffect(() => {
    updateSubscriptionStatus();
    
    const handlePaymentSuccess = () => {
      updateSubscriptionStatus();
    };
    
    window.addEventListener('payment-success', handlePaymentSuccess);
    return () => {
      window.removeEventListener('payment-success', handlePaymentSuccess);
    };
  }, [currentUser]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:opacity-80 transition-opacity"
        style={{ backgroundColor: themeColor }}
      >
        <User className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
          <div className="p-4 space-y-3">
            {/* UID 部分 */}
            <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
              <User className="w-4 h-4 mr-2 flex-shrink-0" />
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="text-sm font-mono truncate mr-2">{getMaskedUid()}</span>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => setShowUid(!showUid)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    {showUid ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCopyUid}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* 修改订阅状态显示部分 */}
            <div 
              className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg"
              onClick={handleSubscriptionClick}
              style={{ cursor: subscriptionStatus.isSubscribed ? 'default' : 'pointer' }}
            >
              <Clock className="w-4 h-4 mr-2" />
              <div className="flex flex-col">
                {getSubscriptionDisplay()}
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