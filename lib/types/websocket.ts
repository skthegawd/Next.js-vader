export interface WSConfig {
  maxReconnectAttempts: number;
  reconnectInterval: number;
  connectionTimeout: number;
  pingInterval: number;
}

export interface ModelConfig {
  chat: string;
  voice: string;
}

export interface ModelStatusData {
  model_name: string;
  status: 'loading' | 'ready' | 'error';
  error?: string;
  progress?: number;
}

export type MessageType = 'message' | 'command' | 'status' | 'stream' | 'error' | 'response' | 'pong';

export interface WSMessage {
  type: MessageType;
  timestamp: string;
  client_id?: string;
}

export interface WSStatusMessage extends WSMessage {
  type: 'status';
  status: string;
  data?: ModelStatusData;
}

export interface WSErrorMessage extends WSMessage {
  type: 'error';
  error: string;
  code: WebSocketErrorCode;
  details?: any;
}

export interface WSStreamMessage extends WSMessage {
  type: 'stream';
  data: any;
  stream_id: string;
}

export interface WSCommandMessage extends WSMessage {
  type: 'command';
  command: string;
  args?: any[];
}

export class WebSocketError extends Error {
  constructor(message: string, public code: WebSocketErrorCode) {
    super(message);
    this.name = 'WebSocketError';
  }
}

export enum WebSocketErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  SERVER_ERROR = 'SERVER_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
} 