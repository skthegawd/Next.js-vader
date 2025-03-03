import "regenerator-runtime/runtime";
import "../styles/globals.css";  // ✅ Moved global CSS here
import Layout from "../components/Layout";

// Log API Base URL for debugging
console.log("Next.js Backend API:", process.env.NEXT_PUBLIC_BACKEND_URL);

function MyApp({ Component, pageProps }) {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
}

export default MyApp;