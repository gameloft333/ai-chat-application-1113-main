import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Character, characters } from '../types/character';
import { CharacterStatsService } from '../services/character-stats-service';

interface CharacterSelectorProps {
  onSelectCharacter: (character: Character) => void;
  maxCharacters?: number;
  selectedGender: string | null;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  onSelectCharacter,
  maxCharacters = characters.length,
  selectedGender
}) => {
  const { t } = useLanguage();
  const [sortedCharacters, setSortedCharacters] = useState<Character[]>([]);

  // 生成随机颜色
  const getRandomColor = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r}, ${g}, ${b}, 0.5)`;
  };

  // 处理边框样式
  const getBorderStyle = (character: Character) => {
    // 如果有配置的边框颜色，使用预定义的类
    if (character.borderColor && character.borderColor !== 'none') {
      return `character-border-${character.borderColor}`;
    }
    
    // 使用随机颜色
    return {
      boxShadow: `0 0 15px 5px ${getRandomColor()}`
    };
  };

  // 添加边框样式处理函数
  const getBorderClass = (borderColor?: BorderColor) => {
    if (!borderColor || borderColor === 'none') return '';
    return `character-border-${borderColor}`;
  };

  useEffect(() => {
    const sortCharactersByPopularity = () => {
      // 获取所有角色的统计数据
      const stats = CharacterStatsService.getCharacterCounts();
      
      // 根据性别过滤角色
      let filteredChars = selectedGender === 'popular' 
        ? characters 
        : characters.filter(char => char.gender === selectedGender);

      // 根据统计数据对角色进行排序，相同对话人数的角色随机排序
      const sorted = filteredChars.sort((a, b) => {
        const countA = stats[a.id] || 0;
        const countB = stats[b.id] || 0;
        if (countA === countB) {
          // 如果对话人数相同，随机排序
          return Math.random() - 0.5;
        }
        return countB - countA; // 降序排列
      });

      setSortedCharacters(sorted.slice(0, maxCharacters));
    };

    sortCharactersByPopularity();
  }, [selectedGender, maxCharacters]);

  // 每次渲染时重新随机排序相同对话人数的角色
  useEffect(() => {
    const reorderSameCountCharacters = () => {
      const stats = CharacterStatsService.getCharacterCounts();
      setSortedCharacters(prev => {
        const newOrder = [...prev].sort((a, b) => {
          const countA = stats[a.id] || 0;
          const countB = stats[b.id] || 0;
          if (countA === countB) {
            return Math.random() - 0.5;
          }
          return countB - countA;
        });
        return newOrder;
      });
    };

    reorderSameCountCharacters();
  }, []); // 空依赖数组确保只在组件挂载时执行一次

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-center mb-8">
        {t('common.selectCharacter')}
      </h2>
      <div className="grid grid-cols-4 gap-4">
        {sortedCharacters.map((character) => {
          const borderStyle = getBorderStyle(character);
          return (
            <div
              key={character.id}
              onClick={() => onSelectCharacter(character)}
              className={`relative cursor-pointer rounded-lg overflow-hidden transition-transform hover:scale-105 ${getBorderClass(character.borderColor)}`}
              style={typeof borderStyle === 'object' ? borderStyle : {}}
            >
              <img
                src={character.avatarFile}
                alt={character.name}
                className="w-full h-auto rounded-lg shadow-lg"
                style={{ aspectRatio: '9 / 16', objectFit: 'cover' }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                <h3 className="text-white text-lg font-bold mb-1">{character.name}</h3>
                <p className="text-gray-300 text-sm">
                  {t(`characters.${character.id}.age`)}
                </p>
                <p className="text-gray-300 text-sm mt-2 line-clamp-2">
                  {t(`characters.${character.id}.description`)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CharacterSelector;
