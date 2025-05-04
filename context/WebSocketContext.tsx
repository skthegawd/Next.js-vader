import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import createWebSocketManager, { WebSocketStatus } from '../lib/websocket';
import api from '../lib/api';
import { WSMessage } from '../types/websocket';

interface WebSocketContextValue {
  modelStatus: {
    connect: (clientId?: string) => Promise<void>;
    disconnect: () => void;
    isConnected: boolean;
    error: Error | null;
  };
  terminal: {
    connect: (clientId?: string) => Promise<void>;
    disconnect: () => void;
    isConnected: boolean;
    error: Error | null;
  };
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  wsUrl?: string;
  autoConnect?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || '',
  autoConnect = true,
}) => {
  // Model Status WebSocket State
  const [modelStatusConnected, setModelStatusConnected] = useState(false);
  const [modelStatusError, setModelStatusError] = useState<Error | null>(null);
  const modelStatusWsRef = useRef<ReturnType<typeof createWebSocketManager> | null>(null);

  // Terminal WebSocket State
  const [terminalConnected, setTerminalConnected] = useState(false);
  const [terminalError, setTerminalError] = useState<Error | null>(null);
  const terminalWsRef = useRef<ReturnType<typeof createWebSocketManager> | null>(null);

  // Model Status WebSocket Methods
  const connectModelStatus = async (clientId?: string) => {
    try {
      if (!modelStatusWsRef.current) {
        modelStatusWsRef.current = createWebSocketManager('model-status');

        modelStatusWsRef.current.onStatus((status) => {
          setModelStatusConnected(status === 'connected');
        });

        modelStatusWsRef.current.onError((error) => {
          setModelStatusError(error);
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
    }
  };

  // Terminal WebSocket Methods
  const connectTerminal = async (clientId?: string) => {
    try {
      if (!terminalWsRef.current) {
        terminalWsRef.current = createWebSocketManager('terminal');

        terminalWsRef.current.onStatus((status) => {
          setTerminalConnected(status === 'connected');
        });

        terminalWsRef.current.onError((error) => {
          setTerminalError(error);
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
    }
  };

  // Auto-connect effect with API initialization
  useEffect(() => {
    const initializeWebSockets = async () => {
      if (!autoConnect) return;

      try {
        // Get client ID from API
        const { data } = await api.initialize();
        if (data.features.websocket && data.clientId) {
          await connectModelStatus(data.clientId);
          await connectTerminal(data.clientId);
        }
      } catch (error) {
        console.error('[WebSocket] Initialization error:', error);
      }
    };

    initializeWebSockets();

    return () => {
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
    },
    terminal: {
      connect: connectTerminal,
      disconnect: disconnectTerminal,
      isConnected: terminalConnected,
      error: terminalError,
    },
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