import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force this route to be dynamic - never statically generated
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Create NextAuth handler with error boundaries
let handler: any;

try {
  handler = NextAuth(authOptions);
} catch (error) {
  console.error('NextAuth initialization error during build:', error);
  // Fallback handler for build time
  handler = {
    GET: () => new Response('NextAuth not available during build', { status: 503 }),
    POST: () => new Response('NextAuth not available during build', { status: 503 }),
  };
}

export { handler as GET, handler as POST };