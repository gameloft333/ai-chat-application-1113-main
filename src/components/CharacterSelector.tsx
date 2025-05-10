import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Character, characters } from '../types/character';
import { CharacterStatsService } from '../services/character-stats-service';
import { marqueeService } from '../services/marquee-service';
import MarqueeNotice from './MarqueeNotice';
import OnlineStats from './OnlineStats';
import { useAuth } from '../contexts/AuthContext';
import { PaymentRecordService } from '../services/payment-record-service';
import { Modal } from 'antd';
import { SUBSCRIPTION_PLANS } from '../config/subscription-config';
import { useSubscription } from '../contexts/SubscriptionContext';
import LoginModal from './LoginModal';
import logger from '../utils/logger';
import { getLoggerConfig, LogLevel } from '../config/logger-config';

interface CharacterSelectorProps {
  onSelectCharacter: (character: Character) => void;
  maxCharacters?: number;
  selectedGender: string | null;
  themeColor?: string;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  onSelectCharacter,
  maxCharacters = SUBSCRIPTION_PLANS.CHARACTER_LIMITS.trial,
  selectedGender,
  themeColor = '#1890ff'
}) => {
  const { t, currentLanguage } = useLanguage();
  const [sortedCharacters, setSortedCharacters] = useState<Character[]>([]);
  const [marqueeMessages, setMarqueeMessages] = useState<MarqueeMessage[]>([]);
  const [randomColors, setRandomColors] = useState<Record<string, string>>({});
  const { currentUser } = useAuth();
  const { subscriptionType } = useSubscription();
  const [usedCharacters, setUsedCharacters] = useState<number>(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  useEffect(() => {
    logger.debug('Language Check:', {
      currentLanguage,
      availableLanguages: ['zh', 'en']
    });
  }, [currentLanguage]);

  // 添加调试日志
  useEffect(() => {
    logger.debug('Character Selection State:', {
      currentLanguage,
      characterCount: sortedCharacters.length,
      characters: sortedCharacters.map(char => ({
        id: char.id,
        i18n: char.i18n?.[currentLanguage]
      }))
    });
  }, [sortedCharacters, currentLanguage]);

  // 修改生成随机颜色的逻辑
  const getRandomColor = (characterId: string) => {
    // 如果已经有缓存的随机颜色，直接返回
    if (randomColors[characterId]) {
      return randomColors[characterId];
    }
    
    // 生成新的随机颜色并缓存
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const color = `rgba(${r}, ${g}, ${b}, 0.5)`;
    
    setRandomColors(prev => ({
      ...prev,
      [characterId]: color
    }));
    
    return color;
  };

  // 修改边框样式处理函数
  const getBorderStyle = (character: Character) => {
    // 如果有配置的边框颜色，使用预定义的类
    if (character.borderColor && character.borderColor !== 'none') {
      return `character-border-${character.borderColor}`;
    }
    
    // 使用随机颜色
    return {
      boxShadow: `0 0 15px 5px ${getRandomColor(character.id)}`
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
        // 如果对话人数相同，随机排序
        return countB - countA;
      });

      // 显示所有角色，不再使用 maxCharacters 限制
      setSortedCharacters(sorted);
    };

    sortCharactersByPopularity();
  }, [selectedGender]); // 移除 maxCharacters 依赖

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

  useEffect(() => {
    const unsubscribe = marqueeService.subscribe(setMarqueeMessages);
    return () => unsubscribe();
  }, []);

  // 获取当前用户可用的最大角色数
  const getMaxCharacters = () => {
    const maxChars = !currentUser 
      ? SUBSCRIPTION_PLANS.CHARACTER_LIMITS.trial 
      : SUBSCRIPTION_PLANS.CHARACTER_LIMITS[subscriptionType || 'trial'];
    
    logger.debug('Character Limit Check:', {
      currentUser: !!currentUser,
      subscriptionType,
      maxChars
    });
    
    return maxChars;
  };

  // 检查是否超出限制
  const checkCharacterLimit = (character: Character) => {
    const maxCharacters = getMaxCharacters();
    if (usedCharacters >= maxCharacters && maxCharacters !== -1) {
      Modal.warning({
        title: t('character.limitReached.title'),
        content: t('character.limitReached.description', { maxCount: maxCharacters }),
        okText: t('subscription.choosePlan'),
        onOk: () => {
          window.location.href = '/subscription';
        }
      });
      return false;
    }
    return true;
  };

  // 修改处理未登录的逻辑
  const handleNotLoggedIn = () => {
    setShowLoginModal(true);
  };

  // 修改选择角色的处理函数
  const handleSelectCharacter = async (character: Character) => {
    try {
      if (!currentUser) {
        handleNotLoggedIn();
        return;
      }

      logger.debug('Attempting to select character:', {
        characterId: character.id,
        userId: currentUser.uid
      });

      const result = await CharacterStatsService.incrementCharacterChat(character.id);
      
      if (!result.success) {
        logger.warn('Character selection failed:', {
          reason: result.reason,
          characterId: character.id,
          userId: currentUser.uid
        });

        if (result.reason === 'notLoggedIn') {
          Modal.error({
            title: t('error.notLoggedIn'),
            content: t('auth.pleaseLoginFirst'),
            okText: t('auth.login'),
            onOk: () => window.location.href = '/login'
          });
        } else if (result.reason === 'limitReached') {
          Modal.error({
            title: t('character.limitReached.title'),
            content: t('character.limitReached.description', { 
              maxCount: SUBSCRIPTION_PLANS.CHARACTER_LIMITS[subscriptionType || 'normal']
            }),
            okText: t('subscription.choosePlan'),
            onOk: () => window.location.href = '/subscription'
          });
        } else {
          Modal.error({
            title: t('error.selectionFailed'),
            content: t('error.unexpectedError')
          });
        }
        return;
      }

      // 更新使用角色数量
      const newUsedCharacters = usedCharacters + 1;
      setUsedCharacters(newUsedCharacters);
      onSelectCharacter(character);

      logger.info('Character selected successfully:', {
        characterId: character.id,
        userId: currentUser.uid,
        newUsedCharacters
      });
    } catch (error) {
      logger.error('Error in handleSelectCharacter:', error);
      Modal.error({
        title: t('error.selectionFailed'),
        content: t('error.unexpectedError')
      });
    }
  };

  // 获取已使用的角色数量
  useEffect(() => {
    const fetchUsedCharacters = async () => {
      if (currentUser) {
        const stats = await CharacterStatsService.getUserCharacterStats(currentUser.uid);
        const used = Object.keys(stats).length;
        setUsedCharacters(used);
        
        logger.debug('Character usage stats:', {
          used,
          maxLimit: maxCharacters,
          userId: currentUser.uid
        });
      }
    };
    fetchUsedCharacters();
  }, [currentUser]);

  const renderCharacterInfo = (character: Character) => {
    const description = character.i18n?.[currentLanguage]?.description;
    const age = character.i18n?.[currentLanguage]?.age;

    const config = getLoggerConfig();
    if (config.enabled && config.level === LogLevel.DEBUG) {
      logger.debug('Rendering character info:', {
        characterId: character.id,
        currentLanguage,
        hasDescription: !!description,
        hasAge: !!age
      });
    }

    return (
      <>
        {age && <p className="text-gray-300 text-sm">{age}</p>}
        {description && (
          <p className="text-gray-300 text-sm mt-2 line-clamp-2">
            {description}
          </p>
        )}
      </>
    );
  };

  const config = getLoggerConfig();
  if (config.enabled && config.level === LogLevel.DEBUG) {
    logger.debug('Character Selector State:', {
      totalCharacters: sortedCharacters.length,
      availableCharacters: characters.length,
      subscriptionType,
      userId: currentUser?.uid,
      characterLimit: SUBSCRIPTION_PLANS.CHARACTER_LIMITS[subscriptionType || 'normal'],
      usedCharacters
    });
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <OnlineStats className="mb-6" />
        <h2 className="text-2xl font-bold text-center mb-8">
          {t('common.selectCharacter')}
        </h2>
        <MarqueeNotice messages={marqueeMessages} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCharacters.map((character) => {
            const borderStyle = getBorderStyle(character);
            
            return (
              <div
                key={character.id}
                onClick={() => handleSelectCharacter(character)}
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
                  {renderCharacterInfo(character)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          themeColor={themeColor}
        />
      )}
    </>
  );
};

export default CharacterSelector;
