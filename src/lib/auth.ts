import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { validateEmail, validatePassword } from './validations';

// Ensure NEXTAUTH_SECRET is set in production
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET must be set in production environment');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const emailValidation = validateEmail(credentials.email);
        if (!emailValidation.valid) {
          return null;
        }

        const passwordValidation = validatePassword(credentials.password);
        if (!passwordValidation.valid) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          profilePhoto: user.profilePhoto || undefined,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    updateAge: 7 * 24 * 60 * 60, // 1 week
  },
  jwt: {
    maxAge: 365 * 24 * 60 * 60, // 1 year - should match session.maxAge
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.profilePhoto = user.profilePhoto ?? undefined;
      }
      
      // Only refresh user data on explicit session update, not on every request
      if (trigger === 'update' && token.id) {
        try {
          const freshUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              username: true,
              profilePhoto: true,
            },
          });
          
          if (freshUser) {
            token.id = freshUser.id;
            token.email = freshUser.email;
            token.username = freshUser.username;
            token.profilePhoto = freshUser.profilePhoto ?? undefined;
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.profilePhoto = (token.profilePhoto ?? undefined) as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/app/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
  // Ensure cookies work across deployments
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};