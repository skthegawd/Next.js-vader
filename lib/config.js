// API Base URLs
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
export const WS_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('http', 'ws') || '';

// API Endpoints
export const API_ENDPOINTS = {
    GPT: `${API_BASE_URL}/api/gpt`,
    MODEL_STATUS: `${API_BASE_URL}/api/model-status`,
    TTS: `${API_BASE_URL}/api/tts`,
    STT: `${API_BASE_URL}/api/stt`,
    WAKEWORD: `${API_BASE_URL}/api/wakeword`,
    WEBSOCKET: `${WS_BASE_URL}/ws`
};

// API Configuration
export const API_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    STREAM_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
    }
};

// WebSocket Configuration
export const WS_CONFIG = {
    RECONNECT_DELAY: 5000,
    MAX_RECONNECT_ATTEMPTS: 5
};

// Model Configuration
export const MODEL_CONFIG = {
    DEFAULT_TEMPERATURE: 0.7,
    DEFAULT_MAX_TOKENS: 2048,
    SUPPORTED_MODELS: ['gpt-4', 'gpt-3.5-turbo']
}; 