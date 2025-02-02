import React, { createContext, useContext, useState } from 'react';
import zh from '../config/i18n/zh';
import en from '../config/i18n/en';
import i18n from 'i18next';

const languages = { zh, en };
type LanguageType = keyof typeof languages;

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
    const [language, setLanguage] = useState<LanguageType>('zh');

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
        setLanguage
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
