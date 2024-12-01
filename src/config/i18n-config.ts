import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './i18n/en';
import zhTranslations from './i18n/zh';

// 初始化i18n配置
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      zh: {
        translation: zhTranslations
      }
    },
    lng: 'zh', // 默认语言
    fallbackLng: 'en', // 备选语言
    interpolation: {
      escapeValue: false // 不转义特殊字符
    },
    debug: true // 启用调试模式
  });

export default i18n;