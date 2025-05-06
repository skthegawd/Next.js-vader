import { 
  WSMessage, 
  WSCommandMessage, 
  WSStatusMessage, 
  WSStreamMessage, 
  WSErrorMessage,
  WSConfig,
  MessageType,
  ModelStatusData,
  WebSocketError,
  WebSocketErrorCode
} from './types';
import { Config } from './config';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketManager {
  private static instances: Map<string, WebSocketManager> = new Map();
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
  private readonly storageKey: string;

  private constructor(endpoint: 'model-status' | 'terminal', config?: Partial<WSConfig>) {
    if (typeof window === 'undefined') {
      throw new Error('WebSocketManager cannot be instantiated on the server side');
    }

    this.endpoint = endpoint;
    this.token = localStorage.getItem('auth_token');
    this.storageKey = `ws_${endpoint}_state`;
    
    // Initialize configuration with defaults or provided values
    this.maxReconnectAttempts = config?.maxReconnectAttempts || Config.WS_RECONNECT_ATTEMPTS;
    this.reconnectTimeout = config?.reconnectInterval || Config.WS_RECONNECT_INTERVAL;
    this.connectionTimeout = config?.connectionTimeout || Config.WS_CONNECTION_TIMEOUT;
    this.pingIntervalTime = config?.pingInterval || Config.WS_PING_INTERVAL;

    // Restore connection state
    this.restoreState();

    // Set default client ID if not provided
    if (!this.clientId) {
      this.setClientId(`client-${Math.random().toString(36).substring(7)}`);
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;

    const state = {
      clientId: this.clientId,
      shouldReconnect: this.shouldReconnect,
      lastConnected: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Failed to save state:`, error);
    }
  }

  private restoreState() {
    if (typeof window === 'undefined') return;

    try {
      const savedState = localStorage.getItem(this.storageKey);
      if (savedState) {
        const state = JSON.parse(savedState);
        this.clientId = state.clientId;
        this.shouldReconnect = state.shouldReconnect;

        // Check if last connection was recent (within 5 minutes)
        const lastConnected = new Date(state.lastConnected);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (lastConnected > fiveMinutesAgo) {
          this.connect().catch(error => {
            console.error(`[WebSocket ${this.endpoint}] Failed to reconnect:`, error);
          });
        }
      }
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Failed to restore state:`, error);
    }
  }

  public static getInstance(endpoint: 'model-status' | 'terminal', config?: Partial<WSConfig>): WebSocketManager {
    try {
      if (!WebSocketManager.instances.has(endpoint)) {
        const instance = new WebSocketManager(endpoint, config);
        WebSocketManager.instances.set(endpoint, instance);
        
        // Initialize connection
        instance.connect().catch(error => {
          console.error(`[WebSocket] Failed to initialize ${endpoint}:`, error);
        });
      }
      return WebSocketManager.instances.get(endpoint)!;
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
          this.handleError(new WebSocketError(errorMsg.error, errorMsg.code));
          break;

        case 'stream':
        case 'message':
        case 'response':
          if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
          break;

        default:
          this.handleError(new WebSocketError(
            `Unhandled message type: ${message.type}`,
            WebSocketErrorCode.INVALID_MESSAGE
          ));
      }
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Error parsing message:`, error);
      this.handleError(new WebSocketError(
        'Failed to parse WebSocket message',
        WebSocketErrorCode.INVALID_MESSAGE
      ));
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
          reject(new WebSocketError('Connection timeout', WebSocketErrorCode.CONNECTION_TIMEOUT));
        }, this.connectionTimeout);

        if (!this.ws) {
          clearTimeout(timeout);
          reject(new WebSocketError('WebSocket not initialized', WebSocketErrorCode.INITIALIZATION_ERROR));
          return;
        }

        this.ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(new WebSocketError(
            error instanceof ErrorEvent ? error.message : 'Unknown WebSocket error',
            WebSocketErrorCode.CONNECTION_FAILED
          ));
        };
      });
    } catch (error) {
      console.error(`[WebSocket ${this.endpoint}] Connection error:`, error);
      this.handleError(error instanceof Error ? error : new Error(String(error)));
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
      this.handleError(new WebSocketError(errorMessage, WebSocketErrorCode.CONNECTION_FAILED));
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
    if (status === 'connected') {
      this.saveState();
    }
  }

  private handleError(error: Error | WebSocketError) {
    if (this.onErrorCallback) {
      if (!(error instanceof WebSocketError)) {
        // Convert generic errors to WebSocketError
        if (error.message.includes('timeout')) {
          error = new WebSocketError(error.message, WebSocketErrorCode.CONNECTION_TIMEOUT);
        } else if (error.message.includes('failed')) {
          error = new WebSocketError(error.message, WebSocketErrorCode.CONNECTION_FAILED);
        } else if (error.message.includes('network')) {
          error = new WebSocketError(error.message, WebSocketErrorCode.NETWORK_ERROR);
        } else {
          error = new WebSocketError(error.message, WebSocketErrorCode.UNKNOWN_ERROR);
        }
      }
      this.onErrorCallback(error);
    }
    this.updateStatus('error');
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
    this.saveState();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.stopPingInterval();
    this.updateStatus('disconnected');
  }

  public static cleanup() {
    WebSocketManager.instances.forEach((instance, endpoint) => {
      instance.disconnect();
    });
    WebSocketManager.instances.clear();
  }
}

// Export a function for backward compatibility
export const initializeWebSocket = (endpoint: 'model-status' | 'terminal', config?: Partial<WSConfig>): WebSocketManager => {
  return WebSocketManager.getInstance(endpoint, config);
};

// Export the WebSocketManager class as default
export { WebSocketManager };
export default WebSocketManager; 