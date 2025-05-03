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

  const getWebSocketUrl = useCallback(() => {
    // Get the base URL from environment variables
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      throw new Error('WebSocket URL not configured. Please set NEXT_PUBLIC_WS_URL in your environment variables.');
    }

    // Remove any trailing slashes
    const baseUrl = wsUrl.replace(/\/$/, '');
    
    // Construct the full URL with endpoint and client ID
    return `${baseUrl}/${endpoint}/${clientId}`;
  }, [endpoint, clientId]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = getWebSocketUrl();
      console.log('[WebSocket] Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;

        // Send initial handshake
        ws.send(JSON.stringify({
          type: 'handshake',
          client_id: clientId,
          timestamp: new Date().toISOString(),
          endpoint
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Received:', data);
          
          // Handle connection established message
          if (data.type === 'connection_established') {
            console.log('[WebSocket] Connection established with client ID:', data.client_id);
          }
          
          // Handle pong responses
          if (data.type === 'pong') {
            console.log('[WebSocket] Received pong:', data.timestamp);
          }
          
          onMessage?.(data);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        setError(err);
        onError?.(err);
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect if we haven't exceeded the maximum attempts
        if (reconnectCountRef.current < reconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
          console.log(`[WebSocket] Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, delay);
        } else {
          console.log('[WebSocket] Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket] Connection error:', err);
      setError(err as Event);
      onError?.(err as Event);
    }
  }, [clientId, endpoint, onMessage, onError, reconnectAttempts, getWebSocketUrl]);

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
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message - connection not open');
      return false;
    }

    try {
      const fullMessage = {
        ...message,
        client_id: clientId,
        timestamp: new Date().toISOString(),
        endpoint
      };
      console.log('[WebSocket] Sending:', fullMessage);
      wsRef.current.send(JSON.stringify(fullMessage));
      return true;
    } catch (err) {
      console.error('[WebSocket] Failed to send message:', err);
      return false;
    }
  }, [clientId, endpoint]);

  // Send periodic ping messages to keep the connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: 'ping',
          payload: {
            timestamp: new Date().toISOString()
          }
        });
      }
    }, 30000); // Send ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  // Connect on mount and reconnect when endpoint changes
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