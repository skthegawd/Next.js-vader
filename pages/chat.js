import { useState, useEffect } from 'react';
import ChatInput from '../components/ChatInput';
import { sendToAI } from '../lib/api';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);

    // Debug: Log messages whenever they change
    useEffect(() => {
        console.log('[DEBUG] Current messages:', messages);
    }, [messages]);

    const handleMessageSend = async (messageData) => {
        try {
            console.log('[DEBUG] Sending message:', messageData);
            const response = await sendToAI(messageData.text);
            console.log('[DEBUG] Received response:', response);
            
            if (response && response.response) {
                const newMessage = {
                    text: messageData.text,
                    response: response.response,
                    audioUrl: response.tts_audio,
                    timestamp: response.timestamp
                };
                
                console.log('[DEBUG] Adding new message:', newMessage);
                setMessages(prevMessages => {
                    const updatedMessages = [...prevMessages, newMessage];
                    console.log('[DEBUG] Updated messages array:', updatedMessages);
                    return updatedMessages;
                });

                // If there's an audio URL, play it
                if (response.tts_audio) {
                    try {
                        const audio = new Audio(response.tts_audio);
                        await audio.play();
                    } catch (audioError) {
                        console.error('[ERROR] Failed to play audio:', audioError);
                    }
                }
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('[ERROR] Failed to process message:', error);
            setError('Failed to get response from AI. Please try again.');
        }
    };

    return (
        <div className="chat-container">
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
            <ChatInput onMessageSend={handleMessageSend} />
            <style jsx>{`
                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    padding: 20px;
                    background: #1a1a1a;
                    color: #fff;
                }
                .messages-container {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 20px;
                    padding: 20px;
                    border-radius: 8px;
                    background: #2a2a2a;
                }
                .empty-state {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-style: italic;
                }
                .message-group {
                    margin-bottom: 20px;
                    opacity: 1;
                    transition: opacity 0.3s ease-in;
                }
                .user-message {
                    background: #3a3a3a;
                    padding: 10px 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .user-message p {
                    margin: 0;
                }
                .ai-message {
                    background: #4a4a4a;
                    padding: 10px 15px;
                    border-radius: 8px;
                }
                .ai-message p {
                    margin: 0;
                    white-space: pre-wrap;
                }
                .error-message {
                    color: #ff4444;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 4px;
                    background: rgba(255, 68, 68, 0.1);
                }
                .audio-controls {
                    margin-top: 10px;
                }
                audio {
                    width: 100%;
                    margin-top: 8px;
                    background: #3a3a3a;
                    border-radius: 4px;
                }
                audio::-webkit-media-controls-panel {
                    background: #3a3a3a;
                }
            `}</style>
        </div>
    );
}