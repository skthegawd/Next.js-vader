import { ModelStatus } from '../types/model';

interface WebSocketConfig {
  url: string;
  token?: string;
  clientId?: string;
  endpoint: 'model-status' | 'terminal';
  onMessage?: (data: any) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
  type: 'model_status' | 'terminal_output' | 'error' | 'ping' | 'pong';
  data: any;
  timestamp: string;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second
  private onMessageCallback: ((data: any) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private token: string | null = null;
  private clientId: string;
  private endpoint: 'model-status' | 'terminal';

  constructor(private baseUrl: string, endpoint: 'model-status' | 'terminal') {
    this.token = localStorage.getItem('auth_token') || process.env.NEXT_PUBLIC_API_TOKEN || null;
    this.endpoint = endpoint;
    this.clientId = this.generateClientId();
  }

  private generateClientId(): string {
    const prefix = this.endpoint === 'model-status' ? 'model' : 'terminal';
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private getWebSocketUrl(): string {
    const url = new URL(this.baseUrl);
    
    // Construct the proper path based on endpoint type
    if (this.endpoint === 'model-status') {
      url.pathname = `/ws/model-status`;
      url.searchParams.append('client_id', this.clientId);
    } else {
      url.pathname = `/ws/${this.clientId}`;
    }

    // Add authentication token if available
    if (this.token) {
      url.searchParams.append('token', this.token);
    }

    return url.toString();
  }

  connect() {
    try {
      const wsUrl = this.getWebSocketUrl();
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
      console.log(`WebSocket connected (${this.endpoint})`);
      this.reconnectAttempts = 0;
      this.startPingInterval();

      // Send initial subscription for model-status endpoint
      if (this.endpoint === 'model-status') {
        this.ws?.send(JSON.stringify({ type: 'subscribe' }));
      }
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
              console.error('WebSocket authentication failed');
              this.disconnect();
              return;
            }
            if (this.onErrorCallback) {
              this.onErrorCallback(new Error(data.data.message || 'Unknown error'));
            }
            break;
          case 'model_status':
          case 'terminal_output':
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
      console.error(`WebSocket error (${this.endpoint}):`, error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error as Error);
      }
    };

    this.ws.onclose = (event) => {
      console.log(`WebSocket closed (${this.endpoint}):`, event.code, event.reason);
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

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  sendCommand(command: string, args: string[] = [], watch = false) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    if (this.endpoint !== 'terminal') {
      throw new Error('Cannot send commands on non-terminal WebSocket');
    }
    this.ws.send(JSON.stringify({ command, args, watch }));
  }

  disconnect() {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create and export default instances for both endpoints
export const modelStatusWs = new WebSocketManager(process.env.NEXT_PUBLIC_WS_URL!, 'model-status');
export const terminalWs = new WebSocketManager(process.env.NEXT_PUBLIC_WS_URL!, 'terminal'); 