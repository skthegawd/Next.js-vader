import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const Chat = () => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/messages`)
            .then(response => setMessages(response.data))
            .catch(error => console.error("Error fetching messages:", error));
    }, []);

    return (
        <Layout>
            <div className="chat-container">
                {messages.map((msg, index) => (
                    <div key={index} className="message">{msg.text}</div>
                ))}
            </div>
        </Layout>
    );
};

export default Chat;