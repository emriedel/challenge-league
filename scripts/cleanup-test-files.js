#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up test files...');

// Clean up test databases
const prismaDir = path.join(__dirname, '..', 'prisma');
if (fs.existsSync(prismaDir)) {
  const files = fs.readdirSync(prismaDir);
  const testDbFiles = files.filter(file => file.startsWith('test-') && file.endsWith('.db'));
  
  if (testDbFiles.length > 0) {
    console.log(`Found ${testDbFiles.length} test database files to clean up...`);
    
    let cleaned = 0;
    for (const file of testDbFiles) {
      const filePath = path.join(prismaDir, file);
      try {
        fs.unlinkSync(filePath);
        cleaned++;
        console.log(`✅ Deleted: ${file}`);
      } catch (error) {
        console.log(`⚠️ Could not delete ${file} (might be in use)`);
      }
    }
    
    console.log(`🎉 Cleaned up ${cleaned} test database files`);
  } else {
    console.log('✅ No test database files found to clean up');
  }
}

// Clean up temporary test files
const testsDir = path.join(__dirname, '..', 'tests', 'temp');
if (fs.existsSync(testsDir)) {
  try {
    fs.rmSync(testsDir, { recursive: true, force: true });
    console.log('✅ Cleaned up tests/temp directory');
  } catch (error) {
    console.log('⚠️ Could not clean up tests/temp directory');
  }
}

// Clean up playwright test results
const testResultsDirs = [
  path.join(__dirname, '..', 'test-results'),
  path.join(__dirname, '..', 'playwright-report')
];

for (const dir of testResultsDirs) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Cleaned up ${path.basename(dir)} directory`);
    } catch (error) {
      console.log(`⚠️ Could not clean up ${path.basename(dir)} directory`);
    }
  }
}

console.log('🎉 Cleanup complete!');