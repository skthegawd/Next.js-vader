import { useState } from "react";
import { sendToAI } from "../lib/api";
import { ensureAuthenticated } from "../lib/auth";

const ChatInput = ({ onMessageSend }) => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        setLoading(true);

        try {
            console.log("[DEBUG] Authenticating user...");
            const token = await ensureAuthenticated();
            if (!token) {
                console.error("[ERROR] Authentication failed. No token found.");
                setLoading(false);
                return;
            }

            console.log("[DEBUG] Sending message to API:", input);
            const response = await sendToAI(input);
            console.log("[DEBUG] API Response:", response);

            if (onMessageSend) {
                onMessageSend({ text: input, response: response.response });
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