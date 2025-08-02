import { NextResponse } from 'next/server';

export interface APIError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(code: string, message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Predefined error types
export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Business logic errors
  VOTING_CLOSED: 'VOTING_CLOSED',
  SUBMISSION_CLOSED: 'SUBMISSION_CLOSED',
  ALREADY_VOTED: 'ALREADY_VOTED',
  CANNOT_VOTE_OWN_SUBMISSION: 'CANNOT_VOTE_OWN_SUBMISSION',
  INVALID_VOTE_DISTRIBUTION: 'INVALID_VOTE_DISTRIBUTION',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// User-friendly error messages
export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: 'Please sign in to continue.',
  [ErrorCodes.FORBIDDEN]: 'You don\'t have permission to perform this action.',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password.',
  
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.INVALID_INPUT]: 'The provided information is invalid.',
  [ErrorCodes.FILE_TOO_LARGE]: 'File size is too large. Please choose a smaller file.',
  [ErrorCodes.INVALID_FILE_TYPE]: 'Invalid file type. Please upload an image file.',
  
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCodes.ALREADY_EXISTS]: 'This resource already exists.',
  
  [ErrorCodes.VOTING_CLOSED]: 'Voting is no longer available for this challenge.',
  [ErrorCodes.SUBMISSION_CLOSED]: 'Submissions are no longer being accepted for this challenge.',
  [ErrorCodes.ALREADY_VOTED]: 'You have already voted for this challenge.',
  [ErrorCodes.CANNOT_VOTE_OWN_SUBMISSION]: 'You cannot vote for your own submission.',
  [ErrorCodes.INVALID_VOTE_DISTRIBUTION]: 'Please distribute exactly 3 votes.',
  
  [ErrorCodes.DATABASE_ERROR]: 'A database error occurred. Please try again.',
  [ErrorCodes.STORAGE_ERROR]: 'File storage error. Please try again.',
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'External service is temporarily unavailable.',
  [ErrorCodes.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
};

export function createAPIError(
  code: keyof typeof ErrorCodes,
  customMessage?: string,
  statusCode?: number,
  details?: any
): APIError {
  return {
    code,
    message: customMessage || ErrorMessages[code] || 'An error occurred',
    statusCode: statusCode || getStatusCodeForError(code),
    details,
  };
}

export function createErrorResponse(
  code: keyof typeof ErrorCodes,
  customMessage?: string,
  statusCode?: number,
  details?: any
): NextResponse {
  const error = createAPIError(code, customMessage, statusCode, details);
  
  console.error(`API Error [${error.code}]:`, error.message, details || '');
  
  return NextResponse.json({ 
    error: {
      code: error.code,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && details && { details })
    }
  }, { status: error.statusCode });
}

function getStatusCodeForError(code: string): number {
  switch (code) {
    case ErrorCodes.UNAUTHORIZED:
    case ErrorCodes.INVALID_CREDENTIALS:
      return 401;
    case ErrorCodes.FORBIDDEN:
      return 403;
    case ErrorCodes.NOT_FOUND:
      return 404;
    case ErrorCodes.ALREADY_EXISTS:
      return 409;
    case ErrorCodes.VALIDATION_ERROR:
    case ErrorCodes.INVALID_INPUT:
    case ErrorCodes.FILE_TOO_LARGE:
    case ErrorCodes.INVALID_FILE_TYPE:
    case ErrorCodes.VOTING_CLOSED:
    case ErrorCodes.SUBMISSION_CLOSED:
    case ErrorCodes.ALREADY_VOTED:
    case ErrorCodes.CANNOT_VOTE_OWN_SUBMISSION:
    case ErrorCodes.INVALID_VOTE_DISTRIBUTION:
      return 400;
    case ErrorCodes.EXTERNAL_SERVICE_ERROR:
      return 502;
    default:
      return 500;
  }
}

// Client-side error handling utility
export function getErrorMessage(error: any): string {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('fetch') ||
    error?.message?.includes('network') ||
    !navigator.onLine
  );
}

export function shouldRetry(error: any): boolean {
  const statusCode = error?.response?.status || error?.status;
  
  // Retry on server errors and network errors
  return statusCode >= 500 || isNetworkError(error);
}