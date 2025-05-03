import { useEffect, useRef, useState, useCallback } from 'react';

// Define message types for type safety
export interface WebSocketMessage {
  type: string;
  payload?: any;
}

interface UseWebSocketOptions {
  clientId: string;
  endpoint?: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = ({
  clientId,
  endpoint = 'default',
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

    // Use the modern WebSocket endpoint format
    const wsBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^http/, 'ws') || '';
    const wsUrl = `${wsBaseUrl}/ws/${endpoint}/${clientId}`;
    console.log('Connecting to WebSocket at:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Handle connection established message
          if (data.type === 'connection_established') {
            console.log('Connection established with client ID:', data.client_id);
          }
          
          // Handle pong responses
          if (data.type === 'pong') {
            console.log('Received pong:', data.timestamp);
          }
          
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

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
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
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err as Event);
      onError?.(err as Event);
    }
  }, [clientId, endpoint, onMessage, onError, reconnectAttempts, reconnectInterval]);

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
      const fullMessage = {
        ...message,
        client_id: clientId,
        timestamp: new Date().toISOString()
      };
      console.log('Sending message:', fullMessage);
      wsRef.current.send(JSON.stringify(fullMessage));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [clientId]);

  // Send periodic ping messages to keep the connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({
        type: 'ping',
        payload: {
          timestamp: new Date().toISOString()
        }
      });
    }, 30000); // Send ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

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