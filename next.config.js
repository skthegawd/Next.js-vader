/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    
    // Basic configuration
    distDir: '.next',
    
    // Configure build output
    output: 'standalone',
    
    // Configure API routes and WebSocket
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://vader-yp5n.onrender.com/:path*',
            },
            {
                source: '/ws',
                destination: 'wss://vader-yp5n.onrender.com/api/ws',
            }
        ];
    },

    // Configure headers for CORS
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: '*' },
                ],
            },
        ];
    },

    // Disable specific features that might cause issues
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    
    // Ensure images are handled correctly
    images: {
        domains: ['vader-yp5n.onrender.com'],
        unoptimized: true,
    },

    // Webpack configuration for proper error handling
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }

        // Add module resolution aliases
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': '.',
        };

        return config;
    },

    // Environment variables that should be available at build time
    env: {
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://vader-yp5n.onrender.com',
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://vader-yp5n.onrender.com/api/ws',
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://vader-yp5n.onrender.com/api',
        NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
    },

    // Ensure environment variables are available during runtime
    publicRuntimeConfig: {
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://vader-yp5n.onrender.com',
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://vader-yp5n.onrender.com/api/ws',
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://vader-yp5n.onrender.com/api',
        NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
    },
};

module.exports = nextConfig;
