import { ModelStatus } from '../types/model';

interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onMessage?: (data: any) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
  type: 'chat' | 'stream' | 'error' | 'heartbeat';
  data: any;
  timestamp: string;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second
  private onMessageCallback: ((data: ModelStatus) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(private url: string) {}

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          return; // Ignore pong messages
        }
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.stopPingInterval();
      this.handleReconnect();
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  onMessage(callback: (data: ModelStatus) => void) {
    this.onMessageCallback = callback;
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  disconnect() {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create and export a default instance
const ws = new WebSocketManager(process.env.NEXT_PUBLIC_WS_URL!);

export default ws; 