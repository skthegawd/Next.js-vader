import "regenerator-runtime/runtime"; // Ensure support for async functions
import '../styles/globals.css';
import Layout from '../components/Layout';

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