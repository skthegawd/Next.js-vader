import { useState } from "react";
import { sendToAI } from "../lib/api";
import { registerUser, getAuthTokenFromAPI } from "../lib/api";

const ChatInput = ({ onMessageSend }) => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        if (!input.trim()) return;
        
        setLoading(true);
        setError(null);

        try {
            console.log("[DEBUG] Sending message to API:", input);
            const response = await sendToAI(input);
            
            if (response && response.response) {
                if (onMessageSend) {
                    onMessageSend({
                        text: input,
                        response: response.response,
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                throw new Error("Invalid response format from API");
            }
        } catch (error) {
            console.error("[ERROR] API request failed:", error);
            setError("Failed to send message. Please try again.");
        } finally {
            setInput("");
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chat-input-container">
            {error && <div className="error-message">{error}</div>}
            <input
                type="text"
                id="chat-input"
                name="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={loading}
            />
            <button 
                onClick={handleSendMessage} 
                disabled={!input.trim() || loading}
                className={loading ? 'loading' : ''}
            >
                {loading ? "Sending..." : "Send"}
            </button>
        </div>
    );
};

export default ChatInput;