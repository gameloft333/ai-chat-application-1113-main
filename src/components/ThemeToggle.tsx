import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ThemeToggleProps {
  themeColor: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ themeColor }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110
        ${theme === 'dark' 
          ? 'bg-gray-700 hover:bg-gray-600' 
          : 'bg-gray-200 hover:bg-gray-300'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900`}
      style={{ 
        focusRing: themeColor,
      }}
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
};

export default ThemeToggle; 