import { io } from 'socket.io-client';
import { MarqueeMessage, MARQUEE_CONFIG } from '../config/marquee-config';
import { logger } from '../utils/logger';

class MarqueeService {
  private socket;
  private messages: MarqueeMessage[] = [];
  private listeners: ((messages: MarqueeMessage[]) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnecting = false;

  constructor() {
    if (MARQUEE_CONFIG.enabled && MARQUEE_CONFIG.websocketUrl) {
      this.initializeSocket();
    }
  }

  private initializeSocket() {
    if (this.isConnecting) {
      logger.debug('Socket connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;
      logger.debug('Initializing WebSocket:', {
        WEBSOCKET_PATH: import.meta.env.VITE_WEBSOCKET_PATH,
        SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
        NODE_ENV: import.meta.env.NODE_ENV
      });

      if (!MARQUEE_CONFIG.websocketUrl) {
        logger.error('WebSocket URL not configured');
        this.isConnecting = false;
        return;
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = MARQUEE_CONFIG.websocketUrl.replace(/^https?:/, wsProtocol);

      // Close existing socket if it exists
      if (this.socket) {
        this.socket.close();
      }

      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: Number(import.meta.env.VITE_SOCKET_TIMEOUT) || 20000,
        path: import.meta.env.VITE_WEBSOCKET_PATH || '/socket.io',
        withCredentials: true,
        forceNew: true,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        autoConnect: true,
        secure: window.location.protocol === 'https:'
      });

      logger.debug('WebSocket configuration:', {
        url: wsUrl,
        protocol: wsProtocol,
        secure: window.location.protocol === 'https:',
        path: import.meta.env.VITE_WEBSOCKET_PATH
      });

      this.setupSocketListeners();
    } catch (error) {
      logger.error('WebSocket initialization error:', {
        error,
        stack: error.stack,
        config: {
          wsUrl: wsUrl,
          protocol: wsProtocol,
          socketConfig: this.socket?.io?.config,
          env: {
            VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
            VITE_WEBSOCKET_PATH: import.meta.env.VITE_WEBSOCKET_PATH,
            NODE_ENV: import.meta.env.NODE_ENV
          }
        }
      });
      this.isConnecting = false;
    }
  }

  private setupSocketListeners() {
    if (!this.socket) {
      logger.error('Socket not initialized');
      this.isConnecting = false;
      return;
    }

    this.socket.on('connect', () => {
      logger.info('Marquee service connected successfully');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Marquee connection error:', {
        error,
        socketState: this.socket?.connected,
        url: MARQUEE_CONFIG.websocketUrl,
        readyState: this.socket?.io?.engine?.transport?.ws?.readyState
      });
      this.isConnecting = false;
      this.handleReconnect();
    });

    this.socket.io.on('error', (error) => {
      logger.error('Socket.IO error:', error);
      this.isConnecting = false;
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      logger.debug(`Socket.IO reconnection attempt #${attempt}`, {
        attempt,
        maxAttempts: this.maxReconnectAttempts
      });
    });

    this.socket.on('marquee:update', (newMessages: MarqueeMessage[]) => {
      logger.debug('Received marquee update:', {
        messageCount: newMessages.length
      });
      this.messages = newMessages;
      this.notifyListeners();
    });

    this.socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected:', { reason });
      this.isConnecting = false;
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 10000);
      
      logger.debug(`Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
        delay,
        maxAttempts: this.maxReconnectAttempts
      });
      
      setTimeout(() => {
        if (!this.socket?.connected) {
          logger.debug(`Starting reconnection attempt ${this.reconnectAttempts}`);
          this.initializeSocket();
        }
      }, delay);
    } else {
      logger.error('Maximum reconnection attempts reached', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
      // Reset reconnection attempts after a longer delay
      setTimeout(() => {
        this.reconnectAttempts = 0;
        logger.info('Resetting reconnection attempts');
      }, 30000);
    }
  }

  subscribe(callback: (messages: MarqueeMessage[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    logger.debug('Notifying marquee listeners:', {
      listenerCount: this.listeners.length,
      messageCount: this.messages.length
    });
    this.listeners.forEach(listener => listener(this.messages));
  }

  getMessages() {
    return this.messages;
  }

  disconnect() {
    if (this.socket) {
      logger.debug('Disconnecting marquee service');
      this.socket.disconnect();
      this.isConnecting = false;
    }
  }
}

export const marqueeService = new MarqueeService(); 