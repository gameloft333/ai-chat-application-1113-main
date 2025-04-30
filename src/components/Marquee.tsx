import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { MarqueeMessage } from '../config/marquee-config';
import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';

interface MarqueeProps {
  websocketUrl: string;
}

export const Marquee: React.FC<MarqueeProps> = ({ websocketUrl }) => {
  const [messages, setMessages] = useState<MarqueeMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { currentLanguage } = useLanguage();
  
  useEffect(() => {
    logger.debug('Initializing Marquee WebSocket:', { websocketUrl });
    
    if (!websocketUrl) {
      logger.error('WebSocket URL not provided');
      return;
    }

    const newSocket = io(websocketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
      withCredentials: true,
      forceNew: true
    });
    
    newSocket.on('connect', () => {
      logger.info('Marquee WebSocket connected');
      setIsConnected(true);
    });
    
    newSocket.on('marquee:update', (newMessages: MarqueeMessage[]) => {
      logger.debug('Received new marquee messages:', {
        count: newMessages.length,
        language: currentLanguage
      });
      setMessages(newMessages);
    });
    
    newSocket.on('error', (error) => {
      logger.error('Marquee WebSocket error:', {
        error,
        socketState: newSocket.connected
      });
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      logger.info('Marquee WebSocket disconnected:', { reason });
      setIsConnected(false);
    });
    
    setSocket(newSocket);
    
    return () => {
      logger.debug('Cleaning up Marquee WebSocket connection');
      newSocket.close();
    };
  }, [websocketUrl]);
  
  useEffect(() => {
    const duration = Number(import.meta.env.VITE_MARQUEE_ANIMATION_DURATION) || 20000;
    logger.debug('Setting marquee animation duration:', { duration });
    document.documentElement.style.setProperty('--marquee-duration', `${duration}ms`);
  }, []);
  
  if (messages.length === 0) {
    logger.debug('No messages to display');
    return null;
  }
  
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