import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import "../styles/globals.css";  // Global styles
import Layout from "../components/Layout";
import { AuthProvider } from "../context/AuthContext";
import api from '../lib/api';
import ws from '../lib/websocket';
import themeManager from '../lib/theme';
import { WebSocketProvider } from '../context/WebSocketContext';

function MyApp({ Component, pageProps }: AppProps) {
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Initialize API session
                const { data } = await api.initialize();
                
                // Initialize WebSocket if enabled
                if (data.features.websocket) {
                    ws.connect(data.clientId);
                }

                // Initialize theme
                await themeManager.initialize();

                // Log initialization success
                console.log('[App] Initialization complete:', {
                    features: data.features,
                    theme: themeManager.getCurrentTheme()?.name
                });
            } catch (error) {
                console.error('[App] Initialization failed:', error);
            }
        };

        initializeApp();

        // Cleanup on unmount
        return () => {
            ws.disconnect();
        };
    }, []);

    useEffect(() => {
        // Check for required environment variables
        const requiredEnvVars = [
            'NEXT_PUBLIC_BACKEND_URL',
            'NEXT_PUBLIC_WS_URL'
        ];

        const missingEnvVars = requiredEnvVars.filter(
            (envVar) => !process.env[envVar]
        );

        if (missingEnvVars.length > 0) {
            console.error(
                `[ERROR] Missing required environment variables: ${missingEnvVars.join(', ')}`
            );
        } else {
            console.log('[DEBUG] Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
            console.log('[DEBUG] WebSocket URL:', process.env.NEXT_PUBLIC_WS_URL);
        }
    }, []);

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