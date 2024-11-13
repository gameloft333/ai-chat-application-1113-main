import React from 'react';
import { speak } from '../services/voice-service';

interface ChatMessageProps {
    message: string;
    voice: string; // 传入语音标识符
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, voice }) => {
    const handleSpeak = () => {
        speak(message, voice); // 播放当前消息的语音
    };

    return (
        <div className="flex items-center">
            <button onClick={handleSpeak} className="mr-2">
                <img src="/public/ui_icons/speaker-icon.png" alt="语音图标" className="w-6 h-6" />
            </button>
            <span>{message}</span>
        </div>
    );
};

export default ChatMessage;
