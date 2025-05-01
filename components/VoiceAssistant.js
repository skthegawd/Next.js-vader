"use client";

import { useState, useEffect, useRef } from 'react';
import { sendToAI } from '../lib/api';
import { tts_api_tts, stt_api_stt, wakeword_api_wakeword } from '../lib/voice';
import wsService, { WS_MESSAGE_TYPES } from '../lib/websocket';
import { logger } from '../lib/logger';
import ModelStatusIndicator from './ModelStatusIndicator';

export default function VoiceAssistant() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState(["Lord Vader, your AI assistant is at your command."]);
    const [loading, setLoading] = useState(false);
    const [wakewordDetected, setWakewordDetected] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [modelParams, setModelParams] = useState({
        temperature: 0.7,
        maxTokens: 2048
    });
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [wsStatus, setWsStatus] = useState('disconnected');

    const messagesEndRef = useRef(null);
    const currentMessageRef = useRef('');

    // Initialize WebSocket connection
    useEffect(() => {
        // Subscribe to WebSocket status changes
        const unsubscribeStatus = wsService.onStatusChange((status) => {
            setWsStatus(status);
            if (status === 'connected') {
                logger.info('WebSocket connected, requesting initial model status');
                wsService.send(WS_MESSAGE_TYPES.MODEL_STATUS, { action: 'get' });
            }
        });

        // Subscribe to different message types
        const unsubscribeModelStatus = wsService.subscribe(
            WS_MESSAGE_TYPES.MODEL_STATUS,
            (data) => {
                logger.debug('Received model status update', data);
                setModelParams(data);
            }
        );

        const unsubscribeWakeword = wsService.subscribe(
            WS_MESSAGE_TYPES.WAKEWORD_DETECTED,
            (data) => {
                logger.debug('Wakeword detection event', data);
                if (data.detected) {
                    handleWakewordDetected();
                }
            }
        );

        const unsubscribeVoice = wsService.subscribe(
            WS_MESSAGE_TYPES.VOICE_STATUS,
            (data) => {
                logger.debug('Voice status update', data);
                setVoiceEnabled(data.enabled);
            }
        );

        // Connect to WebSocket
        wsService.connect();

        // Cleanup subscriptions
        return () => {
            unsubscribeStatus();
            unsubscribeModelStatus();
            unsubscribeWakeword();
            unsubscribeVoice();
            wsService.disconnect();
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleWakewordDetected = () => {
        setWakewordDetected(true);
        handleSend("How may I serve you, my master?");
        setTimeout(() => setWakewordDetected(false), 2000);
    };

    const handleModelParamsChange = (params) => {
        setModelParams(params);
        // Notify backend of parameter changes
        wsService.send(WS_MESSAGE_TYPES.MODEL_STATUS, { action: 'update', params });
    };

    const handleSend = async (text) => {
        if (!text.trim() || loading) return;
        setLoading(true);
        const userMessage = `> ${text}`;
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        currentMessageRef.current = '';

        try {
            logger.debug("Sending request to GPT API...");
            
            if (isStreaming) {
                setMessages(prev => [...prev, '']);
                await sendToAI(text, {
                    stream: true,
                    onChunk: (chunk) => {
                        currentMessageRef.current += chunk;
                        setMessages(prev => [
                            ...prev.slice(0, -1),
                            currentMessageRef.current
                        ]);
                    },
                    ...modelParams
                });
            } else {
                const response = await sendToAI(text, { ...modelParams });
                logger.debug("GPT API Response:", response);

                if (response.error) {
                    throw new Error(response.error);
                }

                setMessages(prev => [...prev, response.response]);
                if (voiceEnabled && response.tts_audio) {
                    await tts_api_tts(response.response);
                }
            }
        } catch (error) {
            logger.error("AI Processing Failed:", error);
            setMessages(prev => [...prev, "[Error] Unable to process command. Try again."]);
        } finally {
            setLoading(false);
            currentMessageRef.current = '';
        }
    };

    const toggleVoice = () => {
        const newState = !voiceEnabled;
        setVoiceEnabled(newState);
        wsService.send(WS_MESSAGE_TYPES.VOICE_STATUS, { enabled: newState });
    };

    const toggleStreaming = () => {
        const newState = !isStreaming;
        setIsStreaming(newState);
        wsService.send(WS_MESSAGE_TYPES.SYSTEM, { 
            action: 'update_streaming',
            enabled: newState 
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <ModelStatusIndicator 
                    onModelParamsChange={handleModelParamsChange}
                    wsStatus={wsStatus}
                />
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
                            onClick={toggleStreaming}
                            className={`px-3 py-1 rounded ${isStreaming ? 'bg-green-600' : 'bg-gray-600'}`}
                            title={isStreaming ? 'Streaming enabled' : 'Streaming disabled'}
                        >
                            <span className="sr-only">Toggle Streaming</span>
                            ⚡
                        </button>
                        <button 
                            onClick={toggleVoice}
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
}
