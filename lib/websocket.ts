import { ModelStatus } from '../types/model';

interface WebSocketConfig {
  url: string;
  token?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  onMessage?: (data: any) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
  type: 'model_status' | 'error' | 'ping' | 'pong';
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
  private token: string | null = null;

  constructor(private url: string) {
    // Try to get token from localStorage or environment
    this.token = localStorage.getItem('auth_token') || process.env.NEXT_PUBLIC_API_TOKEN || null;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  connect() {
    try {
      // Add token to URL if available
      const wsUrl = this.token 
        ? `${this.url}?token=${encodeURIComponent(this.token)}`
        : this.url;

      this.ws = new WebSocket(wsUrl);
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
        const data = JSON.parse(event.data) as WebSocketMessage;
        
        switch (data.type) {
          case 'pong':
            // Handle pong response
            break;
          case 'error':
            if (data.data?.auth === false) {
              // Handle authentication error
              console.error('WebSocket authentication failed');
              this.disconnect();
              return;
            }
            if (this.onErrorCallback) {
              this.onErrorCallback(new Error(data.data.message || 'Unknown error'));
            }
            break;
          case 'model_status':
            if (this.onMessageCallback) {
              this.onMessageCallback(data.data);
            }
            break;
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

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.stopPingInterval();
      
      // Don't reconnect if closed due to auth failure
      if (event.code !== 1008) {
        this.handleReconnect();
      }
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
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
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