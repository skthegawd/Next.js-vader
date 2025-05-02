export interface ModelParameters {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  [key: string]: any; // For any additional parameters
}

export interface ModelMetrics {
  requests_per_minute: number;
  average_latency: number;
  error_rate: number;
  uptime: number;
}

export interface ModelHealth {
  status: 'healthy' | 'degraded' | 'error';
  last_error?: string;
  last_error_time?: string;
  retry_after?: number;
}

export interface ModelStatus {
  model_type: string;
  parameters: ModelParameters;
  metrics: ModelMetrics;
  health: ModelHealth;
  last_updated: string;
  version: string;
} 