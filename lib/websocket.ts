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
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private url: string;
  private onMessage?: (data: any) => void;
  private onStatusChange?: (status: WebSocketStatus) => void;

  constructor(config: WebSocketConfig) {
    this.url = config.url;
    this.maxReconnectAttempts = config.reconnectAttempts || 5;
    this.reconnectDelay = config.reconnectDelay || 5000;
    this.onMessage = config.onMessage;
    this.onStatusChange = config.onStatusChange;
  }

  connect(clientId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.onStatusChange?.('connecting');

    try {
      this.ws = new WebSocket(`${this.url}/${clientId}`);
      this.setupEventHandlers();
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.handleError(error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  private handleOpen(): void {
    console.log('[WebSocket] Connected');
    this.onStatusChange?.('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'heartbeat':
          this.handleHeartbeat();
          break;
        case 'error':
          console.error('[WebSocket] Error message:', message.data);
          break;
        default:
          this.onMessage?.(message);
      }
    } catch (error) {
      console.error('[WebSocket] Message parsing error:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WebSocket] Disconnected:', event.code, event.reason);
    this.onStatusChange?.('disconnected');
    this.stopHeartbeat();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event | any): void {
    console.error('[WebSocket] Error:', error);
    this.onStatusChange?.('error');
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat', data: { timestamp: new Date().toISOString() } });
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleHeartbeat(): void {
    // Reset any connection monitoring here if needed
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.ws?.readyState === WebSocket.CLOSED) {
        this.connect(this.getClientId());
      }
    }, delay);
  }

  send(data: any): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  private getClientId(): string {
    // Extract client ID from the current WebSocket URL
    const match = this.ws?.url.match(/\/([^/]+)$/);
    return match?.[1] || '';
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create and export a default instance
const ws = new WebSocketManager({
  url: process.env.NEXT_PUBLIC_WS_URL!,
  reconnectAttempts: 5,
  reconnectDelay: 5000,
});

export default ws; 