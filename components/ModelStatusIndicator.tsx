import React, { useEffect, useState } from 'react';
import { getModelStatus, initializeWebSocket } from '@/lib/api';

interface ModelStatus {
  gptModel: string;
  voiceModel: string;
  isStreaming: boolean;
  temperature: number;
  maxTokens: number;
}

interface ModelStatusIndicatorProps {
  onStatusChange?: (status: ModelStatus) => void;
}

export const ModelStatusIndicator: React.FC<ModelStatusIndicatorProps> = ({ onStatusChange }) => {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const modelStatus = await getModelStatus();
        setStatus(modelStatus);
        onStatusChange?.(modelStatus);
      } catch (error) {
        console.error('Failed to fetch model status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up periodic refresh
    const intervalId = setInterval(fetchStatus, 30000); // Refresh every 30 seconds

    // Set up WebSocket
    const cleanup = initializeWebSocket(
      (data) => {
        if (data.type === 'model_status') {
          setStatus(data.status);
          onStatusChange?.(data.status);
        }
      },
      (connectionStatus) => setWsStatus(connectionStatus)
    );

    return () => {
      clearInterval(intervalId);
      cleanup();
    };
  }, [onStatusChange]);

  if (isLoading) {
    return <div className="model-status-loading">Loading model status...</div>;
  }

  return (
    <div className="model-status-indicator">
      <div className="status-header">
        <h3>Model Status</h3>
        <div className={`ws-indicator ${wsStatus}`}>
          {wsStatus === 'connected' ? '●' : wsStatus === 'error' ? '⚠' : '○'}
        </div>
      </div>
      
      {status && (
        <div className="status-details">
          <div className="status-item">
            <span>GPT Model:</span>
            <strong>{status.gptModel}</strong>
          </div>
          <div className="status-item">
            <span>Voice Model:</span>
            <strong>{status.voiceModel}</strong>
          </div>
          <div className="status-item">
            <span>Streaming:</span>
            <strong>{status.isStreaming ? 'Enabled' : 'Disabled'}</strong>
          </div>
          <div className="status-item">
            <span>Temperature:</span>
            <strong>{status.temperature.toFixed(2)}</strong>
          </div>
          <div className="status-item">
            <span>Max Tokens:</span>
            <strong>{status.maxTokens}</strong>
          </div>
        </div>
      )}

      <style jsx>{`
        .model-status-indicator {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .ws-indicator {
          font-size: 1.2rem;
          transition: color 0.3s ease;
        }

        .ws-indicator.connected { color: #4CAF50; }
        .ws-indicator.disconnected { color: #9e9e9e; }
        .ws-indicator.error { color: #f44336; }

        .status-details {
          display: grid;
          gap: 0.5rem;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .model-status-loading {
          text-align: center;
          padding: 1rem;
          color: #9e9e9e;
        }
      `}</style>
    </div>
  );
}; 