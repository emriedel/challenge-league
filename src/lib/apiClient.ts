/**
 * Enhanced API client that handles PWA badge refresh
 */

import { refreshPWABadge } from './pwaBadge';

// Enhanced fetch wrapper that handles PWA badge refresh
export async function apiRequest(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);

  // Check if the response includes a header to refresh PWA badge
  if (response.headers.get('X-Refresh-PWA-Badge') === 'true') {
    // Refresh PWA badge after a short delay to allow server state to update
    setTimeout(() => {
      refreshPWABadge();
    }, 100);
  }

  return response;
}

// Convenience methods that use the enhanced apiRequest
export const api = {
  get: (url: string, options?: RequestInit) =>
    apiRequest(url, { ...options, method: 'GET' }),

  post: (url: string, data?: any, options?: RequestInit) =>
    apiRequest(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: any, options?: RequestInit) =>
    apiRequest(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: RequestInit) =>
    apiRequest(url, { ...options, method: 'DELETE' }),
};