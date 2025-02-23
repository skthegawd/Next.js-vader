import { useState } from "react";
import { sendToAI } from "../lib/api";

const ChatInput = ({ onMessageSent }) => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        setLoading(true);

        try {
            const response = await sendToAI(input);
            if (onMessageSent) {
                onMessageSent({ text: input, response: response.response });
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }

        setInput("");
        setLoading(false);
    };

    return (
        <div className="chat-input-container">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
            />
            <button onClick={handleSendMessage} disabled={loading}>
                {loading ? "Sending..." : "Send"}
            </button>
        </div>
    );
};

export default ChatInput;
