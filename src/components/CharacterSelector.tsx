import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { characters /*, Character, BorderColor*/ } from '../types/character';
import { CharacterStatsService } from '../services/character-stats-service';
import { marqueeService } from '../services/marquee-service';
import MarqueeNotice from './MarqueeNotice';
import OnlineStats from './OnlineStats';
import { useAuth } from '../contexts/AuthContext';
// Remove unused import
// import { PaymentRecordService } from '../services/payment-record-service';
import { Modal } from 'antd';
import { SUBSCRIPTION_PLANS } from '../config/subscription-config';
// Remove unused import SubscriptionContextType as it's not exported, and remove assertion
import { useSubscription } from '../contexts/SubscriptionContext';
import LoginModal from './LoginModal';
import logger from '../utils/logger';
import { getLoggerConfig, LogLevel } from '../config/logger-config';
import { MarqueeMessage } from '../config/marquee-config';

interface CharacterSelectorProps {
  onSelectCharacter: (character: any) => void;
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
  // Explicitly type sortedCharacters state as any[]
  const [sortedCharacters, setSortedCharacters] = useState<any[]>([]);
  const [marqueeMessages, setMarqueeMessages] = useState<MarqueeMessage[]>([]);
  const [randomColors, setRandomColors] = useState<Record<string, string>>({});
  const { currentUser } = useAuth();
  // Access subscriptionType with a type assertion to any
  const { subscriptionType } = useSubscription() as any;
  const [usedCharacters, setUsedCharacters] = useState<number>(0);
  // Remove unused state and setter
  // const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
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
      characters: sortedCharacters.map((char: any) => ({ // Use any for char type
        id: char.id,
        i18n: char.i18n?.[currentLanguage]
      }))
    });
  }, [sortedCharacters, currentLanguage]);

  // Modify generation of random colors for characters to use HSL
  const generateRandomCharacterColor = (characterId: string) => {
    if (randomColors[characterId]) {
      return randomColors[characterId];
    }

    // Use HSL for better control over vibrancy
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 20; // 70-90%
    const lightness = 45 + Math.random() * 10; // 45-55%
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    setRandomColors(prev => ({
      ...prev,
      [characterId]: color
    }));

    return color;
  };

  // Modify border style handling to use the new character color function
  // Use any for character type
  const getBorderStyle = (character: any) => {
    // 如果有配置的边框颜色，使用预定义的类
    if (character.borderColor && character.borderColor !== 'none') {
      return `character-border-${character.borderColor}`;
    }

    // Use generated random color for the character border
    return {
      boxShadow: `0 0 15px 5px ${generateRandomCharacterColor(character.id)}`
    };
  };

  // Update getBorderClass - removed BorderColor type annotation, using string
  const getBorderClass = (borderColor?: string) => {
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
        : characters.filter((char: any) => char.gender === selectedGender); // Use any for char type

      // 根据统计数据对角色进行排序，相同对话人数的角色随机排序
      const sorted = filteredChars.sort((a: any, b: any) => { // Use any for a and b types
        const countA = stats[a.id] || 0;
        const countB = stats[b.id] || 0;
        if (countA === countB) {
          // If chat count is the same, sort randomly
          return Math.random() - 0.5;
        }
        // Sort by chat count descending
        return countB - countA;
      });

      // Show all characters, no longer limit by maxCharacters
      setSortedCharacters(sorted);
    };

    sortCharactersByPopularity();
  }, [selectedGender]); // Removed maxCharacters dependency

  // Re-sort characters with the same chat count randomly on each render
  useEffect(() => {
    const reorderSameCountCharacters = () => {
      const stats = CharacterStatsService.getCharacterCounts();
      setSortedCharacters(prev => {
        const newOrder = [...prev].sort((a: any, b: any) => { // Use any for a and b types
          const countA = stats[a.id] || 0;
          const countB = stats[b.id] || 0;
          if (countA === countB) {
            return Math.random() - 0.5;
          }
          return countB - countA; // Corrected sorting logic (was 'return countB - a.count - a.count;')
        });
        return newOrder;
      });
    };

    reorderSameCountCharacters();
  }, []); // Empty dependency array ensures this runs once on mount

  useEffect(() => {
    const unsubscribe = marqueeService.subscribe(setMarqueeMessages);
    return () => unsubscribe();
  }, []);

  // Get the maximum number of characters available to the current user
  const getMaxCharacters = () => {
     // Use a type assertion for subscriptionType access
    const maxChars = !currentUser
      ? SUBSCRIPTION_PLANS.CHARACTER_LIMITS.trial
      // Use a type assertion or check keys if necessary
      : SUBSCRIPTION_PLANS.CHARACTER_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_PLANS.CHARACTER_LIMITS || 'trial'];

    logger.debug('Character Limit Check:', {
      currentUser: !!currentUser,
      subscriptionType,
      maxChars
    });

    return maxChars;
  };

  // Modify logic for not logged in
  const handleNotLoggedIn = () => {
    setShowLoginModal(true);
  };

  // Modify character selection handler
  // Use any for character type
  const handleSelectCharacter = async (character: any) => {
    try {
      if (!currentUser) {
        handleNotLoggedIn();
        return;
      }

      logger.debug('Attempting to select character:', {
        characterId: character.id,
        userId: currentUser.uid
      });

      // Check limit BEFORE incrementing count
      const maxCharactersForUser = getMaxCharacters();
      if (usedCharacters >= maxCharactersForUser && maxCharactersForUser !== -1) {
         Modal.error({
            title: t('character.limitReached.title'),
             // Retained original t function usage
             content: t('character.limitReached.description', {
               maxCount: maxCharactersForUser // Use the correct max characters for the user
            }),
            okText: t('subscription.choosePlan'),
            onOk: () => window.location.href = '/subscription'
          });
          logger.warn('Character selection failed: Limit reached before increment.', {
            characterId: character.id,
            userId: currentUser.uid,
            usedCharacters,
            maxCharactersForUser
          });
          return;
      }


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
          // This block might be redundant if limit check is done before increment, but keeping for safety
          Modal.error({
            title: t('character.limitReached.title'),
             // Retained original t function usage
            content: t('character.limitReached.description', {
              maxCount: SUBSCRIPTION_PLANS.CHARACTER_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_PLANS.CHARACTER_LIMITS || 'normal'] // Use correct type
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

      // Update used characters count only on successful increment
      // Note: This only updates the client-side state. A re-fetch might be better for accuracy.
      // For now, incrementing client-side state for responsiveness
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

  // Fetch the number of characters used by the current user
  useEffect(() => {
    const fetchUsedCharacters = async () => {
      if (currentUser) {
        try {
            const stats = await CharacterStatsService.getUserCharacterStats(currentUser.uid);
            const used = Object.keys(stats).length;
            setUsedCharacters(used);

            logger.debug('Character usage stats:', {
              used,
              maxLimit: maxCharacters,
              userId: currentUser.uid
            });
        } catch (error) {
            logger.error('Failed to fetch user character stats:', error);
            // Optionally set usedCharacters to a default or show an error
        }
      } else {
        // Reset used characters if user logs out
        setUsedCharacters(0);
      }
    };
    fetchUsedCharacters();
  }, [currentUser, maxCharacters]); // Added maxCharacters dependency as it affects the log message


  // Use any for character type
  const renderCharacterInfo = (character: any) => {
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
       // Use a type assertion for subscriptionType access
      characterLimit: SUBSCRIPTION_PLANS.CHARACTER_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_PLANS.CHARACTER_LIMITS || 'normal'],
      usedCharacters
    });
  }

  // 计算相对亮度
  function getRelativeLuminance(r: number, g: number, b: number) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // 计算对比度
  function contrastRatio(l1: number, l2: number) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // HSL 转 RGB
  function hslToRgb(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }

  function generateAccessibleRandomColor(key: string, backgroundColor = '#181A20') {
    // 解析背景色
    const bg = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(backgroundColor);
    const bgRgb = bg
      ? [parseInt(bg[1], 16), parseInt(bg[2], 16), parseInt(bg[3], 16)]
      : [24, 26, 32]; // 默认深色

    const bgLum = getRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);

    let color, rgb, lum, ratio;
    let tries = 0;
    do {
      // 用 key 做种子，保证每次渲染一致
      const hash = Array.from(key).reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const hue = (Math.floor(Math.random() * 360) + hash * 13) % 360;
      const saturation = 70 + (hash % 20); // 70-90%
      const lightness = 55 + (hash % 20); // 55-75%，比原来更亮
      color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      rgb = hslToRgb(hue, saturation, lightness);
      lum = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
      ratio = contrastRatio(lum, bgLum);
      tries++;
      // 最多尝试10次，防止死循环
    } while (ratio < 4.5 && tries < 10);

    return color;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <OnlineStats className="mb-6" />
        <h2 className="text-2xl font-bold text-center mb-8">
          {t('common.selectCharacter')}
        </h2>
        <MarqueeNotice messages={marqueeMessages} />

        <div className="text-center text-xs md:text-sm mb-6" style={{ letterSpacing: 0.5 }}>
          <span
            style={{ color: generateAccessibleRandomColor('disclaimer1'), display: 'block', marginBottom: 2 }}
          >
            {t('disclaimers.noSensitiveUse')}
          </span>
          <span
            style={{ color: generateAccessibleRandomColor('disclaimer2'), display: 'block' }}
          >
            {t('disclaimers.nonMedicalAdvice')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCharacters.map((character: any) => { // Use any for character type
            const borderStyle = getBorderStyle(character);

            return (
              <div
                key={character.id}
                onClick={() => handleSelectCharacter(character)}
                // Use the correctly typed getBorderClass
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
