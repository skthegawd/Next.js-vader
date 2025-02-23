import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Sidebar';
import VoiceAssistant from '../components/VoiceAssistant';
import WakewordListener from '../components/WakewordListener';
import ChatInput from '../components/ChatInput'; // ✅ Import ChatInput
import { sendToAI } from '../lib/api';
import '../styles/chat.css';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ✅ Get or Create Session ID for AI Requests
    const getSessionId = () => {
        let sessionId = localStorage.getItem("session_id");
        if (!sessionId) {
            sessionId = `session_${Date.now()}`;
            localStorage.setItem("session_id", sessionId);
        }
        return sessionId;
    };

    // ✅ Send Message to AI Backend
    const sendMessage = async (messageText) => {
        if (!messageText.trim()) return; // Prevent empty input

        const userMessage = { sender: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);

        try {
            const session_id = getSessionId();
            const response = await sendToAI(messageText, session_id);

            if (response && response.response) {
                const botMessage = { sender: 'bot', text: response.response };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error("Invalid AI response");
            }
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: '[Error] Unable to process request.' }]);
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
                    <div ref={chatEndRef} />
                </div>
                {/* ✅ Use ChatInput component instead of inline input field */}
                <ChatInput onMessageSent={(message) => setMessages(prev => [...prev, message])} />
                <VoiceAssistant onTranscribe={(transcription) => sendMessage(transcription)} />
                <WakewordListener onWakewordDetected={() => sendMessage("How may I serve you, my master?")} />
            </main>
        </div>
    );
}