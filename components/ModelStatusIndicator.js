import React, { useState, useEffect } from 'react';
import { initializeWebSocket, getModelStatus } from '../lib/api';
import { logger } from '../lib/logger';

const ModelStatusIndicator = ({ onModelParamsChange, wsStatus }) => {
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
                onModelParamsChange({
                    temperature: status.temperature,
                    maxTokens: status.maxTokens
                });
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
    }, [onModelParamsChange]);

    const handleParameterChange = (param, value) => {
        setModelStatus(prev => {
            const updated = { ...prev, [param]: value };
            onModelParamsChange?.(updated);
            return updated;
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'connected':
                return 'bg-green-500';
            case 'disconnected':
                return 'bg-red-500';
            case 'error':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'connected':
                return 'WebSocket Connected';
            case 'disconnected':
                return 'WebSocket Disconnected';
            case 'error':
                return 'WebSocket Error';
            case 'failed':
                return 'WebSocket Failed';
            default:
                return 'WebSocket Initializing';
        }
    };

    return (
        <div className="bg-black bg-opacity-50 p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-red-500">Model Status</h2>
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(wsStatus)}`}></div>
                    <span className="text-sm text-gray-300">{getStatusText(wsStatus)}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400">GPT Model</label>
                    <div className="mt-1 text-white">{modelStatus.gptModel}</div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-400">Voice Model</label>
                    <div className="mt-1 text-white">{modelStatus.voiceModel}</div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-400">Temperature</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={modelStatus.temperature}
                        onChange={(e) => {
                            const newTemp = parseFloat(e.target.value);
                            setModelStatus(prev => ({ ...prev, temperature: newTemp }));
                            onModelParamsChange({
                                temperature: newTemp,
                                maxTokens: modelStatus.maxTokens
                            });
                        }}
                        className="w-full mt-1"
                    />
                    <div className="text-sm text-gray-300 mt-1">{modelStatus.temperature}</div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-400">Max Tokens</label>
                    <input
                        type="number"
                        min="1"
                        max="4096"
                        value={modelStatus.maxTokens}
                        onChange={(e) => {
                            const newTokens = parseInt(e.target.value);
                            setModelStatus(prev => ({ ...prev, maxTokens: newTokens }));
                            onModelParamsChange({
                                temperature: modelStatus.temperature,
                                maxTokens: newTokens
                            });
                        }}
                        className="w-full mt-1 bg-gray-700 text-white px-2 py-1 rounded"
                    />
                </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default ModelStatusIndicator; 