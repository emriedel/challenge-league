import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createErrorResponse, UnauthorizedError, MethodNotAllowedError } from '@/lib/apiErrors';
import { createRateLimiter, RateLimitPresets, type RateLimitConfig } from '@/lib/rateLimit';
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
  rateLimit?: RateLimitConfig | 'auth' | 'mutations' | 'queries' | 'expensive' | 'uploads';
}

type ApiHandler = (
  context: ApiContext
) => Promise<NextResponse> | NextResponse;

/**
 * Centralized API route handler that provides:
 * - Automatic dynamic export
 * - Authentication checks
 * - Method validation
 * - Rate limiting
 * - Error handling
 * - Consistent response format
 */
export function createApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
) {
  const { requireAuth = false, allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], rateLimit } = options;

  // Create rate limiter if configured
  let rateLimiter: ((req: NextRequest, next: () => Promise<NextResponse>) => Promise<NextResponse>) | null = null;

  if (rateLimit) {
    let rateLimitConfig: RateLimitConfig;

    if (typeof rateLimit === 'string') {
      // Use preset configuration
      rateLimitConfig = RateLimitPresets[rateLimit];
    } else {
      // Use custom configuration
      rateLimitConfig = rateLimit;
    }

    rateLimiter = createRateLimiter(rateLimitConfig);
  }

  return async function(req: NextRequest, context?: { params?: Record<string, string> }) {
    // Apply rate limiting if configured (outside try-catch to handle 429 responses directly)
    if (rateLimiter) {
      const rateLimitResponse = await rateLimiter(req, async () => {
        // Dummy response - actual processing happens below
        return new NextResponse();
      });

      if (rateLimitResponse.status === 429) {
        return rateLimitResponse;
      }
    }

    try {
      // Method validation
      if (!allowedMethods.includes(req.method || '')) {
        throw new MethodNotAllowedError(req.method || 'UNKNOWN');
      }

      // Get session if auth is required or available
      const session = requireAuth || req.headers.get('authorization')
        ? await getServerSession(authOptions)
        : null;

      // Auth validation
      if (requireAuth && !session?.user) {
        throw new UnauthorizedError();
      }

      // Call the actual handler
      const response = await handler({
        req,
        session,
        params: context?.params,
      });

      return response;

    } catch (error) {
      return createErrorResponse(error);
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