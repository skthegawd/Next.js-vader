import axios from 'axios';
import { getAuthToken, refreshToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com";
const TIMEOUT = 10000; // 10 seconds timeout for API calls

console.log("Using API Base URL:", API_URL);

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    },
});

const authorizedRequest = async (method, url, data = {}) => {
    let token = getAuthToken();
    if (!token) {
        console.warn("No access token found, attempting to refresh...");
        token = await refreshToken();
        if (!token) throw new Error("Authentication required.");
    }

    try {
        const response = await apiClient({
            method,
            url,
            data,
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("[DEBUG] API Response:", response.data);
        return response.data;
    } catch (error) {
        console.error(`API Error: ${url}`, error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.warn("Unauthorized, attempting token refresh...");
            token = await refreshToken();
            if (token) return authorizedRequest(method, url, data);
        }
        throw error;
    }
};

export const sendToAI = async (text, sessionId = "default_session") => {
    console.log("[DEBUG] Sending request to GPT API:", text);
    return await authorizedRequest("POST", "/gpt", { query: text, session_id: sessionId });
};

export const textToSpeech = async (text) => {
    return await authorizedRequest("POST", "/tts", { text });
};

export const checkBackendHealth = async () => {
    try {
        const response = await apiClient.get("/health");
        return response.data;
    } catch (error) {
        console.error("Backend health check failed:", error.message);
        return { status: "unavailable" };
    }
};
