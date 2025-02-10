import React, { createContext, useContext, useState } from 'react';
import zh from '../config/i18n/zh';
import en from '../config/i18n/en';
import i18n from 'i18next';

const languages = { zh, en };
type LanguageType = keyof typeof languages;

// 从环境变量获取默认语言，如果未设置则使用 'en'
const DEFAULT_LANGUAGE = import.meta.env.VITE_DEFAULT_LANGUAGE as LanguageType || 'en';

interface LanguageContextType {
    language: LanguageType;
    currentLanguage: LanguageType;
    t: (key: string) => string;
    setLanguage: (lang: LanguageType) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 使用环境变量中的默认语言
    const [language, setLanguage] = useState<LanguageType>(() => {
        // 尝试从 localStorage 获取上次使用的语言
        const savedLanguage = localStorage.getItem('preferredLanguage') as LanguageType;
        // 如果有保存的语言设置则使用，否则使用默认语言
        return savedLanguage || DEFAULT_LANGUAGE;
    });

    // 更新语言时同时保存到 localStorage
    const handleSetLanguage = (newLang: LanguageType) => {
        setLanguage(newLang);
        localStorage.setItem('preferredLanguage', newLang);
    };

    const t = (key: string) => {
        const keys = key.split('.');
        let value: any = languages[language];
        
        try {
            for (const k of keys) {
                value = value?.[k];
                if (value === undefined) {
                    console.warn(`Translation missing for key: ${key} in language: ${language}`);
                    return ''; // 返回空字符串而不是 key
                }
            }
            return value;
        } catch (error) {
            console.error(`Error getting translation for key: ${key}`, error);
            return '';
        }
    };

    const contextValue: LanguageContextType = {
        language,
        currentLanguage: language,
        t,
        setLanguage: handleSetLanguage
    };

    // 添加调试日志
    console.log('i18next 配置:', {
        interpolation: i18n.options.interpolation,
        resources: i18n.options.resources,
        debug: true
    });

    i18n.init({
        interpolation: {
            escapeValue: false,
            prefix: '{{',
            suffix: '}}',
            // 添加更多插值选项
            skipOnVariables: false
        },
        debug: true  // 启用调试模式
    });

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
};
