#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Challenge League Test Setup Verification\n');

// Check if required files exist
const requiredFiles = [
  'playwright.config.ts',
  'vitest.config.ts',
  'tests/utils/database.ts',
  'tests/utils/test-helpers.ts',
  'tests/integration/complete-user-journey.spec.ts',
  'tests/integration/setup-verification.spec.ts',
  'tests/unit/example.test.ts',
  'TESTING.md'
];

console.log('📂 Checking required files...');
let missingFiles = [];
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.log('\n❌ Missing files detected. Test setup incomplete.');
  process.exit(1);
}

// Check if test commands are available
console.log('\n🔧 Verifying npm scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = [
  'test',
  'test:unit', 
  'test:integration',
  'test:integration:ui',
  'test:setup',
  'test:all'
];

let missingScripts = [];
for (const script of requiredScripts) {
  if (packageJson.scripts[script]) {
    console.log(`✅ npm run ${script}`);
  } else {
    console.log(`❌ npm run ${script}`);
    missingScripts.push(script);
  }
}

if (missingScripts.length > 0) {
  console.log('\n❌ Missing npm scripts detected.');
  process.exit(1);
}

// Test unit test runner
console.log('\n🏃 Running unit tests...');
try {
  execSync('npm run test:unit', { stdio: 'inherit' });
  console.log('✅ Unit tests completed successfully');
} catch (error) {
  console.log('❌ Unit tests failed');
  process.exit(1);
}

console.log('\n🎉 Test setup verification completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure your development server is running: npm run dev');
console.log('2. Run integration tests: npm run test:integration');
console.log('3. For interactive testing: npm run test:integration:ui');
console.log('4. See TESTING.md for detailed documentation');