import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuthToken, loginUser, logoutUser, refreshToken } from "../lib/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(getAuthToken());
    const [user, setUser] = useState(localStorage.getItem("user_id") || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!token) {
                console.log("No token found, attempting refresh...");
                const newToken = await refreshToken();
                if (newToken) {
                    setToken(newToken);
                } else {
                    logout();
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (userId) => {
        const newToken = await loginUser(userId);
        if (newToken) {
            setToken(newToken);
            setUser(userId);
        }
    };

    const logout = () => {
        logoutUser();
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