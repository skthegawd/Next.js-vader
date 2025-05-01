import { useState } from 'react';
import ChatInput from '../components/ChatInput';
import { sendToAI } from '../lib/api';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);

    const handleMessageSend = async (messageData) => {
        try {
            const response = await sendToAI(messageData.text);
            
            if (response && response.response) {
                setMessages(prev => [...prev, {
                    text: messageData.text,
                    response: response.response,
                    timestamp: new Date().toISOString()
                }]);
            } else {
                throw new Error('Invalid response from API');
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
                        <div className="user-message">{msg.text}</div>
                        <div className="ai-message">{msg.response}</div>
                    </div>
                ))}
                {error && <div className="error-message">{error}</div>}
            </div>
            <ChatInput onMessageSend={handleMessageSend} />
        </div>
    );
}