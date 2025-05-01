const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

// Function to send message to AI
export async function sendToAI(message, retryCount = 0) {
    try {
        const endpoint = `${API_BASE_URL}/api/gpt`;
        console.log('[DEBUG] API URL:', endpoint);
        console.log('[DEBUG] Sending message:', message);

        // Check if API_BASE_URL is defined
        if (!API_BASE_URL) {
            throw new Error('Backend URL is not configured. Please check your environment variables.');
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify({
                query: message
            }),
            mode: 'cors',
            credentials: 'omit'
        });

        console.log('[DEBUG] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ERROR] API error response:', errorText);
            
            // Retry on 5xx errors
            if (response.status >= 500 && retryCount < MAX_RETRIES) {
                console.log(`[DEBUG] Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
                await delay(RETRY_DELAY * (retryCount + 1));
                return sendToAI(message, retryCount + 1);
            }
            
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[DEBUG] API Response data:', JSON.stringify(data, null, 2));
        
        // Check if we have a valid response structure
        if (!data || !data.response) {
            console.error('[ERROR] Invalid API response structure:', JSON.stringify(data, null, 2));
            throw new Error('Invalid response format from API');
        }

        // Validate TTS audio URL if present
        if (data.tts_audio) {
            const isAudioValid = await validateAudioUrl(data.tts_audio);
            if (!isAudioValid) {
                console.warn('[WARN] TTS audio URL is invalid or inaccessible:', data.tts_audio);
                data.tts_audio = null; // Clear invalid audio URL
            }
        }

        const result = {
            response: data.response,
            tts_audio: data.tts_audio,
            timestamp: new Date().toISOString(),
            retryCount: retryCount // Include retry information for debugging
        };

        console.log('[DEBUG] Processed response:', JSON.stringify(result, null, 2));

        return result;
    } catch (error) {
        console.error('[ERROR] Full error details:', {
            message: error.message,
            stack: error.stack,
            url: API_BASE_URL,
            retryCount
        });

        // Retry on network errors
        if (error.name === 'TypeError' && retryCount < MAX_RETRIES) {
            console.log(`[DEBUG] Retrying request due to network error (${retryCount + 1}/${MAX_RETRIES})...`);
            await delay(RETRY_DELAY * (retryCount + 1));
            return sendToAI(message, retryCount + 1);
        }

        throw error;
    }
}
