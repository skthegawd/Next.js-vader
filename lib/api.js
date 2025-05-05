const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// WebSocket connection management
let ws = null;
let wsReconnectTimer = null;

// Create the api object with all methods
const api = {
    initializeWebSocket,
    getModelStatus,
    sendToAI,
    initialize: async () => {
        try {
            const status = await getModelStatus();
            return { 
                data: {
                    features: {
                        websocket: true
                    },
                    clientId: Date.now().toString(),
                    ...status
                }
            };
        } catch (error) {
            console.error('[ERROR] Failed to initialize API:', error);
            throw error;
        }
    }
};

export function initializeWebSocket(onMessage, onStatusChange) {
    if (!WS_BASE_URL) {
        console.error('[ERROR] WebSocket URL is not configured');
        return;
    }

    const connect = () => {
        // Use the full WebSocket URL directly
        ws = new WebSocket(WS_BASE_URL);

        ws.onopen = () => {
            console.log('[DEBUG] WebSocket connected to:', WS_BASE_URL);
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
        const endpoint = `${API_BASE_URL}/model-status`;
        console.log('[DEBUG] Fetching model status from:', endpoint);
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
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
        const endpoint = `${API_BASE_URL}/chat`;
        console.log('[DEBUG] API URL:', endpoint);
        console.log('[DEBUG] Sending message:', message);

        // Check if API_BASE_URL is defined
        if (!API_BASE_URL) {
            throw new Error('API URL is not configured. Please check your environment variables.');
        }

        const {
            stream = false,
            onChunk = null,
            temperature,
            maxTokens
        } = options;

        const requestBody = {
            message,
            stream,
            ...(temperature !== undefined && { temperature }),
            ...(maxTokens !== undefined && { max_tokens: maxTokens })
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': stream ? 'text/event-stream' : 'application/json'
            },
            body: JSON.stringify(requestBody)
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

        if (stream && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                if (onChunk) {
                    onChunk(chunk);
                }
            }
            return;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('[ERROR] Failed to send message:', error);
        throw error;
    }
}

// Export both named exports and default export
export { api };
export default api;
