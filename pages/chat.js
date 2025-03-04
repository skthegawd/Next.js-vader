import { useEffect, useState } from "react";
import { authorizedRequest, registerUser, getAuthTokenFromAPI } from "../lib/api";
import Layout from "../components/Layout";

const Chat = () => {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const initializeUser = async () => {
            let userId = localStorage.getItem("vader_user_id");
            if (!userId) {
                const newUser = await registerUser("anonymous_user");
                if (newUser?.user_id) {
                    userId = newUser.user_id;
                    localStorage.setItem("vader_user_id", userId);
                }
            }
            let token = localStorage.getItem("vader_auth_token");
            if (!token) {
                token = await getAuthTokenFromAPI(userId);
            }
        };

        initializeUser();
    }, []);

    useEffect(() => {
        authorizedRequest("GET", "/messages")
            .then(response => setMessages(response))
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