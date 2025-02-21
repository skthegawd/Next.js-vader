import { useState } from 'react';
import { sendToAI } from '../lib/api';

export default function TerminalUI() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState(["Lord Vader, your AI assistant is at your command."]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage = `> ${input}`;
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            const response = await sendToAI(input);
            setMessages(prev => [...prev, response.reply]);
        } catch (error) {
            setMessages(prev => [...prev, "[Error] Unable to process command."]);
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
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
}