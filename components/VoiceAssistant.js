"use client";

import { useState, useEffect } from 'react';
import { sendToAI } from '../lib/api';
import { tts_api_tts, stt_api_stt, wakeword_api_wakeword } from '../lib/voice';

export default function VoiceAssistant() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState(["Lord Vader, your AI assistant is at your command."]);
    const [loading, setLoading] = useState(false);
    const [wakewordDetected, setWakewordDetected] = useState(false);

    useEffect(() => {
        const listenForWakeword = async () => {
            try {
                console.log("[DEBUG] Listening for wakeword...");
                const detected = await wakeword_api_wakeword();
                if (detected) {
                    console.log("[DEBUG] Wakeword detected!");
                    setWakewordDetected(true);
                    handleSend("How may I serve you, my master?");
                    setTimeout(() => setWakewordDetected(false), 2000); // Reset indicator
                }
            } catch (error) {
                console.error("[ERROR] Wakeword detection failed:", error);
            }
        };
        listenForWakeword();
    }, []);

    const handleSend = async (text) => {
        if (!text.trim() || loading) return;
        setLoading(true);
        const userMessage = `> ${text}`;
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            console.log("[DEBUG] Sending request to GPT API...");
            const response = await sendToAI(text);
            console.log("[DEBUG] GPT API Response:", response);

            if (response.error) {
                throw new Error(response.error);
            }

            setMessages(prev => [...prev, response.reply]);
            await tts_api_tts(response.reply);
        } catch (error) {
            console.error("[ERROR] AI Processing Failed:", error);
            setMessages(prev => [...prev, "[Error] Unable to process command. Try again."]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="terminal">
            <div className={`wakeword-indicator ${wakewordDetected ? "active" : ""}`}></div>
            <div className="terminal-output">
                {messages.map((msg, index) => (
                    <p key={index}>{msg}</p>
                ))}
            </div>
            <div className="terminal-input">
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Enter your command..." 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                    className="terminal-textbox"
                    disabled={loading}
                />
                <button onClick={() => handleSend(input)} className="terminal-button" disabled={loading}>
                    {loading ? 'Processing...' : 'Send'}
                </button>
            </div>
            <style jsx>{`
                .wakeword-indicator {
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    background: grey;
                    margin: 10px auto;
                    transition: background 0.3s;
                }
                .wakeword-indicator.active {
                    background: red;
                    box-shadow: 0 0 10px red;
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
