import React, { useState, useEffect } from 'react';
import { getModelStatus } from '../lib/api';

const ModelStatus = ({ onParametersChange }) => {
    const [modelStatus, setModelStatus] = useState({
        gptModel: 'Loading...',
        voiceModel: 'Loading...',
        isStreaming: false,
        temperature: 0.7,
        maxTokens: 2048
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                setError(null);
                setLoading(true);
                const status = await getModelStatus();
                setModelStatus(status);
            } catch (err) {
                setError('Failed to fetch model status');
                console.error('Model status error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        // Refresh status every 30 seconds
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleParameterChange = (param, value) => {
        setModelStatus(prev => {
            const updated = { ...prev, [param]: value };
            onParametersChange?.(updated);
            return updated;
        });
    };

    if (loading) {
        return (
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/50 p-4 rounded-lg shadow-lg">
                <p className="text-red-200">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg space-y-4">
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

            <div className="space-y-3">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Temperature: {modelStatus.temperature}</label>
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
                    <label className="block text-sm text-gray-400 mb-1">Max Tokens: {modelStatus.maxTokens}</label>
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
        </div>
    );
};

export default ModelStatus; 