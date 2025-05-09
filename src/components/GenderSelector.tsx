import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CharacterStatsService } from '../services/character-stats-service';
import { characters } from '../types/character';

interface GenderSelectorProps {
  selectedGender: string | null;
  onGenderChange: (gender: string | null) => void;
  themeColor: string;
  onPopularCharactersChange?: (characterIds: string[]) => void;
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({
  selectedGender,
  onGenderChange,
  onPopularCharactersChange
}) => {
  const { t, currentLanguage } = useLanguage();
  const [buttonColors, setButtonColors] = useState<Record<string, string>>({});

  // 生成符合 WCAG 标准的随机颜色
  const generateAccessibleColor = (isDark = false) => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 20;
    const lightness = isDark ? 65 + Math.random() * 15 : 45 + Math.random() * 10;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 初始化每个按钮的颜色
  useEffect(() => {
    const colors: Record<string, string> = {};
    ['popular', 'female', 'male', 'celebrity', 'pet', 'gods'].forEach(key => {
      colors[key] = generateAccessibleColor(true);
    });
    setButtonColors(colors);
  }, []);

  useEffect(() => {
    const fetchStats = () => {
      try {
        // 获取统计数据
        const stats = CharacterStatsService.getCharacterCounts();
        if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
          console.log('Character stats:', stats);
        }
        
        // 获取所有角色并排序
        const sortedCharacterIds = characters
          .map(char => char.id)
          .sort((a, b) => {
            const countA = stats[a] || 0;
            const countB = stats[b] || 0;
            if (countA === countB) {
              return Math.random() - 0.5;
            }
            return countB - countA;
          });
        
        if (onPopularCharactersChange) {
          onPopularCharactersChange(sortedCharacterIds);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // 错误时显示随机排序的所有角色
        const randomSortedIds = characters
          .map(char => char.id)
          .sort(() => Math.random() - 0.5);
        
        if (onPopularCharactersChange) {
          onPopularCharactersChange(randomSortedIds);
        }
      }
    };

    fetchStats();
  }, [onPopularCharactersChange]);

  // 添加语言切换时的调试日志
  useEffect(() => {
    if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
      console.log('Current language:', currentLanguage);
      console.log('Gender translations:', {
        popular: t('gender.popular'),
        female: t('gender.female'),
        male: t('gender.male'),
        celebrity: t('gender.celebrity'),
        pet: t('gender.pet'),
        god: t('gender.god')
      });
    }
  }, [currentLanguage, t]);

  const genderButtons = [
    { key: 'popular', label: t('gender.popular') },
    { key: 'female', label: t('gender.female') },
    { key: 'male', label: t('gender.male') },
    { key: 'celebrity', label: t('gender.celebrity') },
    { key: 'pet', label: t('gender.pet') },
    { key: 'gods', label: t('gender.god') }
  ];

  return (
    <div className="flex justify-center space-x-4 mb-8 mt-8">
      {genderButtons.map(({ key, label }) => (
        <button
          key={key}
          className={`px-4 py-2 rounded-full transition-all duration-300`}
          style={{
            backgroundColor: selectedGender === key ? buttonColors[key] : 'rgba(55, 65, 81, 0.7)',
            color: selectedGender === key ? 'white' : '#9CA3AF'
          }}
          onClick={() => onGenderChange(key as string | null)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default GenderSelector;