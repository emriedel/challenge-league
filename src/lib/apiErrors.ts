import { NextResponse } from 'next/server';
import { logger } from './monitoring';

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

/**
 * Custom error class for API errors with status codes
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number = 500,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Pre-defined error types for common scenarios
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class MethodNotAllowedError extends ApiError {
  constructor(method: string) {
    super(`Method ${method} not allowed`, 405, 'METHOD_NOT_ALLOWED');
  }
}

/**
 * Convert any error to a standardized API error response
 */
export function createErrorResponse(error: unknown): NextResponse {
  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof Error) {
    // Handle legacy errors with status property
    const status = (error as any).status || 500;
    apiError = new ApiError(error.message, status);
  } else {
    // Handle unknown error types
    apiError = new ApiError('An unexpected error occurred', 500);
  }

  const response: ApiErrorResponse = {
    error: apiError.message,
    code: apiError.code,
    details: apiError.details,
    timestamp: new Date().toISOString(),
  };

  // Use structured logging instead of console
  if (apiError.status >= 500) {
    logger.error('API Error (Server)', apiError, {
      status: apiError.status,
      code: apiError.code,
      category: 'api_error',
    });
  } else if (apiError.status >= 400) {
    logger.warn('API Error (Client)', {
      message: apiError.message,
      status: apiError.status,
      code: apiError.code,
      category: 'api_error',
    });
  }

  return NextResponse.json(response, { status: apiError.status });
}

/**
 * Validation helper for required fields
 */
export function validateRequired(
  data: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => 
    data[field] === undefined || 
    data[field] === null || 
    data[field] === ''
  );

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
}

/**
 * League membership validation helper
 */
export async function validateLeagueMembership(
  db: any,
  userId: string,
  leagueId: string
): Promise<void> {
  const league = await db.league.findUnique({
    where: { id: leagueId }
  });

  if (!league) {
    throw new NotFoundError('League');
  }

  const membership = await db.leagueMembership.findUnique({
    where: {
      userId_leagueId: {
        userId,
        leagueId: league.id
      }
    }
  });

  if (!membership || !membership.isActive) {
    throw new ForbiddenError('You are not a member of this league');
  }
}

/**
 * Async error wrapper for cleaner error handling
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error; // Re-throw to be caught by API handler
    }
  };
}