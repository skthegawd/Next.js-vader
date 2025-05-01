/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    
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
        ];
    },

    // Configure headers for CORS
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, Accept' },
                    { key: 'Access-Control-Max-Age', value: '86400' },
                ],
            },
        ];
    },

    // Disable specific features that might cause issues
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    
    // Ensure images are handled correctly
    images: {
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
        return config;
    },
};

module.exports = nextConfig;
