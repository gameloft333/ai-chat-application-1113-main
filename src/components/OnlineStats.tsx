import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getFirestore, collection, query, where, getCountFromServer } from 'firebase/firestore';

interface OnlineStatsProps {
  className?: string;
  refreshInterval?: number; // 添加刷新间隔配置，默认10秒
  minOnlineCount?: number; // 最小在线人数
  maxOnlineRange?: number; // 最大额外在线人数范围
  timeWaveFactor?: number; // 时间波动因子
  baseTimeFactor?: number; // 基础时间系数
  peakUpdateInterval?: number; // 新增：峰值更新间隔，默认30分钟
  peakFluctuationRange?: number; // 新增：峰值波动范围，默认10-30%
  firebaseMultiplier?: number; // Firebase用户数的倍数因子
}

const OnlineStats: React.FC<OnlineStatsProps> = ({ 
  className = '',
  refreshInterval = 10000, // 默认10秒
  minOnlineCount = 1000, // 默认最小在线人数
  maxOnlineRange = 38000,  // 默认最大额外范围
  timeWaveFactor = 0.3,   // 默认时间波动因子，更大的时间波动因子，波动范围越大，0-1之间
  baseTimeFactor = 0.7,   // 默认基础时间系数，更大的基础时间系数，波动范围越大，0-1之间
  peakUpdateInterval = 1800000, // 30分钟
  peakFluctuationRange = 0.2, // 20%
  firebaseMultiplier = 2.5, // 默认Firebase用户数倍数
}) => {
  const { t, currentLanguage } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onlineCount, setOnlineCount] = useState(0);
  const [peakCount, setPeakCount] = useState(0);
  const [onlineColor, setOnlineColor] = useState('');
  const [peakColor, setPeakColor] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState(0);
  
  // 格式化日期时间
  const formatDateTime = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 生成符合 WCAG 标准的随机颜色
  const generateAccessibleColor = (isDark = false) => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.random() * 20;
    const lightness = isDark ? 65 + Math.random() * 15 : 45 + Math.random() * 10;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 新增: 获取Firebase注册用户数
  const fetchRegisteredUsers = async () => {
    try {
      const db = getFirestore();
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('status', '==', 'active'));
      if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
        console.log('正在查询Firebase用户数...');
      }
      const snapshot = await getCountFromServer(q);
      const count = snapshot.data().count;
      if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
        console.log('Firebase用户数查询成功:', count);
      }
      return count;
    } catch (error) {
      console.error('获取Firebase用户数失败:', error);
      // 返回默认值而不是0，避免显示异常
      return minOnlineCount / firebaseMultiplier;
    }
  };

  /**
   * 计算在线人数
   * 算法说明：
   * 1. baseCount: 基础在线人数范围 minOnlineCount 到 (minOnlineCount + maxOnlineRange)
   * 2. timeMultiplier: 时间影响因子，根据一天24小时计算：
   *    - 使用正弦函数模拟一天中的人数波动
   *    - 0点到24点转换为0到2π的角度
   *    - 乘以timeWaveFactor再加baseTimeFactor使波动范围在
   *      (baseTimeFactor-timeWaveFactor)到(baseTimeFactor+timeWaveFactor)之间
   *    - 这样可以模拟出：
   *      * 凌晨时段(0-6点)：约(baseTimeFactor-timeWaveFactor)的基础人数
   *      * 早晚高峰(7-9点,17-19点)：约(baseTimeFactor+timeWaveFactor)的基础人数
   *      * 日间时段(10-16点)：约baseTimeFactor的基础人数
   *      * 夜间时段(20-23点)：约baseTimeFactor的基础人数
   * 1. 获取Firebase用户数
   * 2. 计算原有算法的基础人数
   * 3. 计算时间影响因子
   * 4. 合并计算
   */
  const calculateOnlineCount = async () => {
    // 1. 获取Firebase用户数
    const firebaseUsers = await fetchRegisteredUsers();
    setRegisteredUsers(firebaseUsers);
    
    // 2. 计算原有算法的基础人数
    const baseCount = minOnlineCount + Math.floor(Math.random() * maxOnlineRange);
    
    // 3. 计算时间影响因子
    const hourAngle = (currentTime.getHours() / 24) * Math.PI * 2;
    const timeMultiplier = Math.sin(hourAngle) * timeWaveFactor + baseTimeFactor;
    
    // 4. 合并计算
    const firebaseBonus = firebaseUsers * firebaseMultiplier; // Firebase用户数的贡献
    const finalCount = Math.floor((baseCount + firebaseBonus) * timeMultiplier);
    
    if (import.meta.env.VITE_SHOW_DEBUG_LOGS === 'true') {
      console.log('在线人数计算:', {
        Firebase用户数: firebaseUsers,
        基础人数: baseCount,
        时间系数: timeMultiplier,
        Firebase加成: firebaseBonus,
        最终人数: finalCount
      });
    }

    return finalCount;
  };

  /**
   * 计算峰值
   * 算法说明：
   * 1. 基于当前在线人数计算
   * 2. 添加随机波动因子(10%-30%)
   * 3. 考虑时间段特征(早晚高峰)
   * 4. 保持相对稳定性
   */
  const calculatePeakCount = (currentOnline: number) => {
    const hour = currentTime.getHours();
    
    // 根据时间段调整基础倍数
    let baseMultiplier = 1.2; // 基础倍数
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      // 早晚高峰时段
      baseMultiplier = 1.5;
    } else if (hour >= 23 || hour <= 5) {
      // 深夜时段
      baseMultiplier = 1.3;
    }
    
    // 添加随机波动
    const fluctuation = 1 + (Math.random() * peakFluctuationRange);
    
    // 计算新峰值，并确保至少比当前在线人数高出20%
    const calculatedPeak = Math.floor(currentOnline * baseMultiplier * fluctuation);
    const minimumPeak = Math.floor(currentOnline * 1.2); // 确保峰值至少比当前在线人数高20%
    
    return Math.max(calculatedPeak, minimumPeak);
  };

  useEffect(() => {
    const initializeStats = async () => {
      const initialOnlineCount = await calculateOnlineCount();
      setOnlineCount(initialOnlineCount);
      setPeakCount(calculatePeakCount(initialOnlineCount));
      setOnlineColor(generateAccessibleColor(true));
      setPeakColor(generateAccessibleColor(true));
    };

    initializeStats();

    // 更新时间
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 更新在线人数和颜色
    const statsTimer = setInterval(async () => {
      const newOnlineCount = await calculateOnlineCount();
      setOnlineCount(newOnlineCount);
      setOnlineColor(generateAccessibleColor(true));
      
      setPeakCount(prev => {
        const currentPeak = Math.max(prev, calculatePeakCount(newOnlineCount));
        return currentPeak;
      });
    }, refreshInterval);

    // 峰值更新定时器
    const peakTimer = setInterval(() => {
      setPeakCount(prev => {
        const newPeak = calculatePeakCount(onlineCount);
        // 确保新峰值不会低于当前在线人数的1.2倍
        return Math.max(prev, newPeak, Math.floor(onlineCount * 1.2));
      });
      setPeakColor(generateAccessibleColor(true));
    }, peakUpdateInterval);

    return () => {
      clearInterval(timer);
      clearInterval(statsTimer);
      clearInterval(peakTimer);
    };
  }, [refreshInterval, peakUpdateInterval]);

  return (
    <div className={`text-center ${className}`}>
      <div className="flex justify-center items-center gap-4 text-2xl font-bold">
        <span>{formatDateTime(currentTime)}</span>
        <span className="mx-4">|</span>
        <span>
          <span style={{ color: onlineColor }}>
            {onlineCount.toLocaleString()}
          </span>
          {' '}{t('stats.online')}
          {/* 用于在主页显示Firebase用户数
          {(import.meta.env.DEV && import.meta.env.VITE_SHOW_DEBUG_INFO === 'true') && (
            <span className="text-sm ml-2">
              (Firebase: {registeredUsers.toLocaleString()})
            </span>
          )}
          */}
        </span>
        <span className="mx-4">|</span>
        <span>
          <span style={{ color: peakColor }}>
            {peakCount.toLocaleString()}
          </span>
          {' '}{t('stats.peak')}
        </span>
      </div>
    </div>
  );
};

export default OnlineStats; 