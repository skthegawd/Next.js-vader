/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    
    // Basic configuration
    distDir: '.next',
    
    // Configure build output
    output: 'standalone',
    
    // Configure API routes
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
            },
            {
                source: '/ws',
                destination: `${process.env.NEXT_PUBLIC_WS_URL}`,
            },
        ];
    },

    // Configure headers for CORS
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Accept, X-Requested-With' },
                    { key: 'Access-Control-Max-Age', value: '86400' },
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
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

    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
        NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
    },
};

module.exports = nextConfig;
