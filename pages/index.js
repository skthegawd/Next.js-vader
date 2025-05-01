import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Home() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <Layout title="Welcome to the Dark Side">
            <div className={`landing-container ${isLoaded ? 'loaded' : ''}`}>
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
                        </div>
                    </div>
                </div>
                <div className="background-animation"></div>
            </div>

            <style jsx>{`
                .landing-container {
                    height: calc(100vh - 40px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.5s ease, transform 0.5s ease;
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
                    padding: 10px 20px;
                    background: rgba(255, 0, 0, 0.8);
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .feature-link:hover {
                    background: #ff0000;
                    transform: translateY(-2px);
                    box-shadow: 0 2px 8px rgba(255, 0, 0, 0.4);
                }

                .background-animation {
                    position: absolute;
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
                    .title {
                        font-size: 2rem;
                    }

                    .intro-text {
                        font-size: 1rem;
                    }

                    .features {
                        grid-template-columns: 1fr;
                    }

                    .content {
                        padding: 20px;
                    }
                }
            `}</style>
        </Layout>
    );
}