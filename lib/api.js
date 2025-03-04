import axios from 'axios';

const API_BASE = 'https://vader-yp5n.onrender.com';

export const registerUser = async (userId) => {
    try {
        await axios.post(`${API_BASE}/auth/register`, { user_id: userId });
    } catch (error) {
        console.error('User registration failed:', error);
    }
};

export const getAuthTokenFromAPI = async (userId) => {
    try {
        const response = await axios.post(`${API_BASE}/auth/token`, { user_id: userId });
        return response.data.token;
    } catch (error) {
        console.error('Failed to retrieve auth token:', error);
        return null;
    }
};

export const refreshToken = async () => {
    try {
        const userId = localStorage.getItem("vader_user_id");
        const response = await axios.post(`${API_BASE}/auth/refresh`, { user_id: userId });
        return response.data.token;
    } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
    }
};

export const authorizedRequest = async (method, url, data = null) => {
    try {
        let token = localStorage.getItem("vader_auth_token");
        let response = await axios({
            method,
            url: `${API_BASE}${url}`,
            data,
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.warn("Token expired, refreshing token...");
            const newToken = await refreshToken();
            if (newToken) {
                localStorage.setItem("vader_auth_token", newToken);
                return authorizedRequest(method, url, data);
            }
        }
        console.error("API request failed:", error);
        throw error;
    }
};

export const sendToAPI = async (text, sessionId) => {
    return authorizedRequest('POST', '/api/gpt', { query: text, session_id: sessionId, gpt_type: 'coding_gpt' });
};

export const textToSpeech = async (text) => {
    return authorizedRequest('POST', '/api/tts', { text });
};