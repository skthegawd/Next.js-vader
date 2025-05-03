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
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  
  const { isConnected, error, sendMessage, reconnect } = useWebSocket({
    clientId,
    endpoint: 'chat', // Specify the endpoint
    onMessage: (data) => {
      console.log('[Chat] Received message:', data);
      if (data.type === 'connection_established') {
        setConnectionStatus('connected');
      } else if (data.type !== 'pong') { // Don't show pong messages in the UI
        setMessages(prev => [...prev, data]);
      }
    },
    onError: (err) => {
      console.error('[Chat] WebSocket error:', err);
      setConnectionStatus('error');
    },
  });

  // Update connection status when isConnected changes
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;

    const message: WebSocketMessage = {
      type: 'chat',
      payload: {
        text: inputMessage,
      },
    };

    const sent = sendMessage(message);
    if (sent) {
      setInputMessage('');
    } else {
      console.error('[Chat] Failed to send message');
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`} />
          <span className="capitalize">{connectionStatus}</span>
          {!isConnected && (
            <button
              onClick={() => reconnect()}
              className="ml-2 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reconnect
            </button>
          )}
        </div>
        {error && (
          <div className="text-red-500 mt-2 text-sm">
            Error: Connection failed. Please check your network connection and try again.
          </div>
        )}
        <div className="text-sm text-gray-500 mt-1">
          Client ID: {clientId}
        </div>
      </div>

      <div className="border rounded-lg p-4 h-[400px] mb-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center mt-4">
            No messages yet. Start chatting!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="mb-4">
              <div className="text-sm text-gray-500">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
              <div className={`mt-1 p-3 rounded-lg ${
                msg.client_id === clientId ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
              }`}>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(msg.data || msg.payload, null, 2)}
                </pre>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={!isConnected}
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected || !inputMessage.trim()}
          className={`px-4 py-2 rounded-lg ${
            isConnected && inputMessage.trim()
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}; 