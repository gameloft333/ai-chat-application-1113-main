import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
// ... 其他导入保持不变
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

const API_KEY = import.meta.env.VITE_API_KEY || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppRoutes />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppContent />} />
      <Route path="/login" element={<Login />} />
      <Route path="/payment-success" element={<PaymentResult />} />
      <Route path="/payment-cancel" element={<Navigate to="/" />} />
    </Routes>
  );
};

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [randomColor, setRandomColor] = useState<string>('');
  const [showSubscription, setShowSubscription] = useState<boolean>(false);
  const [user, setUser] = useState<{ isPaid: boolean } | null>(null);
  const [selectedGender, setSelectedGender] = useState<string>('female');
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

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

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

  const handleSubscribe = async (planId: string, duration: string) => {
    try {
      let plan;
      if (planId === 'trial') {
        plan = pricingPlans.trialPlan;
      } else {
        plan = pricingPlans.plans.find(p => p.id === planId);
      }
      
      if (!plan || !currentUser) {
        throw new Error(t('alerts.error.subscriptionNotFound'));
      }
      
      const pricing = plan.prices[duration] || plan.prices['1week'];
      if (!pricing) {
        throw new Error(t('alerts.error.priceNotFound'));
      }

      // 创建支付记录
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + parseInt(duration) * 7);

      // 先创建 PayPal 订单
      const paypalService = PayPalService.getInstance();
      const orderId = await paypalService.createPaymentOrder({
        price: pricing.price,
        currency: currentCurrency.code,
        description: plan.description
      });

      // 创建支付记录时包含 orderId
      const paymentRecord: PaymentRecord = {
        uid: currentUser.uid,
        planId: planId,
        orderId: orderId,
        amount: pricing.price,
        currency: currentCurrency.code,
        status: 'pending',
        createdAt: new Date(),
        expiredAt: expiredAt,
        paymentChannel: 'paypal'
      };

      await PaymentRecordService.createPaymentRecord(paymentRecord);

      // 打开 PayPal 支付窗口
      window.open(
        `${PAYPAL_CONFIG.SANDBOX_MODE 
          ? 'https://www.sandbox.paypal.com' 
          : 'https://www.paypal.com'}/checkoutnow?token=${orderId}`,
        '_blank'
      );
    } catch (error) {
      console.error('创建订阅失败:', error);
      alert(error instanceof Error ? error.message : t('alerts.error.createSubscriptionFailed'));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/75 dark:bg-gray-900/75 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-8 h-8" style={{ color: themeColor }} />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI Chat Companions
              </h1>
            </div>
            <GenderSelector 
              selectedGender={selectedGender}
              onGenderChange={setSelectedGender}
              themeColor={themeColor}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {!currentUser ? (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: `${themeColor}40`, color: themeColor }}
                >
                  {t('auth.register')}
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: themeColor }}
                >
                  {t('auth.login')}
                </button>
              </>
            ) : user?.isPaid ? (
              <SubscriptionDropdown
                planName={user.planName || 'subscription.defaultPlan'}
                daysLeft={user.daysLeft || 0}
                themeColor={themeColor}
                onChangeSubscription={() => setShowSubscription(true)}
              />
            ) : (
              <button
                onClick={() => setShowSubscription(true)}
                className="px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: themeColor }}
              >
                {t('subscription.subscribe')}
              </button>
            )}
            <button
              onClick={async () => {
                try {
                  await logout();
                  navigate('/login');
                } catch (error) {
                  console.error('退出错误:', error);
                  alert(error instanceof Error ? error.message : t('alerts.error.logoutFailed'));
                }
              }}
              className="px-4 py-2 rounded-lg text-white transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              {t('auth.logout')}
            </button>
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
              <ChatInterface
                selectedCharacter={selectedCharacter}
                initialMessages={chatHistory[selectedCharacter.id] || []}
                onUpdateHistory={(messages) => updateChatHistory(selectedCharacter.id, messages)}
                className="flex-grow h-full"
              />
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
      
      {showSubscription && (
        <SubscriptionPlans
          onClose={() => setShowSubscription(false)}
          onSubscribe={handleSubscribe}
          currentPlanId={user?.planId}
          themeColor={themeColor}
        />
      )}
    </div>
  );
};

export default App;
