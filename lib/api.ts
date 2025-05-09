import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiConfig, ApiResponse, SessionData, ThemeData } from './types';
import { getOrCreateSessionId } from './config';

// API Error class with better error categorization
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any,
    public isNetworkError: boolean = false,
    public retryCount: number = 0
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromAxiosError(error: AxiosError, retryCount: number = 0): ApiError {
    if (!error.response) {
      // Network error or no response
      return new ApiError(
        0,
        'Network error - please check your connection',
        {
          message: error.message,
          stack: error.stack,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          retryCount
        },
        true,
        retryCount
      );
    }

    return new ApiError(
      error.response.status,
      error.response.data?.message || 'An error occurred',
      error.response.data?.error,
      false,
      retryCount
    );
  }
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  shouldRetry: (error: any) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (error.isNetworkError) return true;
    if (error.response?.status >= 500) return true;
    return false;
  }
};

// Create axios instance
const createAxiosInstance = (retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'https://vader-yp5n.onrender.com',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Version': process.env.NEXT_PUBLIC_API_VERSION || 'v1',
      'X-Platform': 'web',
    },
    withCredentials: true,
    timeout: 10000, // 10 second timeout
  });

  // Add retry interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      
      // Initialize retry count
      config.retryCount = config.retryCount || 0;
      
      const shouldRetry = retryConfig.shouldRetry(
        error.response ? 
          ApiError.fromAxiosError(error, config.retryCount) : 
          { isNetworkError: true }
      );

      // Check if we should retry the request
      if (shouldRetry && config.retryCount < retryConfig.maxRetries) {
        config.retryCount += 1;

        // Implement exponential backoff
        const delay = retryConfig.retryDelay * Math.pow(2, config.retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.warn(`[API] Retrying request (${config.retryCount}/${retryConfig.maxRetries})`);
        return instance(config);
      }

      // Convert error to ApiError
      const apiError = ApiError.fromAxiosError(error, config?.retryCount || 0);
      console.error('[API] Full error details:', {
        message: apiError.message,
        stack: apiError.stack,
        url: config?.url,
        baseURL: config?.baseURL,
        retryCount: config?.retryCount || 0
      });

      throw apiError;
    }
  );

  return instance;
};

const axiosInstance = createAxiosInstance();

// API methods with improved error handling
const api = {
  async initialize(): Promise<ApiResponse<SessionData>> {
    try {
      const response = await axiosInstance.get('/api/next/init');
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.fromAxiosError(error as AxiosError);
    }
  },

  async getTheme(): Promise<ApiResponse<ThemeData>> {
    try {
      const response = await axiosInstance.get('/api/next/theme');
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.fromAxiosError(error as AxiosError);
    }
  },

  async analyzeCode(code: string): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.post('/api/next/code/analyze', { code });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.fromAxiosError(error as AxiosError);
    }
  },

  async streamChat(
    message: string,
    onChunk: (chunk: any) => void,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<void> {
    // Use EventSource for SSE streaming
    const session_id = getOrCreateSessionId();
    const params = new URLSearchParams({ session_id });
    const url = `/api/chat/stream?${params.toString()}`;
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(url);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onChunk(data);
          if (data.type === 'stream_end') {
            eventSource.close();
            resolve();
          }
        } catch (err) {
          eventSource.close();
          reject(err);
        }
      };
      eventSource.onerror = (err) => {
        eventSource.close();
        reject(err);
      };
      // Send initial message via fetch to start the stream
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          session_id,
          stream: true,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        }),
      });
    });
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
    try {
      if (options.stream) {
        return this.streamChat(message, options.onChunk || (() => {}));
      }

      const response = await axiosInstance.post('/api/chat', {
        content: message,
        session_id: getOrCreateSessionId(),
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      });

      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.fromAxiosError(error as AxiosError);
    }
  },

  async getModelStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await axiosInstance.get('/api/model-status');
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.fromAxiosError(error as AxiosError);
    }
  }
};

export default api; 