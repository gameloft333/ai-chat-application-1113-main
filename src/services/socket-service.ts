import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';

export class SocketService {
  private static socket: Socket | null = null;
  
  static initialize() {
    try {
      // 添加重试和错误处理逻辑
      this.socket = io(import.meta.env.VITE_API_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        path: import.meta.env.VITE_WEBSOCKET_PATH || '/socket.io',
        withCredentials: true
      });

      this.socket.on('connect_error', (error) => {
        logger.error('Socket连接错误:', error);
      });

      this.socket.on('connect', () => {
        logger.info('Socket连接成功');
      });

      return this.socket;
    } catch (error) {
      logger.error('Socket初始化失败:', error);
      return null;
    }
  }

  static getSocket() {
    if (!this.socket) {
      return this.initialize();
    }
    return this.socket;
  }

  static initializePaymentListeners() {
    socket.on('payment:success', async (data) => {
      try {
        // 1. 更新用户信息
        await UserStore.refreshUserInfo();
        
        // 2. 触发界面更新
        const event = new CustomEvent('payment:completed', {
          detail: data
        });
        window.dispatchEvent(event);
        
        // 3. 显示成功提示
        toast.success('会员升级成功！');
      } catch (error) {
        console.error('处理支付成功消息失败:', error);
      }
    });
  }
} 