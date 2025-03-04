import { useEffect, useState } from "react";
import { authorizedRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import ChatInput from "../components/ChatInput";

const Chat = () => {
    const { token, loading } = useAuth();
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!token || loading) return;
        const fetchMessages = async () => {
            try {
                const data = await authorizedRequest("GET", "/messages");
                setMessages(data);
            } catch (error) {
                console.error("[ERROR] Fetching messages failed:", error);
            }
        };
        fetchMessages();
    }, [token, loading]);

    const handleNewMessage = (message) => {
        setMessages([...messages, message]);
    };

    return (
        <Layout>
            <div className="chat-container">
                <div className="messages">
                    {messages.map((msg, index) => (
                        <div key={index} className="message">{msg.text}</div>
                    ))}
                </div>
                <ChatInput onMessageSend={handleNewMessage} />
            </div>
        </Layout>
    );
};

export default Chat;