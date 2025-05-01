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