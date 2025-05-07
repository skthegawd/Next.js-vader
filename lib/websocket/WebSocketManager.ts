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

export class WebSocketManager extends EventEmitter {
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
    try {
      // Get the WebSocket URL from environment
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!baseUrl) {
        throw new Error('WebSocket URL not configured - NEXT_PUBLIC_WS_URL is missing');
      }

      const wsUrl = new URL(baseUrl);
      
      // Ensure WebSocket protocol
      if (!wsUrl.protocol.startsWith('ws')) {
        wsUrl.protocol = 'wss:';
      }

      // Use /api/ws path for WebSocket endpoint
      wsUrl.pathname = '/api/ws';

      // Add required query parameters
      wsUrl.searchParams.set('endpoint', this.endpoint);
      wsUrl.searchParams.set('client_id', this.clientId);
      wsUrl.searchParams.set('version', 'v1');

      const finalUrl = wsUrl.toString();
      console.log('[WebSocketManager] Connecting to:', finalUrl);
      return finalUrl;
    } catch (error) {
      console.error('[WebSocketManager] Error constructing WebSocket URL:', error);
      throw error;
    }
  }

  public connect(options: WebSocketOptions = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocketManager] Already connected, skipping connection attempt');
      return;
    }

    try {
      const wsUrl = this.getWebSocketUrl();
      
      // Close existing connection if any
      if (this.ws) {
        try {
          this.ws.close();
        } catch (err) {
          console.warn('[WebSocketManager] Error closing existing connection:', err);
        }
        this.ws = null;
      }

      // Create new WebSocket connection
      console.log('[WebSocketManager] Attempting connection...');
      this.ws = new WebSocket(wsUrl);
      this.setStatus('connecting');

      // Set up event handlers
      this.ws.onopen = () => {
        console.log('[WebSocketManager] Connection established');
        this.setStatus('connected');
        this.reconnectCount = 0;
        
        // Send initial identification message
        this.send({
          type: 'identify',
          client_id: this.clientId,
          endpoint: this.endpoint
        });
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocketManager] Received:', data);
          this.emit('message', data);
        } catch (err) {
          console.error('[WebSocketManager] Failed to parse message:', err);
        }
      };

      this.ws.onerror = (error: Event) => {
        console.error('[WebSocketManager] Connection error:', error);
        this.setStatus('error');
        this.emit('error', new Error('WebSocket connection error'));
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log('[WebSocketManager] Connection closed:', event);
        this.setStatus('disconnected');
        
        // Attempt reconnection if not a clean close
        if (!event.wasClean && this.reconnectCount < this.reconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectCount), 30000);
          console.log(`[WebSocketManager] Attempting reconnect in ${delay}ms (${this.reconnectCount + 1}/${this.reconnectAttempts})`);
          
          setTimeout(() => {
            this.reconnectCount++;
            this.connect();
          }, delay);
        }
      };

      // Set up custom event handlers if provided
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

  private handleError(error: Event | Error): void {
    const wsUrl = this.getWebSocketUrl();
    let errorMessage: string;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error instanceof Event) {
      errorMessage = error instanceof ErrorEvent ? error.message : 'Unknown WebSocket error';
    } else {
      errorMessage = 'Unknown error type';
    }

    const fullError = `[WebSocketManager] Error connecting to ${wsUrl}: ${errorMessage}`;
    console.error(fullError, {
      readyState: this.ws?.readyState,
      endpoint: this.endpoint,
      clientId: this.clientId,
      hasToken: !!this.token,
      reconnectCount: this.reconnectCount,
      error
    });
    
    const wsError = new Error(fullError);
    this.setStatus('error');
    this.emit('error', wsError);
    
    // Attempt to reconnect on error
    if (this.ws) {
      try {
        this.ws.close();
      } catch (err) {
        console.warn('[WebSocketManager] Error closing connection after error:', err);
      }
      this.handleClose({ 
        code: 1006, 
        reason: fullError, 
        wasClean: false 
      } as CloseEvent);
    }
  }

  private handleClose(event: CloseEvent): void {
    const closeReason = event.reason || 'No reason provided';
    console.log(`[WebSocketManager] Connection closed:`, {
      code: event.code,
      reason: closeReason,
      wasClean: event.wasClean,
      endpoint: this.endpoint,
      clientId: this.clientId,
      reconnectCount: this.reconnectCount,
      maxRetries: this.reconnectAttempts
    });

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

    // Exponential backoff for reconnection
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