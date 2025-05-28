export const Config = {
  // WebSocket Configuration
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  WS_RECONNECT_ATTEMPTS: Number(process.env.NEXT_PUBLIC_WS_RECONNECT_ATTEMPTS) || 5,
  WS_RECONNECT_INTERVAL: Number(process.env.NEXT_PUBLIC_WS_RECONNECT_INTERVAL) || 1000,
  WS_CONNECTION_TIMEOUT: Number(process.env.NEXT_PUBLIC_WS_CONNECTION_TIMEOUT) || 10000,
  WS_PING_INTERVAL: Number(process.env.NEXT_PUBLIC_WS_PING_INTERVAL) || 30000,

  // Memory Monitor Configuration
  MEMORY_REFRESH_INTERVAL: Number(process.env.NEXT_PUBLIC_MEMORY_REFRESH_INTERVAL) || 60000,

  // Theme Configuration
  THEME_STORAGE_KEY: 'death-star-theme',
  DEFAULT_THEME: {
    name: 'default',
    colors: {
      primary: '#FF0000',
      secondary: '#000000',
      background: '#1A1A1A',
      text: '#FFFFFF',
      accent: '#FFE81F',
    },
    fonts: {
      primary: {
        family: 'system-ui',
        weight: 400,
        size: '16px',
      },
      secondary: {
        family: 'system-ui',
        weight: 400,
        size: '14px',
      },
    },
  },

  // API Configuration
  API_VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
  API_TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,

  // Feature Flags
  FEATURES: {
    WEBSOCKET_ENABLED: process.env.NEXT_PUBLIC_WEBSOCKET_ENABLED !== 'false',
    MEMORY_MONITOR_ENABLED: process.env.NEXT_PUBLIC_MEMORY_MONITOR_ENABLED !== 'false',
    MODEL_STATUS_ENABLED: process.env.NEXT_PUBLIC_MODEL_STATUS_ENABLED !== 'false',
  },
} as const;

export type ConfigType = typeof Config;
export default Config;

// Helper to generate a UUID (RFC4122 v4)
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getOrCreateSessionId(): string {
  let sessionId = '';
  if (typeof window !== 'undefined') {
    sessionId = localStorage.getItem('chat_session_id') || '';
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('chat_session_id', sessionId);
    }
  }
  return sessionId;
}

export const BACKEND_URL = "https://vader-yp5n.onrender.com";
export const WS_URL = "wss://vader-yp5n.onrender.com/ws";
export const API_URL = "https://vader-yp5n.onrender.com";
export const API_VERSION = "v1"; 