import React, { useEffect, useState } from 'react';
import { WebSocketManager } from '../lib/websocket';
import { ModelStatusData, WSModelStatusMessage } from '../types/websocket';
import type { WebSocketStatus } from '../lib/websocket';

interface ModelStatusIndicatorProps {
  onStatusChange?: (status: ModelStatusData) => void;
}

export const ModelStatusIndicator: React.FC<ModelStatusIndicatorProps> = ({ onStatusChange }) => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [modelStatus, setModelStatus] = useState<ModelStatusData>({
    streaming_enabled: true,
    temperature: 0.7,
    max_tokens: 150,
    models: {
      chat: 'unknown',
      voice: 'unknown'
    }
  });

  useEffect(() => {
    // Get the WebSocket instance using the singleton pattern
    const ws = WebSocketManager.getInstance('model-status');

    ws.onStatus((newStatus) => {
      setStatus(newStatus);
    });

    ws.onMessage((data) => {
      if (data.type === 'model_status') {
        const statusMsg = data as WSModelStatusMessage;
        setModelStatus(statusMsg.data);
        onStatusChange?.(statusMsg.data);
      }
    });

    // Cleanup on unmount
    return () => {
      ws.disconnect();
    };
  }, [onStatusChange]);

  return (
    <div className="model-status">
      <div className="status-row">
        <div className={`status-indicator ${status}`} />
        <span>Connection: {status}</span>
      </div>
      
      <div className="model-info">
        <div className="info-row">
          <span>Streaming: {modelStatus.streaming_enabled ? 'Enabled' : 'Disabled'}</span>
          <span>Temperature: {modelStatus.temperature.toFixed(1)}</span>
        </div>
        <div className="info-row">
          <span>Max Tokens: {modelStatus.max_tokens}</span>
          <span>Models: {modelStatus.models.chat} / {modelStatus.models.voice}</span>
        </div>
      </div>

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

        .connecting {
          background: #ffd700;
          animation: pulse 1s infinite;
        }

        .connected {
          background: #4caf50;
        }

        .disconnected {
          background: #f44336;
        }

        .error {
          background: #ff9800;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}; 