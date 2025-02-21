import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Sidebar';
import VoiceAssistant from '../components/VoiceAssistant';
import WakewordListener from '../components/WakewordListener';
import { sendToAI } from '../lib/api';
import '../styles/chat.css';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return; // Prevent empty input and multiple requests

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await sendToAI(input);
            if (response && response.reply) {
                const botMessage = { sender: 'bot', text: response.reply };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error("Invalid AI response");
            }
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: '[Error] Unable to process request.' }]);
        }

        setLoading(false);
    };

    return (
        <div className="chat-container">
            <Head>
                <title>Vader AI Chat</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Sidebar />
            <main className="chat-main">
                <h1>AI Chat Interface</h1>
                <div className="chat-box">
                    {messages.map((msg, index) => (
                        <div key={index} className={msg.sender === 'user' ? 'user-message' : 'bot-message'}>
                            {msg.text}
                        </div>
                    ))}
                    {loading && <div className="typing-indicator">Vader is thinking...</div>}
                    <div ref={chatEndRef} />
                </div>
                <div className="input-container">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={loading}
                    />
                    <button onClick={sendMessage} disabled={loading}>
                        {loading ? 'Processing...' : 'Send'}
                    </button>
                </div>
                <VoiceAssistant onTranscribe={(transcription) => sendMessage(transcription)} />
                <WakewordListener onWakewordDetected={() => sendMessage("How may I serve you, my master?")} />
            </main>
        </div>
    );
}
