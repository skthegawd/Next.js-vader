module.exports = {
    reactStrictMode: true,
    output: 'standalone', // Ensures Vercel serves correct files properly

    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "*",
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization",
                    },
                ],
            },
            {
                source: "/_next/static/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                    {
                        key: "Content-Type",
                        value: "application/javascript",
                    },
                ],
            },
        ];
    },

    async rewrites() {
        return [
            {
                source: "/api/:path*",  // Forward all /api/* calls
                destination: "https://vader-yp5n.onrender.com/api/:path*",
            },
        ];
    },

    experimental: {
        optimizeCss: false, // Temporary fix for Google Fonts issue
    },
};
