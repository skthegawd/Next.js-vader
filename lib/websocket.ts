import { 
  WSMessage, 
  WSCommandMessage, 
  WSStatusMessage, 
  WSStreamMessage, 
  WSErrorMessage,
  WSConfig,
  MessageType,
  ModelStatusData
} from './types';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketManager {
  private static instance: WebSocketManager | null = null;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectTimeout: number;
  private onMessageCallback: ((data: any) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private onStatusCallback: ((status: WebSocketStatus) => void) | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private token: string | null = null;
  private clientId: string | null = null;
  private endpoint: 'model-status' | 'terminal';
  private isConnecting = false;
  private shouldReconnect = true;
  private connectionTimeout: number;
  private pingIntervalTime: number;

  private constructor(endpoint: 'model-status' | 'terminal', config?: Partial<WSConfig>) {
    if (typeof window === 'undefined') {
      throw new Error('WebSocketManager cannot be instantiated on the server side');
    }

    this.endpoint = endpoint;
    this.token = localStorage.getItem('auth_token');
    
    // Initialize configuration with defaults or provided values
    this.maxReconnectAttempts = config?.maxReconnectAttempts || 5;
    this.reconnectTimeout = config?.reconnectInterval || 1000;
    this.connectionTimeout = config?.connectionTimeout || 10000;
    this.pingIntervalTime = config?.pingInterval || 30000;

    // Set default client ID if not provided
    this.setClientId(`client-${Math.random().toString(36).substring(7)}`);
  }

  public static getInstance(endpoint: 'model-status' | 'terminal', config?: Partial<WSConfig>): WebSocketManager {
    try {
      if (!WebSocketManager.instance) {
        WebSocketManager.instance = new WebSocketManager(endpoint, config);
        
        // Initialize connection
        WebSocketManager.instance.connect().catch(error => {
          console.error(`[WebSocket] Failed to initialize ${endpoint}:`, error);
        });
      }
      return WebSocketManager.instance;
    } catch (error) {
      console.error('[WebSocket] Error creating instance:', error);
      throw error;
    }
  }

  private getWebSocketUrl(): string {
    if (!this.clientId) {
      throw new Error('Client ID not set');
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_WS_URL environment variable is not set');
      }

      const url = new URL(baseUrl);
      url.protocol = url.protocol.replace('http', 'ws');
      url.pathname = '/ws';
      
      url.searchParams.append('endpoint', this.endpoint);
      url.searchParams.append('client_id', this.clientId);

      if (this.token) {
        url.searchParams.append('token', this.token);
      }

      const apiVersion = process.env.NEXT_PUBLIC_API_VERSION;
      if (apiVersion) {
        url.searchParams.append('version', apiVersion);
      }

      return url.toString();
    } catch (error) {
      console.error('[WebSocket] Error constructing URL:', error);
      throw error;
    }
  }

  public setClientId(clientId: string) {
    this.clientId = clientId;
  }

  private handleMessage = (event: MessageEvent) => {
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
        case 'message':
        case 'response':
          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
          break;

        default:
          console.warn(`[WebSocket ${this.endpoint}] Unhandled message type:`, message.type);
      }
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Error parsing message:`, error);
      this.handleError(error as Error);
    }
  };

  public async connect(): Promise<void> {
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

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.debug(`[WebSocket ${this.endpoint}] Connected successfully`);
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
      this.startPingInterval();
    };

    this.ws.onmessage = this.handleMessage;

    this.ws.onerror = (event) => {
      const errorMessage = event instanceof ErrorEvent ? event.message : 'Unknown WebSocket error';
      console.error(`[WebSocket ${this.endpoint}] Connection error:`, errorMessage);
      this.handleError(new Error(`WebSocket connection error: ${errorMessage}`));
    };

    this.ws.onclose = (event) => {
      this.updateStatus('disconnected');
      this.stopPingInterval();
      
      if (this.shouldReconnect && event.code !== 1000) {
        this.handleReconnect();
      }
    };
  }

  public onStatus(callback: (status: WebSocketStatus) => void) {
    this.onStatusCallback = callback;
  }

  public onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  public onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  private updateStatus(status: WebSocketStatus) {
    if (this.onStatusCallback) {
      this.onStatusCallback(status);
    }
  }

  private handleError(error: Error) {
    this.updateStatus('error');
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  private async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[WebSocket ${this.endpoint}] Max reconnection attempts reached`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectTimeout * Math.pow(2, this.reconnectAttempts), 30000);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.connect();
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Reconnection failed:`, error);
    }
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

  private sendMessage(message: WSMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn(`[WebSocket ${this.endpoint}] Cannot send message - connection not open`);
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'Disconnected by client');
      this.ws = null;
    }
  }

  public static cleanup() {
    if (WebSocketManager.instance) {
      WebSocketManager.instance.disconnect();
      WebSocketManager.instance = null;
    }
  }
}

export const initializeWebSocket = (endpoint: 'model-status' | 'terminal', config?: Partial<WSConfig>): WebSocketManager => {
  return WebSocketManager.getInstance(endpoint, config);
};

export { WebSocketManager };
export default initializeWebSocket; 