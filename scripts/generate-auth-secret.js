#!/usr/bin/env node

const crypto = require('crypto');

// Generate a cryptographically secure random string
const secret = crypto.randomBytes(32).toString('base64');

console.log('Generated NEXTAUTH_SECRET:');
console.log(secret);
console.log('');
console.log('Add this to your .env files:');
console.log(`NEXTAUTH_SECRET="${secret}"`);
console.log('');
console.log('⚠️  Keep this secret secure and never commit it to version control!');
console.log('📝 Make sure to use the same secret across all your environments');
console.log('   (development, staging, production) to prevent logout issues.');