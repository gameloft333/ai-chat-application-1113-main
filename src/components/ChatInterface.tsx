import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { getLLMResponse } from '../services/llm-service';
import { Character } from '../types/character';
import { Message } from '../types/message';
import { MAX_CHAT_HISTORY, USE_TYPEWRITER_MODE, AI_RESPONSE_MODE } from '../config/app-config';
import { speak } from '../services/voice-service';
import ChatMessage from './ChatMessage'; // 导入 ChatMessage 组件
import { CharacterStatsService } from '../services/character-stats-service';

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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const messagesChanged = JSON.stringify(messages) !== JSON.stringify(initialMessages);
    if (messagesChanged) {
      onUpdateHistory(messages);
    }
  }, [messages, onUpdateHistory, initialMessages]);

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
        text: '对不起，我现在遇到了一些技术问题。让我们稍后再聊吧。',
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
      setThinkingMessage(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
      <div ref={chatContainerRef} 
        className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {messages.map((message, index) => (
          <div key={index} 
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex items-end space-x-2 ${message.isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              {!message.isUser && (
                <button onClick={() => speak(message.text, selectedCharacter.voice)} 
                  className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <img src="/ui_icons/speaker-icon.png" alt="播放语音" 
                    className="w-5 h-5 opacity-75 hover:opacity-100" />
                </button>
              )}
              <div className={`px-4 py-2 rounded-2xl ${
                message.isUser 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}>
                {message.text}
              </div>
            </div>
          </div>
        ))}
        {thinkingMessage && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl text-gray-500 dark:text-gray-400 animate-pulse">
              {thinkingMessage}
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入消息..."
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
