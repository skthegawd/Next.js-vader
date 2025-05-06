import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>

          <style jsx>{`
            .error-container {
              padding: 2rem;
              margin: 1rem;
              background: rgba(255, 0, 0, 0.1);
              border: 1px solid #ff0000;
              border-radius: 8px;
              color: #ff0000;
            }

            h2 {
              margin: 0 0 1rem 0;
            }

            details {
              margin: 1rem 0;
              padding: 1rem;
              background: rgba(0, 0, 0, 0.05);
              border-radius: 4px;
            }

            pre {
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
            }

            button {
              padding: 0.5rem 1rem;
              background: #ff0000;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              transition: background 0.3s ease;
            }

            button:hover {
              background: #cc0000;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
} 