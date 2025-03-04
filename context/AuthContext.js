import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuthTokenFromAPI, registerUser, refreshToken } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("vader_auth_token"));
    const [user, setUser] = useState(localStorage.getItem("vader_user_id") || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                console.warn("[WARNING] No token found, attempting registration...");
                let userId = localStorage.getItem("vader_user_id");
                if (!userId) {
                    userId = `user_${Date.now()}`;
                    localStorage.setItem("vader_user_id", userId);
                }
                await registerUser(userId);
                const newToken = await getAuthTokenFromAPI(userId);
                if (newToken) setToken(newToken);
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (userId) => {
        const newToken = await getAuthTokenFromAPI(userId);
        if (newToken) {
            setToken(newToken);
            setUser(userId);
            localStorage.setItem("vader_auth_token", newToken);
            localStorage.setItem("vader_user_id", userId);
        }
    };

    const logout = () => {
        localStorage.removeItem("vader_auth_token");
        localStorage.removeItem("vader_user_id");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);