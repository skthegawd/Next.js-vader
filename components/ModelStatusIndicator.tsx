import React, { useEffect, useState } from 'react';
import { getModelStatus, initializeWebSocket } from '../lib/api';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setError(null);
        const modelStatus = await getModelStatus();
        setStatus(modelStatus);
        onStatusChange?.(modelStatus);
      } catch (error) {
        console.error('Failed to fetch model status:', error);
        setError('Failed to fetch model status. Retrying...');
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
      (connectionStatus) => {
        setWsStatus(connectionStatus);
        if (connectionStatus === 'connected') {
          setError(null);
        }
      }
    );

    return () => {
      clearInterval(intervalId);
      cleanup();
    };
  }, [onStatusChange]);

  return (
    <div className="model-status-indicator">
      <div className="status-header">
        <h3>Model Status</h3>
        <div className={`status-indicator ${wsStatus}`} title={`WebSocket: ${wsStatus}`} />
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading-status">
          <div className="loading-spinner" />
          <span>Loading model status...</span>
        </div>
      ) : status ? (
        <div className="status-details">
          <div className="status-item">
            <span>GPT Model:</span>
            <strong>{status.gptModel || 'Not available'}</strong>
          </div>
          <div className="status-item">
            <span>Voice Model:</span>
            <strong>{status.voiceModel || 'Not available'}</strong>
          </div>
          <div className="status-item">
            <span>Streaming:</span>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={status.isStreaming}
                onChange={() => {}} // Handled by parent
                id="streaming-toggle"
              />
              <label className="toggle-slider" htmlFor="streaming-toggle" />
            </div>
          </div>
          <div className="status-item">
            <span>Temperature:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={status.temperature}
              onChange={() => {}} // Handled by parent
              className="temperature-slider"
            />
            <strong>{status.temperature.toFixed(1)}</strong>
          </div>
          <div className="status-item">
            <span>Max Tokens:</span>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={status.maxTokens}
              onChange={() => {}} // Handled by parent
              className="tokens-slider"
            />
            <strong>{status.maxTokens}</strong>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .model-status-indicator {
          background: var(--surface-color);
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

        .error-message {
          color: var(--error-color);
          padding: 0.5rem;
          margin-bottom: 1rem;
          border-radius: 4px;
          background: rgba(255, 82, 82, 0.1);
        }

        .loading-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          color: var(--text-color);
          opacity: 0.7;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top-color: var(--secondary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

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

        .temperature-slider,
        .tokens-slider {
          flex: 1;
          margin: 0 1rem;
        }

        strong {
          min-width: 60px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}; 