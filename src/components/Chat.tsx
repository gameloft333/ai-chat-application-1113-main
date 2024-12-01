import { useState } from 'react';
import { useEffect } from 'react';
import { getThinkingStatus, getThinkingMessage } from '../services/llm-service';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/chat.css';

// 在组件中添加状态监听
const [isThinking, setIsThinking] = useState(false);
const [thinkingMessage, setThinkingMessage] = useState('');

const { currentLanguage, t } = useLanguage();

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

// 在渲染部分修改
return (
  <div className="chat-container">
    {messages.map((message, index) => (
      <ChatMessage
        key={index}
        message={message}
        character={character}
      />
    ))}
    
    {/* 将思考状态移到消息列表后面 */}
    {isThinking && (
      <div className="thinking-status">
        <span>{t('chat.thinkingMessage').replace('{{name}}', character.name)}</span>
        <span className="typing-indicator">
          <span className="dot">.</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
        </span>
      </div>
    )}
  </div>
);