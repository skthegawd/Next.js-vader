import React, { useEffect, useRef, useState } from 'react';
import { ModelStatusIndicator } from './ModelStatusIndicator';
import { sendToAI } from '../lib/api';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
  audioUrl?: string;
}

interface VoiceAssistantProps {
  initialMessage?: string;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ initialMessage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialMessage || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [modelConfig, setModelConfig] = useState({
    streaming_enabled: true,
    temperature: 0.7,
    max_tokens: 150,
    models: {
      chat: 'gpt-3.5-turbo',
      voice: 'eleven-labs-v1'
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      let assistantResponse = '';
      
      if (streamingEnabled) {
        const tempMessage: Message = {
          text: '',
          isUser: false,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, tempMessage]);

        await sendToAI(input, {
          stream: true,
          onChunk: (chunk) => {
            assistantResponse += chunk;
            setMessages(prev => [
              ...prev.slice(0, -1),
              { ...prev[prev.length - 1], text: assistantResponse }
            ]);
          },
          ...modelConfig
        });
      } else {
        const response = await sendToAI(input, {
          stream: false,
          ...modelConfig
        });
        
        assistantResponse = response.response;
        const assistantMessage: Message = {
          text: assistantResponse,
          isUser: false,
          timestamp: new Date().toISOString(),
          audioUrl: voiceEnabled ? response.tts_audio : undefined
        };
        
        setMessages(prev => [...prev, assistantMessage]);

        if (voiceEnabled && response.tts_audio) {
          audioRef.current?.play();
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [
        ...prev,
        {
          text: 'Sorry, there was an error processing your message. Please try again.',
          isUser: false,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="voice-assistant">
      <ModelStatusIndicator
        onStatusChange={(status) => {
          setModelConfig(status);
        }}
      />

      <div className="controls">
        <label>
          <input
            type="checkbox"
            checked={modelConfig.streaming_enabled}
            onChange={(e) => setModelConfig(prev => ({
              ...prev,
              streaming_enabled: e.target.checked
            }))}
          />
          Streaming
        </label>
        <label>
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
          />
          Voice Output
        </label>
      </div>

      <div className="messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.isUser ? 'user' : 'assistant'}`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <span className="timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {message.audioUrl && (
              <audio
                ref={audioRef}
                src={message.audioUrl}
                controls
                className="audio-player"
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isProcessing}
        />
        <button type="submit" disabled={isProcessing || !input.trim()}>
          {isProcessing ? 'Processing...' : 'Send'}
        </button>
      </form>

      <style jsx>{`
        .voice-assistant {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
        }

        .controls {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .controls label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .messages {
          height: 500px;
          overflow-y: auto;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          margin: 1rem 0;
        }

        .message {
          margin: 0.5rem 0;
          padding: 0.5rem;
          border-radius: 8px;
          max-width: 80%;
        }

        .message.user {
          margin-left: auto;
          background: #2962ff;
        }

        .message.assistant {
          margin-right: auto;
          background: #424242;
        }

        .message-content {
          display: flex;
          flex-direction: column;
        }

        .timestamp {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.25rem;
        }

        .audio-player {
          width: 100%;
          margin-top: 0.5rem;
        }

        .input-form {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        input {
          flex: 1;
          padding: 0.5rem;
          border: none;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background: #2962ff;
          color: white;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        button:disabled {
          background: #424242;
          cursor: not-allowed;
        }

        button:hover:not(:disabled) {
          background: #1e4bd8;
        }
      `}</style>
    </div>
  );
};

export { VoiceAssistant };
export default VoiceAssistant; 