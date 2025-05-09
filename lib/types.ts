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

// Chat message type
export interface ChatMessage {
  role: string;
  content: string;
}

// Session state
export interface SessionState {
  sessionId: string;
  isActive: boolean;
  lastActivity: number;
  messageCount: number;
}

// Streaming state
export interface StreamingState {
  isStreaming: boolean;
  currentChunk: string;
  error: string | null;
  eventSource: EventSource | null;
}

// Error state
export interface ErrorState {
  hasError: boolean;
  errorMessage: string;
  errorDetails: any;
  retryCount: number;
  retryAfter: number;
}

// Rate limit state
export interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
  lastRequest: number;
}

// Chat context state
export interface ChatContextState {
  session: SessionState;
  streaming: StreamingState;
  error: ErrorState;
  rateLimit: RateLimitState;
  messages: ChatMessage[];
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  setStreaming: (s: Partial<StreamingState>) => void;
  setError: (e: Partial<ErrorState>) => void;
  setRateLimit: (r: Partial<RateLimitState>) => void;
  reset: () => void;
} 