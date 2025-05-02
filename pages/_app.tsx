import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import "../styles/globals.css";  // Global styles
import Layout from "../components/Layout";
import { AuthProvider } from "../context/AuthContext";
import { api } from '../lib/api';
import ws from '../lib/websocket';
import themeManager from '../lib/theme';

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

    return (
        <AuthProvider>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </AuthProvider>
    );
}

export default MyApp; 