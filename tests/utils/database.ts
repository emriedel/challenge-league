import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

/**
 * Test database utilities for isolated testing
 */

let testDbPath: string;
let prisma: PrismaClient;

export function getTestDb(): PrismaClient {
  if (!prisma) {
    // Create a unique test database file for this test run (NEVER use dev.db)
    testDbPath = path.join(process.cwd(), `prisma/test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
    
    // SAFETY CHECK: Ensure we never accidentally use the development database
    if (testDbPath.includes('dev.db') || testDbPath.includes('development')) {
      throw new Error('❌ SAFETY ERROR: Test database path would interfere with development database!');
    }
    
    // Set the test database URL (completely separate from development)
    const testDatabaseUrl = `file:${testDbPath}`;
    
    // Initialize Prisma client with the isolated test database
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
 * Reset the test database with fresh schema
 */
export async function resetTestDb(): Promise<void> {
  try {
    // Get test database instance
    const testDb = getTestDb();
    
    // Use Prisma's programmatic migration instead of execSync
    // This creates the tables directly without shell commands
    await testDb.$executeRaw`PRAGMA foreign_keys = OFF;`;
    
    // Drop all tables if they exist (SQLite specific)
    const tables = await testDb.$queryRaw<Array<{name: string}>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
    `;
    
    for (const table of tables) {
      await testDb.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.name}";`);
    }
    
    await testDb.$executeRaw`PRAGMA foreign_keys = ON;`;
    
    // Manually create the schema (basic tables needed for tests)
    await createTestSchema(testDb);
    
    console.log('✅ Test database reset successfully');
  } catch (error) {
    console.error('❌ Failed to reset test database:', error);
    throw error;
  }
}

/**
 * Create the exact schema matching Prisma schema with proper table names
 */
async function createTestSchema(db: PrismaClient): Promise<void> {
  // Create users table (matches @@map("users"))
  await db.$executeRaw`
    CREATE TABLE "users" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "emailVerified" DATETIME,
      "image" TEXT,
      "username" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "profilePhoto" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create leagues table (matches @@map("leagues"))
  await db.$executeRaw`
    CREATE TABLE "leagues" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "slug" TEXT NOT NULL UNIQUE,
      "description" TEXT NOT NULL,
      "inviteCode" TEXT NOT NULL UNIQUE,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "submissionDays" INTEGER NOT NULL DEFAULT 5,
      "votingDays" INTEGER NOT NULL DEFAULT 2,
      "votesPerPlayer" INTEGER NOT NULL DEFAULT 3,
      "ownerId" TEXT NOT NULL,
      FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  // Create league_memberships table (matches @@map("league_memberships"))
  await db.$executeRaw`
    CREATE TABLE "league_memberships" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "userId" TEXT NOT NULL,
      "leagueId" TEXT NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  // Create unique index for league_memberships
  await db.$executeRaw`
    CREATE UNIQUE INDEX "league_memberships_userId_leagueId_key" ON "league_memberships"("userId", "leagueId");
  `;

  // Create prompts table (matches @@map("prompts"))
  await db.$executeRaw`
    CREATE TABLE "prompts" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "text" TEXT NOT NULL,
      "phaseStartedAt" DATETIME,
      "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
      "queueOrder" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "leagueId" TEXT NOT NULL,
      FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  // Create responses table (matches @@map("responses"))
  await db.$executeRaw`
    CREATE TABLE "responses" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "caption" TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL,
      "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "isPublished" BOOLEAN NOT NULL DEFAULT false,
      "publishedAt" DATETIME,
      "totalVotes" INTEGER NOT NULL DEFAULT 0,
      "totalPoints" INTEGER NOT NULL DEFAULT 0,
      "finalRank" INTEGER,
      "userId" TEXT NOT NULL,
      "promptId" TEXT NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("promptId") REFERENCES "prompts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  // Create unique index for responses (one response per user per prompt)
  await db.$executeRaw`
    CREATE UNIQUE INDEX "responses_userId_promptId_key" ON "responses"("userId", "promptId");
  `;

  // Create votes table (matches @@map("votes"))
  await db.$executeRaw`
    CREATE TABLE "votes" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "points" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "voterId" TEXT NOT NULL,
      "responseId" TEXT NOT NULL,
      FOREIGN KEY ("voterId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("responseId") REFERENCES "responses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  // Create Account table for NextAuth (no mapping, uses default table name)
  await db.$executeRaw`
    CREATE TABLE "Account" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT,
      FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  // Create unique index for Account
  await db.$executeRaw`
    CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
  `;

  // Create Session table for NextAuth (no mapping, uses default table name)
  await db.$executeRaw`
    CREATE TABLE "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionToken" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL,
      "expires" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;
}

/**
 * Clean up test database and disconnect
 */
export async function cleanupTestDb(): Promise<void> {
  if (prisma) {
    try {
      await prisma.$disconnect();
      
      // Clean up the specific test database file
      if (testDbPath && fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
        console.log('✅ Test database file deleted');
      }
    } catch (error) {
      console.error('❌ Error during test database cleanup:', error);
    }
  }
  
  // Also clean up any orphaned test databases
  cleanupOrphanedTestDbs();
}

/**
 * Clean up any orphaned test database files
 */
export function cleanupOrphanedTestDbs(): void {
  try {
    const prismaDir = path.join(process.cwd(), 'prisma');
    if (fs.existsSync(prismaDir)) {
      const files = fs.readdirSync(prismaDir);
      const testDbFiles = files.filter(file => file.startsWith('test-') && file.endsWith('.db'));
      
      for (const file of testDbFiles) {
        const filePath = path.join(prismaDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned up orphaned test database: ${file}`);
        } catch (error) {
          // File might be in use, skip it
        }
      }
    }
  } catch (error) {
    // Silent cleanup failure is okay
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