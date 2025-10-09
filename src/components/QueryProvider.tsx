'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { queryClient } from '@/lib/queryClient';

// Lazy load devtools to prevent chunk loading issues
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((mod) => ({
    default: mod.ReactQueryDevtools,
  }))
);

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * TanStack Query provider component
 * Provides query client to all child components for caching and data fetching
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show dev tools in development */}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="top-left"
          />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}