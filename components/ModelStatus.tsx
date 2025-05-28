import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { ModelStatusData } from '../lib/types/websocket';
import { WS_URL } from '../lib/config';

const wsUrl = WS_URL || "";

const ModelStatus = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatusData | null>(null);
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
    <div className="model-status">
      <div className="status-row">
        <div className={`status-indicator ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`} />
        <span>Connection: {connectionStatus}</span>
      </div>
      
      <div className="model-info">
        <div className="info-row">
          <span>Streaming: {modelStatus?.streaming_enabled ? 'Enabled' : 'Disabled'}</span>
          <span>Temperature: {modelStatus?.temperature.toFixed(1) || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span>Max Tokens: {modelStatus?.max_tokens || 'N/A'}</span>
          <span>Models: {modelStatus?.models.chat || 'N/A'} / {modelStatus?.models.voice || 'N/A'}</span>
        </div>
      </div>

      <div>
        <button onClick={refreshModelStatus}>Refresh Model Status</button>
      </div>
      {lastPong && <div>Last pong: {lastPong}</div>}
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}

      <style jsx>{`
        .model-status {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .status-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .model-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .connected {
          background: #4caf50;
        }

        .disconnected {
          background: #f44336;
        }
      `}</style>
    </div>
  );
};

export default ModelStatus; 