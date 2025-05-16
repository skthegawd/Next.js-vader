import { useState } from 'react';
import { useChat } from '../hooks/useChat';

export function Chat() {
  const { isConnected, messages, sendMessage, setMessages } = useChat();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setMessages(prev => [
        ...prev,
        { content: input, timestamp: new Date().toISOString() }
      ]);
      setInput('');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <div style={{ minHeight: 300, border: '1px solid #333', borderRadius: 8, padding: 16, marginBottom: 16, background: '#181818', color: '#fff' }}>
        {messages.length === 0 ? (
          <div style={{ color: '#888', textAlign: 'center' }}>No messages yet. Start chatting!</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</div>
              <div style={{ background: '#222', borderRadius: 6, padding: 8, marginTop: 2 }}>{msg.content}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
          disabled={!isConnected}
          style={{ flex: 1, padding: 12, borderRadius: 6, border: '1px solid #333', background: '#222', color: '#fff' }}
        />
        <button type="submit" disabled={!isConnected || !input.trim()} style={{ padding: '0 24px', borderRadius: 6, background: isConnected ? '#2962ff' : '#888', color: '#fff', border: 'none', fontWeight: 'bold' }}>
          Send
        </button>
      </form>
      {!isConnected && <div style={{ color: '#888', marginTop: 8 }}>Connecting...</div>}
    </div>
  );
} 