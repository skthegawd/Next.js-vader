import { useState, useEffect, useRef } from 'react';
import type { NextPage } from 'next';
import ChatInput from '../components/ChatInput';
import { api } from '../lib/api';
import Head from 'next/head';
import Layout from '../components/Layout';
import MobileNav from '../components/MobileNav';

// Type definitions
interface Message {
    id: number;
    type: 'user' | 'ai';
    text: string;
    audioUrl?: string;
    timestamp: string;
}

interface MessageData {
    text: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

interface SpeechRecognitionEvent {
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
            };
        };
    };
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    recognition?: SpeechRecognition;
    visualViewport?: {
        height: number;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
    };
}

declare global {
    interface Window {
        webkitSpeechRecognition: new () => SpeechRecognition;
        recognition?: SpeechRecognition;
    }
}

const Chat: NextPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const audioQueue = useRef<string[]>([]);
    const currentAudio = useRef<HTMLAudioElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const transcript = event.results[0][0].transcript;
                handleMessageSend({ text: transcript });
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            const touchY = e.touches[0].clientY;
            const scrollTop = messagesContainerRef.current?.scrollTop || 0;
            
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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    const handleMessageSend = async (messageData: MessageData) => {
        try {
            setError(null);
            setIsLoading(true);
            stopListening(); // Stop listening when sending a message
            
            console.log('[DEBUG] Handling new message:', messageData);
            
            // Add user message immediately
            const newUserMessage: Message = {
                id: Date.now(),
                type: 'user',
                text: messageData.text,
                timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, newUserMessage]);
            
            // Get AI response
            const response = await api.sendToAI(messageData.text);
            console.log('[DEBUG] Received AI response:', JSON.stringify(response, null, 2));
            
            if (response && response.data) {
                const newAIMessage: Message = {
                    id: Date.now() + 1,
                    type: 'ai',
                    text: response.data.response,
                    audioUrl: response.data.tts_audio,
                    timestamp: response.data.timestamp || new Date().toISOString()
                };
                
                console.log('[DEBUG] Adding AI message:', JSON.stringify(newAIMessage, null, 2));
                setMessages(prev => [...prev, newAIMessage]);
                
                // Add audio to queue if available
                if (response.data.tts_audio) {
                    console.log('[DEBUG] Adding audio to queue:', response.data.tts_audio);
                    audioQueue.current.push(response.data.tts_audio);
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
                </div>

                <div 
                    className="messages-container" 
                    ref={messagesContainerRef}
                >
                    {messages.map((message) => (
                        <div 
                            key={message.id}
                            className={`message ${message.type}`}
                        >
                            <div className="message-content">
                                {message.text}
                            </div>
                            <div className="message-timestamp">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                    <ChatInput
                        ref={inputRef}
                        onSend={handleMessageSend}
                        isLoading={isLoading}
                        isListening={isListening}
                        onStartListening={startListening}
                        onStopListening={stopListening}
                    />
                    {error && <div className="error-message">{error}</div>}
                </div>
            </div>
        </Layout>
    );
};

export default Chat; 