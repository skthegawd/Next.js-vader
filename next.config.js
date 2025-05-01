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
                destination: 'https://vader-yp5n.onrender.com/:path*',
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
                    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
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
};

module.exports = nextConfig;
