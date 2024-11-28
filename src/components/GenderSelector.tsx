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
  themeColor,
  onPopularCharactersChange
}) => {
  const { t } = useLanguage();

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

  const genderOptions = [
    { value: 'popular', label: t('gender.popular') },
    { value: 'female', label: t('gender.female') },
    { value: 'male', label: t('gender.male') }
  ];

  return (
    <div className="flex space-x-4">
      {genderOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onGenderChange(option.value)}
          className={`px-4 py-2 rounded-full transition-all duration-300 ${
            selectedGender === option.value
              ? 'text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
          style={{
            backgroundColor: selectedGender === option.value ? themeColor : 'transparent'
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default GenderSelector;