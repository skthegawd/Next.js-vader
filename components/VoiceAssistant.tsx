"use client";

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../lib/api/client';
import { tts_api_tts, stt_api_stt, wakeword_api_wakeword } from '../lib/voice';
import { ModelStatusIndicator } from './ModelStatusIndicator';

interface ModelParams {
    temperature: number;
    maxTokens: number;
}

const VoiceAssistant: React.FC = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<string[]>(["Lord Vader, your AI assistant is at your command."]);
    const [loading, setLoading] = useState(false);
    const [wakewordDetected, setWakewordDetected] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [modelParams, setModelParams] = useState<ModelParams>({
        temperature: 0.7,
        maxTokens: 2048
    });
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentMessageRef = useRef('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const listenForWakeword = async () => {
            try {
                console.log("[DEBUG] Listening for wakeword...");
                const detected = await wakeword_api_wakeword();
                if (detected) {
                    console.log("[DEBUG] Wakeword detected!");
                    setWakewordDetected(true);
                    handleSend("How may I serve you, my master?");
                    setTimeout(() => setWakewordDetected(false), 2000);
                }
            } catch (error) {
                console.error("[ERROR] Wakeword detection failed:", error);
            }
        };
        listenForWakeword();
    }, []);

    const handleSend = async (text: string) => {
        if (!text.trim() || loading) return;
        setLoading(true);
        const userMessage = `> ${text}`;
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        currentMessageRef.current = '';

        try {
            console.log("[DEBUG] Sending request to AI...");
            
            if (isStreaming) {
                setMessages(prev => [...prev, '']);
                await apiClient.sendToAI(text, {
                    stream: true,
                    onChunk: (chunk: string) => {
                        currentMessageRef.current += chunk;
                        setMessages(prev => [
                            ...prev.slice(0, -1),
                            currentMessageRef.current
                        ]);
                    },
                    temperature: modelParams.temperature,
                    maxTokens: modelParams.maxTokens
                });
            } else {
                const response = await apiClient.sendToAI(text, {
                    temperature: modelParams.temperature,
                    maxTokens: modelParams.maxTokens
                });

                if (response.error) {
                    throw new Error(response.error);
                }

                setMessages(prev => [...prev, response.response]);
                if (voiceEnabled && response.tts_audio) {
                    await tts_api_tts(response.response);
                }
            }
        } catch (error) {
            console.error("[ERROR] AI Processing Failed:", error);
            setMessages(prev => [...prev, "[Error] Unable to process command. Try again."]);
        } finally {
            setLoading(false);
            currentMessageRef.current = '';
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <ModelStatusIndicator />
            </div>
            <div className="terminal flex-grow">
                <div className={`wakeword-indicator ${wakewordDetected ? "active" : ""}`}></div>
                <div className="terminal-output overflow-y-auto">
                    {messages.map((msg, index) => (
                        <p key={index} className="whitespace-pre-wrap">{msg}</p>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="terminal-input">
                    <div className="flex items-center space-x-2">
                        <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Enter your command..." 
                            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                            className="terminal-textbox flex-grow"
                            disabled={loading}
                        />
                        <button 
                            onClick={() => setIsStreaming(!isStreaming)}
                            className={`px-3 py-1 rounded ${isStreaming ? 'bg-green-600' : 'bg-gray-600'}`}
                            title={isStreaming ? 'Streaming enabled' : 'Streaming disabled'}
                        >
                            <span className="sr-only">Toggle Streaming</span>
                            ⚡
                        </button>
                        <button 
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`px-3 py-1 rounded ${voiceEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
                            title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
                        >
                            <span className="sr-only">Toggle Voice</span>
                            🔊
                        </button>
                        <button 
                            onClick={() => handleSend(input)} 
                            className="terminal-button" 
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .wakeword-indicator {
                    width: 15px;
                    height: 15px;
                    border-radius: 50%;
                    background: grey;
                    margin: 10px auto;
                    transition: background 0.3s;
                }
                .wakeword-indicator.active {
                    background: red;
                    box-shadow: 0 0 10px red;
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .terminal-output {
                    max-height: calc(100vh - 300px);
                }
            `}</style>
        </div>
    );
};

export default VoiceAssistant; 