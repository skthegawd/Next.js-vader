import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WebSocketManager, WebSocketStatus } from '../lib/websocket';
import api from '../lib/api';
import { WSMessage } from '../types/websocket';
import { Config } from '../lib/config';

interface WebSocketContextValue {
  modelStatus: {
    connect: (clientId?: string) => Promise<void>;
    disconnect: () => void;
    isConnected: boolean;
    error: Error | null;
    sendMessage?: (message: WSMessage) => void;
    onMessage?: (handler: (message: WSMessage) => void) => void;
    offMessage?: (handler: (message: WSMessage) => void) => void;
  };
  terminal: {
    connect: (clientId?: string) => Promise<void>;
    disconnect: () => void;
    isConnected: boolean;
    error: Error | null;
    sendMessage?: (message: WSMessage) => void;
    onMessage?: (handler: (message: WSMessage) => void) => void;
    offMessage?: (handler: (message: WSMessage) => void) => void;
  };
  isInitializing: boolean;
  initializationError: Error | null;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  wsUrl?: string;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  wsUrl = Config.WS_URL,
  autoConnect = true,
}) => {
  // Initialization State
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const initializationAttempts = useRef(0);

  // Model Status WebSocket State
  const [modelStatusConnected, setModelStatusConnected] = useState(false);
  const [modelStatusError, setModelStatusError] = useState<Error | null>(null);
  const modelStatusWsRef = useRef<WebSocketManager | null>(null);
  const modelStatusHandlers = useRef<Set<(message: WSMessage) => void>>(new Set());

  // Terminal WebSocket State
  const [terminalConnected, setTerminalConnected] = useState(false);
  const [terminalError, setTerminalError] = useState<Error | null>(null);
  const terminalWsRef = useRef<WebSocketManager | null>(null);
  const terminalHandlers = useRef<Set<(message: WSMessage) => void>>(new Set());

  // Model Status WebSocket Methods
  const connectModelStatus = async (clientId?: string) => {
    try {
      if (!modelStatusWsRef.current) {
        modelStatusWsRef.current = WebSocketManager.getInstance('model-status');

        modelStatusWsRef.current.onStatus((status) => {
          setModelStatusConnected(status === 'connected');
          if (status === 'error') {
            setModelStatusError(new Error('Connection error'));
          }
        });

        modelStatusWsRef.current.onError((error) => {
          setModelStatusError(error);
        });

        modelStatusWsRef.current.onMessage((message) => {
          modelStatusHandlers.current.forEach(handler => handler(message));
        });
      }

      if (clientId) {
        modelStatusWsRef.current.setClientId(clientId);
      }

      await modelStatusWsRef.current.connect();
    } catch (error) {
      console.error('[WebSocket] Model status connection error:', error);
      setModelStatusError(error as Error);
      throw error;
    }
  };

  const disconnectModelStatus = () => {
    if (modelStatusWsRef.current) {
      modelStatusWsRef.current.disconnect();
      modelStatusWsRef.current = null;
      setModelStatusConnected(false);
      setModelStatusError(null);
      modelStatusHandlers.current.clear();
    }
  };

  // Terminal WebSocket Methods
  const connectTerminal = async (clientId?: string) => {
    try {
      if (!terminalWsRef.current) {
        terminalWsRef.current = WebSocketManager.getInstance('terminal');

        terminalWsRef.current.onStatus((status) => {
          setTerminalConnected(status === 'connected');
          if (status === 'error') {
            setTerminalError(new Error('Connection error'));
          }
        });

        terminalWsRef.current.onError((error) => {
          setTerminalError(error);
        });

        terminalWsRef.current.onMessage((message) => {
          terminalHandlers.current.forEach(handler => handler(message));
        });
      }

      if (clientId) {
        terminalWsRef.current.setClientId(clientId);
      }

      await terminalWsRef.current.connect();
    } catch (error) {
      console.error('[WebSocket] Terminal connection error:', error);
      setTerminalError(error as Error);
      throw error;
    }
  };

  const disconnectTerminal = () => {
    if (terminalWsRef.current) {
      terminalWsRef.current.disconnect();
      terminalWsRef.current = null;
      setTerminalConnected(false);
      setTerminalError(null);
      terminalHandlers.current.clear();
    }
  };

  // Initialize WebSocket connections with retry logic
  const initializeWebSockets = async () => {
    if (!autoConnect) {
      setIsInitializing(false);
      return;
    }

    try {
      setIsInitializing(true);
      setInitializationError(null);

      // Generate a fallback client ID if API initialization fails
      const fallbackClientId = `client-${Math.random().toString(36).substring(7)}`;

      try {
        // Try to get client ID from API
        const { data } = await api.initialize();
        if (data.features.websocket && data.clientId) {
          await Promise.all([
            connectModelStatus(data.clientId),
            connectTerminal(data.clientId)
          ]);
        }
      } catch (error) {
        console.warn('[WebSocket] API initialization failed, using fallback client ID:', error);
        // Use fallback client ID if API fails
        await Promise.all([
          connectModelStatus(fallbackClientId),
          connectTerminal(fallbackClientId)
        ]);
      }

      setIsInitializing(false);
      initializationAttempts.current = 0;
    } catch (error) {
      console.error('[WebSocket] Initialization error:', error);
      setInitializationError(error as Error);
      setIsInitializing(false);

      // Retry initialization with exponential backoff
      if (initializationAttempts.current < Config.WS_RECONNECT_ATTEMPTS) {
        initializationAttempts.current++;
        const delay = Math.min(
          Config.WS_RECONNECT_INTERVAL * Math.pow(2, initializationAttempts.current),
          30000
        );
        setTimeout(initializeWebSockets, delay);
      }
    }
  };

  // Auto-connect effect
  useEffect(() => {
    let mounted = true;

    if (mounted) {
      initializeWebSockets();
    }

    return () => {
      mounted = false;
      disconnectModelStatus();
      disconnectTerminal();
    };
  }, [autoConnect]);

  const contextValue: WebSocketContextValue = {
    modelStatus: {
      connect: connectModelStatus,
      disconnect: disconnectModelStatus,
      isConnected: modelStatusConnected,
      error: modelStatusError,
      sendMessage: (message) => modelStatusWsRef.current?.sendMessage(message),
      onMessage: (handler) => modelStatusHandlers.current.add(handler),
      offMessage: (handler) => modelStatusHandlers.current.delete(handler),
    },
    terminal: {
      connect: connectTerminal,
      disconnect: disconnectTerminal,
      isConnected: terminalConnected,
      error: terminalError,
      sendMessage: (message) => terminalWsRef.current?.sendMessage(message),
      onMessage: (handler) => terminalHandlers.current.add(handler),
      offMessage: (handler) => terminalHandlers.current.delete(handler),
    },
    isInitializing,
    initializationError,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext; 