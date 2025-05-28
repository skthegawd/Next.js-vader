import axios from 'axios';
import { CodeSpecification, CodeAnalysis, ExportOptions } from '../types/code';
import { getOrCreateSessionId, API_URL } from '../../lib/config';

export class CodeService {
  private static instance: CodeService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_URL || 'http://localhost:8000/api';
  }

  public static getInstance(): CodeService {
    if (!CodeService.instance) {
      CodeService.instance = new CodeService();
    }
    return CodeService.instance;
  }

  async generateCode(specification: CodeSpecification) {
    try {
      const response = await axios.post(`${this.baseUrl}/code/generate`, specification, {
        headers: {
          'X-Session-ID': getOrCreateSessionId(),
        },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to generate code'
      };
    }
  }

  async analyzeCode(code: string, language: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/code/analyze`, { code, language }, {
        headers: {
          'X-Session-ID': getOrCreateSessionId(),
        },
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to analyze code'
      };
    }
  }

  async exportCode(code: string, options: ExportOptions) {
    try {
      const response = await axios.post(`${this.baseUrl}/code/export`, {
        code,
        format: options.format,
        options
      }, {
        responseType: options.format === 'zip' || options.format === 'tar' ? 'blob' : 'json',
        headers: {
          'X-Session-ID': getOrCreateSessionId(),
        },
      });

      if (options.format === 'zip' || options.format === 'tar') {
        return {
          success: true,
          data: response.data,
          filename: response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '')
        };
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to export code'
      };
    }
  }
} 