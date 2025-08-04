import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Ensure runtime doesn't fail during build
export const dynamic = 'force-dynamic';