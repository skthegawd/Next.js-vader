declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: { [key: string]: any };
  export default content;
}

// WebSocket types
interface WebSocketMessage {
  type: 'chat' | 'stream' | 'error' | 'heartbeat';
  data: any;
  timestamp: string;
}

// API Response types
interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

// Theme types
interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  [key: string]: string;
}

interface ThemeFont {
  family: string;
  weight: number | string;
  size: string;
}

interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  fonts: {
    primary: ThemeFont;
    secondary: ThemeFont;
  };
}

// Session types
interface SessionData {
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

export as namespace VaderAI; 