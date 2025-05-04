import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import getConfig from 'next/config';
import "../styles/globals.css";  // Global styles
import Layout from "../components/Layout";
import { AuthProvider } from "../context/AuthContext";
import api from '../lib/api';
import ThemeManager from '../lib/theme';
import { WebSocketProvider } from '../context/WebSocketContext';

function MyApp({ Component, pageProps }: AppProps) {
    const { publicRuntimeConfig } = getConfig();

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Initialize theme
                const themeManager = ThemeManager.getInstance();
                await themeManager.initialize();

                // Log initialization success
                console.log('[App] Initialization complete:', {
                    theme: themeManager.getCurrentTheme()?.name
                });
            } catch (error) {
                console.error('[App] Initialization failed:', error);
            }
        };

        initializeApp();
    }, []);

    useEffect(() => {
        // Check for required environment variables
        const requiredEnvVars = [
            'NEXT_PUBLIC_BACKEND_URL',
            'NEXT_PUBLIC_WS_URL'
        ];

        const missingEnvVars = requiredEnvVars.filter(
            (envVar) => !publicRuntimeConfig[envVar]
        );

        if (missingEnvVars.length > 0) {
            console.error(
                `[ERROR] Missing required environment variables: ${missingEnvVars.join(', ')}`
            );
        } else {
            console.log('[DEBUG] Backend URL:', publicRuntimeConfig.NEXT_PUBLIC_BACKEND_URL);
            console.log('[DEBUG] WebSocket URL:', publicRuntimeConfig.NEXT_PUBLIC_WS_URL);
        }
    }, [publicRuntimeConfig]);

    return (
        <WebSocketProvider>
            <AuthProvider>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </AuthProvider>
        </WebSocketProvider>
    );
}

export default MyApp; 