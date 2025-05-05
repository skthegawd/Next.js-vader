export interface WSConfig {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  connectionTimeout?: number;
  pingInterval?: number;
}

export interface ModelConfig {
  chat: string;
  voice: string;
}

export interface ModelStatusData {
  streaming_enabled: boolean;
  temperature: number;
  max_tokens: number;
  models: ModelConfig;
}

export type MessageType = 
  | 'ping'
  | 'pong'
  | 'status'
  | 'error'
  | 'stream'
  | 'message'
  | 'response'
  | 'model_status';

export interface WSMessage {
  type: MessageType;
  data: any;
  client_id?: string;
  timestamp?: string;
}

export interface WSStatusMessage extends WSMessage {
  type: 'status';
  data: {
    status: string;
    message?: string;
  };
}

export interface WSErrorMessage extends WSMessage {
  type: 'error';
  error: string;
}

export interface WSStreamMessage extends WSMessage {
  type: 'stream';
  data: string;
}

export interface WSModelStatusMessage extends WSMessage {
  type: 'model_status';
  data: ModelStatusData;
}

export interface WSCommandMessage extends WSMessage {
  type: 'command';
  command: string;
  args?: string[];
  watch?: boolean;
} 