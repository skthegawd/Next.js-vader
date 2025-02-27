import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import VoiceAssistant from "../components/VoiceAssistant";
import WakewordListener from "../components/WakewordListener";
import ChatInput from "../components/ChatInput";
import { sendToAI } from "../lib/api";
import { getAccessToken } from "../lib/auth"; // ✅ Import authentication helper
import "../styles/chat.css";

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getSessionId = () => {
        let sessionId = localStorage.getItem("session_id");
        if (!sessionId) {
            sessionId = `session_${Date.now()}`;
            localStorage.setItem("session_id", sessionId);
        }
        return sessionId;
    };

    const sendMessage = async (messageText) => {
        if (!messageText.trim()) return;
        setError(null); // Reset error state before new request

        const userMessage = { sender: "user", text: messageText };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const session_id = getSessionId();
            const token = await getAccessToken(); // ✅ Fetch JWT token before request

            console.log("[DEBUG] Sending request to GPT API:", messageText);
            
            const response = await sendToAI(messageText, session_id, token); // ✅ Pass token to API call

            if (response && response.response) {
                const botMessage = { sender: "bot", text: response.response };
                setMessages((prev) => [...prev, botMessage]);
            } else {
                console.warn("[WARNING] No valid response received from API.");
                setMessages((prev) => [...prev, { sender: "bot", text: "[Error] No response from AI." }]);
            }
        } catch (error) {
            console.error("[ERROR] API Request Failed:", error);
            setError("Failed to communicate with AI. Please try again.");
            setMessages((prev) => [...prev, { sender: "bot", text: "[Error] Unable to process request." }]);
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
                        <div key={index} className={msg.sender === "user" ? "user-message" : "bot-message"}>
                            {msg.text}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                {error && <p className="error-message">{error}</p>}
                <ChatInput onMessageSend={(message) => sendMessage(message)} />
                <VoiceAssistant onTranscribe={(transcription) => sendMessage(transcription)} />
                <WakewordListener onWakewordDetected={() => sendMessage("How may I serve you, my master?")} />
            </main>
        </div>
    );
}
