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
  private onStatusCallback: ((status: WebSocketStatus) => void) | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private token: string | null = null;
  private clientId: string;
  private endpoint: 'model-status' | 'terminal';
  private isConnecting = false;
  private shouldReconnect = true;

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
    try {
      const url = new URL(this.baseUrl);
      
      // Ensure we're using wss:// for HTTPS sites
      if (url.protocol === 'https:') {
        url.protocol = 'wss:';
      } else {
        url.protocol = 'ws:';
      }
      
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
    } catch (error) {
      console.error('Error constructing WebSocket URL:', error);
      throw error;
    }
  }

  onStatus(callback: (status: WebSocketStatus) => void) {
    this.onStatusCallback = callback;
  }

  private updateStatus(status: WebSocketStatus) {
    if (this.onStatusCallback) {
      this.onStatusCallback(status);
    }
    console.debug(`[WebSocket ${this.endpoint}] Status: ${status}`);
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws?.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;
    this.updateStatus('connecting');

    try {
      const wsUrl = this.getWebSocketUrl();
      console.debug(`[WebSocket ${this.endpoint}] Connecting to ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);
      this.setupEventListeners();

      // Wait for connection or error
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000); // 10 second timeout

        this.ws!.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.ws!.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Connection error:`, error);
      this.handleError(error as Error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.debug(`[WebSocket ${this.endpoint}] Connected`);
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
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
            // Reset connection monitoring
            break;
          case 'error':
            if (data.data?.auth === false) {
              console.error(`[WebSocket ${this.endpoint}] Authentication failed`);
              this.shouldReconnect = false;
              this.disconnect();
              this.handleError(new Error('Authentication failed'));
              return;
            }
            this.handleError(new Error(data.data.message || 'Unknown error'));
            break;
          case 'model_status':
          case 'terminal_output':
            if (this.onMessageCallback) {
              this.onMessageCallback(data.data);
            }
            break;
        }
      } catch (error) {
        console.error(`[WebSocket ${this.endpoint}] Error parsing message:`, error);
      }
    };

    this.ws.onerror = (error) => {
      console.error(`[WebSocket ${this.endpoint}] Error:`, error);
      this.handleError(error as Error);
    };

    this.ws.onclose = (event) => {
      console.debug(`[WebSocket ${this.endpoint}] Closed:`, event.code, event.reason);
      this.updateStatus('disconnected');
      this.stopPingInterval();
      
      // Don't reconnect if closed intentionally or due to auth failure
      if (this.shouldReconnect && event.code !== 1000 && event.code !== 1008) {
        this.handleReconnect();
      }
    };
  }

  private handleError(error: Error) {
    this.updateStatus('error');
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  private async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.shouldReconnect) {
      console.error(`[WebSocket ${this.endpoint}] Max reconnection attempts reached`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.debug(`[WebSocket ${this.endpoint}] Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Reconnection failed:`, error);
    }
  }

  private startPingInterval() {
    this.stopPingInterval(); // Clear any existing interval
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ 
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
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
    this.shouldReconnect = false;
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'Disconnected by client');
      this.ws = null;
    }
  }
}

// Create and export default instances for both endpoints
const baseUrl = process.env.NEXT_PUBLIC_WS_URL!;
console.debug('[WebSocket] Initializing with base URL:', baseUrl);

export const modelStatusWs = new WebSocketManager(baseUrl, 'model-status');
export const terminalWs = new WebSocketManager(baseUrl, 'terminal'); 