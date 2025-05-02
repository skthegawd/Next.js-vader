import { useState, useEffect, useCallback } from 'react';
import { terminalWs } from '../lib/websocket';

interface TerminalOutput {
  type: 'stdout' | 'stderr';
  data: string;
  timestamp: string;
}

export const useTerminal = () => {
  const [output, setOutput] = useState<TerminalOutput[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    const setupTerminal = async () => {
      try {
        // Setup WebSocket handlers
        terminalWs.onMessage((data: TerminalOutput) => {
          console.debug('[Terminal] Received output:', data);
          setOutput(prev => [...prev, data]);
          setError(null);
        });

        terminalWs.onError((error) => {
          console.error('[Terminal] WebSocket error:', error);
          setError(error);
          setIsWatching(false);
        });

        terminalWs.onStatus((status) => {
          console.debug('[Terminal] WebSocket status:', status);
          setConnectionStatus(status);
          
          if (status === 'disconnected' || status === 'error') {
            setIsWatching(false);
          }
        });

        // Connect WebSocket
        await terminalWs.connect();
      } catch (error) {
        console.error('[Terminal] Setup error:', error);
        setError(error as Error);
      }
    };

    setupTerminal();

    // Cleanup
    return () => {
      terminalWs.disconnect();
    };
  }, []);

  const clearOutput = useCallback(() => {
    console.debug('[Terminal] Clearing output');
    setOutput([]);
  }, []);

  const sendCommand = useCallback((command: string, args: string[] = [], watch = false) => {
    try {
      console.debug('[Terminal] Sending command:', { command, args, watch });
      terminalWs.sendCommand(command, args, watch);
      setIsWatching(watch);
    } catch (err) {
      console.error('[Terminal] Error sending command:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const stopWatching = useCallback(() => {
    if (isWatching) {
      try {
        console.debug('[Terminal] Stopping watch mode');
        terminalWs.sendCommand('stop-watch');
        setIsWatching(false);
      } catch (err) {
        console.error('[Terminal] Error stopping watch:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [isWatching]);

  return {
    output,
    error,
    isWatching,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    sendCommand,
    clearOutput,
    stopWatching,
  };
}; 