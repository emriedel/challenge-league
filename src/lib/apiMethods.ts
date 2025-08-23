import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler, ApiContext, AuthenticatedApiContext } from './apiHandler';
import { MethodNotAllowedError } from './apiErrors';

// Export the dynamic constant so routes that import this get it automatically
export { dynamic } from './apiHandler';

/**
 * HTTP method handlers with built-in authentication and validation
 */

export const GET = (
  handler: (context: ApiContext) => Promise<NextResponse> | NextResponse,
  requireAuth = true
) => createApiHandler(handler, { requireAuth, allowedMethods: ['GET'] });

export const POST = (
  handler: (context: ApiContext) => Promise<NextResponse> | NextResponse,
  requireAuth = true
) => createApiHandler(handler, { requireAuth, allowedMethods: ['POST'] });

export const PUT = (
  handler: (context: ApiContext) => Promise<NextResponse> | NextResponse,
  requireAuth = true
) => createApiHandler(handler, { requireAuth, allowedMethods: ['PUT'] });

export const PATCH = (
  handler: (context: ApiContext) => Promise<NextResponse> | NextResponse,
  requireAuth = true
) => createApiHandler(handler, { requireAuth, allowedMethods: ['PATCH'] });

export const DELETE = (
  handler: (context: ApiContext) => Promise<NextResponse> | NextResponse,
  requireAuth = true
) => createApiHandler(handler, { requireAuth, allowedMethods: ['DELETE'] });

/**
 * Multi-method handler for authenticated routes
 */
export const createMethodHandlers = (handlers: {
  GET?: (context: AuthenticatedApiContext) => Promise<NextResponse> | NextResponse;
  POST?: (context: AuthenticatedApiContext) => Promise<NextResponse> | NextResponse;
  PUT?: (context: AuthenticatedApiContext) => Promise<NextResponse> | NextResponse;
  PATCH?: (context: AuthenticatedApiContext) => Promise<NextResponse> | NextResponse;
  DELETE?: (context: AuthenticatedApiContext) => Promise<NextResponse> | NextResponse;
}, requireAuth = true) => {

  const methods = Object.keys(handlers);
  const baseHandler = createApiHandler(
    async (context) => {
      const method = context.req.method;
      const handler = handlers[method as keyof typeof handlers];
      
      if (!handler) {
        throw new MethodNotAllowedError(method);
      }
      
      // Cast context to AuthenticatedApiContext since requireAuth=true ensures session exists
      return await handler(context as AuthenticatedApiContext);
    },
    { requireAuth, allowedMethods: methods }
  );

  // Return an object with method names as keys
  const result: Record<string, typeof baseHandler> = {};
  methods.forEach(method => {
    result[method] = baseHandler;
  });

  return result;
};

/**
 * Multi-method handler for public routes (no auth required)
 */
export const createPublicMethodHandlers = (handlers: {
  GET?: (context: ApiContext) => Promise<NextResponse> | NextResponse;
  POST?: (context: ApiContext) => Promise<NextResponse> | NextResponse;
  PUT?: (context: ApiContext) => Promise<NextResponse> | NextResponse;
  PATCH?: (context: ApiContext) => Promise<NextResponse> | NextResponse;
  DELETE?: (context: ApiContext) => Promise<NextResponse> | NextResponse;
}) => {

  const methods = Object.keys(handlers);
  const baseHandler = createApiHandler(
    async (context) => {
      const method = context.req.method;
      const handler = handlers[method as keyof typeof handlers];
      
      if (!handler) {
        throw new MethodNotAllowedError(method);
      }
      
      return await handler(context);
    },
    { requireAuth: false, allowedMethods: methods }
  );

  // Return an object with method names as keys
  const result: Record<string, typeof baseHandler> = {};
  methods.forEach(method => {
    result[method] = baseHandler;
  });

  return result;
};