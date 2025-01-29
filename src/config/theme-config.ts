export const THEME_CONFIG = {
  defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'dark',
  enableThemeSwitcher: import.meta.env.VITE_THEME_SWITCHER_ENABLED === 'true',
  darkMode: {
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    // 其他暗色主题相关配置
  }
}; 