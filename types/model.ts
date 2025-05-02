export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop?: string[];
  [key: string]: any;
}

export interface ModelConfig {
  model_type: string;
  parameters: ModelParameters;
  capabilities: string[];
  max_context_length: number;
  supported_parameters: string[];
}

export interface ModelMetrics {
  requests_total: number;
  requests_successful: number;
  requests_failed: number;
  average_latency: number;
  tokens_total: number;
  uptime: number;
}

export interface ModelHealth {
  status: 'healthy' | 'degraded' | 'error';
  last_error?: string;
  last_error_time?: string;
  retry_after?: number;
}

export interface ModelStatus {
  status: 'idle' | 'loading' | 'ready' | 'error';
  message?: string;
  error?: string;
  config: ModelConfig;
  metrics: ModelMetrics;
  health: ModelHealth;
  last_updated: string;
  version: string;
} 