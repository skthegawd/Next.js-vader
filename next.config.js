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
        ];
    },

    // ✅ Removed `optimizeImages`, which was causing the error
    experimental: {
        optimizeCss: true, // Keeps CSS optimization enabled for better performance
    },
};
