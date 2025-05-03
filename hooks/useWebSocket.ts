import { useEffect, useRef, useState } from 'react';
import { WebSocketManager } from '../lib/websocket';
import type { ConnectionStatus } from '../lib/websocket/WebSocketManager';

interface WebSocketConfig {
  endpoint: string;
  token?: string;
}

interface WebSocketOptions {
  config: WebSocketConfig;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

interface WebSocketHookResult {
  status: ConnectionStatus;
  error: Error | null;
  sendMessage: (message: any) => boolean;
  reconnect: () => void;
  disconnect: () => void;
  getClientId: () => string;
}

export const useWebSocket = (
  url: string,
  options: WebSocketOptions
): WebSocketHookResult => {
  const wsRef = useRef<WebSocketManager | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeWebSocket = () => {
      if (!wsRef.current) {
        wsRef.current = WebSocketManager.getInstance(options.config.endpoint);

        // Set up event handlers
        wsRef.current.on('statusChange', (newStatus: ConnectionStatus) => {
          setStatus(newStatus);
          options.onStatusChange?.(newStatus);
        });

        wsRef.current.on('message', (message: any) => {
          options.onMessage?.(message);
        });

        wsRef.current.on('error', (err: Error) => {
          setError(err);
          options.onError?.(err);
        });

        // Connect with the provided configuration
        wsRef.current.connect({
          token: options.config.token,
          baseUrl: url
        });
      }
    };

    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [url, options.config.endpoint, options.config.token]);

  const sendMessage = (message: any): boolean => {
    if (!wsRef.current) {
      console.warn('Cannot send message - WebSocket not initialized');
      return false;
    }
    return wsRef.current.send(message);
  };

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
    wsRef.current = null;
    setError(null);
    setStatus('connecting');
    wsRef.current = WebSocketManager.getInstance(options.config.endpoint);
    wsRef.current.connect({
      token: options.config.token,
      baseUrl: url
    });
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setError(null);
  };

  const getClientId = (): string => {
    if (!wsRef.current) {
      throw new Error('WebSocket not initialized');
    }
    return wsRef.current.getClientId();
  };

  return {
    status,
    error,
    sendMessage,
    reconnect,
    disconnect,
    getClientId
  };
}; 