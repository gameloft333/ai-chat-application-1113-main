import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { getLLMResponse, getThinkingMessage } from '../services/llm-service';
import { type Character } from '../types/types';
import { Message } from '../types/message';
import { MAX_CHAT_HISTORY, USE_TYPEWRITER_MODE, AI_RESPONSE_MODE } from '../config/app-config';
import { speak } from '../services/voice-service';
import ChatMessage from './ChatMessage';
import { CharacterStatsService } from '../services/character-stats-service';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChatUsageService, ChatUsageInfo } from '../services/chatUsageService';
import { Link } from 'react-router-dom';
import logger from '../utils/logger';
import SubscriptionPlans from './SubscriptionPlans';

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
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState<string | null>(null);
  const [chatUsageInfo, setChatUsageInfo] = useState<ChatUsageInfo | null>(null);
  const [chatLimitError, setChatLimitError] = useState<string | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to get current user's ID token
  const getAccessToken = useCallback(async () => {
    if (currentUser && typeof currentUser.getIdToken === 'function') {
        return await currentUser.getIdToken(true); // Force refresh for critical ops
    }
    logger.warn('[ChatInterface] Unable to get access token. User might not be fully authenticated or getIdToken is missing on user object.');
    return null;
  }, [currentUser]);

  // Fetch chat usage information
  useEffect(() => {
    const fetchUsage = async () => {
        if (currentUser) { // Only need currentUser here, getAccessToken is stable if currentUser changes
            try {
                setChatLimitError(null);
                const usage = await ChatUsageService.getTodaysChatUsage(getAccessToken);
                setChatUsageInfo(usage);
                if (usage.remaining === 0 && usage.limit !== 'unlimited') {
                    setChatLimitError(t('chat.limit.exceeded'));
                }
            } catch (error) {
                logger.error('[ChatInterface] Failed to fetch chat usage:', error);
                setChatLimitError(t('chat.networkError')); 
                setChatUsageInfo(null);
            }
        }
    };
    fetchUsage();
  }, [currentUser, selectedCharacter, getAccessToken, t]);

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
        const messageText = await getThinkingMessage(selectedCharacter.id, currentLanguage);
        setThinkingMessage(messageText);
      } else {
        setThinkingMessage(null);
      }
    };
    updateThinkingMessage();
  }, [isLoading, selectedCharacter, currentLanguage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    if (chatUsageInfo && chatUsageInfo.remaining === 0 && chatUsageInfo.limit !== 'unlimited') {
        setChatLimitError(t('chat.limit.exceeded'));
        return;
    }
    setChatLimitError(null);

    const userMessage = { text: inputMessage, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsSending(true);
    setIsLoading(true);

    let llmRespondedOrSetOwnMessage = false;

    try {
      // Ensure selectedCharacter.id is valid before using it
      if (!selectedCharacter || !selectedCharacter.id) {
        logger.error("selectedCharacter or selectedCharacter.id is undefined in handleSendMessage");
        setMessages(prev => [...prev, { text: t('chat.configError'), isUser: false }]);
        llmRespondedOrSetOwnMessage = true;
        setIsLoading(false);
        setThinkingMessage(null);
        setIsSending(false);
        return;
      }

      await CharacterStatsService.incrementCharacterChat(selectedCharacter.id);
      const response = await getLLMResponse(selectedCharacter.id, currentInput);

      setMessages(prev => [...prev, { text: response.text, isUser: false }]);
      llmRespondedOrSetOwnMessage = true;

      setIsLoading(false);
      setThinkingMessage(null);

      if (currentUser) {
        try {
          const incrementResult = await ChatUsageService.incrementChatUsage(getAccessToken);
          if (incrementResult.success && incrementResult.updatedUsage) {
              setChatUsageInfo(incrementResult.updatedUsage);
              if (incrementResult.updatedUsage.remaining === 0 && incrementResult.updatedUsage.limit !== 'unlimited') {
                  setChatLimitError(t('chat.limit.exceeded'));
              }
          } else if (!incrementResult.success) {
              logger.warn('[ChatInterface] Failed to increment chat usage on backend:', incrementResult.message, incrementResult.backendError);
              if (incrementResult.backendError === 'chat.limit.exceeded' && incrementResult.updatedUsage) {
                  setChatUsageInfo(incrementResult.updatedUsage);
                  setChatLimitError(t('chat.limit.exceeded'));
              } else if (incrementResult.backendError === 'AUTH_REQUIRED') {
                   setChatLimitError(t('alerts.error.loginRequired'));
              }
          }
        } catch (usageError) {
          logger.error('Thrown error during chat usage increment:', usageError);
        }
      }

    } catch (error) {
      logger.error('Error in handleSendMessage (likely from LLM or character stats):', error);
      if (!llmRespondedOrSetOwnMessage) {
          setMessages(prev => [...prev, {
            text: t('chat.errorMessage'),
            isUser: false
          }]);
      }
      setIsLoading(false);
      setThinkingMessage(null);
    } finally {
      setIsLoading(false);
      setThinkingMessage(null);
      setIsSending(false);
    }
  };

  const handleOpenSubscriptionModal = () => {
    setIsSubscriptionModalOpen(true);
  };

  const handleCloseSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false);
  };

  const handleSubscribe = (planId: string, duration: string, method: 'paypal' | 'stripe' | 'ton') => {
    // Placeholder for subscription logic
    logger.log('Subscribing to plan:', { planId, duration, method });
    // You would typically call a service here to handle the subscription process
    // and then potentially close the modal and refresh user status.
    handleCloseSubscriptionModal();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-4 p-4 border-b dark:border-gray-700">
        <div className="relative">
          <img
            src={selectedCharacter.avatarFile}
            alt={selectedCharacter.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg aspect-square"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
        </div>
        <div>
          <h3 className="text-lg font-semibold dark:text-white">{selectedCharacter.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedCharacter.i18n?.[currentLanguage]?.description || (selectedCharacter.id ? t(`characters.${selectedCharacter.id}.description`) : 'Loading description...')}
          </p>
        </div>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-700"
      >
        {chatLimitError && (
            <div className="my-2 p-3 rounded-lg bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <div className="flex-grow">
                    <p className="font-semibold">{chatLimitError}</p>
                    {chatUsageInfo && chatUsageInfo.remaining === 0 && chatUsageInfo.limit !== 'unlimited' && (
                         <button 
                            onClick={handleOpenSubscriptionModal}
                            className="mt-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer bg-transparent border-none p-0"
                         >
                            {t('chat.limit.subscribe')}
                        </button>
                    )}
                </div>
            </div>
        )}

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

      {isSubscriptionModalOpen && (
        <SubscriptionPlans
          onClose={handleCloseSubscriptionModal}
          onSubscribe={handleSubscribe} 
          themeColor="#22DCA1"
          userEmail={currentUser?.email || undefined}
        />
      )}

      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
            placeholder={t('chat.inputPlaceholder')}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            disabled={isSending || (chatUsageInfo?.remaining === 0 && chatUsageInfo?.limit !== 'unlimited')}
          />

          {!chatLimitError && chatUsageInfo && chatUsageInfo.limit !== 'unlimited' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap px-2">
              {t('chat.limit.remaining.prefix')}
              <strong className="mx-1">{Number(chatUsageInfo.remaining)}</strong>
              {t('chat.limit.remaining.suffix')}
            </div>
          )}
          {!chatLimitError && chatUsageInfo && chatUsageInfo.limit === 'unlimited' && (
            <div className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap px-2">
                {t('chat.limit.unlimited')}
            </div>
          )}

          <button
            onClick={handleSendMessage}
            disabled={isSending || !inputMessage.trim() || (chatUsageInfo?.remaining === 0 && chatUsageInfo?.limit !== 'unlimited')}
            className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
