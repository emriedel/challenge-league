#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_PORT = 3005; // Use a higher port to avoid conflicts
const TEST_DB_URL = 'postgresql://challenge_league:test_password@localhost:5433/challenge_league_test';

async function runIntegrationTests() {
  console.log('🚀 Starting isolated integration test environment...');

  let nextServer = null;
  let testDbContainer = null;

  try {
    // Step 1: Start test database container
    console.log('📦 Starting test database container...');
    execSync('docker compose -f docker-compose.test.yml up -d', { stdio: 'inherit' });

    // Wait for database to be ready
    console.log('⏳ Waiting for test database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Apply database schema
    console.log('🔧 Applying database schema...');
    execSync('npx prisma db push --force-reset', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL
      }
    });

    // Step 3: Start Next.js server with test configuration
    console.log('🌐 Starting Next.js test server...');
    nextServer = spawn('npm', ['run', 'dev'], {
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
        PORT: TEST_PORT,
        NEXTAUTH_URL: `http://localhost:${TEST_PORT}`,
        NEXTAUTH_SECRET: 'test-secret-for-testing-only',
        NODE_ENV: 'test',
        NEXT_TELEMETRY_DISABLED: '1'
      },
      stdio: ['inherit', 'pipe', 'pipe']
    });

    // Log Next.js server output for debugging
    nextServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('started') || output.includes('Error')) {
        console.log('🌐 Next.js:', output.trim());
      }
    });

    nextServer.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Error') || output.includes('Failed')) {
        console.log('🌐 Next.js Error:', output.trim());
      }
    });

    // Wait for server to start with health check
    console.log('⏳ Waiting for Next.js server to start...');

    let serverReady = false;
    for (let i = 0; i < 30; i++) { // Wait up to 30 seconds
      try {
        const response = await fetch(`http://localhost:${TEST_PORT}/api/health`);
        if (response.status === 200 || response.status === 404) {
          console.log('✅ Next.js test server is ready');
          serverReady = true;
          break;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!serverReady) {
      throw new Error('❌ Next.js test server failed to start');
    }

    // Step 4: Run the integration tests
    console.log('🧪 Running integration tests...');
    execSync('npx playwright test tests/integration/fixed-workflow.spec.ts --timeout=180000', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
        BASE_URL: `http://localhost:${TEST_PORT}`,
        NODE_ENV: 'test'  // This disables the webServer in playwright config
      }
    });

    console.log('✅ Integration tests completed successfully!');

  } catch (error) {
    console.error('❌ Integration tests failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up test environment...');

    if (nextServer) {
      nextServer.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      execSync('docker compose -f docker-compose.test.yml down', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Could not stop test database container');
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  try {
    execSync('docker compose -f docker-compose.test.yml down', { stdio: 'inherit' });
  } catch (error) {
    // Ignore cleanup errors
  }
  process.exit(0);
});

runIntegrationTests();