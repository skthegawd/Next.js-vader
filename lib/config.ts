export const Config = {
  // WebSocket Configuration
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
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