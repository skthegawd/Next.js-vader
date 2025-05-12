import { useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "";

export const WebSocketExample = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [lastPong, setLastPong] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [inputMessage, setInputMessage] = useState('');

  const { status, sendMessage, refreshModelStatus } = useWebSocket(
    wsUrl,
    {
      config: { endpoint: "chat" },
      onModelStatus: (payload) => setMessages((prev) => [...prev, { type: 'model_status', payload, timestamp: new Date().toISOString() }]),
      onConnection: (msg) => setConnectionStatus("connected"),
      onPong: (msg) => setLastPong(msg.timestamp || new Date().toISOString()),
      onError: (err) => setError(err),
      onStatusChange: (s) => setConnectionStatus(s),
    }
  );

  const handleSendMessage = () => {
    if (!inputMessage.trim() || status !== 'connected') return;
    sendMessage({ type: 'chat', payload: { text: inputMessage } });
    setInputMessage('');
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <div>Status: {connectionStatus}</div>
        <button onClick={refreshModelStatus}>Request Model Status</button>
        {lastPong && <div>Last pong: {lastPong}</div>}
        {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
      </div>
      <div className="border rounded-lg p-4 h-[400px] mb-4 overflow-y-auto">
        {(Array.isArray(messages) ? messages : []).length === 0 ? (
          <div className="text-gray-500 text-center mt-4">
            No messages yet. Start chatting!
          </div>
        ) : (
          (Array.isArray(messages) ? messages : []).map((msg, index) => (
            <div key={index} className="mb-4">
              <div className="text-sm text-gray-500">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
              </div>
              <div className="mt-1 p-3 rounded-lg bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(msg.payload, null, 2)}
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
          placeholder={status === 'connected' ? "Type a message..." : "Connecting..."}
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={status !== 'connected'}
        />
        <button
          onClick={handleSendMessage}
          disabled={status !== 'connected' || !inputMessage.trim()}
          className={`px-4 py-2 rounded-lg ${
            status === 'connected' && inputMessage.trim()
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