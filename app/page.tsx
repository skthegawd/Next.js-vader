"use client";
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import MobileNav from '../components/MobileNav';

// Dynamically import CodeGenerator for performance (optional)
const CodeGenerator = dynamic(() => import('./components/code/CodeGenerator').then(mod => mod.CodeGenerator), { ssr: false });

export default function Home() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <Layout title="Welcome to the Dark Side">
            <div className={`landing-container ${isLoaded ? 'loaded' : ''}`}>
                <button 
                    className="hamburger" 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    {/* Sidebar content (optional, can be left empty if handled by Layout) */}
                </div>

                <div className="content">
                    <h1 className="title">Welcome to the Dark Side</h1>
                    <div className="description">
                        <p className="intro-text">Lord Vader, your AI assistant is at your command.</p>
                        <div className="features">
                            <div className="feature">
                                <h3>Chat Interface</h3>
                                <p>Engage in direct conversation with Lord Vader through an intuitive chat interface.</p>
                                <Link href="/chat">
                                    <span className="feature-link">Enter Chat</span>
                                </Link>
                            </div>
                            <div className="feature">
                                <h3>Terminal Access</h3>
                                <p>Access the Dark Side through a command-line interface for direct system interaction.</p>
                                <Link href="/terminal">
                                    <span className="feature-link">Open Terminal</span>
                                </Link>
                            </div>
                            <div className="feature">
                                <h3>Code Generator</h3>
                                <p>Generate, analyze, and export code with Vader's AI-powered tools.</p>
                                {/* Optionally embed the CodeGenerator directly below, or link to a dedicated page */}
                                <a href="#code-generator" className="feature-link">Try Code Generator</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="background-animation"></div>
                <MobileNav />
            </div>
            {/* Optionally embed the CodeGenerator below the landing page */}
            <div id="code-generator" style={{ marginTop: 60 }}>
                <CodeGenerator />
            </div>
            <style jsx>{`
                .landing-container {
                    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.5s ease, transform 0.5s ease;
                    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
                }
                .landing-container.loaded {
                    opacity: 1;
                    transform: translateY(0);
                }
                .content {
                    position: relative;
                    z-index: 1;
                    text-align: center;
                    padding: 40px;
                    background: rgba(0, 0, 0, 0.8);
                    border: 1px solid #ff0000;
                    border-radius: 10px;
                    box-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
                    max-width: 800px;
                    width: 90%;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                .title {
                    font-size: 3rem;
                    color: #ff0000;
                    margin: 0 0 30px 0;
                    text-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
                    font-family: 'Orbitron', sans-serif;
                    letter-spacing: 2px;
                }
                .intro-text {
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    font-size: 1.2rem;
                    margin-bottom: 40px;
                    text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
                }
                .features {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 30px;
                    margin-top: 40px;
                }
                .feature {
                    padding: 20px;
                    background: rgba(255, 0, 0, 0.1);
                    border-radius: 8px;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                }
                .feature:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(255, 0, 0, 0.2);
                }
                .feature h3 {
                    color: #ff0000;
                    margin: 0 0 15px 0;
                    font-size: 1.5rem;
                }
                .feature p {
                    color: #ffffff;
                    margin: 0 0 20px 0;
                    line-height: 1.6;
                }
                .feature-link {
                    display: inline-block;
                    padding: 15px 25px;
                    background: rgba(255, 0, 0, 0.8);
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    min-height: 44px;
                    min-width: 44px;
                    user-select: none;
                    -webkit-user-select: none;
                    touch-action: manipulation;
                }
                .feature-link:hover {
                    background: #ff0000;
                    transform: translateY(-2px);
                    box-shadow: 0 2px 8px rgba(255, 0, 0, 0.4);
                }
                .feature-link:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 4px rgba(255, 0, 0, 0.2);
                }
                .background-animation {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%),
                        linear-gradient(45deg, rgba(255,0,0,0.1) 25%, transparent 25%),
                        linear-gradient(-45deg, rgba(255,0,0,0.1) 25%, transparent 25%);
                    background-size: 100% 100%, 4px 4px, 4px 4px;
                    animation: backgroundMove 20s linear infinite;
                    z-index: 0;
                    pointer-events: none;
                }
                .hamburger {
                    display: none;
                    position: fixed;
                    top: calc(20px + env(safe-area-inset-top));
                    right: 20px;
                    z-index: 1001;
                    background: transparent;
                    border: none;
                    padding: 15px;
                    cursor: pointer;
                }
                .hamburger span {
                    display: block;
                    width: 25px;
                    height: 2px;
                    background: #ff0000;
                    margin: 5px 0;
                    transition: 0.3s;
                }
                @keyframes backgroundMove {
                    0% {
                        background-position: center, 0 0, 0 0;
                    }
                    100% {
                        background-position: center, 100px 100px, -100px -100px;
                    }
                }
                @media (max-width: 768px) {
                    .landing-container {
                        padding: 0;
                        height: 100%;
                        min-height: -webkit-fill-available;
                    }
                    .content {
                        padding: 20px;
                        width: 100%;
                        height: 100%;
                        border: none;
                        border-radius: 0;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    .title {
                        font-size: 2rem;
                        padding-top: calc(20px + env(safe-area-inset-top));
                    }
                    .intro-text {
                        font-size: 1rem;
                    }
                    .features {
                        grid-template-columns: 1fr;
                        gap: 20px;
                        margin-bottom: calc(60px + env(safe-area-inset-bottom));
                    }
                    .feature {
                        padding: 15px;
                    }
                    .hamburger {
                        display: block;
                    }
                }
            `}</style>
        </Layout>
    );
} 