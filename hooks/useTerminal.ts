import { useState, useEffect, useCallback } from 'react';
import { terminalWs } from '../lib/websocket';

interface TerminalOutput {
  type: 'stdout' | 'stderr';
  data: string;
  timestamp: string;
}

export const useTerminal = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [output, setOutput] = useState<TerminalOutput[]>([]);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    // Setup WebSocket
    terminalWs.onMessage((data: TerminalOutput) => {
      setOutput(prev => [...prev, data]);
      setConnected(true);
      setError(null);
    });

    terminalWs.onError((error) => {
      console.error('Terminal WebSocket error:', error);
      setConnected(false);
      setError(error);
      setIsWatching(false);
    });

    // Connect WebSocket
    terminalWs.connect();

    // Cleanup
    return () => {
      terminalWs.disconnect();
    };
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const sendCommand = useCallback((command: string, args: string[] = [], watch = false) => {
    try {
      terminalWs.sendCommand(command, args, watch);
      setIsWatching(watch);
    } catch (err) {
      console.error('Error sending command:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const stopWatching = useCallback(() => {
    if (isWatching) {
      try {
        terminalWs.sendCommand('stop-watch');
        setIsWatching(false);
      } catch (err) {
        console.error('Error stopping watch:', err);
      }
    }
  }, [isWatching]);

  return {
    connected,
    error,
    output,
    isWatching,
    sendCommand,
    clearOutput,
    stopWatching,
  };
}; 