import { API_BASE_URL, WS_BASE_URL, API_ENDPOINTS, API_CONFIG, WS_CONFIG } from './config';

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

// Function to send message to AI with streaming support
export async function sendToAI(message, options = {}, retryCount = 0) {
    try {
        console.log('[DEBUG] API URL:', API_ENDPOINTS.GPT);
        console.log('[DEBUG] Sending message:', message);

        if (!API_BASE_URL) {
            throw new Error('Backend URL is not configured. Please check your environment variables.');
        }

        const {
            stream = false,
            onChunk = null,
            temperature = API_CONFIG.DEFAULT_TEMPERATURE,
            maxTokens = API_CONFIG.DEFAULT_MAX_TOKENS
        } = options;

        const requestBody = {
            query: message,
            stream,
            temperature,
            max_tokens: maxTokens
        };

        const headers = stream ? API_CONFIG.STREAM_HEADERS : API_CONFIG.DEFAULT_HEADERS;

        const response = await fetch(API_ENDPOINTS.GPT, {
            method: 'POST',
            headers: {
                ...headers,
                'Origin': window.location.origin
            },
            body: JSON.stringify(requestBody),
            mode: 'cors',
            credentials: 'omit'
        });

        console.log('[DEBUG] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ERROR] API error response:', errorText);
            
            if (response.status >= 500 && retryCount < API_CONFIG.MAX_RETRIES) {
                console.log(`[DEBUG] Retrying request (${retryCount + 1}/${API_CONFIG.MAX_RETRIES})...`);
                await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
                return sendToAI(message, options, retryCount + 1);
            }
            
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        // Extract model information from headers
        const modelInfo = {
            gptModel: response.headers.get('X-GPT-Model'),
            voiceModel: response.headers.get('X-Voice-Model'),
            temperature: response.headers.get('X-Temperature'),
            maxTokens: response.headers.get('X-Max-Tokens')
        };

        if (stream && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                if (onChunk) {
                    onChunk(chunk);
                }
            }
            
            return {
                response: 'Streaming complete',
                modelInfo,
                timestamp: new Date().toISOString()
            };
        }

        const data = await response.json();
        console.log('[DEBUG] API Response data:', JSON.stringify(data, null, 2));
        
        if (!data || !data.response) {
            console.error('[ERROR] Invalid API response structure:', JSON.stringify(data, null, 2));
            throw new Error('Invalid response format from API');
        }

        if (data.tts_audio) {
            const isAudioValid = await validateAudioUrl(data.tts_audio);
            if (!isAudioValid) {
                console.warn('[WARN] TTS audio URL is invalid or inaccessible:', data.tts_audio);
                data.tts_audio = null;
            }
        }

        return {
            response: data.response,
            tts_audio: data.tts_audio,
            modelInfo,
            timestamp: new Date().toISOString(),
            retryCount
        };
    } catch (error) {
        console.error('[ERROR] Full error details:', {
            message: error.message,
            stack: error.stack,
            url: API_BASE_URL,
            retryCount
        });

        if (error.name === 'TypeError' && retryCount < API_CONFIG.MAX_RETRIES) {
            console.log(`[DEBUG] Retrying request due to network error (${retryCount + 1}/${API_CONFIG.MAX_RETRIES})...`);
            await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
            return sendToAI(message, options, retryCount + 1);
        }

        throw error;
    }
}
