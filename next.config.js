module.exports = {
    reactStrictMode: true,
    output: 'standalone', // Ensures Vercel serves correct files properly

    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "https://vader-yp5n.onrender.com/api/:path*", // Forward API requests
            },
        ];
    },

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
        ];
    },

    experimental: {
        optimizeCss: false, // Temporary fix for Google Fonts issue
    },
};
