import { useEffect, useRef, useState, useCallback } from 'react';
import type { ConnectionStatus } from '../lib/websocket/WebSocketManager';

interface WebSocketHookResult {
  status: ConnectionStatus;
  error: Error | null;
  sendMessage: (message: any) => boolean;
  reconnect: () => void;
  disconnect: () => void;
  getClientId: () => string;
  isConnected: boolean;
  retryCount: number;
  refreshModelStatus: () => void;
}

export const useWebSocket = (endpoint: string): WebSocketHookResult => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const clientIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const retryInterval = 3000;

  const cleanup = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [ws]);

  const connect = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      // First, ensure API is initialized
      const response = await fetch('/api/next/init');
      if (!response.ok) {
        throw new Error('API initialization failed');
      }

      // Generate a stable client ID if not exists
      if (!clientIdRef.current) {
        clientIdRef.current = `client-${Math.random().toString(36).substr(2, 6)}`;
      }

      // Cleanup any existing connection
      cleanup();

      // Create WebSocket connection
      const wsInstance = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL}?endpoint=${endpoint}&client_id=${clientIdRef.current}&version=${process.env.NEXT_PUBLIC_API_VERSION}`
      );

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (wsInstance.readyState !== WebSocket.OPEN) {
          wsInstance.close();
          setError(new Error('WebSocket connection timeout'));
        }
      }, 5000);

      wsInstance.onopen = () => {
        clearTimeout(connectionTimeout);
        setWs(wsInstance);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
      };

      wsInstance.onerror = (error) => {
        clearTimeout(connectionTimeout);
        setError(error instanceof Error ? error : new Error('WebSocket error'));
        setIsConnecting(false);
      };

      wsInstance.onclose = () => {
        setWs(null);
        setIsConnecting(false);
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      };
    } catch (error: any) {
      setError(error);
      setIsConnecting(false);
    }
  }, [endpoint, isConnecting, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Helper to send get_model_status
  const refreshModelStatus = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'get_model_status' }));
    }
  }, [ws]);

  const handleStatusChange = useCallback((newStatus: ConnectionStatus) => {
    console.log(`[WebSocket Hook] Status changed to: ${newStatus}`);
    setStatus(newStatus);
    if (newStatus === 'connected') {
      setRetryCount(0);
      setError(null);
      // On connect, send get_model_status if endpoint is model-status
      if (endpoint === 'model-status') {
        refreshModelStatus();
      }
    }
  }, [endpoint, refreshModelStatus]);

  const handleError = useCallback((err: Error) => {
    console.error('[WebSocket Hook] Error:', err);
    setError(err);
    if (err instanceof Error) {
      setRetryCount(prev => {
        const newCount = prev + 1;
        if (newCount >= maxRetries) {
          console.log(`[WebSocket Hook] Max retries (${maxRetries}) reached`);
        }
        return newCount;
      });
    }
  }, [maxRetries, endpoint]);

  const handleMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'connection_established':
        // Optionally, send get_model_status if endpoint is model-status
        if (endpoint === 'model-status') {
          refreshModelStatus();
        }
        break;
      case 'pong':
        break;
      case 'model_status':
        break;
      case 'error':
        setError(new Error(msg.payload?.message || 'WebSocket error'));
        break;
      default:
        // Optionally handle other message types
        break;
    }
  }, [endpoint, refreshModelStatus]);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = event.data;
        const msg = JSON.parse(data);
        handleMessage(msg);
      };
      ws.onerror = (event) => {
        const errorEvent = event as Event;
        handleError(errorEvent instanceof Error ? errorEvent : new Error('WebSocket error'));
      };
      ws.onopen = () => {
        handleStatusChange('connected');
      };
      ws.onclose = () => {
        handleStatusChange('disconnected');
      };
    }
  }, [ws, handleMessage, handleError, handleStatusChange]);

  const sendMessage = useCallback((message: any): boolean => {
    if (!ws) {
      console.warn('[WebSocket Hook] Cannot send message - WebSocket not initialized');
      return false;
    }
    ws.send(JSON.stringify(message));
    return true;
  }, [ws]);

  const reconnect = useCallback(() => {
    console.log('[WebSocket Hook] Manually triggering reconnect');
    if (ws) {
      ws.close();
    }
    setError(null);
    setStatus('connecting');
    setRetryCount(0);
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket Hook] Manually disconnecting');
    if (ws) {
      ws.close();
    }
    setStatus('disconnected');
    setError(null);
    setRetryCount(0);
  }, []);

  const getClientId = useCallback((): string => {
    if (!ws) {
      throw new Error('WebSocket not initialized');
    }
    return clientIdRef.current || '';
  }, [ws]);

  return {
    status,
    error,
    sendMessage,
    reconnect,
    disconnect,
    getClientId,
    isConnected: status === 'connected',
    retryCount,
    refreshModelStatus
  };
}; 