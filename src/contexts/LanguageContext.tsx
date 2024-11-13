import React, { createContext, useContext, useState } from 'react';
import zh from '../config/i18n/zh';
import en from '../config/i18n/en';

const languages = { zh, en };
type LanguageType = keyof typeof languages;

interface LanguageContextType {
    language: LanguageType;
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
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    };

    return (
        <LanguageContext.Provider value={{ language, t, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};