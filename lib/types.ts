export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface SessionData {
  clientId: string;
  features: {
    websocket: boolean;
    streaming: boolean;
    codeAnalysis: boolean;
  };
  limits: {
    maxTokens: number;
    rateLimit: number;
  };
}

export interface ThemeData {
  name: string;
  colors: Record<string, string>;
  fonts: {
    primary: string;
    secondary: string;
  };
}

export enum WebSocketErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class WebSocketError extends Error {
  code: WebSocketErrorCode;

  constructor(message: string, code: WebSocketErrorCode) {
    super(message);
    this.name = 'WebSocketError';
    this.code = code;
  }
} 