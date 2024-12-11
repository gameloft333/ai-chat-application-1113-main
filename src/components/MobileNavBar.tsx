// src/components/MobileNavBar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Home, Users, Trophy, User, Wallet } from 'lucide-react';

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
      key: 'games',
      icon: <Users className="w-6 h-6" />,
      label: t('nav.games'),
      path: '/games'
    },
    {
      key: 'tasks',
      icon: <Trophy className="w-6 h-6" />,
      label: t('nav.tasks'),
      path: '/tasks'
    },
    {
      key: 'community',
      icon: <Wallet className="w-6 h-6" />,
      label: t('nav.community'),
      path: '/community'
    },
    {
      key: 'profile',
      icon: <User className="w-6 h-6" />,
      label: t('nav.profile'),
      path: '/profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 px-2
              ${location.pathname === item.path 
                ? 'text-blue-500 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
              }
              hover:text-blue-600 dark:hover:text-blue-300
              transition-colors duration-200`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};