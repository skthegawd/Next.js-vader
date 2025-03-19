import { useState } from "react";
import { sendToAI } from "../lib/api";
import { registerUser, getAuthTokenFromAPI } from "../lib/api";

const ChatInput = ({ onMessageSend }) => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Function to ensure user is authenticated
    const ensureAuthenticated = async () => {
        let token = localStorage.getItem("vader_auth_token");

        if (!token) {
            console.warn("[WARNING] No token found, registering user...");
            const userId = localStorage.getItem("vader_user_id") || `user_${Date.now()}`;
            localStorage.setItem("vader_user_id", userId);

            try {
                await registerUser(userId);
                token = await getAuthTokenFromAPI(userId);
                if (token) {
                    localStorage.setItem("vader_auth_token", token);
                    console.log("[DEBUG] User authenticated successfully.");
                } else {
                    console.error("[ERROR] Failed to fetch authentication token.");
                    return null;
                }
            } catch (error) {
                console.error("[ERROR] Authentication process failed:", error);
                return null;
            }
        }
        return token;
    };

    // Function to send a message
    const handleSendMessage = async () => {
        console.log("[DEBUG] Button Clicked");
        
        if (!input.trim()) return;
        setLoading(true);

        try {
            console.log("[DEBUG] Authenticating user...");
            const token = await ensureAuthenticated();
            if (!token) {
                console.error("[ERROR] Authentication failed. No token available.");
                setLoading(false);
                return;
            }

            console.log("[DEBUG] Sending message to API:", input);
            const response = await sendToAI(input);
            console.log("[DEBUG] API Response:", response);

            if (onMessageSend) {
                onMessageSend({ text: input, response: response?.response });
            }
        } catch (error) {
            console.error("[ERROR] API request failed:", error);
        }

        setInput("");
        setLoading(false);
    };

    return (
        <div className="chat-input-container">
            <input
                type="text"
                id="chat-input"
                name="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
            />
            <button onClick={handleSendMessage} disabled={!input.trim() || loading}>
                {loading ? "Sending..." : "Send"}
            </button>
        </div>
    );
};

export default ChatInput;