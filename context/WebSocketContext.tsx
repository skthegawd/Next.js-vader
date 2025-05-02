import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WebSocketManager } from '../lib/websocket';
import { WSMessage } from '../types/websocket';

interface WebSocketContextValue {
  modelStatus: {
    connect: () => Promise<void>;
    disconnect: () => void;
    isConnected: boolean;
    error: Error | null;
  };
  terminal: {
    connect: () => Promise<void>;
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
  const modelStatusWsRef = useRef<WebSocketManager | null>(null);

  // Terminal WebSocket State
  const [terminalConnected, setTerminalConnected] = useState(false);
  const [terminalError, setTerminalError] = useState<Error | null>(null);
  const terminalWsRef = useRef<WebSocketManager | null>(null);

  // Model Status WebSocket Methods
  const connectModelStatus = async () => {
    try {
      if (!modelStatusWsRef.current) {
        modelStatusWsRef.current = new WebSocketManager(wsUrl, 'model-status', {
          autoReconnect: true,
          reconnectInterval: 1000,
          maxReconnectAttempts: 5,
          pingInterval: 30000,
          connectionTimeout: 10000
        });

        modelStatusWsRef.current.onStatus((status) => {
          setModelStatusConnected(status === 'connected');
        });

        modelStatusWsRef.current.onError((error) => {
          setModelStatusError(error);
        });
      }

      await modelStatusWsRef.current.connect();
    } catch (error) {
      setModelStatusError(error as Error);
      throw error;
    }
  };

  const disconnectModelStatus = () => {
    modelStatusWsRef.current?.disconnect();
    modelStatusWsRef.current = null;
    setModelStatusConnected(false);
    setModelStatusError(null);
  };

  // Terminal WebSocket Methods
  const connectTerminal = async () => {
    try {
      if (!terminalWsRef.current) {
        terminalWsRef.current = new WebSocketManager(wsUrl, 'terminal', {
          autoReconnect: true,
          reconnectInterval: 1000,
          maxReconnectAttempts: 5,
          pingInterval: 30000,
          connectionTimeout: 10000
        });

        terminalWsRef.current.onStatus((status) => {
          setTerminalConnected(status === 'connected');
        });

        terminalWsRef.current.onError((error) => {
          setTerminalError(error);
        });
      }

      await terminalWsRef.current.connect();
    } catch (error) {
      setTerminalError(error as Error);
      throw error;
    }
  };

  const disconnectTerminal = () => {
    terminalWsRef.current?.disconnect();
    terminalWsRef.current = null;
    setTerminalConnected(false);
    setTerminalError(null);
  };

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      connectModelStatus();
      connectTerminal();
    }

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