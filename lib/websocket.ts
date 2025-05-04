import { 
  WSMessage, 
  WSCommandMessage, 
  WSStatusMessage, 
  WSStreamMessage, 
  WSErrorMessage,
  WSConfig,
  MessageType
} from '../types/websocket';
import { ModelStatus } from '../types/model';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectTimeout: number;
  private onMessageCallback: ((data: any) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private onStatusCallback: ((status: WebSocketStatus) => void) | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private token: string | null = null;
  private clientId: string;
  private endpoint: 'model-status' | 'terminal';
  private isConnecting = false;
  private shouldReconnect = true;
  private connectionTimeout: number;
  private pingIntervalTime: number;

  constructor(private baseUrl: string, endpoint: 'model-status' | 'terminal', config?: Partial<WSConfig>) {
    this.token = localStorage.getItem('auth_token') || process.env.NEXT_PUBLIC_API_TOKEN || null;
    this.endpoint = endpoint;
    this.clientId = this.generateClientId();
    
    // Initialize configuration with defaults or provided values
    this.maxReconnectAttempts = config?.maxReconnectAttempts || 5;
    this.reconnectTimeout = config?.reconnectInterval || 1000;
    this.connectionTimeout = config?.connectionTimeout || 10000;
    this.pingIntervalTime = config?.pingInterval || 30000;
  }

  private generateClientId(): string {
    const prefix = this.endpoint === 'model-status' ? 'model' : 'terminal';
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getWebSocketUrl(): string {
    try {
      const url = new URL(this.baseUrl);
      
      // Convert http(s) to ws(s)
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Clean up the base URL path
      url.pathname = url.pathname.replace(/\/+$/, '');
      
      // Only add /ws if it's not already in the base URL
      if (!url.pathname.includes('/ws')) {
        url.pathname = `${url.pathname}/ws`;
      }
      
      // Add endpoint and client ID
      url.pathname = `${url.pathname}/${this.endpoint}/${this.clientId}`;

      // Add authentication token if available
      if (this.token) {
        url.searchParams.append('token', this.token);
      }

      // Add API version if available
      const apiVersion = process.env.NEXT_PUBLIC_API_VERSION;
      if (apiVersion) {
        url.searchParams.append('version', apiVersion);
      }

      const finalUrl = url.toString();
      console.debug(`[WebSocket ${this.endpoint}] Connecting to:`, finalUrl);
      return finalUrl;
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Error constructing WebSocket URL:`, error);
      throw new Error(`Failed to construct WebSocket URL: ${error.message}`);
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data) as WSMessage;
      
      switch (message.type) {
        case 'pong':
          console.debug(`[WebSocket ${this.endpoint}] Received pong`);
          break;

        case 'status':
          const statusMsg = message as WSStatusMessage;
          this.handleStatusMessage(statusMsg);
          break;

        case 'error':
          const errorMsg = message as WSErrorMessage;
          this.handleError(new Error(errorMsg.error || 'Unknown error'));
          break;

        case 'stream':
          const streamMsg = message as WSStreamMessage;
          if (this.onMessageCallback) {
            this.onMessageCallback(streamMsg.data);
          }
          break;

        case 'message':
        case 'response':
          if (this.onMessageCallback) {
            this.onMessageCallback(message.data);
          }
          break;

        default:
          console.warn(`[WebSocket ${this.endpoint}] Unhandled message type:`, message.type);
      }
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Error parsing message:`, error);
      this.handleError(error as Error);
    }
  }

  private handleStatusMessage(message: WSStatusMessage) {
    const status = message.data.status;
    this.updateStatus(status);
    
    if (status === 'error' && message.data.message) {
      this.handleError(new Error(message.data.message));
    }
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.debug(`[WebSocket ${this.endpoint}] Connected successfully`);
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
      this.startPingInterval();

      // Send initial subscription message
      this.sendMessage({
        type: 'status',
        data: { status: 'connected' },
        client_id: this.clientId,
        timestamp: new Date().toISOString()
      });
    };

    this.ws.onmessage = this.handleMessage.bind(this);

    this.ws.onerror = (event) => {
      const errorMessage = event instanceof ErrorEvent ? event.message : 'Unknown WebSocket error';
      console.error(`[WebSocket ${this.endpoint}] Connection error:`, errorMessage);
      this.handleError(new Error(`WebSocket connection error: ${errorMessage}`));
    };

    this.ws.onclose = (event) => {
      console.debug(`[WebSocket ${this.endpoint}] Connection closed:`, {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      this.updateStatus('disconnected');
      this.stopPingInterval();
      
      if (this.shouldReconnect && event.code !== 1000 && event.code !== 1008) {
        this.handleReconnect();
      }
    };
  }

  private sendMessage(message: WSMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn(`[WebSocket ${this.endpoint}] Cannot send message - connection not open`);
    }
  }

  async sendCommand(command: string, args: string[] = [], watch = false) {
    const message: WSCommandMessage = {
      type: 'command',
      command,
      args,
      watch,
      client_id: this.clientId,
      timestamp: new Date().toISOString(),
      data: null
    };

    this.sendMessage(message);
  }

  private startPingInterval() {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.sendMessage({
        type: 'ping',
        data: null,
        client_id: this.clientId,
        timestamp: new Date().toISOString()
      });
    }, this.pingIntervalTime);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
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
        }, this.connectionTimeout);

        if (!this.ws) {
          clearTimeout(timeout);
          reject(new Error('WebSocket not initialized'));
          return;
        }

        this.ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.ws.onerror = (error) => {
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
    const delay = Math.min(this.reconnectTimeout * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.debug(`[WebSocket ${this.endpoint}] Reconnecting in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Reconnection failed:`, error);
    }
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
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