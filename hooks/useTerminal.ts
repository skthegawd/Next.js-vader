import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketManager } from '../lib/websocket';
import { WSStreamMessage } from '../types/websocket';
import { WS_URL } from '../lib/config';

interface TerminalOutput {
  content: string;
  timestamp: string;
  error?: boolean;
}

interface UseTerminalOptions {
  autoConnect?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export const useTerminal = (options: UseTerminalOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [output, setOutput] = useState<TerminalOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocketManager | null>(null);
  const outputRef = useRef<TerminalOutput[]>([]);

  // Keep outputRef in sync with state
  useEffect(() => {
    outputRef.current = output;
  }, [output]);

  const handleOutput = useCallback((data: any) => {
    const newOutput: TerminalOutput = {
      content: typeof data === 'string' ? data : data.content,
      timestamp: new Date().toISOString(),
      error: data.error || false
    };

    setOutput(prev => [...prev, newOutput]);
  }, []);

  const handleStatus = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    setIsConnected(status === 'connected');
    
    if (status === 'connected') {
      options.onConnected?.();
    } else if (status === 'disconnected') {
      options.onDisconnected?.();
    }
  }, [options]);

  const handleError = useCallback((err: Error) => {
    setError(err);
    options.onError?.(err);
  }, [options]);

  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!wsRef.current) {
        wsRef.current = new WebSocketManager(WS_URL, 'terminal', {
          autoReconnect: true,
          reconnectInterval: 1000,
          maxReconnectAttempts: 5,
          pingInterval: 30000,
          connectionTimeout: 10000
        });
      }

      wsRef.current.onMessage(handleOutput);
      wsRef.current.onStatus(handleStatus);
      wsRef.current.onError(handleError);

      await wsRef.current.connect();
    } catch (err) {
      handleError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [handleOutput, handleStatus, handleError]);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setIsConnected(false);
    setError(null);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const executeCommand = useCallback(async (
    command: string,
    args: string[] = [],
    watch = false
  ) => {
    if (!wsRef.current) {
      throw new Error('Terminal not connected');
    }

    try {
      await wsRef.current.sendCommand(command, args, watch);
    } catch (err) {
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
    isConnected,
    isLoading,
    error,
    output,
    connect,
    disconnect,
    clearOutput,
    executeCommand
  };
}; 