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
            // ✅ Ensures static assets are served correctly
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

    experimental: {
        optimizeCss: true, // Keeps CSS optimization enabled for better performance
    },
};
