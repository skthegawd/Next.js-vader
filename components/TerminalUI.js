import { useState } from 'react';
import { sendToAI } from '../lib/api';
import { tts_api_tts, stt_api_stt, wakeword_api_wakeword } from '../lib/voice';

export default function TerminalUI() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState(["Lord Vader, your AI assistant is at your command."]);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        setLoading(true);
        const userMessage = `> ${input}`;
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            const response = await sendToAI(input);
            setMessages(prev => [...prev, response.reply]);
            await tts_api_tts(response.reply);
        } catch (error) {
            setMessages(prev => [...prev, "[Error] Unable to process command. Try again."]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="terminal">
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="terminal-textbox"
                />
                <button onClick={handleSend} className="terminal-button" disabled={loading}>
                    {loading ? 'Processing...' : 'Send'}
                </button>
            </div>
            <style jsx>{`
                .terminal {
                    background: black;
                    color: #33ff33;
                    font-family: 'Courier New', monospace;
                    padding: 20px;
                    height: 80vh;
                    border: 2px solid #ff4444;
                    box-shadow: 0 0 10px #ff0000;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }
                .terminal-output {
                    flex-grow: 1;
                    max-height: 60vh;
                    overflow-y: auto;
                    margin-bottom: 10px;
                }
                .terminal-textbox {
                    width: 80%;
                    background: black;
                    color: #33ff33;
                    border: 2px solid #33ff33;
                    padding: 5px;
                }
                .terminal-button {
                    background: black;
                    color: #ff4444;
                    border: 2px solid #ff4444;
                    padding: 5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .terminal-button:hover {
                    background: #ff4444;
                    color: black;
                    box-shadow: 0 0 10px #ff4444;
                }
            `}</style>
        </div>
    );
}
