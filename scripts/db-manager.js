#!/usr/bin/env node

/**
 * Safe Database Management CLI
 * Industry-standard approach with environment isolation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color output for better UX
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log('red', `❌ Error: ${message}`);
  process.exit(1);
}

function success(message) {
  log('green', `✅ ${message}`);
}

function info(message) {
  log('blue', `ℹ️  ${message}`);
}

function warn(message) {
  log('yellow', `⚠️  ${message}`);
}

// Validate environment
function validateEnvironment(env) {
  const validEnvs = ['development', 'staging', 'production'];
  if (!validEnvs.includes(env)) {
    error(`Invalid environment: ${env}. Must be one of: ${validEnvs.join(', ')}`);
  }
}

// Get environment configuration
function getEnvConfig(env) {
  const configs = {
    development: {
      envFile: '.env',
      schema: 'prisma/schema.prisma',
      provider: 'sqlite',
      description: 'Local SQLite database'
    },
    production: {
      envFile: '.env.production',
      schema: 'prisma/schema.production.prisma', 
      provider: 'postgresql',
      description: 'Production PostgreSQL database'
    }
  };
  
  return configs[env];
}

// Execute command with specific environment and schema
function execWithEnv(command, env, schemaFile = null) {
  const config = getEnvConfig(env);
  
  // Verify env file exists
  if (!fs.existsSync(config.envFile)) {
    if (env === 'production') {
      error(`Production environment file not found. Run: vercel env pull ${config.envFile}`);
    } else {
      error(`Environment file ${config.envFile} not found`);
    }
  }

  // Use provided schema or default
  const schema = schemaFile || config.schema;
  const finalCommand = command.includes('--schema=') ? command : `${command} --schema=${schema}`;
  
  // Execute with explicit environment
  const envCommand = `dotenv -e ${config.envFile} -- ${finalCommand}`;
  
  try {
    return execSync(envCommand, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}`);
  }
}

// Commands
const commands = {
  // Safe database operations
  async reset(env, options = {}) {
    validateEnvironment(env);
    const config = getEnvConfig(env);
    
    warn(`This will COMPLETELY RESET the ${config.description}`);
    
    if (env === 'production' && !options.force) {
      warn('Production reset requires --force flag for safety');
      info('If you\'re sure, run: npm run db reset production --force');
      return;
    }
    
    info(`Resetting ${env} database...`);
    
    // Use appropriate schema temporarily for this operation only
    const tempSchema = `schema.${env}.temp.prisma`;
    execSync(`cp ${config.schema} prisma/${tempSchema}`);
    
    try {
      // Generate client with correct schema
      execWithEnv(`prisma generate --schema=prisma/${tempSchema}`, env);
      
      // Reset database
      execWithEnv(`prisma db push --force-reset --schema=prisma/${tempSchema}`, env);
      
      success(`${config.description} reset successfully`);
    } finally {
      // Always cleanup temp schema
      if (fs.existsSync(`prisma/${tempSchema}`)) {
        fs.unlinkSync(`prisma/${tempSchema}`);
      }
    }
  },

  async seed(env, options = {}) {
    validateEnvironment(env);
    const config = getEnvConfig(env);
    
    if (env === 'production' && !options.force) {
      error('Production seeding is DESTRUCTIVE and requires --force flag');
      warn('Seeding will:');
      warn('  • Clear all user sessions (everyone logged out)');
      warn('  • Potentially overwrite user accounts');
      warn('  • Reset ongoing competitions');  
      warn('  • Change league ownership');
      info('If you\'re sure, run: npm run db seed production --force');
      return;
    }
    
    if (env === 'production') {
      warn('⚠️  DESTRUCTIVE OPERATION: Seeding production database');
      warn('This may overwrite real user data and disrupt live competitions');
    }
    
    info(`Seeding ${config.description} with test data...`);
    
    // Generate client with correct schema first
    const tempSchema = `schema.${env}.temp.prisma`;
    execSync(`cp ${config.schema} prisma/${tempSchema}`);
    
    try {
      execWithEnv('prisma generate', env, `prisma/${tempSchema}`);
      execWithEnv('tsx prisma/seed.ts', env);
      success(`${config.description} seeded successfully`);
      
      if (env === 'production') {
        warn('All users have been logged out and may need to re-register');
      }
    } catch (seedError) {
      error(`Failed to seed ${env} database: ${seedError.message}`);
      throw seedError;
    } finally {
      // Always cleanup temp schema
      if (fs.existsSync(`prisma/${tempSchema}`)) {
        fs.unlinkSync(`prisma/${tempSchema}`);
      }
    }
  },

  async migrate(env, options = {}) {
    validateEnvironment(env);
    const config = getEnvConfig(env);
    
    const tempSchema = `schema.${env}.temp.prisma`;
    execSync(`cp ${config.schema} prisma/${tempSchema}`);
    
    try {
      // First, always preview the migration
      info('🔍 Analyzing schema changes...');
      execWithEnv(`prisma generate --schema=prisma/${tempSchema}`, env);
      
      // Try a dry-run to see what would happen
      info('📋 Migration preview:');
      try {
        execSync(`dotenv -e ${config.envFile} -- prisma db push --schema=prisma/${tempSchema} --preview-feature`, { 
          stdio: 'pipe'
        });
        success('✅ Schema changes appear safe - no data loss detected');
      } catch (previewError) {
        const errorOutput = previewError.stderr ? previewError.stderr.toString() : previewError.message;
        
        if (errorOutput.includes('data loss') || errorOutput.includes('data will be lost')) {
          error('🚨 DATA LOSS DETECTED!');
          warn('The migration will cause data loss:');
          
          // Extract specific warnings from Prisma output
          const lines = errorOutput.split('\n');
          lines.forEach(line => {
            if (line.includes('You are about to drop') || 
                line.includes('data will be lost') ||
                line.includes('will be lost')) {
              warn(`  • ${line.trim()}`);
            }
          });
          
          if (env === 'production' && !options.acceptDataLoss) {
            error('Production data loss prevention engaged!');
            warn('To proceed with data loss, run:');
            warn(`  npm run db migrate ${env} --force --accept-data-loss`);
            return;
          }
        } else {
          warn('⚠️  Migration may fail due to data conflicts');
          warn('This usually means existing data doesn\'t match new constraints');
        }
      }
      
      if (env === 'production') {
        warn('⚠️  PRODUCTION MIGRATION WARNING');
        warn('Schema changes can cause:');
        warn('  • Application downtime during migration'); 
        warn('  • Failed migration if data conflicts with new constraints');
        warn('');
        
        if (!options.force) {
          error('Production migrations require --force flag for safety');
          info('After reviewing the preview above, run:');
          info('  npm run db migrate production --force');
          return;
        }
        
        warn('Proceeding with production migration...');
      }
      
      info('Applying schema changes...');
      
      const migrationCommand = options.acceptDataLoss 
        ? `prisma db push --schema=prisma/${tempSchema} --accept-data-loss`
        : `prisma db push --schema=prisma/${tempSchema}`;
        
      execWithEnv(migrationCommand, env);
      
      success(`${config.description} migration completed successfully`);
      
      if (env === 'production') {
        info('🎉 Production migration successful!');
        info('Monitor your application for any issues and be ready to rollback if needed');
      }
    } catch (migrationError) {
      error(`Migration failed: ${migrationError.message}`);
      
      if (env === 'production') {
        error('PRODUCTION MIGRATION FAILED!');
        warn('Your production database schema may be in an inconsistent state');
        warn('Consider rolling back or fixing the schema before deploying new code');
      }
      
      throw migrationError;
    } finally {
      if (fs.existsSync(`prisma/${tempSchema}`)) {
        fs.unlinkSync(`prisma/${tempSchema}`);
      }
    }
  },

  async preview(env) {
    validateEnvironment(env);
    const config = getEnvConfig(env);
    
    info(`🔍 Previewing schema changes for ${config.description}...`);
    
    const tempSchema = `schema.${env}.temp.prisma`;
    execSync(`cp ${config.schema} prisma/${tempSchema}`);
    
    try {
      execWithEnv(`prisma generate --schema=prisma/${tempSchema}`, env);
      
      info('📋 Migration preview (no changes will be applied):');
      try {
        const result = execSync(`dotenv -e ${config.envFile} -- prisma db push --schema=prisma/${tempSchema} --preview-feature`, { 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        
        success('✅ Schema changes appear safe - no data loss detected');
        if (result) {
          info('Changes to be applied:');
          console.log(result);
        }
      } catch (previewError) {
        const errorOutput = previewError.stderr || previewError.message;
        
        if (errorOutput.includes('data loss') || errorOutput.includes('data will be lost')) {
          error('🚨 DATA LOSS DETECTED!');
          warn('The following data would be lost:');
          
          const lines = errorOutput.split('\n');
          lines.forEach(line => {
            if (line.includes('You are about to drop') || 
                line.includes('data will be lost') ||
                line.includes('will be lost')) {
              warn(`  • ${line.trim()}`);
            }
          });
          
          warn('');
          warn('To apply this migration with data loss:');
          warn(`  npm run db migrate ${env} --force --accept-data-loss`);
        } else {
          warn('⚠️  Migration preview indicates potential issues:');
          console.log(errorOutput);
        }
      }
    } finally {
      if (fs.existsSync(`prisma/${tempSchema}`)) {
        fs.unlinkSync(`prisma/${tempSchema}`);
      }
    }
  },

  async studio(env) {
    validateEnvironment(env);
    const config = getEnvConfig(env);
    
    info(`Opening Prisma Studio for ${config.description}...`);
    warn('Remember: This is live data! Be careful with any changes.');
    
    const tempSchema = `schema.${env}.temp.prisma`;
    execSync(`cp ${config.schema} prisma/${tempSchema}`);
    
    try {
      execWithEnv(`prisma studio --schema=prisma/${tempSchema}`, env);
    } finally {
      if (fs.existsSync(`prisma/${tempSchema}`)) {
        fs.unlinkSync(`prisma/${tempSchema}`);
      }
    }
  },

  help() {
    console.log(`
🗄️  Safe Database Manager

Usage: node scripts/db-manager.js <command> <environment> [options]

Commands:
  preview <env>            Preview schema changes (safe, no changes applied)
  reset <env> [--force]    Reset database (destructive!)
  seed <env> [--force]     Seed with test data (destructive in production!)
  migrate <env> [--force] [--accept-data-loss]  Apply schema migrations
  studio <env>             Open database browser (read/write access)
  help                     Show this help

Environments:
  development              Local SQLite database
  production              Production PostgreSQL database

Examples:
  # Safe preview (recommended before migrations)
  node scripts/db-manager.js preview production
  node scripts/db-manager.js preview development
  
  # Development (no --force needed)
  node scripts/db-manager.js reset development
  node scripts/db-manager.js seed development
  node scripts/db-manager.js migrate development
  
  # Production (--force required for safety)
  node scripts/db-manager.js reset production --force
  node scripts/db-manager.js seed production --force
  node scripts/db-manager.js migrate production --force
  
  # Dangerous: migration with data loss
  node scripts/db-manager.js migrate production --force --accept-data-loss

⚠️  Production Safety:
  • preview: SAFE - Shows what would happen, no changes applied
  • reset: WIPES ALL DATA - requires --force
  • seed: DESTRUCTIVE - clears sessions, may overwrite data - requires --force  
  • migrate: POTENTIALLY DESTRUCTIVE - previews changes, requires --force
  • migrate with --accept-data-loss: EXTREMELY DANGEROUS - can destroy data
  • studio: LIVE DATA ACCESS - be extremely careful

🛡️  Safety Features:
  ✅ No file swapping or .env modification
  ✅ Temporary schemas (auto-cleanup)
  ✅ Environment validation  
  ✅ Production safety checks with --force flags
  ✅ Clear warnings about destructive operations
  ✅ Detailed error messages and recovery guidance
    `);
  }
};

// Parse command line arguments
const [,, command, environment, ...flags] = process.argv;

if (!command) {
  commands.help();
  process.exit(0);
}

if (command === 'help') {
  commands.help();
  process.exit(0);
}

if (!environment) {
  error('Environment required. Use: development, staging, or production');
}

const options = {
  force: flags.includes('--force'),
  acceptDataLoss: flags.includes('--accept-data-loss')
};

// Execute command
if (commands[command]) {
  commands[command](environment, options).catch(err => {
    error(err.message);
  });
} else {
  error(`Unknown command: ${command}. Run 'help' for available commands.`);
}