import React, { useState, useEffect } from 'react';
import { initializeWebSocket, getModelStatus } from '../lib/api';

const ModelStatusIndicator = ({ onModelParamsChange }) => {
    const [modelStatus, setModelStatus] = useState({
        gptModel: 'Loading...',
        voiceModel: 'Loading...',
        isStreaming: false,
        temperature: 0.7,
        maxTokens: 2048
    });
    const [wsStatus, setWsStatus] = useState('disconnected');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Initialize WebSocket connection
        const cleanup = initializeWebSocket(
            (data) => {
                // Handle real-time updates
                if (data.type === 'model_status') {
                    setModelStatus(prev => ({ ...prev, ...data.payload }));
                } else if (data.type === 'processing_status') {
                    setIsProcessing(data.payload.isProcessing);
                }
            },
            (status) => setWsStatus(status)
        );

        // Fetch initial model status
        const fetchStatus = async () => {
            try {
                setError(null);
                const status = await getModelStatus();
                setModelStatus(status);
            } catch (err) {
                console.error('Failed to fetch model status:', err);
                setError('Failed to fetch model status');
            }
        };

        fetchStatus();
        const statusInterval = setInterval(fetchStatus, 30000); // Refresh every 30s

        return () => {
            cleanup();
            clearInterval(statusInterval);
        };
    }, []);

    const handleParameterChange = (param, value) => {
        setModelStatus(prev => {
            const updated = { ...prev, [param]: value };
            onModelParamsChange?.(updated);
            return updated;
        });
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg space-y-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                    wsStatus === 'connected' ? 'bg-green-500' :
                    wsStatus === 'error' ? 'bg-red-500' :
                    'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-300">
                    {wsStatus === 'connected' ? 'Connected' :
                     wsStatus === 'error' ? 'Connection Error' :
                     'Connecting...'}
                </span>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span className="text-sm text-gray-300">Processing request...</span>
                </div>
            )}

            {/* Model Information */}
            <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">GPT Model:</span>
                    <span className="text-green-400 font-medium">{modelStatus.gptModel}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Voice Model:</span>
                    <span className="text-green-400 font-medium">{modelStatus.voiceModel}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">Streaming:</span>
                    <span className={modelStatus.isStreaming ? 'text-green-400' : 'text-yellow-400'}>
                        {modelStatus.isStreaming ? 'Enabled' : 'Disabled'}
                    </span>
                </div>
            </div>

            {/* Model Parameters */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        Temperature: {modelStatus.temperature}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={modelStatus.temperature}
                        onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        Max Tokens: {modelStatus.maxTokens}
                    </label>
                    <input
                        type="range"
                        min="256"
                        max="4096"
                        step="256"
                        value={modelStatus.maxTokens}
                        onChange={(e) => handleParameterChange('maxTokens', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-900/50 p-2 rounded text-sm text-red-200">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ModelStatusIndicator; 