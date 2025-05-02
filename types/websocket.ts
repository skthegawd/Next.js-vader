export type MessageType = 
  | 'message' 
  | 'error' 
  | 'stream' 
  | 'stream_end' 
  | 'ping' 
  | 'pong' 
  | 'status' 
  | 'command' 
  | 'response';

export interface WSMessage<T = any> {
  type: MessageType;
  data: T;
  client_id: string;
  timestamp?: string;
  error?: string;
}

export interface WSCommandMessage extends WSMessage {
  type: 'command';
  command: string;
  args?: string[];
  watch?: boolean;
}

export interface WSStatusMessage extends WSMessage {
  type: 'status';
  data: {
    status: 'connected' | 'disconnected' | 'error';
    message?: string;
  };
}

export interface WSStreamMessage extends WSMessage {
  type: 'stream';
  data: {
    content: string;
    done: boolean;
  };
}

export interface WSErrorMessage extends WSMessage {
  type: 'error';
  error: string;
  data: null;
}

export interface WSConfig {
  url: string;
  onMessage?: (message: WSMessage) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  connectionTimeout?: number;
} 