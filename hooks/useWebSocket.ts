import { useEffect, useState, useCallback } from 'react';
import WebSocketManager, { WebSocketMessage, ConnectionStatus } from '../lib/websocket/WebSocketManager';

interface UseWebSocketOptions {
  endpoint?: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Event | null>(null);

  useEffect(() => {
    const manager = WebSocketManager.getInstance();

    const handleMessage = (data: any) => {
      options.onMessage?.(data);
    };

    const handleError = (err: Event) => {
      setError(err);
      options.onError?.(err);
    };

    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      options.onStatusChange?.(newStatus);
    };

    // Connect with options
    manager.connect({
      ...options,
      onMessage: handleMessage,
      onError: handleError,
      onStatusChange: handleStatusChange,
    });

    // Cleanup
    return () => {
      manager.disconnect();
    };
  }, [options]);

  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    const manager = WebSocketManager.getInstance();
    return manager.send(message);
  }, []);

  const disconnect = useCallback(() => {
    const manager = WebSocketManager.getInstance();
    manager.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    const manager = WebSocketManager.getInstance();
    manager.connect();
  }, []);

  const getClientId = useCallback(() => {
    const manager = WebSocketManager.getInstance();
    return manager.getClientId();
  }, []);

  return {
    status,
    error,
    sendMessage,
    disconnect,
    reconnect,
    getClientId,
    isConnected: status === 'connected'
  };
}; 