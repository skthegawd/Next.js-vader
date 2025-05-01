import { useState } from "react";

const ChatInput = ({ onMessageSend, disabled }) => {
    const [input, setInput] = useState("");

    // Function to send a message
    const handleSendMessage = async () => {
        if (!input.trim() || disabled) return;
        
        try {
            await onMessageSend({ text: input.trim() });
            setInput(""); // Clear input after successful send
        } catch (error) {
            console.error('[ERROR] Failed to send message:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className={`chat-input-container ${disabled ? 'disabled' : ''}`}>
            <input
                type="text"
                id="chat-input"
                name="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={disabled ? "Lord Vader is thinking..." : "Type a message..."}
                disabled={disabled}
                className="chat-input-field"
                autoComplete="off"
            />
            <button 
                onClick={handleSendMessage} 
                disabled={!input.trim() || disabled}
                className={`send-button ${disabled ? 'disabled' : ''}`}
            >
                {disabled ? "Waiting..." : "Send"}
            </button>
            <style jsx>{`
                .chat-input-container {
                    display: flex;
                    gap: 10px;
                    padding: 15px;
                    background: rgba(255, 0, 0, 0.1);
                    border-radius: 8px;
                    transition: opacity 0.3s ease;
                }

                .chat-input-container.disabled {
                    opacity: 0.7;
                }

                .chat-input-field {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid rgba(255, 0, 0, 0.3);
                    border-radius: 20px;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    font-size: 16px;
                    transition: all 0.3s ease;
                }

                .chat-input-field:focus {
                    outline: none;
                    border-color: rgba(255, 0, 0, 0.6);
                    box-shadow: 0 0 10px rgba(255, 0, 0, 0.2);
                }

                .chat-input-field:disabled {
                    background: rgba(0, 0, 0, 0.5);
                    cursor: not-allowed;
                }

                .send-button {
                    padding: 12px 24px;
                    background: rgba(255, 0, 0, 0.8);
                    border: none;
                    border-radius: 20px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 100px;
                    text-transform: uppercase;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                }

                .send-button:hover:not(:disabled) {
                    background: rgba(255, 0, 0, 1);
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3);
                }

                .send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .send-button.disabled {
                    background: rgba(255, 0, 0, 0.4);
                }

                @media (max-width: 600px) {
                    .chat-input-container {
                        padding: 10px;
                    }

                    .send-button {
                        padding: 12px 16px;
                        min-width: 80px;
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ChatInput;