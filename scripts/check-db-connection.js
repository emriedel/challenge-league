#!/usr/bin/env node

/**
 * Database Connection Checker
 * Helps verify which database environment we're connecting to
 */

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔍 Database Connection Check');
console.log('============================');
console.log(`DATABASE_URL: ${DATABASE_URL}`);

if (!DATABASE_URL) {
  console.log('❌ No DATABASE_URL found');
  process.exit(1);
}

// Parse the database URL to identify the environment
try {
  const url = new URL(DATABASE_URL);

  console.log(`Host: ${url.hostname}`);
  console.log(`Port: ${url.port}`);
  console.log(`Database: ${url.pathname.slice(1)}`); // Remove leading /
  console.log(`Username: ${url.username}`);

  // Determine environment based on connection details
  if (url.port === '5433' && url.pathname.includes('test')) {
    console.log('✅ ISOLATED TEST DATABASE detected');
    console.log('   Safe to run tests - will not affect development data');
  } else if (url.port === '5432' || !url.port) {
    console.log('⚠️  DEVELOPMENT DATABASE detected');
    console.log('   WARNING: Running tests may affect your development data!');
  } else {
    console.log('❓ Unknown database configuration');
  }

} catch (error) {
  console.log('❌ Could not parse DATABASE_URL:', error.message);
  process.exit(1);
}

console.log('============================');