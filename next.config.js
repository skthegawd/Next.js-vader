/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    
    // Ensure proper static file serving
    assetPrefix: process.env.NODE_ENV === 'production' ? '/_next' : '',
    
    // Configure build output
    output: 'export',  // Changed from 'standalone' to 'export' for static file generation
    
    // Configure API routes
    rewrites: async () => {
        return {
            beforeFiles: [
                {
                    source: '/api/:path*',
                    destination: 'https://vader-yp5n.onrender.com/:path*',
                },
            ],
        };
    },

    // Configure headers for CORS
    headers: async () => {
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
