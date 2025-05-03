import { useEffect, useState } from 'react';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';

export const WebSocketExample = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Generate a unique client ID (in a real app, this might come from authentication)
  const clientId = 'user-123'; // Replace with actual user ID or session ID

  const { isConnected, error, sendMessage } = useWebSocket({
    clientId,
    onMessage: (data) => {
      setMessages(prev => [...prev, data]);
    },
    onError: (err) => {
      console.error('WebSocket error:', err);
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const message: WebSocketMessage = {
      type: 'chat',
      payload: {
        text: inputMessage,
        timestamp: new Date().toISOString(),
      },
    };

    sendMessage(message);
    setInputMessage('');
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {error && (
          <div className="text-red-500 mt-2">
            Error: Connection failed
          </div>
        )}
      </div>

      <div className="border rounded-lg p-4 h-[400px] mb-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <pre className="whitespace-pre-wrap">{JSON.stringify(msg, null, 2)}</pre>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={!isConnected}
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-300"
        >
          Send
        </button>
      </div>
    </div>
  );
}; 