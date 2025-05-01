import { API_BASE_URL, WS_BASE_URL, API_ENDPOINTS, API_CONFIG, WS_CONFIG } from './config';
import { logger } from './logger';

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// WebSocket connection management
let ws = null;
let wsReconnectTimer = null;
let wsReconnectAttempts = 0;

export function initializeWebSocket(onMessage, onStatusChange) {
    if (!WS_BASE_URL) {
        console.error('[ERROR] WebSocket URL is not configured');
        return;
    }

    const connect = () => {
        if (wsReconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.error('[ERROR] Max WebSocket reconnection attempts reached');
            onStatusChange?.('failed');
            return;
        }

        ws = new WebSocket(API_ENDPOINTS.WEBSOCKET);

        ws.onopen = () => {
            console.log('[DEBUG] WebSocket connected');
            onStatusChange?.('connected');
            wsReconnectAttempts = 0;
            if (wsReconnectTimer) {
                clearTimeout(wsReconnectTimer);
                wsReconnectTimer = null;
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage?.(data);
            } catch (error) {
                console.error('[ERROR] Failed to parse WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('[DEBUG] WebSocket disconnected');
            onStatusChange?.('disconnected');
            wsReconnectAttempts++;
            wsReconnectTimer = setTimeout(connect, WS_CONFIG.RECONNECT_DELAY);
        };

        ws.onerror = (error) => {
            console.error('[ERROR] WebSocket error:', error);
            onStatusChange?.('error');
        };
    };

    connect();
    return () => {
        if (ws) {
            ws.close();
            ws = null;
        }
        if (wsReconnectTimer) {
            clearTimeout(wsReconnectTimer);
            wsReconnectTimer = null;
        }
        wsReconnectAttempts = 0;
    };
}

// Function to get current model status
export async function getModelStatus() {
    try {
        const response = await fetch(API_ENDPOINTS.MODEL_STATUS, {
            method: 'GET',
            headers: API_CONFIG.DEFAULT_HEADERS,
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch model status: ${response.status}`);
        }

        const data = await response.json();
        return {
            gptModel: data.gpt_model,
            voiceModel: data.voice_model,
            isStreaming: data.streaming_enabled,
            temperature: data.temperature,
            maxTokens: data.max_tokens
        };
    } catch (error) {
        console.error('[ERROR] Failed to fetch model status:', error);
        throw error;
    }
}

// Function to validate audio URL
async function validateAudioUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error('[ERROR] Audio URL validation failed:', error);
        return false;
    }
}

export async function streamFromBackend(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/frontend/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'text',
                data: data
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            try {
                const parsedChunk = JSON.parse(chunk);
                // Process chunk data
                logger.debug('Received chunk:', parsedChunk);
            } catch (error) {
                logger.error('Error parsing chunk:', error);
            }
        }
    } catch (error) {
        logger.error('Streaming error:', error);
        throw error;
    }
}

export async function sendToAI(message, options = {}) {
    const { stream = false, onChunk = null } = options;

    if (stream) {
        return streamFromBackend(message);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/frontend/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                ...options
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        logger.error('API error:', error);
        throw error;
    }
}
