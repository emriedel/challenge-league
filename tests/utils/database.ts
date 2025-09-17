import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Test database utilities for isolated testing with PostgreSQL
 */

let testDbName: string;
let prisma: PrismaClient;

export function getTestDb(): PrismaClient {
  if (!prisma) {
    // Use fixed test database name that matches Docker container
    testDbName = 'challenge_league_test';

    // Set the test database URL (different port from dev)
    const testDatabaseUrl = `postgresql://challenge_league:test_password@localhost:5433/${testDbName}`;

    // Initialize Prisma client with the test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDatabaseUrl,
        },
      },
      log: [], // No logging for tests
    });
  }

  return prisma;
}

/**
 * Reset the test database with fresh schema (PostgreSQL)
 * Uses dedicated test database on port 5433
 */
export async function resetTestDb(): Promise<void> {
  try {
    // Use fixed test database (not unique per test run)
    testDbName = 'challenge_league_test';

    const testDatabaseUrl = `postgresql://challenge_league:test_password@localhost:5433/${testDbName}`;

    // Initialize Prisma client with the shared test database
    if (prisma) {
      await prisma.$disconnect();
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDatabaseUrl,
        },
      },
      log: [], // No logging for tests
    });

    // Clear all data from existing tables
    console.log('🧹 Clearing test database data...');
    try {
      // Clear data in the correct order to respect foreign key constraints
      await prisma.$executeRaw`TRUNCATE TABLE "Vote" CASCADE`;
      await prisma.$executeRaw`TRUNCATE TABLE "Comment" CASCADE`;
      await prisma.$executeRaw`TRUNCATE TABLE "Response" CASCADE`;
      await prisma.$executeRaw`TRUNCATE TABLE "Prompt" CASCADE`;
      await prisma.$executeRaw`TRUNCATE TABLE "LeagueMembership" CASCADE`;
      await prisma.$executeRaw`TRUNCATE TABLE "League" CASCADE`;
      await prisma.$executeRaw`TRUNCATE TABLE "PushSubscription" CASCADE`;
      await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
      console.log('✅ Test database data cleared');
    } catch (clearError) {
      console.log('⚠️ Could not clear existing data (tables may not exist yet)');

      // Apply schema if tables don't exist
      console.log('🔧 Applying database schema to test database...');

      try {
        // Use Prisma's db push to create the schema from the schema.prisma file
        execSync(`npx prisma db push --force-reset`, {
          stdio: 'pipe',
          cwd: process.cwd(),
          env: {
            ...process.env,
            DATABASE_URL: testDatabaseUrl
          }
        });
        console.log('✅ Prisma db push completed successfully');
      } catch (pushError) {
        console.log('⚠️ Prisma db push failed:', pushError instanceof Error ? pushError.message : String(pushError));

        // Alternative: Apply migrations
        try {
          execSync(`npx prisma migrate deploy`, {
            stdio: 'pipe',
            cwd: process.cwd(),
            env: {
              ...process.env,
              DATABASE_URL: testDatabaseUrl
            }
          });
        } catch (migrateError) {
          console.log('⚠️ Migration failed too, proceeding without schema setup...');
        }
      }
    }
    
    // Test connection and verify schema
    await prisma.$executeRaw`SELECT 1`;
    
    // Verify tables exist
    try {
      const tableCount = await prisma.$queryRaw<Array<{count: bigint}>>`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name IN ('users', 'leagues', 'prompts', 'responses', 'votes');
      `;
      const count = Number(tableCount[0]?.count || 0);
      console.log(`🔍 Schema verification: ${count}/5 core tables found`);
      
      if (count < 5) {
        console.log('⚠️ Warning: Missing database tables, schema may not be properly applied');
      }
    } catch (verifyError) {
      console.log('⚠️ Could not verify schema:', verifyError instanceof Error ? verifyError.message : String(verifyError));
    }
    
    console.log('✅ Test database reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset test database:', error);
    throw error;
  }
}

/**
 * Create the test database using PostgreSQL (not needed for Docker setup)
 */
async function createTestDatabase(): Promise<void> {
  // Database is created by Docker container, no need to create it manually
  console.log('✅ Test database managed by Docker container');
}

/**
 * Clean up test database and disconnect (PostgreSQL)
 */
export async function cleanupTestDb(): Promise<void> {
  if (prisma) {
    try {
      // Just disconnect, don't drop the database (it's managed by Docker)
      await prisma.$disconnect();
      console.log('✅ Disconnected from test database');
    } catch (error) {
      console.error('❌ Error during test database cleanup:', error);
    }
  }

  // Reset variables for next test
  prisma = null;
  testDbName = null;
}

/**
 * Clean up any orphaned test databases (PostgreSQL)
 */
export async function cleanupOrphanedTestDbs(): Promise<void> {
  try {
    const adminDb = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://challenge_league:dev_password@localhost:5432/postgres',
        },
      },
    });
    
    // Get all databases starting with 'test_db_'
    const databases = await adminDb.$queryRaw<Array<{datname: string}>>`
      SELECT datname FROM pg_database WHERE datname LIKE 'test_db_%';
    `;
    
    for (const db of databases) {
      try {
        await adminDb.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${db.datname}"`);
        console.log(`🗑️ Cleaned up orphaned test database: ${db.datname}`);
      } catch (error) {
        // Database might be in use, skip it
      }
    }
    
    await adminDb.$disconnect();
  } catch (error) {
    // Silent cleanup failure is okay
    console.log('⚠️ Could not cleanup orphaned databases:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Seed test database with minimal required data
 */
export async function seedTestDb(): Promise<{
  mainLeague: any;
  testUser?: any;
}> {
  const db = getTestDb();
  
  // Create test user first (needed as league owner) with unique identifiers
  const timestamp = Date.now();
  const testUser = await db.user.create({
    data: {
      email: `testowner${timestamp}@example.com`,
      username: `testowner${timestamp}`,
      password: 'hashedpassword',
    },
  });
  
  // Create main league with unique identifiers
  const mainLeague = await db.league.create({
    data: {
      name: `Main League ${timestamp}`,
      slug: `main-league-${timestamp}`,
      description: 'The main competition league for all players',
      inviteCode: `MAIN${timestamp}`,
      isActive: true,
      ownerId: testUser.id,
    },
  });

  console.log('✅ Test database seeded');
  
  return {
    mainLeague,
    testUser,
  };
}