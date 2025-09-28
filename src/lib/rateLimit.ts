import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter for Next.js API routes
 * Uses Map to store rate limit data per IP address
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

// In-memory store (in production, consider using Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Try various headers for IP detection
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default (should not happen in production)
  return 'unknown';
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const ip = getClientIP(request);
    const now = Date.now();
    const key = `${ip}:${request.nextUrl.pathname}`;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: config.message || 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: resetTimeSeconds,
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetTimeSeconds.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      );
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    // Execute the API route
    const response = await next();

    // Add rate limit headers to response
    const remaining = Math.max(0, config.maxRequests - entry.count);
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return response;
  };
}

/**
 * Common rate limit configurations
 */
export const RateLimitPresets = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  },

  // Moderate limits for data modification endpoints
  mutations: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: 'Too many requests. Please slow down.',
  },

  // Relaxed limits for read-only endpoints
  queries: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Too many requests. Please slow down.',
  },

  // Very strict limits for expensive operations
  expensive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour
    message: 'Rate limit exceeded for this operation. Please try again later.',
  },

  // File upload limits
  uploads: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 uploads per 15 minutes
    message: 'Too many file uploads. Please try again later.',
  },
} as const;

/**
 * Rate limit middleware factory for easy use in API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  const rateLimiter = createRateLimiter(config);

  return function rateLimitedHandler(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, context?: any): Promise<NextResponse> {
      return rateLimiter(request, () => handler(request, context));
    };
  };
}

/**
 * Helper to create rate-limited API handler with preset configurations
 */
export const withAuthRateLimit = withRateLimit(RateLimitPresets.auth);
export const withMutationRateLimit = withRateLimit(RateLimitPresets.mutations);
export const withQueryRateLimit = withRateLimit(RateLimitPresets.queries);
export const withExpensiveRateLimit = withRateLimit(RateLimitPresets.expensive);
export const withUploadRateLimit = withRateLimit(RateLimitPresets.uploads);

export default {
  createRateLimiter,
  RateLimitPresets,
  withRateLimit,
  withAuthRateLimit,
  withMutationRateLimit,
  withQueryRateLimit,
  withExpensiveRateLimit,
  withUploadRateLimit,
};