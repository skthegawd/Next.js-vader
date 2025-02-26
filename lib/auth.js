import axios from 'axios';

const AUTH_API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com/auth";
const TOKEN_STORAGE_KEY = "access_token";

// Get stored token
export const getAuthToken = () => {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
};

// Store token securely
export const setAuthToken = (token) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

// Clear stored token (logout)
export const logoutUser = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
};

// Refresh Token
export const refreshToken = async () => {
    try {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
            console.warn("No user ID found for token refresh.");
            return null;
        }
        
        const response = await axios.post(`${AUTH_API}/refresh`, { user_id: userId });
        if (response.data && response.data.access_token) {
            setAuthToken(response.data.access_token);
            return response.data.access_token;
        }
    } catch (error) {
        console.error("Token refresh failed:", error.response?.data || error.message);
        logoutUser();
        return null;
    }
};

// Perform Login
export const loginUser = async (userId) => {
    try {
        const response = await axios.post(`${AUTH_API}/token`, { user_id: userId });
        if (response.data && response.data.access_token) {
            setAuthToken(response.data.access_token);
            localStorage.setItem("user_id", userId);
            return response.data.access_token;
        }
    } catch (error) {
        console.error("Login failed:", error.response?.data || error.message);
        return null;
    }
};