import { useState, useEffect, useCallback } from 'react';
import { getOrCreateSessionId } from '../lib/config';

interface ChatResponse {
  content: string;
  conversation_id?: string;
  timestamp: string;
}

export function useChat(endpoint = 'chat') {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    if (isConnecting || ws) return;
    setIsConnecting(true);
    setError(null);
    try {
      // 1. Ensure API is initialized
      const response = await fetch('/api/next/init');
      if (!response.ok) throw new Error('API initialization failed');
      // 2. Generate a stable client ID
      const clientId = getOrCreateSessionId();
      // 3. Connect to WebSocket
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?endpoint=${endpoint}&client_id=${clientId}&version=${process.env.NEXT_PUBLIC_API_VERSION}`;
      console.log(`[Chat WebSocket] Connecting to: ${wsUrl}`);
      const wsInstance = new WebSocket(wsUrl);
      // 4. Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (wsInstance.readyState !== WebSocket.OPEN) {
          wsInstance.close();
          setError(new Error('WebSocket connection timeout'));
          console.error('[Chat WebSocket] Connection timeout');
        }
      }, 5000);
      wsInstance.onopen = () => {
        clearTimeout(connectionTimeout);
        setWs(wsInstance);
        setIsConnected(true);
        setIsConnecting(false);
        console.log('[Chat WebSocket] Connected');
      };
      wsInstance.onerror = (err) => {
        clearTimeout(connectionTimeout);
        setError(new Error('WebSocket connection error'));
        setIsConnecting(false);
        console.error('[Chat WebSocket] Error:', err);
      };
      wsInstance.onclose = (event) => {
        setWs(null);
        setIsConnected(false);
        setIsConnecting(false);
        console.warn(`[Chat WebSocket] Closed: code=${event.code}, reason=${event.reason}`);
      };
      wsInstance.onmessage = (event) => {
        console.log('[Chat WebSocket] Message received:', event.data);
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'chat_response') {
            setMessages((prev) => [...prev, message.data]);
          }
        } catch (e) {
          console.error('[Chat WebSocket] Failed to parse message:', event.data, e);
        }
      };
    } catch (err: any) {
      setError(err);
      setIsConnecting(false);
      console.error('[Chat WebSocket] Connection error:', err);
    }
  }, [endpoint, isConnecting, ws]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ws) ws.close();
    };
  }, [ws]);

  const sendMessage = useCallback((content: string, conversationId?: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        type: 'chat',
        data: {
          content,
          conversation_id: conversationId,
          max_tokens: 2048,
        },
      })
    );
  }, [ws]);

  return {
    ws,
    isConnected,
    isConnecting,
    error,
    messages,
    sendMessage,
    connect,
    setMessages,
  };
} 