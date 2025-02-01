import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { MARQUEE_CONFIG } from '../config/app-config';

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

  if (!MARQUEE_CONFIG.enabled) {
    console.log('MarqueeNotice 已在配置中禁用');
    return null;
  }

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
    const element = document.querySelector('.animate-marquee');
    if (element) {
      element.classList.remove('animate-marquee');
      void element.offsetWidth;
      element.classList.add('animate-marquee');
    }
  };

  // 如果组件不可见或没有消息内容，则不渲染任何内容
  if (!isVisible || !currentMessages?.length) {
    console.log('MarqueeNotice 不显示, isVisible:', isVisible, 'currentMessages:', currentMessages);
    return null;
  }

  // 确定显示语言，如果没有设置当前语言则使用默认语言
  const displayLanguage = currentLanguage || defaultLanguage;
  console.log('使用显示语言:', displayLanguage);

  // 跑马灯容器刷新位置 top-16 是跑马灯到顶部的距离，z-40 是跑马灯的层级（现在和导航栏一样）
  return (
    <div className={`fixed z-40 top-16 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
      style={{ 
        width: '100%',  // 控制宽度
        left: '0%',   // 控制左边距，使其居中
        right: '0%'   // 控制右边距
      }}
    >
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 backdrop-blur-sm rounded-lg">
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