import axios from 'axios';
import type { ApiConfig, ApiResponse, SessionData, ThemeData } from './types';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'https://vader-yp5n.onrender.com';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': process.env.NEXT_PUBLIC_API_VERSION || 'v1',
    'X-Platform': 'web',
  },
  withCredentials: true,
});

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

axiosInstance.interceptors.response.use(
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

export const api = {
  async initialize(): Promise<ApiResponse<SessionData>> {
    const response = await axiosInstance.get('/api/next/init');
    return response.data;
  },

  async getTheme(): Promise<ApiResponse<ThemeData>> {
    const response = await axiosInstance.get('/api/next/theme');
    return response.data;
  },

  async analyzeCode(code: string): Promise<ApiResponse<any>> {
    const response = await axiosInstance.post('/api/next/code/analyze', { code });
    return response.data;
  },

  async streamChat(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const response = await axiosInstance.post(
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
  },

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

    const response = await axiosInstance.post('/api/gpt', {
      query: message,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return response.data;
  },

  async getModelStatus(): Promise<ApiResponse<any>> {
    const response = await axiosInstance.get('/api/model-status');
    return response.data;
  },
}; 