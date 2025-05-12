import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { THEME_CONFIG } from '../config/theme-config';
import logger from '../utils/logger';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme;
    
    // 2. If no saved theme, use the default from environment config
    const defaultTheme = savedTheme || THEME_CONFIG.defaultTheme as Theme;
    
    logger.debug('Initial Theme Selection:', {
      savedTheme, 
      configDefaultTheme: THEME_CONFIG.defaultTheme,
      finalTheme: defaultTheme
    });

    return defaultTheme;
  });

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Save to localStorage
      localStorage.setItem('theme', newTheme);
      
      // Update HTML class for Tailwind dark mode
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      logger.debug('Theme toggled:', { 
        oldTheme: prevTheme, 
        newTheme: newTheme 
      });
      
      return newTheme;
    });
  }, []);

  // Initial theme setup
  useEffect(() => {
    // Ensure the correct class is added on initial render
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      logger.debug('Added dark class to documentElement on initial render');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 