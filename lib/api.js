import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com/api";
const TIMEOUT = 10000; // 10 seconds timeout

console.log("Using API Base URL:", API_URL);

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: TIMEOUT,
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ""}`,
    }
});

// Function to send text to AI GPT API
export const sendToAI = async (text) => {
    try {
        console.log("[DEBUG] Sending request to GPT API with text:", text);
        const response = await apiClient.post('/gpt', { text });

        if (response.status !== 200) {
            throw new Error(`Unexpected status code: ${response.status}`);
        }

        console.log("[DEBUG] GPT API Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("[ERROR] Failed to send request to GPT API:", error.message);
        return { error: "AI service is currently unavailable. Please try again later." };
    }
};

// Function to check Vader AI Backend Status
export const checkVaderBackend = async () => {
    try {
        const response = await apiClient.get('/health');
        return response.data;
    } catch (error) {
        console.error("[ERROR] Vader AI Backend Health Check Failed:", error.message);
        return { status: "unavailable" };
    }
};