import { useState, useEffect, useRef } from 'react';
import ChatInput from '../components/ChatInput';
import { sendToAI } from '../lib/api';
import Head from 'next/head';
import Layout from '../components/Layout';
import MobileNav from '../components/MobileNav';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const audioQueue = useRef([]);
    const currentAudio = useRef(null);
    const inputRef = useRef(null);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                handleMessageSend({ text: transcript });
            };

            recognition.onerror = (event) => {
                console.error('[ERROR] Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            window.recognition = recognition;
        }
    }, []);

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
        const handleTouchStart = (e) => {
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e) => {
            const touchY = e.touches[0].clientY;
            const scrollTop = messagesContainerRef.current.scrollTop;
            
            // Prevent pull-to-refresh when at top of messages
            if (scrollTop === 0 && touchY > touchStartY) {
                e.preventDefault();
            }
        };

        const container = messagesContainerRef.current;
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

    const startListening = () => {
        if (window.recognition && !isListening) {
            try {
                window.recognition.start();
                setIsListening(true);
            } catch (error) {
                console.error('[ERROR] Failed to start speech recognition:', error);
            }
        }
    };

    const stopListening = () => {
        if (window.recognition && isListening) {
            window.recognition.stop();
            setIsListening(false);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Audio queue management
    const playNextInQueue = async () => {
        if (audioQueue.current.length === 0) return;
        
        try {
            const audioUrl = audioQueue.current[0];
            console.log('[DEBUG] Playing next audio in queue:', audioUrl);
            
            const audio = new Audio(audioUrl);
            currentAudio.current = audio;
            
            audio.onerror = (e) => {
                console.error('[ERROR] Audio playback error:', e);
                audioQueue.current.shift();
                playNextInQueue();
            };
            
            audio.onended = () => {
                console.log('[DEBUG] Audio playback completed');
                audioQueue.current.shift();
                currentAudio.current = null;
                playNextInQueue();
            };
            
            await audio.play();
        } catch (error) {
            console.error('[ERROR] Failed to play audio:', error);
            audioQueue.current.shift();
            playNextInQueue();
        }
    };

    const handleMessageSend = async (messageData) => {
        try {
            setError(null);
            setIsLoading(true);
            stopListening(); // Stop listening when sending a message
            
            console.log('[DEBUG] Handling new message:', messageData);
            
            // Add user message immediately
            const newUserMessage = {
                id: Date.now(),
                type: 'user',
                text: messageData.text,
                timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, newUserMessage]);
            
            // Get AI response
            const response = await sendToAI(messageData.text);
            console.log('[DEBUG] Received AI response:', JSON.stringify(response, null, 2));
            
            if (response && response.response) {
                const newAIMessage = {
                    id: Date.now() + 1,
                    type: 'ai',
                    text: response.response,
                    audioUrl: response.tts_audio,
                    timestamp: response.timestamp || new Date().toISOString()
                };
                
                console.log('[DEBUG] Adding AI message:', JSON.stringify(newAIMessage, null, 2));
                setMessages(prev => [...prev, newAIMessage]);
                
                // Add audio to queue if available
                if (response.tts_audio) {
                    console.log('[DEBUG] Adding audio to queue:', response.tts_audio);
                    audioQueue.current.push(response.tts_audio);
                    if (!currentAudio.current) {
                        playNextInQueue();
                    }
                }
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('[ERROR] Failed to process message:', error);
            setError('Failed to get response from AI. Please try again.');
            
            // Remove the user message if AI response failed
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (currentAudio.current) {
                currentAudio.current.pause();
                currentAudio.current = null;
            }
            audioQueue.current = [];
            if (window.recognition) {
                window.recognition.stop();
            }
        };
    }, []);

    return (
        <Layout title="Chat with Lord Vader">
            <div className="chat-container">
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

                <div className="chat-header">
                    <h1>Chat with Lord Vader</h1>
                    <button 
                        className={`voice-button ${isListening ? 'listening' : ''}`}
                        onClick={isListening ? stopListening : startListening}
                        title={isListening ? "Stop speaking" : "Start speaking"}
                    >
                        <span className="microphone-icon"></span>
                        {isListening ? "Listening..." : "Speak"}
                    </button>
                </div>

                <div className="messages-container" ref={messagesContainerRef}>
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            Begin your conversation with Lord Vader...
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`message ${msg.type}`}>
                                <div className="message-content">
                                    <div className="message-text">{msg.text}</div>
                                    {msg.type === 'ai' && msg.audioUrl && (
                                        <div className="audio-controls">
                                            <audio 
                                                controls 
                                                src={msg.audioUrl}
                                                preload="metadata"
                                                onError={(e) => {
                                                    console.error('[ERROR] Audio element error:', e);
                                                    e.target.parentElement.innerHTML = 'Audio playback failed. Click message to try again.';
                                                }}
                                            >
                                                Your browser does not support the audio element.
                                            </audio>
                                        </div>
                                    )}
                                    <div className="message-timestamp">
                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="loading-indicator">
                            <div className="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    )}
                    {error && <div className="error-message">{error}</div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-wrapper" ref={inputRef}>
                    <ChatInput onMessageSend={handleMessageSend} disabled={isLoading || isListening} />
                </div>

                <MobileNav />
            </div>

            <style jsx>{`
                .chat-container {
                    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
                    display: flex;
                    flex-direction: column;
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid #ff0000;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
                    overflow: hidden;
                    position: relative;
                }

                .chat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    padding-top: calc(15px + env(safe-area-inset-top));
                    background: rgba(0, 0, 0, 0.95);
                    border-bottom: 1px solid #ff0000;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }

                .messages-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    -webkit-overflow-scrolling: touch;
                    scroll-behavior: smooth;
                    overscroll-behavior-y: contain;
                }

                .input-wrapper {
                    position: sticky;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 15px;
                    padding-bottom: calc(15px + env(safe-area-inset-bottom));
                    background: rgba(0, 0, 0, 0.95);
                    border-top: 1px solid #ff0000;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
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
                    .chat-container {
                        border-radius: 0;
                        border: none;
                    }

                    .hamburger {
                        display: block;
                    }

                    .hamburger.open span:nth-child(1) {
                        transform: rotate(45deg) translate(5px, 5px);
                    }

                    .hamburger.open span:nth-child(2) {
                        opacity: 0;
                    }

                    .hamburger.open span:nth-child(3) {
                        transform: rotate(-45deg) translate(7px, -7px);
                    }

                    .chat-header h1 {
                        font-size: 1.5rem;
                        margin-right: 50px;
                    }

                    .message {
                        max-width: 85%;
                    }

                    .message.user {
                        margin-left: auto;
                    }

                    .message.ai {
                        margin-right: auto;
                    }

                    .audio-controls audio {
                        width: 100%;
                        margin-top: 10px;
                    }

                    /* iOS specific styles */
                    @supports (-webkit-touch-callout: none) {
                        .chat-container {
                            height: -webkit-fill-available;
                        }

                        .input-wrapper {
                            position: sticky;
                        }
                    }
                }
            `}</style>
        </Layout>
    );
}