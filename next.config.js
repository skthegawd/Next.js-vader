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

    // Ensures assets are served correctly
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || "",

    // Optimizes for Vercel deployment
    experimental: {
        optimizeCss: true, // Minifies CSS for better performance
        optimizeImages: true, // Optimizes images with Next.js built-in optimization
    },
};
