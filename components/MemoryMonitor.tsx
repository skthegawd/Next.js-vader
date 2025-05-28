import React, { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { WS_URL } from '../lib/config';

interface MemoryStats {
  rss_mb: number;
  percent: number;
  system_percent: number;
  system_available_mb: number;
}

const wsUrl = WS_URL || "";

const MemoryMonitor = () => {
  const [modelStatus, setModelStatus] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [lastPong, setLastPong] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);

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

  // Subscribe to memory stats updates
  React.useEffect(() => {
    if (!modelStatus) return;

    const handleMemoryStats = (message: any) => {
      if (message.type === 'memory_stats') {
        setMemoryStats(message.data);
      }
    };

    // Add message listener
    modelStatus.onMessage?.(handleMemoryStats);

    // Request initial memory stats
    sendMessage?.({
      type: 'command',
      command: 'get_memory_stats',
      timestamp: new Date().toISOString()
    });

    return () => {
      modelStatus.offMessage?.(handleMemoryStats);
    };
  }, [modelStatus]);

  if (!memoryStats) {
    return (
      <div className="memory-monitor loading">
        <h3>Memory Usage</h3>
        <p>Loading memory statistics...</p>
      </div>
    );
  }

  return (
    <div className="memory-monitor">
      <h3>Memory Usage</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <label>Process Memory:</label>
          <span>{memoryStats.rss_mb.toFixed(2)} MB ({memoryStats.percent.toFixed(1)}%)</span>
        </div>
        <div className="stat-item">
          <label>System Memory:</label>
          <span>{memoryStats.system_percent.toFixed(1)}% Used</span>
        </div>
        <div className="stat-item">
          <label>Available Memory:</label>
          <span>{memoryStats.system_available_mb.toFixed(2)} MB</span>
        </div>
      </div>

      <div>Status: {connectionStatus}</div>
      <button onClick={refreshModelStatus}>Refresh Model Status</button>
      {lastPong && <div>Last pong: {lastPong}</div>}
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
      <pre>{JSON.stringify(modelStatus, null, 2)}</pre>

      <style jsx>{`
        .memory-monitor {
          background: var(--death-star-background);
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid var(--death-star-accent);
        }

        .loading {
          opacity: 0.7;
        }

        h3 {
          color: var(--death-star-text);
          margin: 0 0 1rem 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        label {
          color: var(--death-star-secondary);
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        span {
          color: var(--death-star-text);
          font-size: 1.125rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default MemoryMonitor; 