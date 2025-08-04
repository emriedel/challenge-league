import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

// Force all API routes using this handler to be dynamic
export const dynamic = 'force-dynamic';

export interface ApiContext {
  req: NextRequest;
  session: Session | null;
  params?: Record<string, string>;
}

export interface AuthenticatedApiContext extends ApiContext {
  session: Session;
}

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  allowedMethods?: string[];
}

type ApiHandler = (
  context: ApiContext
) => Promise<NextResponse> | NextResponse;

/**
 * Centralized API route handler that provides:
 * - Automatic dynamic export
 * - Authentication checks
 * - Method validation
 * - Error handling
 * - Consistent response format
 */
export function createApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
) {
  const { requireAuth = false, allowedMethods = ['GET', 'POST', 'PATCH', 'DELETE'] } = options;

  return async function(req: NextRequest, context?: { params?: Record<string, string> }) {
    try {
      // Method validation
      if (!allowedMethods.includes(req.method || '')) {
        return NextResponse.json(
          { error: `Method ${req.method} not allowed` },
          { status: 405 }
        );
      }

      // Get session if auth is required or available
      const session = requireAuth || req.headers.get('authorization') 
        ? await getServerSession(authOptions)
        : null;

      // Auth validation
      if (requireAuth && !session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Call the actual handler
      return await handler({
        req,
        session,
        params: context?.params,
      });

    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Type-safe wrapper for route handlers with params
 */
export function createApiHandlerWithParams<T extends Record<string, string>>(
  handler: (context: ApiContext & { params: T }) => Promise<NextResponse> | NextResponse,
  options: ApiHandlerOptions = {}
) {
  return createApiHandler(
    (context) => handler(context as ApiContext & { params: T }),
    options
  );
}