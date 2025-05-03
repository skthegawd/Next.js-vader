import { useEffect, useRef, useState, useCallback } from 'react';

// Define message types for type safety
export interface WebSocketMessage {
  type: string;
  payload?: any;
}

interface UseWebSocketOptions {
  clientId: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = ({
  clientId,
  onMessage,
  onError,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Construct WebSocket URL with query parameters
    const wsUrl = new URL(process.env.NEXT_PUBLIC_WS_URL || '');
    wsUrl.searchParams.append('client_id', clientId);
    
    const ws = new WebSocket(wsUrl.toString());

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      reconnectCountRef.current = 0;
      
      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connect',
        payload: {
          client_id: clientId,
          timestamp: new Date().toISOString()
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError(err);
      onError?.(err);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);

      // Attempt to reconnect if we haven't exceeded the maximum attempts
      if (reconnectCountRef.current < reconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectCountRef.current += 1;
          connect();
        }, reconnectInterval);
      }
    };

    wsRef.current = ws;
  }, [clientId, onMessage, onError, reconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        client_id: clientId, // Always include client_id with messages
        timestamp: new Date().toISOString()
      }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [clientId]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}; 