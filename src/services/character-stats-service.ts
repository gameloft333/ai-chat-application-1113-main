import { characters } from '../types/character';
import { auth } from '../config/firebase-config';

export class CharacterStatsService {
  private static STORAGE_KEY = 'character_chat_stats';

  static async incrementCharacterChat(characterId: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const stats = this.getStats();
      if (!stats[characterId]) {
        stats[characterId] = new Set();
      }
      stats[characterId].add(userId);
      this.saveStats(stats);
    } catch (error) {
      console.error('Error incrementing character chat:', error);
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

  static getCharacterCounts(): { [key: string]: number } {
    try {
      const stats = this.getStats();
      const counts: { [key: string]: number } = {};
      
      // 确保所有角色都有初始值
      characters.forEach(char => {
        counts[char.id] = 0; // 默认值为0
      });
      
      // 添加统计数据
      Object.entries(stats).forEach(([id, users]) => {
        if (counts.hasOwnProperty(id)) {
          counts[id] = (users as Set<string>).size;
        }
      });
      
      return counts;
    } catch (error) {
      console.error('Error getting character counts:', error);
      // 发生错误时返回所有角色的默认统计
      return characters.reduce((acc, char) => {
        acc[char.id] = 0;
        return acc;
      }, {} as Record<string, number>);
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
}