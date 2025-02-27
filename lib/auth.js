import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vader-yp5n.onrender.com";

const TOKEN_KEY = "vader_auth_token"; // Local Storage Key for Token
const USER_ID = "test_user"; // Default test user, change as needed

// ✅ Get stored token
export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

// ✅ Save token to storage
export const setAuthToken = (token) => localStorage.setItem(TOKEN_KEY, token);

// ✅ Remove token
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

// ✅ Register user (should be called only once per new user)
export const registerUser = async () => {
    try {
        console.log("[DEBUG] Registering user...");
        await axios.post(`${API_URL}/auth/register`, { user_id: USER_ID });
    } catch (error) {
        console.warn("[WARNING] User may already exist:", error.response?.data || error.message);
    }
};

// ✅ Request new access token
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

// ✅ Refresh token logic
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

// ✅ Ensure user is authenticated before making API calls
export const ensureAuthenticated = async () => {
    let token = getAuthToken();
    if (!token) {
        token = await loginForToken();
    }
    return token;
};
