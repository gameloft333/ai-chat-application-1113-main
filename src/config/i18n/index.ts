import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhTranslations from './zh';
import enTranslations from './en';

const resources = {
  zh: {
    translation: zhTranslations
  },
  en: {
    translation: enTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage']
    }
  });

export default i18n; 