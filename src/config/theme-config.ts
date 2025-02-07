export const THEME_CONFIG = {
  defaultTheme: (() => {
    console.log('VITE_DEFAULT_THEME:', import.meta.env.VITE_DEFAULT_THEME);
    console.log('Resolved Default Theme:', import.meta.env.VITE_DEFAULT_THEME || 'dark');
    return import.meta.env.VITE_DEFAULT_THEME || 'dark';
  })(),
  enableThemeSwitcher: (() => {
    const isEnabled = import.meta.env.VITE_THEME_SWITCHER_ENABLED === 'true';
    console.log('Theme Switcher Enabled:', isEnabled);
    return isEnabled;
  })(),
  darkMode: {
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    // 其他暗色主题相关配置
  }
};