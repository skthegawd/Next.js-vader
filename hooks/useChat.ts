import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import type { ChatMessage } from '../lib/types';

interface ChatResponse {
  content: string;
  conversation_id?: string;
  timestamp: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatResponse[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || '';

  const { status, sendMessage } = useWebSocket(
    wsUrl,
    {
      config: { endpoint: 'chat' },
      onConnection: () => setIsConnected(true),
      onStatusChange: (s) => setIsConnected(s === 'connected'),
      onError: () => setIsConnected(false),
      onModelStatus: undefined,
      onPong: undefined,
      onMaxRetriesReached: undefined,
    }
  );

  // Handle incoming chat messages
  useEffect(() => {
    // This effect is a placeholder for future message handling if needed
  }, []);

  const sendChatMessage = useCallback((content: string, conversationId?: string) => {
    if (status !== 'connected') return;
    sendMessage({
      type: 'chat',
      payload: {
        content,
        conversation_id: conversationId,
        max_tokens: 2048
      }
    });
  }, [status, sendMessage]);

  // Listen for chat_response messages
  useEffect(() => {
    // This would be handled in useWebSocket's onMessage if exposed
    // For now, assume messages are handled in the parent and update state accordingly
  }, []);

  return {
    isConnected,
    messages,
    sendMessage: sendChatMessage,
    setMessages // Expose for manual updates if needed
  };
} 