import React, { useState, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { ModelStatusData } from '../lib/types/websocket';

interface ModelInfo extends ModelStatusData {
  success_count: number;
  error_count: number;
  last_error?: string;
  last_success?: string;
}

export const ModelStatus: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<Record<string, ModelInfo>>({});
  const { modelStatus } = useWebSocket();

  const refreshStatus = useCallback(() => {
    if (!modelStatus.isConnected) return;

    modelStatus.sendMessage?.({
      type: 'command',
      command: 'get_model_status',
      timestamp: new Date().toISOString()
    });
  }, [modelStatus.isConnected, modelStatus.sendMessage]);

  React.useEffect(() => {
    if (!modelStatus.isConnected) return;

    const handleModelStatus = (message: any) => {
      if (message.type === 'status' && message.data) {
        setModelInfo(prevInfo => ({
          ...prevInfo,
          [message.data.model_name]: {
            ...message.data,
            success_count: (prevInfo[message.data.model_name]?.success_count || 0) + 
              (message.data.status === 'ready' ? 1 : 0),
            error_count: (prevInfo[message.data.model_name]?.error_count || 0) + 
              (message.data.status === 'error' ? 1 : 0),
            last_error: message.data.status === 'error' ? 
              message.data.error : prevInfo[message.data.model_name]?.last_error,
            last_success: message.data.status === 'ready' ? 
              new Date().toISOString() : prevInfo[message.data.model_name]?.last_success
          }
        }));
      }
    };

    modelStatus.onMessage?.(handleModelStatus);
    refreshStatus();

    return () => {
      modelStatus.offMessage?.(handleModelStatus);
    };
  }, [modelStatus.isConnected, refreshStatus]);

  return (
    <div className="model-status">
      <div className="header">
        <h3>Model Status</h3>
        <button onClick={refreshStatus} disabled={!modelStatus.isConnected}>
          Refresh
        </button>
      </div>

      <div className="models-grid">
        {Object.entries(modelInfo).map(([name, info]) => (
          <div key={name} className={`model-card status-${info.status}`}>
            <h4>{name}</h4>
            <div className="model-info">
              <p>Status: <span className={`status-${info.status}`}>{info.status}</span></p>
              {info.progress !== undefined && (
                <p>Progress: {(info.progress * 100).toFixed(1)}%</p>
              )}
              <p>Success Rate: {
                ((info.success_count / (info.success_count + info.error_count || 1)) * 100).toFixed(1)
              }%</p>
              {info.error && (
                <p className="error">Error: {info.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .model-status {
          background: var(--death-star-background);
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid var(--death-star-accent);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        h3 {
          color: var(--death-star-text);
          margin: 0;
        }

        button {
          background: var(--death-star-primary);
          color: var(--death-star-text);
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .models-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .model-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid transparent;
        }

        .model-card.status-ready {
          border-color: var(--death-star-primary);
        }

        .model-card.status-error {
          border-color: #ff4444;
        }

        .model-card.status-loading {
          border-color: var(--death-star-secondary);
        }

        h4 {
          color: var(--death-star-text);
          margin: 0 0 0.5rem 0;
        }

        .model-info p {
          margin: 0.25rem 0;
          color: var(--death-star-text);
          font-size: 0.875rem;
        }

        .status-ready {
          color: var(--death-star-primary);
        }

        .status-error {
          color: #ff4444;
        }

        .status-loading {
          color: var(--death-star-secondary);
        }

        .error {
          color: #ff4444;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}; 