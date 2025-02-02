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
  const [messageColors, setMessageColors] = useState<Record<string, string>>({});

  // 生成随机HSL颜色，确保与背景有足够对比度
  const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 20; // 70-90%
    const lightness = 65 + Math.random() * 15;  // 65-80% 提高亮度确保可读性
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 检查颜色对比度
  const checkColorContrast = (color: string, backgroundColor: string = 'rgba(0, 0, 0, 0.8)') => {
    // 将HSL转换为RGB
    const hslToRgb = (h: number, s: number, l: number) => {
      const a = s * Math.min(l, 1 - l);
      const f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return [f(0) * 255, f(8) * 255, f(4) * 255];
    };

    // 计算相对亮度
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    // 计算对比度
    const getContrastRatio = (l1: number, l2: number) => {
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    return getContrastRatio(
      getLuminance(...hslToRgb(...color.match(/\d+/g)!.map(Number))),
      getLuminance(0, 0, 0) // 背景色为黑色半透明
    ) >= 4.5;
  };

  // 为每条消息生成随机颜色
  useEffect(() => {
    const newColors: Record<string, string> = {};
    messages.forEach(msg => {
      let color;
      do {
        color = generateRandomColor();
      } while (!checkColorContrast(color));
      newColors[msg.id] = color;
    });
    setMessageColors(newColors);
  }, [messages]);

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
              className="inline-block px-4 py-2"
              style={{ 
                color: messageColors[msg.id],
                textShadow: '0 0 8px rgba(0, 0, 0, 0.5)'
              }}
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