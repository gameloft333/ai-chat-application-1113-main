import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import ChatInterface from './components/ChatInterface';
import CharacterSelector from './components/CharacterSelector';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { Character } from './types/character';
import { CLEAR_MEMORY_ON_RESTART } from './config/app-config';
import ChatMessage from './ChatMessage';
import SubscriptionPlans from './components/SubscriptionPlans';
import { PaymentService } from './services/payment-service';
import { pricingPlans, currentCurrency } from './config/pricing-config';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageSwitch from './components/LanguageSwitch';
import { AuthProvider } from './contexts/AuthContext';
import { PaymentRecordService } from './services/payment-record-service';
import { PaymentRecord } from './types/payment';
import { PayPalService } from './services/paypal-service';
import { PAYPAL_CONFIG } from './config/paypal-config';
import PaymentResult from './components/PaymentResult';
import GenderSelector from './components/GenderSelector';
import SubscriptionDropdown from './components/SubscriptionDropdown';
import SubscriptionExpiry from './components/SubscriptionExpiry';
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

const API_KEY = import.meta.env.VITE_API_KEY || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AppRoutesProps {
  themeColor: string;
}

const AppRoutes: React.FC<AppRoutesProps> = ({ themeColor }) => {
  return (
    <Routes>
      <Route path="/" element={<AppContent themeColor={themeColor} />} />
      <Route path="/login" element={<Login />} />
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

const AppContent: React.FC<AppRoutesProps> = ({ themeColor }) => {
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
  const [stripePaymentData, setStripePaymentData] = useState<{
    clientSecret: string;
    amount: number;
    currency: string;
    planId: string;
    duration: string;
    userId: string;
    userEmail: string;
    price: number;
    expiredAt: Date;
  } | null>(null);
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
      if (!currentUser) {
        throw new Error(t('alerts.error.loginRequired'));
      }

      // 获取计划和定价信息
      const plan = pricingPlans.plans.find(p => p.id === planId) || pricingPlans.trialPlan;
      if (!plan) {
        throw new Error(t('alerts.error.invalidPlan'));
      }

      const pricing = plan.prices[duration];
      if (!pricing) {
        throw new Error(t('alerts.error.invalidDuration'));
      }

      const expiredAt = calculateExpiredAt(duration);

      if (paymentMethod === 'paypal') {
        // PayPal 支付逻辑
        const paypalService = PayPalService.getInstance();
        const orderId = await paypalService.createPaymentOrder({
          price: pricing.price,
          currency: currentCurrency.code,
          description: plan.description
        });

        // 创建支付记录
        const paymentRecord = {
          uid: currentUser.uid,
          userEmail: currentUser.email || '',
          planId: planId,
          duration: duration,
          orderId: orderId,
          amount: pricing.price,
          currency: currentCurrency.code,
          status: 'pending',
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

        // 跳转到 PayPal 支付
        const returnUrl = `${window.location.origin}/payment-callback`;
        const cancelUrl = `${window.location.origin}/payment-cancel`;
        
        window.location.href = `${PAYPAL_CONFIG.SANDBOX_MODE 
          ? 'https://www.sandbox.paypal.com' 
          : 'https://www.paypal.com'}/checkoutnow?token=${orderId}&returnUrl=${encodeURIComponent(returnUrl)}&cancelUrl=${encodeURIComponent(cancelUrl)}`;
      } else if (paymentMethod === 'stripe') {
        try {
          console.log('开始 Stripe 支付流程...');
          const stripeService = StripeService.getInstance();
          
          console.log('创建支付意向，参数:', {
            price: pricing.price,
            currency: currentCurrency.code
          });
          
          const clientSecret = await stripeService.createPaymentIntent(
            pricing.price,
            currentCurrency.code
          );
          
          console.log('支付意向创建成功，准备打开支付表单...');
          setShowStripePaymentModal(true);
          setStripePaymentData({
            clientSecret,
            amount: pricing.price,
            currency: currentCurrency.code,
            planId,
            duration,
            userId: currentUser.uid,
            userEmail: currentUser.email || '',
            price: pricing.price,
            expiredAt: expiredAt
          });
        } catch (error) {
          console.error('Stripe 支付初始化失败:', {
            error,
            stack: error.stack,
            type: typeof error
          });
          throw error;
        }
      } else if (paymentMethod === 'ton') {
        try {
          console.log('开始 TON 支付流程...');
          const tonService = TonService.getInstance();
          
          const paymentId = await tonService.createPaymentIntent(
            pricing.price,
            currentCurrency.code
          );
          
          setShowStripePaymentModal(false);
          setShowTonPaymentModal(true);
          setTonPaymentData({
            paymentId,
            amount: pricing.price,
            currency: currentCurrency.code,
            planId,
            duration,
            userId: currentUser.uid,
            expiredAt: expiredAt
          });
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
        // 如果热门列表为空，返回有角色
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

  return (
    <>
      <DynamicFavicon selectedCharacter={selectedCharacter} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/75 dark:bg-gray-900/75 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-8 h-8" style={{ color: themeColor }} />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Companions
                </h1>
              </div>
              <GenderSelector
                selectedGender={selectedGender}
                onGenderChange={handleGenderChange}
                themeColor={themeColor}
                onPopularCharactersChange={setPopularCharacters}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              {!currentUser ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: themeColor }}
                >
                  {t('auth.login')}
                </button>
              ) : (
                <>
                  {user?.isPaid ? (
                    <>
                      <SubscriptionExpiry 
                        expiredAt={new Date(user.expiredAt)} 
                        themeColor={themeColor}
                      />
                      <SubscriptionDropdown
                        planName={user.planName || 'subscription.defaultPlan'}
                        daysLeft={user.daysLeft || 0}
                        themeColor={themeColor}
                        onChangeSubscription={openSubscriptionModal}
                      />
                    </>
                  ) : (
                    <button
                      onClick={handleOpenSubscriptionModal}
                      className="px-4 py-2 rounded-lg text-white transition-colors"
                      style={{ backgroundColor: themeColor }}
                    >
                      {t('subscription.choosePlan')}
                    </button>
                  )}
                  <UserProfileDropdown 
                    themeColor={themeColor}
                  />
                </>
              )}
              <LanguageSwitch themeColor={themeColor} />
            </div>
          </div>
        </header>
          
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selectedCharacter ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <button onClick={handleReturn} 
                  className="group mb-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
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
              <div className="lg:col-span-2">
                {currentUser ? (
                  <ChatInterface
                    selectedCharacter={selectedCharacter}
                    initialMessages={chatHistory[selectedCharacter.id] || []}
                    onUpdateHistory={(messages) => updateChatHistory(selectedCharacter.id, messages)}
                    className="flex-grow h-full"
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
        <footer className="bg-black bg-opacity-50 text-white p-4 text-center">
          <p style={{ color: randomColor }}>{t('common.copyright')}</p>
        </footer>
        {CLEAR_MEMORY_ON_RESTART && (
          <div className="text-yellow-400 text-sm mt-2">
            {t('common.testMode')}
          </div>
        )}
        
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
            currentPlanId={currentUser?.planId}
            themeColor={themeColor}
            userEmail={currentUser?.email}
          />
        )}
        
        {showPaymentModal && selectedPlanInfo && (
          <SubscriptionModal 
            themeColor={themeColor}
            planId={selectedPlanInfo.planId}
            duration={selectedPlanInfo.duration}
            onClose={() => setShowPaymentModal(false)}
          />
        )}

        {showStripePaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">支付确认</h2>
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  {...stripePaymentData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  themeColor={themeColor}
                />
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
              tonAmount={tonPaymentData.tonAmount || 0}
              walletAddress={import.meta.env.VITE_TON_TEST_WALLET_ADDRESS}
              onCancel={() => setShowTonPaymentModal(false)}
              onClose={() => setShowTonPaymentModal(false)}
            />
          </div>
        )}

        {/* 添加反馈按钮 */}
        {currentUser && <FeedbackButton themeColor={themeColor} />}
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [themeColor, setThemeColor] = useState<string>('#4F46E5');

  const generateThemeColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 20;
    const lightness = 45 + Math.random() * 10;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  useEffect(() => {
    const newColor = generateThemeColor();
    setThemeColor(newColor);
    document.documentElement.style.setProperty('--theme-color', newColor);
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <SubscriptionProvider>
              <AppRoutes themeColor={themeColor} />
            </SubscriptionProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
