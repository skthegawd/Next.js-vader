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
                destination: 'https://vader-yp5n.onrender.com/:path*',
            }
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
};

module.exports = nextConfig;
