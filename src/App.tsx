import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';
import CharacterSelector from './components/CharacterSelector';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { type Character } from './types/types';
import { CLEAR_MEMORY_ON_RESTART } from './config/app-config';
import SubscriptionPlans from './components/SubscriptionPlans';
import { pricingPlans, currentCurrency } from './config/pricing-config';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageSwitch from './components/LanguageSwitch';
import { AuthProvider } from './contexts/AuthContext';
import { PaymentRecordService } from './services/payment-record-service';
import { type PaymentRecord } from './types/payment';
import { PayPalService } from './services/paypal-service';
import PaymentResult from './components/PaymentResult';
import GenderSelector from './components/GenderSelector';
import LoginModal from './components/LoginModal';
import UserProfileDropdown from './components/UserProfileDropdown';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import { SubscriptionModal } from './components/SubscriptionModal';
import { PaymentCallback } from './components/PaymentCallback';
import { StripeService } from './services/stripe-service';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripePaymentForm } from './components/StripePaymentForm';
import { CharacterStatsService } from './services/character-stats-service';
import { characters } from './types/character';
import FeedbackButton from './components/FeedbackButton';
import DynamicFavicon from './components/DynamicFavicon';
import { TonService } from './services/ton-service';
import { TonPayment } from './components/TonPayment';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import { MobileNavBar } from './components/MobileNavBar';
import './styles/payment.css';
import { THEME_CONFIG } from './config/theme-config';
import logger from './utils/logger';
import { SocketService } from './services/socket-service';
import { PAYMENT_CONFIG } from './config/payment-config';
import { Marquee } from './components/Marquee';
import { SocialButtons } from './components/SocialButtons';
import { type Message } from './types/message';
import Privacy from './pages/privacy';
import Terms from './pages/terms';

interface AppRoutesProps {
  themeColor: string;
}

interface AppContentProps extends AppRoutesProps {
  showThemeToggle?: boolean; // 添加控制暗色模式按钮显示的属性
  showFilterTags?: boolean; // 新增：控制筛选标签显示
}

const AppRoutes: React.FC<AppRoutesProps> = ({ themeColor }) => {
  return (
    <Routes>
      <Route path="/" element={<AppContent themeColor={themeColor} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/payment-success" element={<PaymentResult />} />
      <Route path="/payment-callback" element={<PaymentCallback />} />
      <Route path="/payment-cancel" element={<Navigate to="/" />} />
    </Routes>
  );
};

interface UserState {
  isPaid: boolean;
  expiredAt?: string;
  planName?: string;
  daysLeft?: number;
  planId?: string;
}

const mapToSubscriptionDuration = (duration: string): 'monthly' | 'quarterly' | 'yearly' | 'lifetime' => {
  switch (duration) {
    case '1week':
    case '1month':
      return 'monthly';
    case '12months':
      return 'yearly';
    case '24months':
      return 'lifetime';
    case 'quarterly':
      return 'quarterly';
    case 'yearly':
      return 'yearly';
    case 'lifetime':
      return 'lifetime';
    default:
      return 'monthly';
  }
};

const AppContent: React.FC<AppContentProps> = ({ 
  themeColor, 
  showThemeToggle = true,  // 默认显示
  showFilterTags = true    // 新增：控制筛选标签显示
}) => {
  const { t } = useLanguage();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [randomColor, setRandomColor] = useState<string>('');
  const [user, setUser] = useState<UserState | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>('popular');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { openSubscriptionModal } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanInfo, setSelectedPlanInfo] = useState<{planId: string, duration: string} | null>(null);
  const [showStripePaymentModal, setShowStripePaymentModal] = useState(false);
  const [stripePaymentData, setStripePaymentData] = useState<any>(null);
  const [characterStats, setCharacterStats] = useState<Record<string, number>>({});
  const [popularCharacters, setPopularCharacters] = useState<string[]>([]);
  const [showTonPaymentModal, setShowTonPaymentModal] = useState(false);
  const [tonPaymentData, setTonPaymentData] = useState<{
    paymentId: string;
    amount: number;
    currency: string;
    planId: string;
    duration: string;
    userId: string;
    expiredAt: Date;
  } | null>(null);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  
  const generateThemeColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 20;
    const lightness = 45 + Math.random() * 10;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  useEffect(() => {
    const newColor = generateThemeColor();
    document.documentElement.style.setProperty('--theme-color', newColor);
  }, []);

  // 生成随机颜色的函数
  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // 在组件载时设置随机颜色
  useEffect(() => {
    let newColor;
    do {
      newColor = generateRandomColor();
    } while (isColorSimilarToBackground(newColor)); // 确保颜色与背景色不相似
    setRandomColor(newColor);
  }, []);

  // 检查颜色是否与背景色相似的函数
  const isColorSimilarToBackground = (color: string) => {
    // 这里以根据你的背景色进行判断
    const backgroundColor = '#1a202c'; // 示例背景色
    // 这里可以添加更复杂的颜色相似性判断逻辑
    return color === backgroundColor;
  };

  useEffect(() => {
    if (CLEAR_MEMORY_ON_RESTART) {
      localStorage.removeItem('chatHistory');
    } else {
      const savedHistory = localStorage.getItem('chatHistory');
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  const handleSelectCharacter = (character: Character) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    setSelectedCharacter(character);
  };

  const handleReturn = () => {
    setSelectedCharacter(null);
  };

  const updateChatHistory = (characterId: string, messages: Message[]) => {
    const updatedHistory = { ...chatHistory, [characterId]: messages };
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  };

  // 添加计算过期时间的函数
  const calculateExpiredAt = (duration: string) => {
    const now = new Date();
    switch (duration) {
      case '1week':
        return new Date(now.setDate(now.getDate() + 7));
      case '1month':
        return new Date(now.setMonth(now.getMonth() + 1));
      case '12months':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      case '24months':
        return new Date(now.setFullYear(now.getFullYear() + 2));
      default:
        return new Date(now.setDate(now.getDate() + 7)); // 默认一周
    }
  };

  // 在组件顶部初始化 Stripe
  const stripePromise = useMemo(() => loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY), []);
  
  // 添加支付成功处理函数
  const handlePaymentSuccess = useCallback(() => {
    setShowStripePaymentModal(false);
    navigate('/payment-success', {
      state: { 
        paymentStatus: 'success',
        message: t('payment.success')
      }
    });
  }, [navigate, t]);

  // 修改支付错误处理函数
  const handlePaymentError = useCallback((error: string) => {
    setShowStripePaymentModal(false);
    navigate('/', {
      state: { 
        paymentStatus: 'error',
        message: error || t('payment.error')
      }
    });
  }, [navigate, t]);

  const handleSubscribe = async (planId: string, duration: string, paymentMethod: 'paypal' | 'stripe' | 'ton') => {
    try {
      if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
        console.log('订阅参数:', { planId, duration, paymentMethod }); // 添加日志
      }
      
      if (!currentUser) {
        throw new Error(t('alerts.error.loginRequired'));
      }

      // 验证订阅周期
      const validDurations = ['test', '1week', '1month', '12months', '24months', 'monthly', 'quarterly', 'yearly', 'lifetime'];
      if (!validDurations.includes(duration)) {
        console.error('无效的订阅周期:', { duration, validDurations });
        throw new Error(t('alerts.error.invalidDuration'));
      }

      // PayPal 测试账户提示
      if (paymentMethod === 'paypal') {
        (t as any)('payment.paypal.testAccount');
        alert(t('payment.paypal.testAccount'));
      }

      // 获取计划和定价信息
      let plan;
      if (duration === '1week' && planId === 'trial') {
        plan = pricingPlans.trialPlan;
      } else {
        plan = pricingPlans.plans.find(p => p.id === planId);
      }

      if (!plan) {
        throw new Error(t('alerts.error.invalidPlan'));
      }

      const pricing = (plan.prices as any)[duration];
      if (!pricing) {
        console.error('未找到对应定价:', { 
          duration, 
          planId,
          plan,
          availableDurations: Object.keys(plan.prices)
        });
        throw new Error(t('alerts.error.invalidDuration'));
      }

      const expiredAt = calculateExpiredAt(duration);

      if (paymentMethod === 'paypal') {
        // PayPal 支付逻辑
        if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
          console.log('开始 PayPal 支付流程...', {
            price: (plan.prices as any)[duration].price,
            currency: currentCurrency.code,
            description: plan.description || `订阅 ${plan.name}`
          });
        }
        
        const paypalService = PayPalService.getInstance();
        const { orderId, approvalUrl } = await paypalService.createPaymentOrder({
          price: (plan.prices as any)[duration].price,
          currency: currentCurrency.code,
          description: plan.description || `订阅 ${plan.name}`
        });

        const paymentRecord: PaymentRecord = {
          uid: currentUser.uid,
          userEmail: currentUser.email || '',
          planId: planId,
          duration: mapToSubscriptionDuration(duration),
          orderId: orderId,
          amount: (plan.prices as any)[duration].price,
          currency: currentCurrency.code,
          status: 'pending' as const,
          createdAt: new Date(),
          expiredAt: expiredAt,
          paymentChannel: 'paypal'
        };

        await PaymentRecordService.createPaymentRecord(paymentRecord);
        
        // 添加测试账户提示
        alert(`请使用以下测试买家账户登录：
          邮箱：sb-6vbqu34102045@personal.example.com
          密码：请使用开发者平台提供的密码
          
          注意事项：
          1. 请确保已退出所有 PayPal 账户
          2. 建议使用无痕模式
          3. 如果遇到错误，请清除浏览器缓存后重试`);
  
          // 直接跳转到 PayPal 提供的 approvalUrl
        window.location.href = approvalUrl;
        
      } else if (paymentMethod === 'stripe') {
        try {
          if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
            console.log('开始 Stripe 支付流程...');
          }
          const stripeService = StripeService.getInstance();
          
          const minAmount = 0.55;
          const amount = Math.max((plan.prices as any)[duration].price, minAmount);
          
          if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
            console.log('创建支付意向，参数:', {
              price: amount,
              currency: currentCurrency.code,
              originalPrice: (plan.prices as any)[duration].price,
              minRequired: {
                HKD: 4.00,
                USD: 0.51
              }
            });
          }
          
          const clientSecret = await stripeService.createPaymentIntent(
            amount,
            currentCurrency.code,
            currentUser.uid
          );
          
          const paymentRecord: PaymentRecord = {
            uid: currentUser.uid,
            userEmail: currentUser.email || '',
            planId: planId,
            duration: mapToSubscriptionDuration(duration),
            orderId: clientSecret,
            amount: amount,
            currency: currentCurrency.code,
            status: 'pending' as const,
            createdAt: new Date(),
            expiredAt: expiredAt,
            paymentChannel: 'stripe'
          };

          await PaymentRecordService.createPaymentRecord(paymentRecord);
          
          if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
            console.log('支付意向创建成功，准备打开支付表单...');
          }
          
          setStripePaymentData({
            clientSecret,
            amount,
            currency: currentCurrency.code,
            planId,
            duration: mapToSubscriptionDuration(duration),
            userId: currentUser.uid,
            userEmail: currentUser.email || '',
            price: (plan.prices as any)[duration].price,
            expiredAt: expiredAt,
            themeColor: themeColor,
            onSuccess: handlePaymentSuccess,
            onError: handlePaymentError,
            onClose: () => {
              setShowStripePaymentModal(false); // 关闭支付模态框
              if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
                console.log('用户取消支付');
              }
            }
          });
          setShowStripePaymentModal(true);
        } catch (error) {
          console.error('Stripe 支付初始化失败:', {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            type: typeof error
          });
          
          // 使用 i18next 处理错误消息
          let errorMessage = t('payment.stripe.error.default');
          if (error instanceof Error) {
            if (error.message.includes('Amount must convert')) {
              errorMessage = (t as any)('payment.stripe.error.minimumAmount', { 
                min: '0.51 USD (≈ 4.00 HKD)',
                current: `${(plan.prices as any)[duration].price} ${currentCurrency.code}`
              });
            }
          }
          alert(errorMessage);
          throw error;
        }
      } else if (paymentMethod === 'ton') {
        try {
          if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
            console.log('开始 TON 支付流程...');
          }
          const tonService = TonService.getInstance();
          
          const paymentId = await tonService.createPaymentIntent(
            (plan.prices as any)[duration].price,
            currentCurrency.code
          );
          
          setShowStripePaymentModal(false);
          
          setTonPaymentData({
            paymentId,
            amount: (plan.prices as any)[duration].price,
            currency: currentCurrency.code,
            planId,
            duration: mapToSubscriptionDuration(duration),
            userId: currentUser.uid,
            expiredAt: expiredAt
          });
          setShowTonPaymentModal(true);
        } catch (error) {
          console.error('TON 支付初始化失败:', error);
          throw error;
        }
      } else {
        throw new Error(t('alerts.error.invalidPaymentMethod'));
      }
    } catch (error) {
      console.error('创建订阅失败:', error);
      alert(error instanceof Error ? error.message : '创建订阅失败');
    }
  };

  useEffect(() => {
    const paymentStatus = location.state?.paymentStatus;
    const message = location.state?.message;
    
    if (paymentStatus && message) {
      // 清除状态，防止刷新时重复显示
      navigate('/', { replace: true });
      
      // 显示支付状态提示
      alert(message);
    }
  }, [location, navigate]);

  const handleOpenSubscriptionModal = () => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    setShowSubscriptionModal(true);
  };

  const handleGenderChange = (gender: string | null) => {
    setSelectedGender(gender);
    if (gender === 'popular') {
      // 获取所有角色的统计数据
      const stats = CharacterStatsService.getCharacterCounts();
      const sortedCharacters = characters
        .map(char => ({
          id: char.id,
          count: stats[char.id] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .map(item => item.id);
      setPopularCharacters(sortedCharacters);
    }
  };

  const getFilteredCharacters = () => {
    if (selectedGender === 'popular') {
      if (popularCharacters.length === 0) {
        // 如果门列表为空，返回有角色
        return characters;
      }
      // 按照 popularCharacters 的顺序返回所有角色
      return popularCharacters
        .map(id => characters.find(char => char.id === id))
        .filter((char): char is Character => char !== undefined);
    }
    return characters.filter(char => char.gender === selectedGender);
  };

  useEffect(() => {
    if (selectedGender === 'popular') {
      // 获取所有角色的统计数据
      const stats = CharacterStatsService.getCharacterCounts();
      const sortedCharacters = characters
        .map(char => ({
          id: char.id,
          count: stats[char.id] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .map(item => item.id);
      setPopularCharacters(sortedCharacters);
    }
  }, [selectedGender]);

  useEffect(() => {
    // 设置默认主题
    document.documentElement.setAttribute('data-theme', THEME_CONFIG.defaultTheme);
  }, []);

  const handleSubscribeClick = () => {
    logger.debug('点击订阅按钮');
    logger.debug('支付配置:', PAYMENT_CONFIG);
    logger.debug('Socket状态:', SocketService.getSocket()?.connected);
    
    // 显示支付方式选择器
    setShowPaymentSelector(true);
  };

  useEffect(() => {
    // 添加调试日志
    if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
      console.log('当前用户:', currentUser);
    }
    
    if (currentUser) {
      CharacterStatsService.getUserCharacterStats(currentUser.uid)
        .then(stats => {
          if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
            console.log('获取到的角色统计:', stats);
          }
        })
        .catch(error => {
          console.error('获取角色统计失败:', error);
        });
    }
  }, [currentUser]);

  return (
    <>
      {/* 添加跑马灯容器，确保在导航栏底部 */}
      <div 
        className="fixed top-16 left-0 right-0 pointer-events-none z-40"
        style={{ 
          height: '40px'
        }}
      >
        <Marquee 
          websocketUrl={import.meta.env.VITE_MARQUEE_WS_URL || ''}
        />
      </div>

      <DynamicFavicon selectedCharacter={selectedCharacter} />
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* 响应式顶部导航栏 */}
        <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/75 dark:bg-gray-900/75 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-8 h-8" style={{ color: themeColor }} />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white md:block hidden">
                  AILove - Companions
                </h1>
              </div>
              {/* 在移动端隐藏性别选择器 */}
              <div className="hidden md:block">
                {!selectedCharacter && (  // 只在未选择角色时显示
                  <GenderSelector
                    selectedGender={selectedGender}
                    onGenderChange={handleGenderChange}
                    themeColor={themeColor}
                    onPopularCharactersChange={setPopularCharacters}
                  />
                )}
              </div>
            </div>
            
            {/* 右侧工具栏按钮组 */}
            <div className="flex items-center space-x-3">
              {/* 订阅计划按钮 */}
              {currentUser && !user?.isPaid && (
                <button
                  onClick={handleOpenSubscriptionModal}
                  className="px-4 py-2 rounded-lg text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: themeColor }}
                >
                  {t('subscription.choosePlan')}
                </button>
              )}
              
              {/* 语言切换按钮 */}
              <LanguageSwitch themeColor={themeColor} />
              
              {/* 用户头像/登录按钮 */}
              {currentUser ? (
                <UserProfileDropdown 
                  firebaseUser={currentUser}
                  onLogout={logout}
                  themeColor={themeColor}
                  onOpenSubscription={handleOpenSubscriptionModal}
                />
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-white hover:text-gray-300"
                >
                  {t('auth.login')}
                </button>
              )}
            </div>
          </div>
        </header>
          
        {/* 主内容区域，添加底部padding以适应移动导航栏 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] py-8 pb-24 md:pb-8 flex flex-col">
          {selectedCharacter ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
              <div className="lg:col-span-1">
                <button 
                  onClick={handleReturn} 
                  className="group mb-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  {t('common.back')}
                </button>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={selectedCharacter.image}
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-2 h-full">
                {currentUser ? (
                  <ChatInterface
                    selectedCharacter={selectedCharacter}
                    initialMessages={chatHistory[selectedCharacter.id] || []}
                    onUpdateHistory={(messages) => updateChatHistory(selectedCharacter.id, messages)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="px-6 py-3 rounded-lg text-white transition-colors"
                      style={{ backgroundColor: themeColor }}
                    >
                      {t('auth.loginToChat')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <CharacterSelector
              onSelectCharacter={handleSelectCharacter}
              selectedGender={selectedGender}
            />
          )}
        </main>

        {/* 移动端导航栏 */}
        <MobileNavBar />

        <footer className="bg-black bg-opacity-50 text-white p-4 text-center">
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm">
            <span style={{ color: randomColor }}>
              2025 Companions. All rights reserved.
            </span>
            <span className="text-yellow-400">
              注意: 现在处于测试模式，服务器重启时会清空聊天记录哦。
            </span>
            <span className="flex items-center">
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="mx-2 text-blue-300 hover:underline"
              >
                {t('privacy.title')}
              </a>
              <span className="text-gray-400">|</span>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="mx-2 text-blue-300 hover:underline"
              >
                {t('terms.title')}
              </a>
            </span>
          </div>
        </footer>
        
        {showLoginModal && (
          <LoginModal 
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            themeColor={themeColor}
          />
        )}

        {showSubscriptionModal && (
          <SubscriptionPlans
            onClose={() => setShowSubscriptionModal(false)}
            onSubscribe={handleSubscribe}
            currentPlanId={user?.planId}
            themeColor={themeColor}
            userEmail={currentUser?.email || undefined}
          />
        )}
        
        {showPaymentModal && selectedPlanInfo && (
          <SubscriptionModal 
            themeColor={themeColor}
          />
        )}

        {showStripePaymentModal && stripePaymentData && stripePaymentData.clientSecret && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <Elements stripe={stripePromise}>
                <StripePaymentForm {...stripePaymentData} />
              </Elements>
            </div>
          </div>
        )}

        {showTonPaymentModal && tonPaymentData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <TonPayment
              payment={{
                id: tonPaymentData.paymentId,
                amount: tonPaymentData.amount
              }}
              tonAmount={tonPaymentData.amount}
              walletAddress={import.meta.env.VITE_TON_TEST_WALLET_ADDRESS}
              onCancel={() => setShowTonPaymentModal(false)}
              onClose={() => setShowTonPaymentModal(false)}
            />
          </div>
        )}

        {/* 添加社交媒体按钮 */}
        <SocialButtons />

        {/* 添加反馈按钮 */}
        {currentUser && <FeedbackButton themeColor={themeColor} />}
      </div>
      {THEME_CONFIG.enableThemeSwitcher && <ThemeToggle themeColor={themeColor} />}
    </>
  );
};

const App: React.FC = () => {
  const [themeColor, setThemeColor] = useState(() => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 20;
    const lightness = 45 + Math.random() * 10;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });

  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <AppRoutes themeColor={themeColor} />
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
