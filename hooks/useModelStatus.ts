import { useState, useEffect, useCallback } from 'react';
import { ModelStatus } from '../types/model';
import { modelStatusWs } from '../lib/websocket';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const POLLING_INTERVAL = 30000; // 30 seconds

export const useModelStatus = () => {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  const fetchModelStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/model-status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setModelStatus(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching model status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    const intervalId = setInterval(fetchModelStatus, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchModelStatus]);

  useEffect(() => {
    // Initial fetch
    fetchModelStatus();

    // Setup WebSocket
    modelStatusWs.onMessage((data: ModelStatus) => {
      setModelStatus(data);
      setIsWebSocketConnected(true);
      setError(null);
    });

    modelStatusWs.onError((error) => {
      console.error('WebSocket error:', error);
      setIsWebSocketConnected(false);
      setError(error);
      // Start polling as fallback
      const cleanup = startPolling();
      return () => cleanup();
    });

    // Connect WebSocket
    modelStatusWs.connect();

    // Cleanup
    return () => {
      modelStatusWs.disconnect();
    };
  }, [startPolling]);

  const updateModelParameters = async (modelType: string, parameters: any) => {
    try {
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
      setModelStatus(updatedStatus);
      return updatedStatus;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    modelStatus,
    error,
    isLoading,
    isWebSocketConnected,
    updateModelParameters,
    refreshStatus: fetchModelStatus,
  };
}; 