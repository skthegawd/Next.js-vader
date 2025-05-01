const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Function to send message to AI
export async function sendToAI(message) {
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
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[DEBUG] API Response data:', data);
        
        // Check if we have a valid response structure
        if (!data || !data.response) {
            console.error('[ERROR] Invalid API response structure:', data);
            throw new Error('Invalid response format from API');
        }

        return {
            response: data.response,
            tts_audio: data.tts_audio,  // Include the TTS audio URL
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('[ERROR] Full error details:', {
            message: error.message,
            stack: error.stack,
            url: API_BASE_URL
        });
        throw error;
    }
}
