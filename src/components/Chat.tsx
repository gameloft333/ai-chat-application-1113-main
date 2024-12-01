import { useState } from 'react';
import { useEffect } from 'react';
import { getThinkingStatus, getThinkingMessage } from '../services/llm-service';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/chat.css';

// 在组件中添加状态监听
const [isThinking, setIsThinking] = useState(false);
const [thinkingMessage, setThinkingMessage] = useState('');

const { currentLanguage } = useLanguage();

useEffect(() => {
  const checkThinkingStatus = async () => {
    const status = getThinkingStatus(characterId);
    setIsThinking(status);
    if (status) {
      const message = await getThinkingMessage(characterId, currentLanguage);
      setThinkingMessage(message);
    }
  };
  
  const interval = setInterval(checkThinkingStatus, 100);
  return () => clearInterval(interval);
}, [characterId, currentLanguage]);

// 在渲染部分添加
{isThinking && (
  <div className="thinking-status">
    {thinkingMessage}
  </div>
)}