import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketManager } from '../lib/websocket';
import { ModelStatus } from '../types/model';
import { WSMessage } from '../types/websocket';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';
const POLLING_INTERVAL = 30000; // 30 seconds

interface UseModelStatusOptions {
  autoConnect?: boolean;
  enablePolling?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export const useModelStatus = (options: UseModelStatusOptions = {}) => {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocketManager | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchModelStatus = useCallback(async () => {
    try {
      console.debug('[ModelStatus] Fetching status...');
      const response = await fetch(`${API_BASE_URL}/model-status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.debug('[ModelStatus] Received status update:', data);
      setModelStatus(data);
      setError(null);
    } catch (err) {
      console.error('[ModelStatus] Error fetching status:', err);
      setError(err as Error);
      options.onError?.(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const startPolling = useCallback(() => {
    if (!options.enablePolling) return;
    
    console.debug('[ModelStatus] Starting polling...');
    pollTimeoutRef.current = setInterval(fetchModelStatus, POLLING_INTERVAL);
    
    return () => {
      if (pollTimeoutRef.current) {
        console.debug('[ModelStatus] Stopping polling...');
        clearInterval(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [fetchModelStatus, options.enablePolling]);

  const handleMessage = useCallback((data: ModelStatus) => {
    console.debug('[ModelStatus] Received WebSocket update:', data);
    setModelStatus(data);
    setError(null);
  }, []);

  const handleStatus = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    console.debug('[ModelStatus] WebSocket status:', status);
    setIsConnected(status === 'connected');
    
    if (status === 'connected') {
      options.onConnected?.();
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    } else if (status === 'disconnected') {
      options.onDisconnected?.();
      startPolling();
    }
  }, [options, startPolling]);

  const handleError = useCallback((err: Error) => {
    console.error('[ModelStatus] Error:', err);
    setError(err);
    options.onError?.(err);
  }, [options]);

  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!wsRef.current) {
        wsRef.current = new WebSocketManager(WS_URL, 'model-status', {
          autoReconnect: true,
          reconnectInterval: 1000,
          maxReconnectAttempts: 5,
          pingInterval: 30000,
          connectionTimeout: 10000
        });
      }

      wsRef.current.onMessage(handleMessage);
      wsRef.current.onStatus(handleStatus);
      wsRef.current.onError(handleError);

      await wsRef.current.connect();
      await fetchModelStatus(); // Get initial status
    } catch (err) {
      handleError(err as Error);
      startPolling(); // Fallback to polling on connection failure
    } finally {
      setIsLoading(false);
    }
  }, [fetchModelStatus, handleMessage, handleStatus, handleError, startPolling]);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setIsConnected(false);
    setError(null);
    
    if (pollTimeoutRef.current) {
      clearInterval(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const updateModelParameters = useCallback(async (modelType: string, parameters: any) => {
    try {
      console.debug('[ModelStatus] Updating parameters:', { modelType, parameters });
      const response = await fetch(`${API_BASE_URL}/model-status/${modelType}/parameters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedStatus = await response.json();
      console.debug('[ModelStatus] Parameters updated:', updatedStatus);
      setModelStatus(updatedStatus);
      return updatedStatus;
    } catch (err) {
      console.error('[ModelStatus] Error updating parameters:', err);
      handleError(err as Error);
      throw err;
    }
  }, [handleError]);

  // Auto-connect if enabled
  useEffect(() => {
    if (options.autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [options.autoConnect, connect, disconnect]);

  return {
    modelStatus,
    error,
    isLoading,
    isConnected,
    connect,
    disconnect,
    updateModelParameters,
    refreshStatus: fetchModelStatus,
  };
}; 