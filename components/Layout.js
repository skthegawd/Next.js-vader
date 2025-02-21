import Sidebar from './Sidebar';
import '../styles/globals.css';
import Head from 'next/head';

export default function Layout({ children }) {
    return (
        <>
            <Head>
                <link href="https://fonts.googleapis.com/css2?family=Star+Jedi&display=swap" rel="stylesheet" />
            </Head>
            <div className="layout-container">
                <Sidebar />
                <main className="content-area">
                    {children}
                </main>
            </div>
            <style jsx>{`
                .layout-container {
                    display: flex;
                    height: 100vh;
                    background: radial-gradient(circle, #111 30%, #000 100%);
                    color: #ff4444;
                    font-family: 'Star Jedi', sans-serif;
                }
                .content-area {
                    flex-grow: 1;
                    padding: 20px;
                    text-shadow: 0 0 10px red;
                }
            `}</style>
        </>
    );
}