import { useState, useRef } from 'react';
import ChatInput from '../components/ChatInput';
import { sendToAI } from '../lib/api';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const audioRef = useRef(null);

    const handleMessageSend = async (messageData) => {
        try {
            const response = await sendToAI(messageData.text);
            console.log('[DEBUG] GPT API Response:', response);
            
            if (response && response.response) {
                const newMessage = {
                    text: messageData.text,
                    response: response.response,
                    audioUrl: response.tts_audio, // Store the audio URL if available
                    timestamp: new Date().toISOString()
                };

                setMessages(prev => [...prev, newMessage]);

                // If there's an audio URL, play it
                if (response.tts_audio) {
                    const audio = new Audio(response.tts_audio);
                    audio.play().catch(error => {
                        console.error('[ERROR] Failed to play audio:', error);
                    });
                }
            } else {
                throw new Error('Invalid response format from API');
            }
        } catch (error) {
            console.error('[ERROR] GPT API Failed:', error);
            setError('Failed to get response from AI. Please try again.');
        }
    };

    return (
        <div className="chat-container">
            <div className="messages-container">
                {messages.map((msg, index) => (
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
                ))}
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
                .message-group {
                    margin-bottom: 20px;
                }
                .user-message {
                    background: #3a3a3a;
                    padding: 10px 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .ai-message {
                    background: #4a4a4a;
                    padding: 10px 15px;
                    border-radius: 8px;
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
                }
            `}</style>
        </div>
    );
}