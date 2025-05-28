import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const Chat = () => {
  const { ws, error, isConnecting, connect } = useWebSocket('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ content: string; timestamp: string }[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    connect(); // Connect on mount
    // Cleanup handled by hook
  }, [connect]);

  useEffect(() => {
    if (!ws) return;
    setIsConnected(ws.readyState === WebSocket.OPEN);
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'chat_response') {
          setMessages((prev) => [...prev, message.data]);
        }
      } catch (e) {
        // Ignore parse errors
      }
    };
    // No need to cleanup ws.onmessage, as ws is replaced on reconnect
  }, [ws]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'chat',
          data: {
            content: input,
            max_tokens: 2048,
          },
        })
      );
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
          placeholder={isConnected ? 'Type a message...' : isConnecting ? 'Connecting...' : 'Not connected'}
          disabled={!isConnected || isConnecting}
          style={{ flex: 1, padding: 12, borderRadius: 6, border: '1px solid #333', background: '#222', color: '#fff' }}
        />
        <button type="submit" disabled={!isConnected || !input.trim() || isConnecting} style={{ padding: '0 24px', borderRadius: 6, background: isConnected ? '#2962ff' : '#888', color: '#fff', border: 'none', fontWeight: 'bold' }}>
          Send
        </button>
      </form>
      {isConnecting && <div style={{ color: '#888', marginTop: 8 }}>Connecting to chat server...</div>}
      {error && <div style={{ color: 'red', marginTop: 8 }}>Error: {error.message}</div>}
      {!isConnected && !isConnecting && !error && <div style={{ color: '#888', marginTop: 8 }}>Not connected.</div>}
    </div>
  );
};

export default Chat; 