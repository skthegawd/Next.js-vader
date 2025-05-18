import { useState, useEffect, useCallback } from 'react';

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
      const clientId = `client-${Math.random().toString(36).substr(2, 6)}`;

      // 3. Connect to WebSocket
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?endpoint=${endpoint}&client_id=${clientId}&version=${process.env.NEXT_PUBLIC_API_VERSION}`;
      const wsInstance = new WebSocket(wsUrl);

      // 4. Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (wsInstance.readyState !== WebSocket.OPEN) {
          wsInstance.close();
          setError(new Error('WebSocket connection timeout'));
        }
      }, 5000);

      wsInstance.onopen = () => {
        clearTimeout(connectionTimeout);
        setWs(wsInstance);
        setIsConnected(true);
        setIsConnecting(false);
      };

      wsInstance.onerror = (err) => {
        clearTimeout(connectionTimeout);
        setError(new Error('WebSocket connection error'));
        setIsConnecting(false);
      };

      wsInstance.onclose = () => {
        setWs(null);
        setIsConnected(false);
        setIsConnecting(false);
      };

      wsInstance.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'chat_response') {
            setMessages((prev) => [...prev, message.data]);
          }
        } catch (e) {
          // Ignore parse errors
        }
      };
    } catch (err: any) {
      setError(err);
      setIsConnecting(false);
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