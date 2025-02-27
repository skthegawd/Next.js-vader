import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com";

const TOKEN_KEY = "vader_auth_token"; // Local Storage Key for Token
const USER_ID = "test_user"; // Default test user, change as needed

// Get stored token
export const getAuthToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

// Save token to storage
export const setAuthToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

// Remove token
export const clearAuthToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

// Request new access token
export const loginForToken = async () => {
    try {
        console.log("[DEBUG] Requesting new access token...");
        const response = await axios.post(`${API_URL}/auth/token`, { user_id: USER_ID });
        if (response.data.access_token) {
            setAuthToken(response.data.access_token);
            return response.data.access_token;
        }
    } catch (error) {
        console.error("[ERROR] Failed to obtain access token:", error.response?.data || error.message);
        return null;
    }
};

// Refresh token logic (same as login for now, but can be extended)
export const refreshToken = async () => {
    try {
        console.log("[DEBUG] Refreshing access token...");
        const response = await axios.post(`${API_URL}/auth/refresh`, { user_id: USER_ID });
        if (response.data.access_token) {
            setAuthToken(response.data.access_token);
            return response.data.access_token;
        }
    } catch (error) {
        console.error("[ERROR] Failed to refresh token:", error.response?.data || error.message);
        clearAuthToken();
        return null;
    }
};

// Ensure user is authenticated before making requests
export const ensureAuthenticated = async () => {
    let token = getAuthToken();
    if (!token) {
        token = await loginForToken();
    }
    return token;
};
