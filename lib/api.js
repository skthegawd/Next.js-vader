const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const WS_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('http', 'ws') || '';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// WebSocket connection management
let ws = null;
let wsReconnectTimer = null;

export function initializeWebSocket(onMessage, onStatusChange) {
    if (!WS_BASE_URL) {
        console.error('[ERROR] WebSocket URL is not configured');
        return;
    }

    const connect = () => {
        ws = new WebSocket(`${WS_BASE_URL}/ws`);

        ws.onopen = () => {
            console.log('[DEBUG] WebSocket connected');
            onStatusChange?.('connected');
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
            wsReconnectTimer = setTimeout(connect, 5000);
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
    };
}

// Function to get current model status
export async function getModelStatus() {
    try {
        const endpoint = `${API_BASE_URL}/api/model-status`;
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
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
        const endpoint = `${API_BASE_URL}/api/gpt`;
        console.log('[DEBUG] API URL:', endpoint);
        console.log('[DEBUG] Sending message:', message);

        // Check if API_BASE_URL is defined
        if (!API_BASE_URL) {
            throw new Error('Backend URL is not configured. Please check your environment variables.');
        }

        const {
            stream = false,
            onChunk = null,
            temperature,
            maxTokens
        } = options;

        const requestBody = {
            query: message,
            stream,
            ...(temperature !== undefined && { temperature }),
            ...(maxTokens !== undefined && { max_tokens: maxTokens })
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': stream ? 'text/event-stream' : 'application/json',
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
            
            if (response.status >= 500 && retryCount < MAX_RETRIES) {
                console.log(`[DEBUG] Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
                await delay(RETRY_DELAY * (retryCount + 1));
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

        if (error.name === 'TypeError' && retryCount < MAX_RETRIES) {
            console.log(`[DEBUG] Retrying request due to network error (${retryCount + 1}/${MAX_RETRIES})...`);
            await delay(RETRY_DELAY * (retryCount + 1));
            return sendToAI(message, options, retryCount + 1);
        }

        throw error;
    }
}
