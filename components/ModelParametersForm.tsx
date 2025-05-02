import React, { useState } from 'react';
import { ModelParameters } from '../types/model';

interface ModelParametersFormProps {
  modelType: string;
  currentParameters: ModelParameters;
  onUpdate: (modelType: string, parameters: Partial<ModelParameters>) => Promise<void>;
}

export const ModelParametersForm: React.FC<ModelParametersFormProps> = ({
  modelType,
  currentParameters,
  onUpdate
}) => {
  const [parameters, setParameters] = useState<ModelParameters>(currentParameters);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof ModelParameters, value: number) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onUpdate(modelType, parameters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update parameters');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Temperature
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={parameters.temperature}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono w-12 text-right">
            {parameters.temperature.toFixed(1)}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max Tokens
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="100"
            max="4000"
            step="100"
            value={parameters.max_tokens}
            onChange={(e) => handleChange('max_tokens', parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono w-12 text-right">
            {parameters.max_tokens}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Top P
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={parameters.top_p}
            onChange={(e) => handleChange('top_p', parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono w-12 text-right">
            {parameters.top_p.toFixed(1)}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Frequency Penalty
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={parameters.frequency_penalty}
            onChange={(e) => handleChange('frequency_penalty', parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono w-12 text-right">
            {parameters.frequency_penalty.toFixed(1)}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Presence Penalty
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={parameters.presence_penalty}
            onChange={(e) => handleChange('presence_penalty', parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-mono w-12 text-right">
            {parameters.presence_penalty.toFixed(1)}
          </span>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            px-4 py-2 rounded-md text-white font-medium
            ${isSubmitting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {isSubmitting ? 'Updating...' : 'Update Parameters'}
        </button>
      </div>
    </form>
  );
}; 