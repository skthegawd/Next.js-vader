import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com/api";
const TIMEOUT = 10000; // 10 seconds timeout for API calls

console.log("Using API Base URL:", API_URL);

// ✅ Initialize API Client with Authentication Handling
const apiClient = axios.create({
    baseURL: API_URL,
    timeout: TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    }
});

// ✅ Retrieve Token from Local Storage
const getAuthToken = () => localStorage.getItem("access_token");

// ✅ Refresh Token If Expired
const refreshAuthToken = async () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return null;
    try {
        const response = await apiClient.post("/auth/refresh", { user_id: userId });
        localStorage.setItem("access_token", response.data.access_token);
        return response.data.access_token;
    } catch (error) {
        console.error("Token refresh failed:", error);
        return null;
    }
};

// ✅ Wrapper Function to Handle Authentication
const authorizedRequest = async (method, url, data = {}) => {
    let token = getAuthToken();
    if (!token) {
        console.warn("No access token found, attempting to refresh...");
        token = await refreshAuthToken();
        if (!token) throw new Error("Authentication required.");
    }

    try {
        const response = await apiClient({
            method,
            url,
            data,
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error(`API Error: ${url}`, error.response?.data || error.message);
        if (error.response?.status === 401) {
            console.warn("Unauthorized, attempting token refresh...");
            const newToken = await refreshAuthToken();
            if (newToken) {
                return authorizedRequest(method, url, data);
            }
        }
        throw error;
    }
};

// ✅ Authenticate User & Get Token
export const login = async (user_id) => {
    try {
        const response = await apiClient.post("/auth/token", { user_id });
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("user_id", user_id);
        return response.data;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

// ✅ Function to Send Text to AI (GPT API)
export const sendToAI = async (text) => {
    try {
        console.log("[DEBUG] Sending request to GPT API:", text);
        return await authorizedRequest("POST", "/gpt", { text });
    } catch (error) {
        console.error("[ERROR] Failed to send request to GPT API:", error.message);
        return { error: "AI service is currently unavailable. Please try again later." };
    }
};

// ✅ Function to Convert Text to Speech (TTS API)
export const textToSpeech = async (text) => {
    try {
        return await authorizedRequest("POST", "/tts", { text });
    } catch (error) {
        console.error("[ERROR] Failed to send request to TTS API:", error.message);
        return { error: "TTS service is currently unavailable." };
    }
};

// ✅ Function to Check Backend Health
export const checkVaderBackend = async () => {
    try {
        const response = await apiClient.get("/health");
        return response.data;
    } catch (error) {
        console.error("[ERROR] Vader AI Backend Health Check Failed:", error.message);
        return { status: "unavailable" };
    }
};