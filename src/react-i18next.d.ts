import 'react-i18next';
// Import default exports from your translation files
import enTranslations from './config/i18n/en';
import zhTranslations from './config/i18n/zh';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    // resources property should match the shape of the resources object passed to i18next.init
    // If your en.ts and zh.ts are `export default { common: { ... }, ... }`
    // then `typeof enTranslations` and `typeof zhTranslations` will correctly type them.
    resources: {
      en: typeof enTranslations;
      zh: typeof zhTranslations;
    };
  }
} 