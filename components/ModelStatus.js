import React from 'react';
import { useModelStatus } from '../hooks/useModelStatus';
import { ModelStatusIndicator } from './ModelStatusIndicator';

const ModelStatus = () => {
  const {
    modelStatus,
    error,
    isLoading,
    isWebSocketConnected,
    updateModelParameters,
    refreshStatus
  } = useModelStatus();

  if (isLoading) {
    return <div className="animate-pulse">Loading model status...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error: {error.message}
        <button
          onClick={refreshStatus}
          className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!modelStatus) {
    return <div>No model status available</div>;
  }

  const {
    model_type,
    parameters,
    metrics,
    health,
    last_updated,
    version
  } = modelStatus;

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{model_type}</h2>
        <ModelStatusIndicator status={health.status} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Parameters</h3>
          <div className="space-y-1">
            {Object.entries(parameters).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600">{key}:</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Metrics</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Requests/min:</span>
              <span className="font-mono">{metrics.requests_per_minute}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg. Latency:</span>
              <span className="font-mono">{metrics.average_latency}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Error Rate:</span>
              <span className="font-mono">{(metrics.error_rate * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-mono">{formatUptime(metrics.uptime)}</span>
            </div>
          </div>
        </div>
      </div>

      {health.last_error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          <div className="font-medium">Last Error:</div>
          <div className="text-sm">{health.last_error}</div>
          <div className="text-xs text-red-500 mt-1">
            {new Date(health.last_error_time).toLocaleString()}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
        <div>
          Version: {version}
        </div>
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${isWebSocketConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
          {isWebSocketConnected ? 'Real-time' : 'Polling'}
        </div>
        <div>
          Updated: {new Date(last_updated).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
};

export default ModelStatus; 