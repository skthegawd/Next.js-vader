const API_BASE_URL = "https://vader-yp5n.onrender.com";

// Function to register a user
export async function registerUser(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            throw new Error(`Registration failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error registering user:", error);
        return null;
    }
}

// Function to get authentication token
export async function getAuthToken(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            throw new Error(`Token request failed: ${response.status}`);
        }

        const data = await response.json();
        localStorage.setItem("vader_auth_token", data.token);
        return data.token;
    } catch (error) {
        console.error("Error fetching auth token:", error);
        return null;
    }
}

// Function to refresh the token
export async function refreshToken(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = await response.json();
        localStorage.setItem("vader_auth_token", data.token);
        return data.token;
    } catch (error) {
        console.error("Error refreshing token:", error);
        return null;
    }
}

// Function to make an authorized API request
export async function authorizedRequest(endpoint, method = "GET", body = null) {
    try {
        let token = localStorage.getItem("vader_auth_token");

        if (!token) {
            console.warn("No token found, fetching new one...");
            token = await getAuthToken("default_user");
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: body ? JSON.stringify(body) : null
        });

        if (response.status === 401) {
            console.warn("Token expired, refreshing token...");
            token = await refreshToken("default_user");

            if (!token) {
                throw new Error("Failed to refresh token.");
            }

            return authorizedRequest(endpoint, method, body); // Retry request
        }

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error in authorized request:", error);
        return null;
    }
}

// Function to make a GPT API call
export async function requestGPT(query, sessionId = "default_session", gptType = "coding_gpt") {
    return await authorizedRequest("/api/gpt", "POST", { query, session_id: sessionId, gpt_type: gptType });
}
