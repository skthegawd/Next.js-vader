import { useState, useEffect, useRef } from 'react';
import ChatInput from '../components/ChatInput';
import { sendToAI } from '../lib/api';
import Head from 'next/head';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleMessageSend = async (messageData) => {
        try {
            setError(null);
            setIsLoading(true);
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
            console.log('[DEBUG] Received AI response:', response);
            
            if (response && response.response) {
                const newAIMessage = {
                    id: Date.now() + 1,
                    type: 'ai',
                    text: response.response,
                    audioUrl: response.tts_audio,
                    timestamp: new Date().toISOString()
                };
                
                setMessages(prev => [...prev, newAIMessage]);
                
                // Play audio if available
                if (response.tts_audio) {
                    try {
                        console.log('[DEBUG] Playing TTS audio from URL:', response.tts_audio);
                        const audio = new Audio(response.tts_audio);
                        audio.onerror = (e) => {
                            console.error('[ERROR] Audio playback error:', e);
                        };
                        audio.onloadstart = () => {
                            console.log('[DEBUG] Audio started loading');
                        };
                        audio.oncanplay = () => {
                            console.log('[DEBUG] Audio ready to play');
                        };
                        await audio.play();
                        console.log('[DEBUG] Audio playback started successfully');
                    } catch (audioError) {
                        console.error('[ERROR] Failed to play audio:', audioError);
                        console.error('[ERROR] Audio URL was:', response.tts_audio);
                    }
                } else {
                    console.log('[DEBUG] No TTS audio URL provided in response');
                }
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
                        <ChatInput onMessageSend={handleMessageSend} disabled={isLoading} />
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
            `}</style>
        </>
    );
}