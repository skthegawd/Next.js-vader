import { createContext, useState, useEffect } from 'react';
import { registerUser, getAuthTokenFromAPI, refreshToken } from '../lib/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem("vader_user_id");
            const storedToken = localStorage.getItem("vader_auth_token");

            if (storedUserId) {
                setUserId(storedUserId);
            }
            
            if (storedToken) {
                setToken(storedToken);
            } else if (storedUserId) {
                authenticateUser(storedUserId);
            } else {
                const newUserId = `user_${Date.now()}`;
                registerUser(newUserId).then(() => {
                    localStorage.setItem("vader_user_id", newUserId);
                    setUserId(newUserId);
                    authenticateUser(newUserId);
                });
            }
        }
    }, []);

    const authenticateUser = async (userId) => {
        try {
            const newToken = await getAuthTokenFromAPI(userId);
            if (newToken) {
                localStorage.setItem("vader_auth_token", newToken);
                setToken(newToken);
            }
        } catch (error) {
            console.error("Authentication failed:", error);
        }
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            if (userId) {
                try {
                    const refreshedToken = await refreshToken();
                    if (refreshedToken) {
                        localStorage.setItem("vader_auth_token", refreshedToken);
                        setToken(refreshedToken);
                    }
                } catch (error) {
                    console.error("Token refresh failed:", error);
                }
            }
        }, 15 * 60 * 1000); // Refresh token every 15 minutes

        return () => clearInterval(interval);
    }, [userId]);

    return (
        <AuthContext.Provider value={{ token, userId }}>
            {children}
        </AuthContext.Provider>
    );
};