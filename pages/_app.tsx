import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import getConfig from 'next/config';
import "../styles/globals.css";  // Global styles
import Layout from "../components/Layout";
import { AuthProvider } from "../context/AuthContext";
import ThemeManager from '../lib/theme';
import { WebSocketProvider } from '../context/WebSocketContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

function MyApp({ Component, pageProps }: AppProps) {
    const { publicRuntimeConfig } = getConfig();

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Check for required environment variables
                const requiredEnvVars = [
                    'NEXT_PUBLIC_BACKEND_URL',
                    'NEXT_PUBLIC_WS_URL'
                ];

                const missingEnvVars = requiredEnvVars.filter(
                    (envVar) => !publicRuntimeConfig[envVar]
                );

                if (missingEnvVars.length > 0) {
                    throw new Error(
                        `Missing required environment variables: ${missingEnvVars.join(', ')}`
                    );
                }

                // Initialize theme
                const themeManager = ThemeManager.getInstance();
                const { theme } = await themeManager.initialize();

                // Log initialization success
                console.log('[App] Initialization complete:', {
                    theme,
                    backendUrl: publicRuntimeConfig.NEXT_PUBLIC_BACKEND_URL,
                    wsUrl: publicRuntimeConfig.NEXT_PUBLIC_WS_URL
                });
            } catch (error) {
                console.error('[App] Initialization failed:', error);
                // Re-throw the error to be caught by the ErrorBoundary
                throw error;
            }
        };

        initializeApp().catch(error => {
            console.error('[App] Fatal initialization error:', error);
        });
    }, [publicRuntimeConfig]);

    return (
        <ErrorBoundary>
            <WebSocketProvider>
                <AuthProvider>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </AuthProvider>
            </WebSocketProvider>
        </ErrorBoundary>
    );
}

export default MyApp; 