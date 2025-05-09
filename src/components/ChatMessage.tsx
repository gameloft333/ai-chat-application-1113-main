import React from 'react';
import { speak } from '../services/voice-service';
import { Message } from '../types/message';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/chat.css';

interface ChatMessageProps {
    message: Message;
    character?: {
        name: string;
        voice?: string;
    };
    isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, character, isTyping }) => {
    const { t } = useLanguage();
    
    return (
        <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] ${
                message.isUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700'
                } rounded-lg px-4 py-2`}
            >
                <span className="whitespace-pre-wrap">
                    {typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}
                </span>
                {!message.isUser && isTyping && (
                    <span className="typing-indicator">
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                    </span>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
