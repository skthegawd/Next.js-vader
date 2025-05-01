const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Function to send message to AI
export async function sendToAI(message) {
    try {
        console.log('Sending request to:', `${API_BASE_URL}/gpt`);
        
        const response = await fetch(`${API_BASE_URL}/gpt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: message,
                session_id: 'default_session'
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        return {
            response: data.response || data.message || data.answer,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error sending message to AI:', error);
        throw error;
    }
}
