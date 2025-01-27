import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { getLLMResponse, getThinkingMessage } from '../services/llm-service';
import { Character } from '../types/character';
import { Message } from '../types/message';
import { MAX_CHAT_HISTORY, USE_TYPEWRITER_MODE, AI_RESPONSE_MODE } from '../config/app-config';
import { speak } from '../services/voice-service';
import ChatMessage from './ChatMessage';
import { CharacterStatsService } from '../services/character-stats-service';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatInterfaceProps {
  selectedCharacter: Character;
  initialMessages: Message[];
  onUpdateHistory: (messages: Message[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedCharacter,
  initialMessages,
  onUpdateHistory
}) => {
  const { t, currentLanguage } = useLanguage();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const messagesChanged = JSON.stringify(messages) !== JSON.stringify(initialMessages);
    if (messagesChanged) {
      onUpdateHistory(messages);
    }
  }, [messages, onUpdateHistory, initialMessages]);

  useEffect(() => {
    const updateThinkingMessage = async () => {
      if (isLoading && selectedCharacter) {
        const message = await getThinkingMessage(selectedCharacter.id, currentLanguage);
        setThinkingMessage(message);
      } else {
        setThinkingMessage(null);
      }
    };
    
    updateThinkingMessage();
  }, [isLoading, selectedCharacter, currentLanguage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = { text: inputMessage, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      await CharacterStatsService.incrementCharacterChat(selectedCharacter.id);
      const response = await getLLMResponse(selectedCharacter.id, inputMessage);
      setMessages(prev => [...prev, { text: response.text, isUser: false }]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setMessages(prev => [...prev, {
        text: t('chat.errorMessage'),
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
      setThinkingMessage(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-4 p-4 border-b dark:border-gray-700">
        <div className="relative">
          <img
            src={selectedCharacter.avatarFile}
            alt={selectedCharacter.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
        </div>
        <div>
          <h3 className="text-lg font-semibold dark:text-white">{selectedCharacter.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedCharacter.i18n?.[currentLanguage]?.description || t(`characters.${selectedCharacter.id}.description`)}
          </p>
        </div>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-700"
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            character={selectedCharacter}
            isTyping={isLoading && index === messages.length - 1}
          />
        ))}
        {isLoading && thinkingMessage && (
          <div className="thinking-status">
            {thinkingMessage}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t('chat.inputPlaceholder')}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
