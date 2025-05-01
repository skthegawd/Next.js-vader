import Link from 'next/link';
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Layout({ children, title = 'Vader AI' }) {
    const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleBluetoothConnect = async () => {
        try {
            // Request Bluetooth device
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true
            });
            console.log('[DEBUG] Bluetooth device selected:', device);
            setIsBluetoothConnected(true);
        } catch (error) {
            console.error('[ERROR] Bluetooth connection failed:', error);
            setIsBluetoothConnected(false);
        }
    };

    return (
        <div className="layout">
            <Head>
                <title>{title}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <link rel="apple-touch-icon" href="/vader-icon.png" />
            </Head>

            {isMobile && (
                <div className="mobile-header">
                    <button 
                        className="menu-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>
                    <h1 className="mobile-title">{title}</h1>
                </div>
            )}

            <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
                <div className="sidebar-content">
                    <h1 className="menu-title">Vader AI Menu</h1>
                    <nav>
                        <ul>
                            <li>
                                <Link href="/chat">
                                    <span className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Chat</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/terminal">
                                    <span className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Terminal</span>
                                </Link>
                            </li>
                            <li>
                                <button 
                                    className={`bluetooth-button ${isBluetoothConnected ? 'connected' : ''}`}
                                    onClick={handleBluetoothConnect}
                                >
                                    {isBluetoothConnected ? 'Bluetooth Connected' : 'Connect Bluetooth'}
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>

            <main className={`main-content ${isMobile ? 'mobile' : ''}`}>
                {children}
            </main>

            {isMobileMenuOpen && isMobile && (
                <div className="overlay" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            <style jsx global>{`
                body {
                    margin: 0;
                    padding: 0;
                    background: #000000;
                    color: #ffffff;
                    font-family: 'Orbitron', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    -webkit-tap-highlight-color: transparent;
                }

                * {
                    box-sizing: border-box;
                    -webkit-touch-callout: none;
                }

                @font-face {
                    font-family: 'Orbitron';
                    src: url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap');
                }
            `}</style>

            <style jsx>{`
                .layout {
                    display: flex;
                    min-height: 100vh;
                    position: relative;
                }

                .mobile-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: rgba(0, 0, 0, 0.9);
                    border-bottom: 1px solid #ff0000;
                    display: flex;
                    align-items: center;
                    padding: 0 15px;
                    z-index: 1000;
                }

                .mobile-title {
                    color: #ff0000;
                    font-size: 20px;
                    margin: 0;
                    text-align: center;
                    flex: 1;
                    text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
                }

                .menu-toggle {
                    background: none;
                    border: none;
                    padding: 10px;
                    cursor: pointer;
                    z-index: 1001;
                }

                .hamburger {
                    width: 24px;
                    height: 20px;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .hamburger span {
                    display: block;
                    width: 100%;
                    height: 2px;
                    background: #ff0000;
                    transition: all 0.3s ease;
                    transform-origin: left center;
                }

                .hamburger.open span:first-child {
                    transform: rotate(45deg);
                }

                .hamburger.open span:nth-child(2) {
                    opacity: 0;
                }

                .hamburger.open span:last-child {
                    transform: rotate(-45deg);
                }

                .sidebar {
                    width: 250px;
                    background: rgba(0, 0, 0, 0.9);
                    border-right: 1px solid #ff0000;
                    padding: 20px;
                    position: fixed;
                    height: 100vh;
                    box-shadow: 2px 0 10px rgba(255, 0, 0, 0.3);
                    transition: transform 0.3s ease;
                    z-index: 999;
                }

                .sidebar.mobile {
                    transform: translateX(-100%);
                }

                .sidebar.mobile.open {
                    transform: translateX(0);
                }

                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 998;
                }

                .sidebar-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .menu-title {
                    color: #ff0000;
                    font-size: 24px;
                    margin: 0 0 30px 0;
                    text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
                }

                .main-content {
                    flex: 1;
                    margin-left: 250px;
                    padding: 20px;
                    position: relative;
                }

                .main-content.mobile {
                    margin-left: 0;
                    padding-top: 80px;
                }

                nav ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                nav ul li {
                    margin-bottom: 15px;
                }

                .nav-link {
                    color: #ff0000;
                    text-decoration: none;
                    font-size: 18px;
                    display: block;
                    padding: 10px;
                    border-radius: 5px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .nav-link:hover {
                    background: rgba(255, 0, 0, 0.1);
                    text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
                }

                .bluetooth-button {
                    width: 100%;
                    padding: 12px;
                    background: transparent;
                    border: 1px solid #ff0000;
                    color: #ff0000;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    margin-top: 20px;
                }

                .bluetooth-button:hover {
                    background: rgba(255, 0, 0, 0.1);
                    box-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
                }

                .bluetooth-button.connected {
                    background: rgba(255, 0, 0, 0.2);
                    border-color: #ff0000;
                }

                @media (max-width: 768px) {
                    .sidebar {
                        width: 280px;
                    }

                    .menu-title {
                        font-size: 20px;
                        margin-top: 20px;
                    }

                    .nav-link {
                        font-size: 16px;
                        padding: 15px;
                    }

                    .bluetooth-button {
                        padding: 15px;
                    }
                }

                @media (max-height: 600px) {
                    .menu-title {
                        margin-bottom: 15px;
                    }

                    nav ul li {
                        margin-bottom: 10px;
                    }

                    .nav-link {
                        padding: 8px;
                    }
                }
            `}</style>
        </div>
    );
}