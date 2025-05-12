"use client";

import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { ApiError } from '../lib/api';
import { tts_api_tts, stt_api_stt, wakeword_api_wakeword } from '../lib/voice';
import { ModelStatusIndicator } from './ModelStatusIndicator';
import React, { createContext, useReducer, useContext } from 'react';
import { getOrCreateSessionId } from '../lib/config';
import type { ChatContextState, ChatMessage, SessionState, StreamingState, ErrorState, RateLimitState } from '../lib/types';

interface ModelParams {
    temperature: number;
    maxTokens: number;
}

// Helper to extract chat messages from various backend response formats
function extractChatMessages(response: any): { role: string, content: string }[] {
    if (response?.data?.messages) {
        // Non-streaming response (array of messages)
        return response.data.messages;
    } else if (response?.data?.content) {
        // Streaming or direct content response
        return [{
            role: response.data.role || 'assistant',
            content: response.data.content
        }];
    } else if (response?.messages) {
        // Flattened response
        return response.messages;
    }
    return [];
}

// Initial state for context
const initialSession: SessionState = {
    sessionId: getOrCreateSessionId(),
    isActive: true,
    lastActivity: Date.now(),
    messageCount: 0,
};
const initialStreaming: StreamingState = {
    isStreaming: false,
    currentChunk: '',
    error: null,
    eventSource: null,
};
const initialError: ErrorState = {
    hasError: false,
    errorMessage: '',
    errorDetails: null,
    retryCount: 0,
    retryAfter: 0,
};
const initialRateLimit: RateLimitState = {
    isLimited: false,
    retryAfter: 0,
    lastRequest: 0,
};

const ChatContext = createContext<ChatContextState | undefined>(undefined);

function chatReducer(state: Omit<ChatContextState, 'setMessages' | 'addMessage' | 'setStreaming' | 'setError' | 'setRateLimit' | 'reset'>, action: any) {
    switch (action.type) {
        case 'SET_MESSAGES':
            return { ...state, messages: action.payload };
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload] };
        case 'SET_STREAMING':
            return { ...state, streaming: { ...state.streaming, ...action.payload } };
        case 'SET_ERROR':
            return { ...state, error: { ...state.error, ...action.payload } };
        case 'SET_RATELIMIT':
            return { ...state, rateLimit: { ...state.rateLimit, ...action.payload } };
        case 'RESET':
            return {
                ...state,
                session: { ...initialSession, sessionId: getOrCreateSessionId() },
                streaming: initialStreaming,
                error: initialError,
                rateLimit: initialRateLimit,
                messages: [],
            };
        default:
            return state;
    }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(chatReducer, {
        session: initialSession,
        streaming: initialStreaming,
        error: initialError,
        rateLimit: initialRateLimit,
        messages: [],
    });
    const setMessages = (msgs: ChatMessage[]) => dispatch({ type: 'SET_MESSAGES', payload: msgs });
    const addMessage = (msg: ChatMessage) => dispatch({ type: 'ADD_MESSAGE', payload: msg });
    const setStreaming = (s: Partial<StreamingState>) => dispatch({ type: 'SET_STREAMING', payload: s });
    const setError = (e: Partial<ErrorState>) => dispatch({ type: 'SET_ERROR', payload: e });
    const setRateLimit = (r: Partial<RateLimitState>) => dispatch({ type: 'SET_RATELIMIT', payload: r });
    const reset = () => dispatch({ type: 'RESET' });
    return (
        <ChatContext.Provider value={{ ...state, setMessages, addMessage, setStreaming, setError, setRateLimit, reset }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used within a ChatProvider');
    return ctx;
}

const VoiceAssistant: React.FC = () => {
    const [input, setInput] = useState('');
    const { messages, setMessages, setStreaming, setError, setRateLimit } = useChat();
    const [loading, setLoading] = useState(false);
    const [wakewordDetected, setWakewordDetected] = useState(false);
    const [modelParams, setModelParams] = useState<ModelParams>({
        temperature: 0.7,
        maxTokens: 2048
    });
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentMessageRef = useRef('');
    const lastMessageRef = useRef('');

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
                setError({
                    message: "Voice detection unavailable. Please use text input.",
                    isRetryable: false,
                    retryCount: 0
                });
            }
        };
        listenForWakeword();
    }, []);

    const handleRetry = () => {
        if (!lastMessageRef.current) return;
        handleSend(lastMessageRef.current);
    };

    const handleSend = async (text: string) => {
        if (!text.trim() || loading) return;
        
        setLoading(true);
        setError(null);
        const userMessage = `> ${text}`;
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        currentMessageRef.current = '';
        lastMessageRef.current = text;

        try {
            console.log("[DEBUG] Sending request to AI...");
            
            if (setStreaming.isStreaming) {
                setMessages(prev => [...prev, '']);
                await api.sendToAI(text, {
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
                const response = await api.sendToAI(text, {
                    temperature: modelParams.temperature,
                    maxTokens: modelParams.maxTokens
                });

                if (response.error) {
                    throw new Error(response.error);
                }

                // Use helper to extract reply from backend response
                const messagesArr = extractChatMessages(response);
                const reply = messagesArr.find(m => m.role === 'assistant')?.content
                    || messagesArr[messagesArr.length - 1]?.content
                    || response.response
                    || response.message
                    || '';
                setMessages(prev => [...prev, reply]);
                if (voiceEnabled && reply) {
                    await tts_api_tts(reply);
                }
            }
        } catch (error) {
            console.error("[ERROR] AI Processing Failed:", error);
            
            if (error instanceof ApiError) {
                setError({
                    message: error.message,
                    isRetryable: error.isNetworkError || error.status >= 500,
                    retryCount: error.retryCount
                });
                
                setMessages(prev => [...prev, 
                    `[Error] ${error.message}${error.isNetworkError ? 
                        ". Please check your connection." : 
                        ". Please try again later."}`
                ]);
            } else {
                setError({
                    message: "An unexpected error occurred",
                    isRetryable: false,
                    retryCount: 0
                });
                setMessages(prev => [...prev, "[Error] Unable to process command. Try again."]);
            }
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
                    {(Array.isArray(messages) ? messages : []).map((msg, index) => (
                        <p key={index} className="whitespace-pre-wrap">{msg}</p>
                    ))}
                    {setError.isRetryable && (
                        <div className="error-container">
                            <p className="text-red-500">{setError.message}</p>
                            <button 
                                onClick={handleRetry}
                                className="retry-button"
                                disabled={loading}
                            >
                                Retry Request
                            </button>
                        </div>
                    )}
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
                            onClick={() => setStreaming({ isStreaming: !setStreaming.isStreaming })}
                            className={`px-3 py-1 rounded ${setStreaming.isStreaming ? 'bg-green-600' : 'bg-gray-600'}`}
                            title={setStreaming.isStreaming ? 'Streaming enabled' : 'Streaming disabled'}
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
                .error-container {
                    margin: 1rem 0;
                    padding: 1rem;
                    border: 1px solid #ff4444;
                    border-radius: 4px;
                    background: rgba(255, 68, 68, 0.1);
                }
                .retry-button {
                    margin-top: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .retry-button:hover:not(:disabled) {
                    background: #ff6666;
                }
                .retry-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default VoiceAssistant; 