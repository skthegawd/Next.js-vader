import { useEffect, useState } from 'react';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';

// Generate a unique client ID
const generateClientId = () => {
  return `client-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
};

export const WebSocketExample = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [clientId] = useState(generateClientId); // Generate once when component mounts
  
  const { isConnected, error, sendMessage } = useWebSocket({
    clientId,
    endpoint: 'chat', // Specify the endpoint
    onMessage: (data) => {
      console.log('Received message:', data);
      if (data.type !== 'pong') { // Don't show pong messages in the UI
        setMessages(prev => [...prev, data]);
      }
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
        <div className="text-sm text-gray-500 mt-1">
          Client ID: {clientId}
        </div>
      </div>

      <div className="border rounded-lg p-4 h-[400px] mb-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <div className="text-sm text-gray-500">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded">
              {JSON.stringify(msg.data || msg.payload, null, 2)}
            </pre>
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