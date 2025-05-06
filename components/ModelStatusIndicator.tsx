import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { WSMessage } from '../types/websocket';

const ModelStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState('loading');
  const { modelStatus } = useWebSocket();

  useEffect(() => {
    if (!modelStatus.isConnected) return;

    const handleStatusUpdate = (message: WSMessage) => {
      if (message.type === 'status') {
        setStatus(message.data.status);
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
  }, [modelStatus.isConnected]);

  return (
    <div className="status-indicator">
      <span className={`status-dot ${status}`} />
      <span className="status-text">{status}</span>

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