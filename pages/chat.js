import { useState, useEffect, useRef } from 'react';
import ChatInput from '../components/ChatInput';
import { sendToAI } from '../lib/api';
import Head from 'next/head';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const audioQueue = useRef([]);
    const currentAudio = useRef(null);

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
        <>
            <Head>
                <title>Chat with Lord Vader</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="page-container">
                <div className="chat-container">
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
                    <div className="input-container">
                        <ChatInput onMessageSend={handleMessageSend} disabled={isLoading || isListening} />
                    </div>
                </div>
            </div>
            <style jsx global>{`
                body {
                    margin: 0;
                    padding: 0;
                    background: #000000;
                    color: #ffffff;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                }

                * {
                    box-sizing: border-box;
                }
            `}</style>
            <style jsx>{`
                .page-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #000000;
                }

                .chat-container {
                    flex: 1;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    width: 100%;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }

                .chat-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    text-align: center;
                    margin-bottom: 20px;
                    padding: 20px 0;
                    border-bottom: 1px solid #333;
                }

                .chat-header h1 {
                    margin: 0;
                    color: #ff0000;
                    text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
                    font-size: 2rem;
                }

                .messages-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    background: rgba(255, 0, 0, 0.05);
                    border-radius: 8px;
                    margin-bottom: 20px;
                    scroll-behavior: smooth;
                }

                .empty-state {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-style: italic;
                }

                .message {
                    margin-bottom: 20px;
                    opacity: 0;
                    transform: translateY(20px);
                    animation: fadeInUp 0.3s ease forwards;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .message.user .message-content {
                    background: rgba(255, 255, 255, 0.1);
                    margin-left: auto;
                    margin-right: 0;
                    border-radius: 15px 15px 0 15px;
                }

                .message.ai .message-content {
                    background: rgba(255, 0, 0, 0.1);
                    margin-right: auto;
                    margin-left: 0;
                    border-radius: 15px 15px 15px 0;
                }

                .message-content {
                    max-width: 80%;
                    padding: 15px;
                }

                .message-text {
                    margin: 0;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .error-message {
                    color: #ff4444;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                    background: rgba(255, 68, 68, 0.1);
                    animation: fadeIn 0.3s ease;
                }

                .message-timestamp {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                    margin-top: 5px;
                    text-align: right;
                }

                .audio-controls {
                    margin-top: 15px;
                    position: relative;
                }

                .audio-controls audio {
                    width: 100%;
                    height: 40px;
                    border-radius: 20px;
                    background: rgba(0, 0, 0, 0.3);
                    outline: none;
                }

                .audio-controls audio::-webkit-media-controls-panel {
                    background: rgba(0, 0, 0, 0.5);
                }

                .audio-controls audio::-webkit-media-controls-current-time-display,
                .audio-controls audio::-webkit-media-controls-time-remaining-display {
                    color: #ffffff;
                }

                .audio-controls audio::-webkit-media-controls-play-button,
                .audio-controls audio::-webkit-media-controls-mute-button {
                    filter: invert(1);
                }

                .audio-controls audio::-webkit-media-controls-timeline {
                    background-color: rgba(255, 0, 0, 0.3);
                }

                .input-container {
                    padding: 20px;
                    background: rgba(255, 0, 0, 0.05);
                    border-radius: 8px;
                    position: relative;
                }

                .loading-indicator {
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                }

                .loading-dots {
                    display: flex;
                    gap: 8px;
                }

                .loading-dots span {
                    width: 8px;
                    height: 8px;
                    background: #ff0000;
                    border-radius: 50%;
                    animation: bounce 1s infinite;
                }

                .loading-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .loading-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @media (max-width: 600px) {
                    .chat-container {
                        padding: 10px;
                    }

                    .message-content {
                        max-width: 90%;
                    }

                    .chat-header h1 {
                        font-size: 1.5rem;
                    }
                }

                .voice-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: rgba(255, 0, 0, 0.8);
                    border: none;
                    border-radius: 20px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .voice-button:hover {
                    background: rgba(255, 0, 0, 1);
                    transform: translateY(-1px);
                }

                .voice-button.listening {
                    background: #ff0000;
                    animation: pulse 1.5s infinite;
                }

                .microphone-icon {
                    width: 16px;
                    height: 16px;
                    background: white;
                    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z'/%3E%3C/svg%3E") no-repeat center;
                    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z'/%3E%3C/svg%3E") no-repeat center;
                }

                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4);
                    }
                    70% {
                        box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
                    }
                }
            `}</style>
        </>
    );
}