import { useState } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Sidebar';
import VoiceAssistant from '../components/VoiceAssistant';
import styles from '../styles/chat.css';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/gpt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: input })
            });
            const data = await response.json();
            const botMessage = { sender: 'bot', text: data.reply };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
        }
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
                </div>
                <div className="input-container">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder="Type your message..." 
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
                <VoiceAssistant onTranscribe={(transcription) => setInput(transcription)} />
            </main>
        </div>
    );
}