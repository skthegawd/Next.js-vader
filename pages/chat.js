import { useState, useEffect } from 'react';
import ChatInput from '../components/ChatInput';
import { sendToAI } from '../lib/api';
import Head from 'next/head';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);

    // Debug: Log messages whenever they change
    useEffect(() => {
        console.log('[DEBUG] Current messages:', messages);
    }, [messages]);

    const handleMessageSend = async (messageData) => {
        console.log('[DEBUG] HandleMessageSend called with:', messageData);
        
        try {
            const response = await sendToAI(messageData.text);
            console.log('[DEBUG] Received response:', response);
            
            const newMessage = {
                text: messageData.text,
                response: response.response,
                audioUrl: response.tts_audio,
                timestamp: new Date().toISOString()
            };
            
            console.log('[DEBUG] Adding new message to state:', newMessage);
            
            // Force a re-render by creating a new array
            setMessages(currentMessages => {
                const newMessages = [...currentMessages, newMessage];
                console.log('[DEBUG] New messages array:', newMessages);
                return newMessages;
            });

            // Handle audio after updating messages
            if (response.tts_audio) {
                try {
                    const audio = new Audio(response.tts_audio);
                    await audio.play();
                } catch (audioError) {
                    console.error('[ERROR] Failed to play audio:', audioError);
                }
            }
        } catch (error) {
            console.error('[ERROR] Failed to process message:', error);
            setError('Failed to get response from AI. Please try again.');
        }
    };

    return (
        <>
            <Head>
                <title>Chat with Lord Vader</title>
            </Head>
            <div className="page-container">
                <div className="chat-container">
                    <div className="chat-header">
                        <h1>Chat with Lord Vader</h1>
                    </div>
                    <div className="messages-container">
                        {messages.length === 0 ? (
                            <div className="empty-state">
                                Begin your conversation with Lord Vader...
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div key={index} className="message-group">
                                    <div className="user-message">
                                        <p>{msg.text}</p>
                                    </div>
                                    <div className="ai-message">
                                        <p>{msg.response}</p>
                                        {msg.audioUrl && (
                                            <div className="audio-controls">
                                                <audio controls src={msg.audioUrl}>
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {error && <div className="error-message">{error}</div>}
                    </div>
                    <div className="input-container">
                        <ChatInput onMessageSend={handleMessageSend} />
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
                }
                .messages-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    background: rgba(255, 0, 0, 0.05);
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .empty-state {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-style: italic;
                }
                .message-group {
                    margin-bottom: 20px;
                }
                .user-message {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .ai-message {
                    background: rgba(255, 0, 0, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                }
                .user-message p,
                .ai-message p {
                    margin: 0;
                    line-height: 1.5;
                }
                .error-message {
                    color: #ff4444;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                    background: rgba(255, 68, 68, 0.1);
                }
                .audio-controls {
                    margin-top: 15px;
                }
                .input-container {
                    padding: 20px;
                    background: rgba(255, 0, 0, 0.05);
                    border-radius: 8px;
                }
                audio {
                    width: 100%;
                    margin-top: 10px;
                }
                audio::-webkit-media-controls-panel {
                    background: rgba(255, 0, 0, 0.1);
                }
            `}</style>
        </>
    );
}