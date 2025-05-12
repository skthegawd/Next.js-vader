import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { WSMessage } from '../types/websocket';

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "";

const ModelStatusIndicator: React.FC = () => {
  const [modelStatus, setModelStatus] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [lastPong, setLastPong] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { status, sendMessage, refreshModelStatus } = useWebSocket(
    wsUrl,
    {
      config: { endpoint: "model-status" },
      onModelStatus: (payload) => setModelStatus(payload),
      onConnection: () => setConnectionStatus("connected"),
      onPong: (msg) => setLastPong(msg.timestamp || new Date().toISOString()),
      onError: (err) => setError(err),
      onStatusChange: (s) => setConnectionStatus(s),
    }
  );

  return (
    <div className="status-indicator">
      <span className={`status-dot ${status}`} />
      <span className="status-text">{status}</span>

      <div>Status: {connectionStatus}</div>
      <button onClick={refreshModelStatus}>Refresh Model Status</button>
      {lastPong && <div>Last pong: {lastPong}</div>}
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
      <pre>{JSON.stringify(modelStatus, null, 2)}</pre>

      <style jsx>{`
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-text {
          font-size: 0.875rem;
          color: var(--death-star-text);
          text-transform: capitalize;
        }

        .loading {
          background: var(--death-star-secondary);
          animation: pulse 1.5s infinite;
        }

        .ready {
          background: var(--death-star-primary);
        }

        .error {
          background: #ff4444;
        }

        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export { ModelStatusIndicator };
export default ModelStatusIndicator; 