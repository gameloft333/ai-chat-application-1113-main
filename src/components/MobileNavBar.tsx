// src/components/MobileNavBar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { MessageCircle, Settings, User, CreditCard, Home } from 'lucide-react';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

export const MobileNavBar: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      key: 'home',
      icon: <Home className="w-6 h-6" />,
      label: t('nav.home'),
      path: '/'
    },
    {
      key: 'chat',
      icon: <MessageCircle className="w-6 h-6" />,
      label: t('nav.chat'),
      path: '/chat'
    },
    {
      key: 'subscription',
      icon: <CreditCard className="w-6 h-6" />,
      label: t('nav.subscription'),
      path: '/subscription'
    },
    {
      key: 'settings',
      icon: <Settings className="w-6 h-6" />,
      label: t('nav.settings'),
      path: '/settings'
    },
    {
      key: 'profile',
      icon: <User className="w-6 h-6" />,
      label: t('nav.profile'),
      path: '/profile'
    }
  ];

  const handleNavigation = (path: string) => {
    // 添加导航前的验证逻辑
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50">
      <div className="flex justify-around items-center h-16 px-2 max-w-screen-xl mx-auto">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => handleNavigation(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 px-2
              ${location.pathname === item.path 
                ? 'text-primary-500 dark:text-primary-400' 
                : 'text-gray-500 dark:text-gray-400'
              }
              hover:text-primary-600 dark:hover:text-primary-300
              active:scale-95 transform transition-all duration-200`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};