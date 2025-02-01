import { io } from 'socket.io-client';
import { MarqueeMessage, MARQUEE_CONFIG } from '../config/marquee-config';

class MarqueeService {
  private socket;
  private messages: MarqueeMessage[] = [];
  private listeners: ((messages: MarqueeMessage[]) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    if (MARQUEE_CONFIG.enabled && MARQUEE_CONFIG.websocketUrl) {
      this.initializeSocket();
    }
  }

  private initializeSocket() {
    try {
      if (!MARQUEE_CONFIG.websocketUrl) {
        console.error('WebSocket URL未配置');
        return;
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = MARQUEE_CONFIG.websocketUrl.replace(/^https?:/, wsProtocol);

      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: Number(import.meta.env.VITE_SOCKET_RECONNECTION_DELAY) || 2000,
        timeout: Number(import.meta.env.VITE_SOCKET_TIMEOUT) || 20000,
        path: import.meta.env.VITE_WEBSOCKET_PATH || '/socket.io',
        withCredentials: true,
        forceNew: true,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        autoConnect: true,
        secure: window.location.protocol === 'https:'
      });

      console.log('WebSocket配置:', {
        url: wsUrl,
        protocol: wsProtocol,
        secure: window.location.protocol === 'https:',
        path: import.meta.env.VITE_WEBSOCKET_PATH
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Marquee服务初始化失败，详细错误:', error);
    }
  }

  private setupSocketListeners() {
    if (!this.socket) {
      console.error('Socket未初始化');
      return;
    }

    this.socket.on('connect', () => {
      console.log('Marquee服务连接成功');
      this.reconnectAttempts = 0;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Marquee连接错误:', {
        error,
        socketState: this.socket?.connected,
        url: MARQUEE_CONFIG.websocketUrl,
        readyState: this.socket?.io?.engine?.transport?.ws?.readyState
      });
      this.handleReconnect();
    });

    this.socket.io.on('error', (error) => {
      console.error('Socket.IO错误:', error);
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`Socket.IO重连尝试 #${attempt}`);
    });

    this.socket.on('marquee:update', (newMessages: MarqueeMessage[]) => {
      this.messages = newMessages;
      this.notifyListeners();
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts}), 延迟: ${delay}ms`);
      
      setTimeout(() => {
        console.log(`开始第 ${this.reconnectAttempts} 次重连`);
        this.initializeSocket();
      }, delay);
    } else {
      console.error('达到最大重连次数，停止重连');
    }
  }

  subscribe(callback: (messages: MarqueeMessage[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.messages));
  }

  getMessages() {
    return this.messages;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const marqueeService = new MarqueeService(); 