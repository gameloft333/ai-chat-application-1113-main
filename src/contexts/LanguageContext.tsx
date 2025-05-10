import React, { createContext, useContext, useState, useEffect } from 'react';
import zh from '../config/i18n/zh';
import en from '../config/i18n/en';
import i18n from 'i18next';

const languages = { zh, en };
type LanguageType = keyof typeof languages;

// 从环境变量获取默认语言，如果未设置则使用 'en'
const DEFAULT_LANGUAGE = import.meta.env.VITE_DEFAULT_LANGUAGE as LanguageType || 'en';

const SHOW_DEBUG_LOGS = import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true';

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

        if (SHOW_DEBUG_LOGS) {
            // Commenting out this verbose log to reduce console noise
            // console.log(`[LanguageContext] Attempting to translate key: "${key}" for language: "${language}"`);
        }
        try {
            for (const k of keys) {
                // Check if value is an object before trying to access property k
                if (typeof value !== 'object' || value === null) {
                    if (SHOW_DEBUG_LOGS) {
                        console.warn(`[LanguageContext] Translation path broken for key: "${key}" (segment: "${k}") in language: "${language}". Current path value is not an object:`, value);
                    }
                    return key; // Return key itself as fallback
                }
                value = value[k]; // Access property
                if (value === undefined) {
                    if (SHOW_DEBUG_LOGS) {
                        console.warn(`[LanguageContext] Translation missing for key: "${key}" (segment: "${k}") in language: "${language}"`);
                    }
                    return key; // Return key itself as fallback
                }
            }

            if (typeof value === 'string') {
                return value;
            } else {
                if (SHOW_DEBUG_LOGS) {
                    console.warn(`[LanguageContext] Translation found for key: "${key}" in language: "${language}" but it is not a string. Value:`, value);
                }
                return key; // Return key itself as fallback
            }
        } catch (error) {
            if (SHOW_DEBUG_LOGS) {
                console.error(`[LanguageContext] Error getting translation for key: "${key}" in language: "${language}"`, error);
            }
            return key; // Return key itself on error
        }
    };

    const contextValue: LanguageContextType = {
        language,
        currentLanguage: language,
        t,
        setLanguage: handleSetLanguage
    };

    useEffect(() => {
        // 添加调试日志
        console.log('i18next 配置 (on mount):', {
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
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
};
