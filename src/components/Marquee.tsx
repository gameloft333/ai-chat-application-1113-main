import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { MarqueeMessage } from '../config/marquee-config';
import { io, Socket } from 'socket.io-client';

interface MarqueeProps {
  websocketUrl: string;
}

export const Marquee: React.FC<MarqueeProps> = ({ websocketUrl }) => {
  const [messages, setMessages] = useState<MarqueeMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { currentLanguage } = useLanguage();
  
  useEffect(() => {
    console.log('连接到跑马灯WebSocket:', websocketUrl);
    const newSocket = io(websocketUrl);
    
    newSocket.on('connect', () => {
      console.log('跑马灯WebSocket已连接');
    });
    
    newSocket.on('marquee:update', (newMessages: MarqueeMessage[]) => {
      console.log('收到新的跑马灯消息:', newMessages);
      setMessages(newMessages);
    });
    
    newSocket.on('error', (error) => {
      console.error('跑马灥WebSocket错误:', error);
    });
    
    setSocket(newSocket);
    
    return () => {
      console.log('关闭跑马灯WebSocket连接');
      newSocket.close();
    };
  }, [websocketUrl]);
  
  useEffect(() => {
    // 设置动画持续时间
    document.documentElement.style.setProperty(
      '--marquee-duration', 
      `${import.meta.env.VITE_MARQUEE_ANIMATION_DURATION}ms`
    );
  }, []);
  
  if (messages.length === 0) return null;
  
  return (
    <div className="marquee-container overflow-hidden bg-gray-800 p-2">
      <div className="marquee-content flex space-x-4 animate-marquee">
        {messages.map((message) => (
          <div
            key={message.id}
            className="text-white whitespace-nowrap"
            style={{
              textShadow: `0 0 10px ${message.shadowColor || '#4299e1'}`
            }}
          >
            {/* 根据当前语言显示对应的内容 */}
            {message.content[currentLanguage as keyof typeof message.content]}
          </div>
        ))}
      </div>
    </div>
  );
}; 