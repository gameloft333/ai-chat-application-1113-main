import React, { useEffect } from 'react';
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
  themeColor,
  onPopularCharactersChange
}) => {
  const { t, currentLanguage } = useLanguage();

  useEffect(() => {
    const fetchStats = () => {
      try {
        // 获取统计数据
        const stats = CharacterStatsService.getCharacterCounts();
        console.log('Character stats:', stats);
        
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
    console.log('Current language:', currentLanguage);
    console.log('Gender translations:', {
      popular: t('gender.popular'),
      female: t('gender.female'),
      male: t('gender.male'),
      celebrity: t('gender.celebrity'),
      pet: t('gender.pet'),
      gods: t('gender.gods')
    });
  }, [currentLanguage]);

  const genderButtons = [
    { key: 'popular', label: t('gender.popular') },
    { key: 'female', label: t('gender.female') },
    { key: 'male', label: t('gender.male') },
    { key: 'celebrity', label: t('gender.celebrity') },
    { key: 'pet', label: t('gender.pet') },
    { key: 'gods', label: t('gender.gods') }
  ];

  return (
    <div className="flex justify-center space-x-4 mb-8 mt-8">
      {genderButtons.map(({ key, label }) => (
        <button
          key={key}
          className={`px-4 py-2 rounded-full transition-all duration-300 ${
            selectedGender === key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
          }`}
          onClick={() => onGenderChange(key as string | null)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default GenderSelector;