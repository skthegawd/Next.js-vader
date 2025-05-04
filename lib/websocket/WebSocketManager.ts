import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  payload?: any;
  client_id?: string;
  timestamp?: string;
}

interface WebSocketOptions {
  token?: string;
  baseUrl?: string;
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketManager extends EventEmitter {
  private static instances: Map<string, WebSocketManager> = new Map();
  private ws: WebSocket | null = null;
  private clientId: string;
  private endpoint: string;
  private token: string | null = null;
  private baseUrl: string;
  private reconnectAttempts: number;
  private reconnectInterval: number;
  private reconnectCount: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private status: ConnectionStatus = 'disconnected';
  private pingInterval: NodeJS.Timeout | null = null;

  private constructor(endpoint: string) {
    super();
    this.clientId = this.generateClientId();
    this.endpoint = endpoint;
    this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || '';
    this.reconnectAttempts = 5;
    this.reconnectInterval = 3000;
  }

  public static getInstance(endpoint: string = 'default'): WebSocketManager {
    if (!this.instances.has(endpoint)) {
      this.instances.set(endpoint, new WebSocketManager(endpoint));
    }
    return this.instances.get(endpoint)!;
  }

  private generateClientId(): string {
    return `client-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
  }

  private getWebSocketUrl(): string {
    // Get base URL from instance or environment
    let baseUrl = (this.baseUrl || process.env.NEXT_PUBLIC_WS_URL || '').trim();
    if (!baseUrl) {
      throw new Error('WebSocket URL not configured');
    }

    // Remove trailing slashes and /ws if present
    baseUrl = baseUrl.replace(/\/+$/, '').replace(/\/ws$/, '');

    // Construct the full URL with the correct path structure
    const url = `${baseUrl}/ws/${encodeURIComponent(this.endpoint)}/${encodeURIComponent(this.clientId)}`;
    
    // Add token as a query parameter if provided
    if (this.token) {
      return `${url}?token=${encodeURIComponent(this.token)}`;
    }
    
    return url;
  }

  public connect(options: WebSocketOptions = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocketManager] Already connected, skipping connection attempt');
      return;
    }

    // Update configuration
    if (options.baseUrl) {
      // Ensure baseUrl is properly formatted
      this.baseUrl = options.baseUrl.trim().replace(/\/+$/, '').replace(/\/ws$/, '');
    }
    if (options.token) this.token = options.token;
    this.reconnectAttempts = options.reconnectAttempts || 5;
    this.reconnectInterval = options.reconnectInterval || 3000;

    try {
      const wsUrl = this.getWebSocketUrl();
      console.log('[WebSocketManager] Connecting to:', wsUrl, {
        endpoint: this.endpoint,
        clientId: this.clientId,
        hasToken: !!this.token
      });
      
      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.ws = new WebSocket(wsUrl);
      this.setStatus('connecting');

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);

      if (options.onMessage) this.on('message', options.onMessage);
      if (options.onError) this.on('error', options.onError);
      if (options.onStatusChange) this.on('statusChange', options.onStatusChange);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      console.error('[WebSocketManager] Connection error:', error);
      this.setStatus('error');
      this.emit('error', error);
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.emit('statusChange', status);
  }

  private handleOpen(): void {
    const wsUrl = this.getWebSocketUrl();
    console.log(`[WebSocketManager] Connected successfully to ${wsUrl}`);
    this.setStatus('connected');
    this.reconnectCount = 0;
    this.startPingInterval();

    // Send initial handshake with authentication
    this.send({
      type: 'handshake',
      payload: {
        client_id: this.clientId,
        endpoint: this.endpoint,
        token: this.token,
        version: '1.0' // Add protocol version
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('[WebSocketManager] Received:', data);
      this.emit('message', data);
    } catch (err) {
      console.error('[WebSocketManager] Failed to parse message:', err);
    }
  }

  private handleError(error: Event): void {
    const wsUrl = this.getWebSocketUrl();
    const errorMessage = `[WebSocketManager] Error connecting to ${wsUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMessage);
    
    const wsError = new Error(errorMessage);
    this.setStatus('error');
    this.emit('error', wsError);
    
    // Attempt to reconnect on error
    if (this.ws) {
      this.ws.close();
      this.handleClose({ code: 1006, reason: errorMessage, wasClean: false } as CloseEvent);
    }
  }

  private handleClose(event: CloseEvent): void {
    const closeReason = event.reason || 'No reason provided';
    console.log(`[WebSocketManager] Connection closed: code=${event.code}, reason=${closeReason}`);
    this.setStatus('disconnected');
    this.stopPingInterval();

    // Don't reconnect if it was a clean close or max attempts reached
    if (event.wasClean || this.reconnectCount >= this.reconnectAttempts) {
      if (event.wasClean) {
        console.log('[WebSocketManager] Clean connection close, not attempting reconnect');
      } else {
        console.log(`[WebSocketManager] Max reconnection attempts (${this.reconnectAttempts}) reached`);
        this.emit('error', new Error(`Failed to connect after ${this.reconnectAttempts} attempts`));
      }
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectCount), 30000);
    console.log(`[WebSocketManager] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectCount + 1}/${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectCount++;
      this.connect();
    }, delay);
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      this.send({
        type: 'ping',
        payload: {
          timestamp: new Date().toISOString()
        }
      });
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(message: WebSocketMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocketManager] Cannot send message - connection not open');
      return false;
    }

    try {
      const fullMessage = {
        ...message,
        client_id: this.clientId,
        timestamp: new Date().toISOString()
      };
      console.log('[WebSocketManager] Sending:', fullMessage);
      this.ws.send(JSON.stringify(fullMessage));
      return true;
    } catch (err) {
      console.error('[WebSocketManager] Failed to send message:', err);
      return false;
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getClientId(): string {
    return this.clientId;
  }
}

export default WebSocketManager; 