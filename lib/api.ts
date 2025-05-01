import axios, { AxiosInstance } from 'axios';
import type { ApiConfig, ApiResponse, SessionData, ThemeData } from './types';

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

export class ApiClient {
  private static instance: ApiClient;
  private axios: AxiosInstance;
  private baseUrl: string;

  private constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': process.env.NEXT_PUBLIC_API_VERSION || 'v1',
        ...config.headers,
      },
      withCredentials: true,
    });

    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new ApiError(
            error.response.status,
            error.response.data.message || 'An error occurred',
            error.response.data.error
          );
        }
        throw error;
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient({
        baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'https://vader-yp5n.onrender.com',
        headers: {
          'X-Platform': 'web',
        },
      });
    }
    return ApiClient.instance;
  }

  async initialize(): Promise<ApiResponse<SessionData>> {
    const response = await this.axios.get('/api/next/init');
    return response.data;
  }

  async getTheme(): Promise<ApiResponse<ThemeData>> {
    const response = await this.axios.get('/api/next/theme');
    return response.data;
  }

  async analyzeCode(code: string): Promise<ApiResponse<any>> {
    const response = await this.axios.post('/api/next/code/analyze', { code });
    return response.data;
  }

  async streamChat(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const response = await this.axios.post(
      '/api/next/chat/stream',
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

    const response = await this.axios.post('/api/gpt', {
      query: message,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return response.data;
  }

  async getModelStatus(): Promise<ApiResponse<any>> {
    const response = await this.axios.get('/api/model-status');
    return response.data;
  }
}

// Export the singleton instance
export const api = ApiClient.getInstance(); 