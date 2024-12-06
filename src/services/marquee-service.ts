import { io } from 'socket.io-client';
import { MarqueeMessage, MARQUEE_CONFIG } from '../config/marquee-config';

class MarqueeService {
  private socket;
  private messages: MarqueeMessage[] = [];
  private listeners: ((messages: MarqueeMessage[]) => void)[] = [];

  constructor() {
    if (MARQUEE_CONFIG.enabled && MARQUEE_CONFIG.websocketUrl) {
      this.socket = io(MARQUEE_CONFIG.websocketUrl);
      
      this.socket.on('connect', () => {
        console.log('Marquee WebSocket connected');
      });
      
      this.socket.on('marquee:update', (newMessages: MarqueeMessage[]) => {
        this.messages = newMessages;
        this.notifyListeners();
      });

      this.socket.on('error', (error) => {
        console.error('Marquee WebSocket error:', error);
      });
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