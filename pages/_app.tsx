import { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import getConfig from 'next/config';
import "../styles/globals.css";  // Global styles
import Layout from "../components/Layout";
import { AuthProvider } from "../context/AuthContext";
import ThemeManager from '../lib/theme';
import { WebSocketProvider } from '../context/WebSocketContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import api from '../lib/api';

function MyApp({ Component, pageProps }: AppProps) {
    const { publicRuntimeConfig } = getConfig();
    const [backendHealthy, setBackendHealthy] = useState(true);

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

                // Health check: try /api/next/init
                try {
                    await api.get('/next/init');
                    setBackendHealthy(true);
                } catch (err) {
                    setBackendHealthy(false);
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
                setBackendHealthy(false);
                // Re-throw the error to be caught by the ErrorBoundary
                throw error;
            }
        };

        initializeApp().catch(error => {
            console.error('[App] Fatal initialization error:', error);
            setBackendHealthy(false);
        });
    }, [publicRuntimeConfig]);

    return (
        <>
            {!backendHealthy && (
                <div style={{
                    background: '#ff4444',
                    color: 'white',
                    padding: '1rem',
                    textAlign: 'center',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999
                }}>
                    Backend is unavailable. Some features may not work. Please try again later.
                </div>
            )}
            <ErrorBoundary>
                <WebSocketProvider>
                    <AuthProvider>
                        <Layout>
                            <Component {...pageProps} />
                        </Layout>
                    </AuthProvider>
                </WebSocketProvider>
            </ErrorBoundary>
        </>
    );
}

export default MyApp; 