import React, { useEffect, useState } from 'react';
import { getModelStatus, initializeWebSocket } from '../lib/api';
import { ModelHealth } from '../types/model';

interface ModelStatus {
  gptModel: string;
  voiceModel: string;
  isStreaming: boolean;
  temperature: number;
  maxTokens: number;
}

interface ModelStatusIndicatorProps {
  status: ModelHealth['status'];
  onStatusChange?: (status: ModelStatus) => void;
}

export const ModelStatusIndicator: React.FC<ModelStatusIndicatorProps> = ({ status, onStatusChange }) => {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setError(null);
        const modelStatus = await getModelStatus();
        setModelStatus(modelStatus);
        onStatusChange?.(modelStatus);
      } catch (error) {
        console.error('Failed to fetch model status:', error);
        setError('Failed to fetch model status. Retrying...');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up periodic refresh
    const intervalId = setInterval(fetchStatus, 30000); // Refresh every 30 seconds

    // Set up WebSocket
    const cleanup = initializeWebSocket(
      (data) => {
        if (data.type === 'model_status') {
          setModelStatus(data.status);
          onStatusChange?.(data.status);
        }
      },
      (connectionStatus) => {
        setWsStatus(connectionStatus);
        if (connectionStatus === 'connected') {
          setError(null);
        }
      }
    );

    return () => {
      clearInterval(intervalId);
      cleanup();
    };
  }, [onStatusChange]);

  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          label: 'Healthy',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'degraded':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          label: 'Degraded',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'error':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          label: 'Error',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          label: 'Unknown',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
      <span className={`flex-shrink-0 w-2 h-2 rounded-full ${config.color} mr-2`} />
      <span className="text-sm font-medium flex items-center">
        {config.label}
        <span className="ml-2">{config.icon}</span>
      </span>
    </div>
  );
}; 