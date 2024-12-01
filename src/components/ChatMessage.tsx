import React from 'react';
import { speak } from '../services/voice-service';
import { Message } from '../types/message';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatMessageProps {
    message: Message;  // 修改为 Message 类型
    character?: {
        name: string;
        voice: string;
    };
    isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, character, isTyping }) => {
    const { t } = useLanguage();
    
    const handleSpeak = () => {
        if (character?.voice && message.text) {
            speak(message.text, character.voice);
        }
    };

    return (
        <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] ${
                message.isUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700'
                } rounded-lg px-4 py-2`}
            >
                {!message.isUser && character && (
                    <button 
                        onClick={handleSpeak} 
                        className="mr-2 opacity-50 hover:opacity-100 transition-opacity"
                        title={t('chat.playVoice')}
                    >
                        <img 
                            src="/ui_icons/speaker-icon.png" 
                            alt={t('chat.voiceIcon')} 
                            className="w-4 h-4 inline-block"
                        />
                    </button>
                )}
                <span className="whitespace-pre-wrap">
                    {typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}
                </span>
                {isTyping && <span className="typing-indicator">...</span>}
            </div>
        </div>
    );
};

export default ChatMessage;
