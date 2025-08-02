import { getErrorMessage, shouldRetry, isNetworkError } from './errors';

interface APIOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class APIClient {
  private baseURL: string;
  private defaultRetries: number;
  private defaultRetryDelay: number;

  constructor(baseURL = '', defaultRetries = 2, defaultRetryDelay = 1000) {
    this.baseURL = baseURL;
    this.defaultRetries = defaultRetries;
    this.defaultRetryDelay = defaultRetryDelay;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeRequest<T>(
    url: string, 
    options: APIOptions = {}
  ): Promise<APIResponse<T>> {
    const { retries = this.defaultRetries, retryDelay = this.defaultRetryDelay, ...fetchOptions } = options;
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add delay before retry attempts
        if (attempt > 0) {
          await this.sleep(retryDelay * attempt);
        }

        const response = await fetch(`${this.baseURL}${url}`, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          const error = new Error(data.error?.message || `HTTP ${response.status}`);
          (error as any).status = response.status;
          (error as any).response = { status: response.status, data };
          
          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              error: getErrorMessage(error),
            };
          }
          
          throw error;
        }

        return {
          success: true,
          data,
        };
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's the last attempt or if we shouldn't retry this error
        if (attempt === retries || !shouldRetry(error)) {
          break;
        }
        
        console.warn(`API request failed (attempt ${attempt + 1}/${retries + 1}):`, getErrorMessage(error));
      }
    }

    return {
      success: false,
      error: getErrorMessage(lastError),
    };
  }

  async get<T>(url: string, options?: APIOptions): Promise<APIResponse<T>> {
    return this.executeRequest<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, data?: any, options?: APIOptions): Promise<APIResponse<T>> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    const headers = data instanceof FormData 
      ? { ...options?.headers } 
      : { 'Content-Type': 'application/json', ...options?.headers };

    return this.executeRequest<T>(url, {
      ...options,
      method: 'POST',
      body,
      headers,
    });
  }

  async put<T>(url: string, data?: any, options?: APIOptions): Promise<APIResponse<T>> {
    return this.executeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(url: string, options?: APIOptions): Promise<APIResponse<T>> {
    return this.executeRequest<T>(url, { ...options, method: 'DELETE' });
  }
}

// Create default API client instance
export const api = new APIClient();

// Network status utilities
export function useNetworkStatus() {
  if (typeof window === 'undefined') {
    return { online: true, offline: false };
  }

  return {
    online: navigator.onLine,
    offline: !navigator.onLine,
  };
}

// Hook for handling API calls with loading states
export function useAPICall<T>() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = async (apiCall: () => Promise<APIResponse<T>>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return { loading, error, data, execute, reset };
}

// React import for useAPICall hook
import React from 'react';