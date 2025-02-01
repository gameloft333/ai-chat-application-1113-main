import { useLanguage } from '../contexts/LanguageContext';

export interface MarqueeMessage {
  id: string;
  content: {
    zh: string;
    en: string;
  };
  shadowColor?: string;
  priority: number;  // 优先级，数字越大越优先显示
  startTime?: Date;  // 开始时间，可选
  endTime?: Date;    // 结束时间，可选
}

// 默认消息配置
export const DEFAULT_MARQUEE_MESSAGES: MarqueeMessage[] = [
  {
    id: 'welcome',
    content: {
      zh: '欢迎使用我们的AI聊天服务！',
      en: 'Welcome to our AI Chat Service!'
    },
    shadowColor: 'rgba(66, 153, 225, 0.5)',
    priority: 100
  },
  {
    id: 'new_features',
    content: {
      zh: '新功能上线：支持更多支付方式！',
      en: 'New Feature: More payment methods supported!'
    },
    shadowColor: 'rgba(72, 187, 120, 0.5)',
    priority: 90
  },
  {
    id: 'test_msg',
    content: {
      zh: '这是一条测试消息！',
      en: 'This is a test message!'
    },
    shadowColor: 'rgba(72, 187, 120, 0.5)',
    priority: 120
  }
];

// 获取当前有效的跑马灯消息
export const getActiveMarqueeMessages = () => {
  const now = new Date();
  return DEFAULT_MARQUEE_MESSAGES.filter(message => {
    if (message.startTime && message.startTime > now) return false;
    if (message.endTime && message.endTime < now) return false;
    return true;
  }).sort((a, b) => b.priority - a.priority);
};

// 跑马灯配置
export const MARQUEE_CONFIG = {
  enabled: import.meta.env.VITE_MARQUEE_ENABLED === 'true',
  shadowColor: import.meta.env.VITE_MARQUEE_SHADOW_COLOR,
  animationDuration: Number(import.meta.env.VITE_MARQUEE_ANIMATION_DURATION) || 20000,
  websocketUrl: import.meta.env.VITE_MARQUEE_WEBSOCKET_URL,
  transitionDuration: 500, // 过渡动画持续时间（毫秒）
  zIndex: 99999, // 提高 z-index 值
};