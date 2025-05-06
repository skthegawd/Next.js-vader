import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { ModelStatusData } from '../lib/types/websocket';

interface ModelStatusProps {
  onStatusChange?: (status: ModelStatusData) => void;
}

const ModelStatus: React.FC<ModelStatusProps> = ({ onStatusChange }) => {
  const { modelStatus } = useWebSocket();
  const [status, setStatus] = useState<ModelStatusData>({
    streaming_enabled: true,
    temperature: 0.7,
    max_tokens: 150,
    models: {
      chat: 'unknown',
      voice: 'unknown'
    }
  });

  useEffect(() => {
    if (!modelStatus.isConnected) return;

    const handleStatusUpdate = (message: any) => {
      if (message.type === 'model_status') {
        setStatus(message.data);
        onStatusChange?.(message.data);
      }
    };

    modelStatus.onMessage?.(handleStatusUpdate);

    // Request initial status
    modelStatus.sendMessage?.({
      type: 'command',
      command: 'get_model_status',
      timestamp: new Date().toISOString()
    });

    return () => {
      modelStatus.offMessage?.(handleStatusUpdate);
    };
  }, [modelStatus.isConnected, onStatusChange]);

  return (
    <div className="model-status">
      <div className="status-row">
        <div className={`status-indicator ${modelStatus.isConnected ? 'connected' : 'disconnected'}`} />
        <span>Connection: {modelStatus.isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      
      <div className="model-info">
        <div className="info-row">
          <span>Streaming: {status.streaming_enabled ? 'Enabled' : 'Disabled'}</span>
          <span>Temperature: {status.temperature.toFixed(1)}</span>
        </div>
        <div className="info-row">
          <span>Max Tokens: {status.max_tokens}</span>
          <span>Models: {status.models.chat} / {status.models.voice}</span>
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

export { ModelStatus };
export default ModelStatus; 