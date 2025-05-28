import React from 'react';
import MemoryMonitor from '../components/MemoryMonitor';
import ModelStatus from '../components/ModelStatus';
import { Config } from '../lib/config';
import { useWebSocket } from '../context/WebSocketContext';

const MonitoringPage: React.FC = () => {
  const { isInitializing, initializationError, retry } = useWebSocket();

  if (isInitializing) {
    return (
      <div className="monitoring-page">
        <div className="loading-state">
          <h2>Initializing System...</h2>
          <p>Establishing connections and loading monitoring data...</p>
        </div>

        <style jsx>{`
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            color: var(--death-star-text);
          }

          h2 {
            margin: 0 0 1rem;
            font-size: 1.5rem;
          }

          p {
            margin: 0;
            opacity: 0.7;
          }
        `}</style>
      </div>
    );
  }

  if (initializationError) {
    return (
      <div className="monitoring-page">
        <div className="error-state">
          <h2>Connection Error</h2>
          <p>Failed to initialize monitoring system:</p>
          <pre className="error-details">
            {initializationError.message}
            {initializationError.stack && (
              <>
                <br />
                <br />
                Stack trace:
                <br />
                {initializationError.stack}
              </>
            )}
          </pre>
          <div className="error-actions">
            <button onClick={retry} className="retry-button">
              Retry Connection
            </button>
            <button onClick={() => window.location.reload()} className="reload-button">
              Reload Page
            </button>
          </div>
        </div>

        <style jsx>{`
          .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            color: var(--death-star-text);
            padding: 2rem;
          }

          h2 {
            margin: 0 0 1rem;
            font-size: 1.5rem;
            color: var(--death-star-primary);
          }

          p {
            margin: 0 0 1rem;
          }

          .error-details {
            background: rgba(255, 0, 0, 0.1);
            padding: 1rem;
            border-radius: 4px;
            margin: 1rem 0;
            max-width: 100%;
            overflow-x: auto;
            color: #ff4444;
            font-size: 0.875rem;
            text-align: left;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .error-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
          }

          button {
            background: var(--death-star-primary);
            color: var(--death-star-text);
            border: none;
            border-radius: 4px;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .retry-button {
            background: var(--death-star-primary);
          }

          .reload-button {
            background: var(--death-star-secondary);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="monitoring-page">
      <header>
        <h1>System Monitoring</h1>
      </header>

      <main>
        <div className="monitoring-grid">
          {Config.FEATURES.MEMORY_MONITOR_ENABLED && (
            <section className="monitor-section">
              <MemoryMonitor />
            </section>
          )}

          {Config.FEATURES.MODEL_STATUS_ENABLED && (
            <section className="monitor-section">
              <ModelStatus />
            </section>
          )}
        </div>
      </main>

      <style jsx>{`
        .monitoring-page {
          min-height: 100vh;
          background: var(--death-star-background);
          color: var(--death-star-text);
          padding: 2rem;
        }

        header {
          margin-bottom: 2rem;
        }

        h1 {
          color: var(--death-star-text);
          font-size: 2rem;
          margin: 0;
        }

        .monitoring-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .monitoring-grid {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }
        }

        .monitor-section {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          padding: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }

        .monitor-section:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <style jsx global>{`
        :root {
          --death-star-background: ${Config.DEFAULT_THEME.colors.background};
          --death-star-text: ${Config.DEFAULT_THEME.colors.text};
          --death-star-primary: ${Config.DEFAULT_THEME.colors.primary};
          --death-star-secondary: ${Config.DEFAULT_THEME.colors.secondary};
          --death-star-accent: ${Config.DEFAULT_THEME.colors.accent};
        }

        body {
          margin: 0;
          padding: 0;
          font-family: ${Config.DEFAULT_THEME.fonts.primary.family};
          background: var(--death-star-background);
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default MonitoringPage; 