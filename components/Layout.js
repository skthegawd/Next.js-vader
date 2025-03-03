import Sidebar from './Sidebar';
import Head from 'next/head';

export default function Layout({ children }) {
    return (
        <>
            <Head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta name="description" content="Vader AI - Your Personal Sith Assistant" />
                <title>Vader AI</title>
                <link href="https://fonts.googleapis.com/css2?family=Orbitron&display=swap" rel="stylesheet" />
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
                    font-family: 'Orbitron', sans-serif;
                    overflow: hidden;
                }
                .content-area {
                    flex-grow: 1;
                    padding: 20px;
                    text-shadow: 0 0 10px red;
                    overflow-y: auto;
                    max-height: 100vh;
                }
            `}</style>
        </>
    );
}