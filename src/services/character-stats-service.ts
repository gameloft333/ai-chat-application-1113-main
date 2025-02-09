import { characters } from '../types/character';
import { auth } from '../config/firebase-config';
import { SUBSCRIPTION_PLANS } from '../config/subscription-config';

export class CharacterStatsService {
  private static STORAGE_KEY = 'character_chat_stats';

  static async incrementCharacterChat(characterId: string): Promise<{success: boolean; reason?: string}> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return { success: false, reason: 'notLoggedIn' };
      }
  
      // 获取用户订阅类型
      const userSubscription = await this.getUserSubscriptionType(userId);
      console.log('当前用户订阅类型:', userSubscription);
      
      // 获取角色限制
      const characterLimit = SUBSCRIPTION_PLANS.CHARACTER_LIMITS[userSubscription];
      console.log('角色数量限制:', characterLimit);
  
      // 获取已使用的角色统计
      const stats = await this.getUserCharacterStats(userId);
      const usedCount = Object.keys(stats).length;
      console.log('已使用角色数:', usedCount);
  
      // 严格检查限制
      if (characterLimit !== -1 && usedCount >= characterLimit) {
        return { success: false, reason: 'limitReached' };
      }
  
      // 更新统计
      const newStats = { ...stats };
      newStats[characterId] = (newStats[characterId] || 0) + 1;
      
      // 使用单独的key存储用户角色统计
      const userStatsKey = `character_stats_${userId}`;
      localStorage.setItem(userStatsKey, JSON.stringify(newStats));
      
      console.log('角色统计更新成功:', newStats);
      return { success: true };
    } catch (error) {
      console.error('更新角色统计失败:', error);
      return { success: false, reason: 'error' };
    }
  }

  static getStats(): { [key: string]: Set<string> } {
    try {
      const statsJson = localStorage.getItem(this.STORAGE_KEY);
      if (!statsJson) return {};
      
      const rawStats = JSON.parse(statsJson);
      // 将普通数组转换回 Set
      const stats: { [key: string]: Set<string> } = {};
      Object.entries(rawStats).forEach(([key, users]) => {
        stats[key] = new Set(users as string[]);
      });
      return stats;
    } catch (error) {
      console.error('Error getting character stats:', error);
      return {};
    }
  }

  public static async getUserCharacterStats(userId: string): Promise<Record<string, number>> {
    try {
      // 添加调试日志
      console.log('获取用户角色统计:', userId);
      
      // 从本地存储获取数据
      const stats = localStorage.getItem(`character_stats_${userId}`);
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.error('获取角色统计失败:', error);
      return {};
    }
  }

  public static getCharacterCounts(): Record<string, number> {
    try {
      const stats = localStorage.getItem('character_counts');
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.error('获取角色计数失败:', error);
      return {};
    }
  }

  private static saveStats(stats: { [key: string]: Set<string> }): void {
    try {
      // 将 Set 转换为数组以便存储
      const saveableStats: { [key: string]: string[] } = {};
      Object.entries(stats).forEach(([key, users]) => {
        saveableStats[key] = Array.from(users);
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveableStats));
    } catch (error) {
      console.error('Error saving character stats:', error);
    }
  }

  private static async getUserSubscriptionType(userId: string): Promise<string> {
    try {
      // 优先从 localStorage 获取
      const localData = localStorage.getItem(`subscription_${userId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        return parsed.type || 'normal';
      }
      
      // 如果没有订阅信息，返回普通用户类型
      return 'normal';
    } catch (error) {
      console.error('获取用户订阅类型失败:', error);
      return 'normal';
    }
  }
}