import { useState, useEffect, useRef, FormEvent } from 'react';
import type { NextPage } from 'next';
import Layout from '../components/Layout';
import { api, ApiClient, ApiError } from '../lib/api';
import MobileNav from '../components/MobileNav';

interface TerminalEntry {
    type: 'system' | 'command' | 'response' | 'error';
    content: string;
    audioUrl?: string;
}

const Terminal: NextPage = () => {
    const [history, setHistory] = useState<TerminalEntry[]>([]);
    const [currentInput, setCurrentInput] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Add welcome message
        setHistory([{
            type: 'system',
            content: 'Welcome to the Dark Side Terminal\nType "help" for available commands...'
        }]);
        
        // Focus input on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        // Scroll to bottom when history changes
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [history]);

    // Handle keyboard visibility on iOS
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleVisualViewportResize = () => {
                if (window.visualViewport) {
                    const currentHeight = window.visualViewport.height;
                    const windowHeight = window.innerHeight;
                    const isKeyboardVisible = windowHeight - currentHeight > 150;

                    if (isKeyboardVisible && inputRef.current) {
                        setTimeout(() => {
                            inputRef.current.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                    }
                }
            };

            window.visualViewport?.addEventListener('resize', handleVisualViewportResize);
            return () => {
                window.visualViewport?.removeEventListener('resize', handleVisualViewportResize);
            };
        }
    }, []);

    // Handle mobile touch events
    useEffect(() => {
        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            const touchY = e.touches[0].clientY;
            const scrollTop = terminalRef.current?.scrollTop || 0;
            
            // Prevent pull-to-refresh when at top of terminal
            if (scrollTop === 0 && touchY > touchStartY) {
                e.preventDefault();
            }
        };

        const container = terminalRef.current;
        if (container) {
            container.addEventListener('touchstart', handleTouchStart);
            container.addEventListener('touchmove', handleTouchMove, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
            }
        };
    }, []);

    const handleCommand = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!currentInput.trim() || isProcessing) return;

        const command = currentInput.trim();
        setCurrentInput('');
        setIsProcessing(true);

        // Add command to history
        setHistory(prev => [...prev, {
            type: 'command',
            content: command
        }]);

        try {
            if (command.toLowerCase() === 'help') {
                setHistory(prev => [...prev, {
                    type: 'system',
                    content: `Available commands:
- help: Show this help message
- clear: Clear terminal
- status: Check system status
- Any other input will be processed as a message to Lord Vader`
                }]);
            } else if (command.toLowerCase() === 'clear') {
                setHistory([{
                    type: 'system',
                    content: 'Terminal cleared.'
                }]);
            } else if (command.toLowerCase() === 'status') {
                setHistory(prev => [...prev, {
                    type: 'system',
                    content: `System Status:
- Terminal: Online
- Connection: Secure
- Dark Side: Strong
- Power Level: Maximum`
                }]);
            } else {
                // Send command to AI
                const response = await api.sendToAI(command);
                
                if (response && response.data) {
                    setHistory(prev => [...prev, {
                        type: 'response',
                        content: response.data.response,
                        audioUrl: response.data.tts_audio
                    }]);

                    // Play audio if available
                    if (response.data.tts_audio) {
                        try {
                            const audio = new Audio(response.data.tts_audio);
                            await audio.play();
                        } catch (error) {
                            console.error('[ERROR] Failed to play audio:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[ERROR] Command processing failed:', error);
            setHistory(prev => [...prev, {
                type: 'error',
                content: 'Command processing failed. The Dark Side is disturbed.'
            }]);
        } finally {
            setIsProcessing(false);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    return (
        <Layout title="Dark Side Terminal">
            <div className="terminal-container">
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
                    {/* Sidebar content */}
                </div>

                <div className="terminal-window">
                    <div className="terminal-header">
                        <div className="terminal-title">Dark Side Terminal</div>
                        <div className="terminal-controls">
                            <span className="control red"></span>
                            <span className="control yellow"></span>
                            <span className="control green"></span>
                        </div>
                    </div>
                    <div className="terminal-body" ref={terminalRef}>
                        {history.map((entry, index) => (
                            <div key={index} className={`terminal-line ${entry.type}`}>
                                {entry.type === 'command' ? '> ' : ''}
                                {entry.content}
                                {entry.audioUrl && (
                                    <div className="audio-player">
                                        <audio controls src={entry.audioUrl}>
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                )}
                            </div>
                        ))}
                        <form onSubmit={handleCommand} className="terminal-input-line">
                            <span className="prompt">{'>'}</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                                disabled={isProcessing}
                                placeholder={isProcessing ? "Processing..." : "Enter command..."}
                                className="terminal-input"
                                autoComplete="off"
                            />
                        </form>
                    </div>
                </div>

                <MobileNav />
            </div>

            <style jsx>{`
                .terminal-container {
                    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
                    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
                    position: relative;
                }

                .terminal-window {
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid #ff0000;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    -webkit-overflow-scrolling: touch;
                }

                .terminal-header {
                    background: rgba(255, 0, 0, 0.1);
                    padding: 15px;
                    padding-top: calc(15px + env(safe-area-inset-top));
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #ff0000;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .terminal-title {
                    color: #ff0000;
                    font-family: 'Courier New', monospace;
                    font-size: 1.2rem;
                }

                .terminal-controls {
                    display: flex;
                    gap: 8px;
                }

                .control {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }

                .red { background: #ff5f56; }
                .yellow { background: #ffbd2e; }
                .green { background: #27c93f; }

                .terminal-body {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    font-family: 'Courier New', monospace;
                    color: #00ff00;
                    line-height: 1.6;
                }

                .terminal-line {
                    margin-bottom: 10px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .terminal-line.system { color: #ffff00; }
                .terminal-line.command { color: #00ff00; }
                .terminal-line.response { color: #ffffff; }
                .terminal-line.error { color: #ff0000; }

                .terminal-input-line {
                    display: flex;
                    align-items: center;
                    margin-top: 10px;
                }

                .prompt {
                    color: #00ff00;
                    margin-right: 10px;
                }

                .terminal-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    font-size: 1rem;
                    outline: none;
                    padding: 0;
                }

                .terminal-input::placeholder {
                    color: rgba(0, 255, 0, 0.5);
                }

                .terminal-input:disabled {
                    opacity: 0.5;
                }

                .audio-player {
                    margin-top: 10px;
                }

                .audio-player audio {
                    width: 100%;
                    max-width: 300px;
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

                @media (max-width: 768px) {
                    .terminal-container {
                        padding: 0;
                    }

                    .terminal-window {
                        border-radius: 0;
                        border: none;
                    }

                    .terminal-header {
                        padding-right: 60px;
                    }

                    .hamburger {
                        display: block;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default Terminal; 