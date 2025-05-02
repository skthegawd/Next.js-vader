import { useState, useEffect, useCallback } from 'react';
import { ModelStatus } from '../types/model';
import { modelStatusWs } from '../lib/websocket';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const POLLING_INTERVAL = 30000; // 30 seconds

export const useModelStatus = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const fetchModelStatus = useCallback(async () => {
    try {
      console.debug('[ModelStatus] Fetching model status...');
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    console.debug('[ModelStatus] Starting polling...');
    const intervalId = setInterval(fetchModelStatus, POLLING_INTERVAL);
    return () => {
      console.debug('[ModelStatus] Stopping polling...');
      clearInterval(intervalId);
    };
  }, [fetchModelStatus]);

  useEffect(() => {
    let pollCleanup: (() => void) | null = null;

    const setupWebSocket = async () => {
      try {
        // Setup WebSocket handlers
        modelStatusWs.onMessage((data: ModelStatus) => {
          console.debug('[ModelStatus] Received WebSocket update:', data);
          setModelStatus(data);
          setError(null);
        });

        modelStatusWs.onError((error) => {
          console.error('[ModelStatus] WebSocket error:', error);
          setError(error);
        });

        modelStatusWs.onStatus((status) => {
          console.debug('[ModelStatus] WebSocket status:', status);
          setConnectionStatus(status);
          
          // Start/stop polling based on connection status
          if (status === 'disconnected' || status === 'error') {
            if (!pollCleanup) {
              pollCleanup = startPolling();
            }
          } else if (status === 'connected') {
            if (pollCleanup) {
              pollCleanup();
              pollCleanup = null;
            }
          }
        });

        // Initial fetch and connect
        await fetchModelStatus();
        await modelStatusWs.connect();
      } catch (error) {
        console.error('[ModelStatus] Setup error:', error);
        setError(error as Error);
        // Start polling on initial connection failure
        pollCleanup = startPolling();
      }
    };

    setupWebSocket();

    // Cleanup
    return () => {
      if (pollCleanup) {
        pollCleanup();
      }
      modelStatusWs.disconnect();
    };
  }, [fetchModelStatus, startPolling]);

  const updateModelParameters = async (modelType: string, parameters: any) => {
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
      setError(err as Error);
      throw err;
    }
  };

  return {
    modelStatus,
    error,
    isLoading,
    isWebSocketConnected: connectionStatus === 'connected',
    connectionStatus,
    updateModelParameters,
    refreshStatus: fetchModelStatus,
  };
}; 