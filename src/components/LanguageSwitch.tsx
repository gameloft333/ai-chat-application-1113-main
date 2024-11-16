import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSwitchProps {
  themeColor: string;
}

const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ themeColor }) => {
  const { currentLanguage, setLanguage } = useLanguage();
  
  return (
    <select
      value={currentLanguage}
      onChange={(e) => setLanguage(e.target.value)}
      className="px-4 py-2 rounded-lg transition-colors bg-opacity-20 text-gray-300"
      style={{ backgroundColor: `${themeColor}40`, color: themeColor }}
    >
      <option value="zh">中文</option>
      <option value="en">English</option>
    </select>
  );
};

export default LanguageSwitch;