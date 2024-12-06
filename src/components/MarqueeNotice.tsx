import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface MarqueeNoticeProps {
  messages: Array<{
    id: string;
    content: {
      zh: string;
      en: string;
    };
    shadowColor?: string;
  }>;
}

const MarqueeNotice: React.FC<MarqueeNoticeProps> = ({ messages }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<MarqueeNoticeProps['messages']>(messages);
  const { currentLanguage } = useLanguage();
  const [defaultLanguage] = useState<'zh' | 'en'>('zh');

  useEffect(() => {
    console.log('MarqueeNotice 收到新消息:', messages);
    console.log('当前语言:', currentLanguage);
    if (messages?.length > 0) {
      setIsVisible(true);
      setCurrentMessages(messages);
      console.log('设置当前消息:', messages);
    }
  }, [messages, currentLanguage]);

  const handleAnimationEnd = () => {
    console.log('动画结束，设置 isVisible 为 false');
    setIsVisible(false);
  };

  if (!isVisible || !currentMessages?.length) {
    console.log('MarqueeNotice 不显示，isVisible:', isVisible, 'currentMessages:', currentMessages);
    return null;
  }

  const displayLanguage = currentLanguage || defaultLanguage;
  console.log('使用显示语言:', displayLanguage);

  return (
    <div className="fixed w-full z-50 top-24 px-4">
      <div 
        className="relative w-full overflow-hidden bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm rounded-lg"
        style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
      >
        <div 
          className="whitespace-nowrap animate-marquee"
          onAnimationEnd={handleAnimationEnd}
        >
          {currentMessages.map(msg => (
            <span 
              key={msg.id}
              className="inline-block px-4 py-2 text-white"
            >
              {msg.content[displayLanguage]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarqueeNotice; 