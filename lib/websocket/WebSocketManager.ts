import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  payload?: any;
  client_id?: string;
  timestamp?: string;
}

interface WebSocketOptions {
  endpoint?: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
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
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      throw new Error('WebSocket URL not configured. Please set NEXT_PUBLIC_WS_URL in your environment variables.');
    }
    const baseUrl = wsUrl.replace(/\/$/, '');
    return `${baseUrl}/ws/${encodeURIComponent(this.endpoint)}/${encodeURIComponent(this.clientId)}`;
  }

  public connect(options: WebSocketOptions = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.reconnectAttempts = options.reconnectAttempts || 5;
    this.reconnectInterval = options.reconnectInterval || 3000;

    try {
      const wsUrl = this.getWebSocketUrl();
      console.log('[WebSocketManager] Connecting to:', wsUrl);
      
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
      console.error('[WebSocketManager] Connection error:', err);
      this.setStatus('error');
      this.emit('error', err);
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.emit('statusChange', status);
  }

  private handleOpen(): void {
    console.log('[WebSocketManager] Connected successfully');
    this.setStatus('connected');
    this.reconnectCount = 0;
    this.startPingInterval();

    // Send initial handshake
    this.send({
      type: 'handshake',
      payload: {
        client_id: this.clientId,
        endpoint: this.endpoint
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
    console.error('[WebSocketManager] Error:', error);
    this.setStatus('error');
    this.emit('error', error);
    
    // Attempt to reconnect on error
    if (this.ws) {
      this.ws.close();
      this.handleClose({ code: 1006, reason: 'Error occurred', wasClean: false } as CloseEvent);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WebSocketManager] Connection closed:', event.code, event.reason);
    this.setStatus('disconnected');
    this.stopPingInterval();

    // Don't reconnect if it was a clean close
    if (event.wasClean) {
      console.log('[WebSocketManager] Clean connection close, not attempting reconnect');
      return;
    }

    if (this.reconnectCount < this.reconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectCount), 30000);
      console.log(`[WebSocketManager] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectCount + 1}/${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectCount++;
        this.connect();
      }, delay);
    } else {
      console.log('[WebSocketManager] Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
    }
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