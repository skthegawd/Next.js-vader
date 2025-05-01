/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    
    // Disable automatic static optimization for now
    staticPageGenerationTimeout: 120,
    
    // Configure build output
    output: 'standalone',
    
    // Configure webpack for proper file handling
    webpack: (config, { isServer }) => {
        // Fixes npm packages that depend on `fs` module
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },

    // Configure API routes
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://vader-yp5n.onrender.com/:path*',
            },
        ];
    },

    // Configure headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization',
                    },
                ],
            },
        ];
    },

    experimental: {
        optimizeCss: false, // Temporary fix for Google Fonts issue
    },
};

module.exports = nextConfig;
