import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketManager } from '../lib/websocket';
import type { ConnectionStatus } from '../lib/websocket/WebSocketManager';

interface WebSocketConfig {
  endpoint: string;
  token?: string;
  maxRetries?: number;
  retryInterval?: number;
}

interface WebSocketOptions {
  config: WebSocketConfig;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  onMaxRetriesReached?: () => void;
}

interface WebSocketHookResult {
  status: ConnectionStatus;
  error: Error | null;
  sendMessage: (message: any) => boolean;
  reconnect: () => void;
  disconnect: () => void;
  getClientId: () => string;
  isConnected: boolean;
  retryCount: number;
}

export const useWebSocket = (
  url: string,
  options: WebSocketOptions
): WebSocketHookResult => {
  const wsRef = useRef<WebSocketManager | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = options.config.maxRetries ?? 5;
  const retryInterval = options.config.retryInterval ?? 3000;

  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    console.log(`[WebSocket Hook] Status changed to: ${newStatus}`);
    setStatus(newStatus);
    options.onStatusChange?.(newStatus);

    if (newStatus === 'connected') {
      setRetryCount(0);
      setError(null);
    }
  }, [options]);

  const handleError = useCallback((err: Error) => {
    console.error('[WebSocket Hook] Error:', err);
    setError(err);
    options.onError?.(err);

    // Increment retry count
    setRetryCount(prev => {
      const newCount = prev + 1;
      if (newCount >= maxRetries) {
        console.log(`[WebSocket Hook] Max retries (${maxRetries}) reached`);
        options.onMaxRetriesReached?.();
      }
      return newCount;
    });
  }, [maxRetries, options]);

  const initializeWebSocket = useCallback(() => {
    if (!wsRef.current) {
      console.log(`[WebSocket Hook] Initializing WebSocket for endpoint: ${options.config.endpoint}`);
      wsRef.current = WebSocketManager.getInstance(options.config.endpoint);

      wsRef.current.on('statusChange', handleStatusChange);
      wsRef.current.on('message', options.onMessage || (() => {}));
      wsRef.current.on('error', handleError);

      wsRef.current.connect({
        token: options.config.token,
        baseUrl: url,
        reconnectAttempts: maxRetries,
        reconnectInterval: retryInterval
      });
    }
  }, [url, options.config, handleStatusChange, handleError, maxRetries, retryInterval]);

  useEffect(() => {
    initializeWebSocket();

    return () => {
      console.log('[WebSocket Hook] Cleaning up WebSocket connection');
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [url, options.config.endpoint, options.config.token, initializeWebSocket]);

  const sendMessage = useCallback((message: any): boolean => {
    if (!wsRef.current) {
      console.warn('[WebSocket Hook] Cannot send message - WebSocket not initialized');
      return false;
    }
    return wsRef.current.send(message);
  }, []);

  const reconnect = useCallback(() => {
    console.log('[WebSocket Hook] Manually triggering reconnect');
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
    wsRef.current = null;
    setError(null);
    setStatus('connecting');
    setRetryCount(0);
    initializeWebSocket();
  }, [initializeWebSocket]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket Hook] Manually disconnecting');
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setError(null);
    setRetryCount(0);
  }, []);

  const getClientId = useCallback((): string => {
    if (!wsRef.current) {
      throw new Error('WebSocket not initialized');
    }
    return wsRef.current.getClientId();
  }, []);

  return {
    status,
    error,
    sendMessage,
    reconnect,
    disconnect,
    getClientId,
    isConnected: status === 'connected',
    retryCount
  };
}; 