import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com";
const TIMEOUT = 10000;

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: TIMEOUT,
    headers: {
        "Content-Type": "application/json"
    },
});

// Store and retrieve auth token from localStorage
const getAuthToken = () => localStorage.getItem("vader_auth_token");
const saveAuthToken = (token) => localStorage.setItem("vader_auth_token", token);

// Register a new user if no token exists
export const registerUser = async (userId) => {
    try {
        const response = await apiClient.post("/auth/register", { user_id: userId });
        console.log("[DEBUG] Registered User:", response.data);
        return response.data;
    } catch (error) {
        console.error("[ERROR] Registration failed:", error.response?.data || error.message);
    }
};

// Get a new auth token
export const getAuthTokenFromAPI = async (userId) => {
    try {
        const response = await apiClient.post("/auth/token", { user_id: userId });
        const token = response.data?.access_token;
        if (token) {
            saveAuthToken(token);
            console.log("[DEBUG] Token stored successfully");
        }
        return token;
    } catch (error) {
        console.error("[ERROR] Token fetch failed:", error.response?.data || error.message);
    }
};

// Refresh token logic
export const refreshToken = async () => {
    console.log("[DEBUG] Refreshing token...");
    const userId = localStorage.getItem("vader_user_id");
    if (!userId) {
        console.warn("[WARNING] No user ID found, cannot refresh token.");
        return null;
    }
    return await getAuthTokenFromAPI(userId);
};

// Function to make authorized requests
const authorizedRequest = async (method, url, data = {}) => {
    let token = getAuthToken();
    if (!token) {
        console.warn("[WARNING] No token found, attempting to refresh...");
        token = await refreshToken();
    }
    if (!token) throw new Error("Authentication required.");

    try {
        const response = await apiClient({
            method,
            url,
            data,
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`[ERROR] API Request Failed: ${url}`, error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.warn("[WARNING] Unauthorized, attempting token refresh...");
            token = await refreshToken();
            if (token) return authorizedRequest(method, url, data);
        }
        throw error;
    }
};

// Call GPT API
export const sendToAI = async (text, sessionId = "default_session") => {
    return authorizedRequest("POST", "/api/gpt", { query: text, session_id: sessionId, gpt_type: "coding_gpt" });
};

// Convert text to speech
export const textToSpeech = async (text) => {
    return authorizedRequest("POST", "/tts", { text });
};

// Check backend health
export const checkBackendHealth = async () => {
    try {
        const response = await apiClient.get("/health");
        return response.data;
    } catch (error) {
        console.error("[ERROR] Backend health check failed:", error.message);
        return { status: "unavailable" };
    }
};