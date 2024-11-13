import React, { useState, useEffect } from 'react';
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

const API_KEY = import.meta.env.VITE_API_KEY || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [randomColor, setRandomColor] = useState<string>('');
  const [showSubscription, setShowSubscription] = useState<boolean>(false);
  const [user, setUser] = useState<{ isPaid: boolean } | null>(null);

  // 生成随机颜色的函数
  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // 在组件加载时设置随机颜色
  useEffect(() => {
    let newColor;
    do {
      newColor = generateRandomColor();
    } while (isColorSimilarToBackground(newColor)); // 确保颜色与背景色不相似
    setRandomColor(newColor);
  }, []);

  // 检查颜色是否与背景色相似的函数
  const isColorSimilarToBackground = (color: string) => {
    // 这里可以根据你的背景色进行判断
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
      const paymentService = PaymentService.getInstance();
      let plan;
      
      if (planId === 'trial') {
        plan = pricingPlans.trialPlan;
      } else {
        plan = pricingPlans.plans.find(p => p.id === planId);
      }
      
      if (!plan) {
        throw new Error('未找到订阅方案');
      }
      
      const pricing = plan.prices[duration] || plan.prices['1week'];
      if (!pricing) {
        throw new Error('未找到价格方案');
      }

      console.log('创建支付链接...', { plan, pricing }); // 添加调试日志

      const invoiceLink = await paymentService.createInvoiceLink({
        id: `${planId}-${duration}`,
        name: plan.name,
        description: plan.description,
        price: pricing.price,
        currency: currentCurrency.code,
        duration: duration
      }, 'user123');
      
      if (invoiceLink) {
        console.log('付链接创建成功:', invoiceLink); // 添加调试日志
        window.open(invoiceLink, '_blank');
      } else {
        throw new Error('生成支付链接失败');
      }
    } catch (error) {
      console.error('创建订阅失败:', error);
      alert(error instanceof Error ? error.message : '订阅失败，请稍后重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/75 dark:bg-gray-900/75 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-8 h-8 text-indigo-500" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Chat Companions</h1>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitch />
            <button
              onClick={() => setShowSubscription(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t('subscription.subscribe')}
            </button>
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
          <CharacterSelector onSelectCharacter={handleSelectCharacter} maxCharacters={8} />
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
          isPaidUser={user?.isPaid}
        />
      )}
    </div>
  );
};

export default App;
