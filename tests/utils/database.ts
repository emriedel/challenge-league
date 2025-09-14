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
    // Create a unique test database name for this test run
    testDbName = `test_db_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // SAFETY CHECK: Ensure we never accidentally use the development database
    if (testDbName.includes('dev') || testDbName.includes('development') || testDbName.includes('challenge_league')) {
      throw new Error('❌ SAFETY ERROR: Test database name would interfere with development database!');
    }
    
    // Set the test database URL (PostgreSQL)
    const testDatabaseUrl = `postgresql://challenge_league:dev_password@localhost:5432/${testDbName}`;
    
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
 * Reset the test database with fresh schema (PostgreSQL)
 */
export async function resetTestDb(): Promise<void> {
  try {
    // First create the test database
    await createTestDatabase();
    
    // Get test database instance
    const testDb = getTestDb();
    
    // Use Prisma db push to create fresh schema
    console.log('🔧 Applying database schema to test database...');
    
    // Set the test database URL in environment for Prisma commands
    process.env.DATABASE_URL = `postgresql://challenge_league:dev_password@localhost:5432/${testDbName}`;
    
    try {
      // Use Prisma's db push to create the schema from the schema.prisma file
      const pushResult = execSync(`npx prisma db push --force-reset`, {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: `postgresql://challenge_league:dev_password@localhost:5432/${testDbName}`
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
            DATABASE_URL: `postgresql://challenge_league:dev_password@localhost:5432/${testDbName}`
          }
        });
      } catch (migrateError) {
        console.log('⚠️ Migration failed too, proceeding without schema setup...');
      }
    }
    
    // Test connection and verify schema
    await testDb.$executeRaw`SELECT 1`;
    
    // Verify tables exist
    try {
      const tableCount = await testDb.$queryRaw<Array<{count: bigint}>>`
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
 * Create the test database using PostgreSQL
 */
async function createTestDatabase(): Promise<void> {
  try {
    // Connect to postgres default database to create test database
    const adminDb = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://challenge_league:dev_password@localhost:5432/postgres',
        },
      },
    });
    
    // Drop test database if it exists and create new one
    await adminDb.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${testDbName}"`);
    await adminDb.$executeRawUnsafe(`CREATE DATABASE "${testDbName}"`);
    
    await adminDb.$disconnect();
  } catch (error) {
    // If database creation fails, try to continue - it might already exist
    console.log('⚠️ Database creation warning (might already exist):', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Clean up test database and disconnect (PostgreSQL)
 */
export async function cleanupTestDb(): Promise<void> {
  if (prisma) {
    try {
      await prisma.$disconnect();
      
      // Drop the test database
      if (testDbName) {
        try {
          const adminDb = new PrismaClient({
            datasources: {
              db: {
                url: 'postgresql://challenge_league:dev_password@localhost:5432/postgres',
              },
            },
          });
          
          await adminDb.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${testDbName}"`);
          await adminDb.$disconnect();
          console.log('✅ Test database dropped');
        } catch (error) {
          console.log('⚠️ Could not drop test database (may not exist):', error instanceof Error ? error.message : String(error));
        }
      }
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