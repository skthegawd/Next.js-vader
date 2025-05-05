import axios from 'axios';
import type { ApiConfig, ApiResponse, SessionData, ThemeData } from '../types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface IApi {
  initialize(): Promise<ApiResponse<SessionData>>;
  getTheme(): Promise<ApiResponse<ThemeData>>;
  analyzeCode(code: string): Promise<ApiResponse<any>>;
  streamChat(message: string, onChunk: (chunk: string) => void): Promise<void>;
  sendToAI(message: string, options?: {
    stream?: boolean;
    onChunk?: (chunk: string) => void;
    temperature?: number;
    maxTokens?: number;
  }): Promise<ApiResponse<any>>;
  getModelStatus(): Promise<ApiResponse<any>>;
}

class ApiClient implements IApi {
  private axios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Version': process.env.NEXT_PUBLIC_API_VERSION || 'v1',
      'X-Platform': 'web',
    },
    timeout: 30000,
    validateStatus: (status) => status >= 200 && status < 500,
  });

  constructor() {
    this.axios.interceptors.request.use(
      (config) => {
        if (config.url && !config.url.startsWith('/api/')) {
          config.url = `/api${config.url}`;
        }
        
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
          baseURL: config.baseURL,
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('[API] Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.axios.interceptors.response.use(
      (response) => {
        console.log(`[API] Response ${response.status}:`, {
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('[API] Full error details:', {
          message: error.message,
          stack: error.stack,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          retryCount: error.config?.retryCount || 0
        });

        if (!error.response) {
          throw new ApiError(
            0,
            'Network error - please check your connection',
            error
          );
        }

        throw new ApiError(
          error.response.status,
          error.response.data?.message || 'An unexpected error occurred',
          error.response.data?.error || error
        );
      }
    );
  }

  async initialize(): Promise<ApiResponse<SessionData>> {
    const response = await this.axios.get('/init');
    return response.data;
  }

  async getTheme(): Promise<ApiResponse<ThemeData>> {
    const response = await this.axios.get('/theme');
    return response.data;
  }

  async analyzeCode(code: string): Promise<ApiResponse<any>> {
    const response = await this.axios.post('/code/analyze', { code });
    return response.data;
  }

  async streamChat(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const response = await this.axios.post(
      '/chat/stream',
      { message },
      {
        responseType: 'stream',
      }
    );

    const reader = response.data.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          onChunk(data);
        }
      }
    }
  }

  async sendToAI(
    message: string,
    options: {
      stream?: boolean;
      onChunk?: (chunk: string) => void;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<ApiResponse<any>> {
    if (options.stream) {
      return this.streamChat(message, options.onChunk || (() => {}));
    }

    const response = await this.axios.post('/chat', {
      message,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return response.data;
  }

  async getModelStatus(): Promise<ApiResponse<any>> {
    const response = await this.axios.get('/model-status');
    return response.data;
  }
}

export const apiClient = new ApiClient(); 