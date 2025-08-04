import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with error handling for build time
let prismaClient: PrismaClient;

try {
  prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    // Prevent database connection during build
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./dev.db'
      }
    }
  });
} catch (error) {
  console.warn('Prisma client initialization failed during build:', error);
  // Create a mock client for build time
  prismaClient = {} as PrismaClient;
}

export const db = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;