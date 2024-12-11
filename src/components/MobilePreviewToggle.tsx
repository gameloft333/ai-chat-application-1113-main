// src/components/MobilePreviewToggle.tsx
import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MobilePreviewToggleProps {
  themeColor: string;
}

export const MobilePreviewToggle: React.FC<MobilePreviewToggleProps> = ({ themeColor }) => {
  const { t } = useLanguage();
  const [isMobilePreview, setIsMobilePreview] = React.useState(false);

  const togglePreview = () => {
    setIsMobilePreview(!isMobilePreview);
    // 切换预览模式
    document.documentElement.classList.toggle('mobile-preview');
    
    if (!isMobilePreview) {
      // 进入手机预览模式
      document.body.style.maxWidth = '420px';
      document.body.style.margin = '0 auto';
      document.body.style.height = '100vh';
      document.body.style.position = 'relative';
      document.body.style.overflow = 'auto';
    } else {
      // 退出手机预览模式
      document.body.style.maxWidth = '';
      document.body.style.margin = '';
      document.body.style.height = '';
      document.body.style.position = '';
      document.body.style.overflow = '';
    }
  };

  return (
    <button
      onClick={togglePreview}
      className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110
        ${isMobilePreview 
          ? 'bg-primary-100 text-primary-600' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900`}
      style={{ 
        focusRing: themeColor,
      }}
      aria-label={t('preview.toggle')}
      title={t('preview.toggle')}
    >
      {isMobilePreview ? (
        <Monitor className="w-5 h-5" />
      ) : (
        <Smartphone className="w-5 h-5" />
      )}
    </button>
  );
};