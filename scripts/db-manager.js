#!/usr/bin/env node

/**
 * Prisma-Compliant Database Management CLI
 * Follows official Prisma best practices for development and production
 */

const { execSync } = require('child_process');
const fs = require('fs');

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
  const validEnvs = ['development', 'production'];
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
      description: 'Local SQLite database'
    },
    production: {
      envFile: '.env.production', 
      schema: 'prisma/schema.production.prisma',
      description: 'Production PostgreSQL database'
    }
  };
  
  return configs[env];
}

// Execute command with specific environment
function execWithEnv(command, env) {
  const config = getEnvConfig(env);
  
  // Verify env file exists
  if (!fs.existsSync(config.envFile)) {
    if (env === 'production') {
      error(`Production environment file not found. Run: vercel env pull ${config.envFile}`);
    } else {
      error(`Environment file ${config.envFile} not found`);
    }
  }

  // Add schema parameter if command supports it
  const finalCommand = command.includes('--schema=') ? command : `${command} --schema=${config.schema}`;
  
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

// Commands following Prisma best practices
const commands = {
  // Development-only: Reset and seed database
  async reset(env, options = {}) {
    validateEnvironment(env);
    
    if (env === 'production') {
      error('Database reset is not allowed in production for safety');
    }
    
    const config = getEnvConfig(env);
    warn(`This will COMPLETELY RESET the ${config.description}`);
    
    if (!options.force) {
      warn('Reset requires --force flag for safety');
      info('If you\'re sure, run: npm run db reset development --force');
      return;
    }
    
    info(`Resetting ${env} database...`);
    
    try {
      // Use Prisma's official reset command
      execWithEnv('prisma migrate reset --force', env);
      success(`${config.description} reset successfully`);
    } catch (resetError) {
      error(`Failed to reset ${env} database: ${resetError.message}`);
    }
  },

  // Seed database with test data
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
    
    try {
      execWithEnv('tsx prisma/seed.ts', env);
      success(`${config.description} seeded successfully`);
      
      if (env === 'production') {
        warn('All users have been logged out and may need to re-register');
      }
    } catch (seedError) {
      error(`Failed to seed ${env} database: ${seedError.message}`);
    }
  },

  // PRODUCTION: Apply pending migrations (Prisma recommended approach)
  async migrate(env, options = {}) {
    validateEnvironment(env);
    const config = getEnvConfig(env);
    
    if (env === 'development') {
      info('For development, use: npx prisma migrate dev');
      return;
    }
    
    if (!options.force) {
      warn('Production migration requires --force flag for safety');
      info('If you\'re sure, run: npm run db migrate production --force');
      return;
    }
    
    info(`🚀 Applying pending migrations to ${config.description}...`);
    
    try {
      // Use Prisma's official production migration command
      execWithEnv('prisma migrate deploy', env);
      success(`Production migrations applied successfully`);
      
      // Generate client after migration
      execWithEnv('prisma generate', env);
      success(`Prisma client regenerated`);
      
    } catch (migrateError) {
      error(`Migration failed: ${migrateError.message}`);
      warn('If you see "Migration failed to apply cleanly", check for:');
      warn('  • Schema conflicts with existing data');
      warn('  • Missing foreign key references');
      warn('  • Database connection issues');
    }
  },

  // View migration status
  async status(env) {
    validateEnvironment(env);
    const config = getEnvConfig(env);
    
    info(`📋 Migration status for ${config.description}...`);
    
    try {
      execWithEnv('prisma migrate status', env);
    } catch (statusError) {
      warn('Could not get migration status. Database may need to be initialized.');
    }
  },

  // Open Prisma Studio
  async studio(env) {
    validateEnvironment(env);
    const config = getEnvConfig(env);
    
    if (env === 'production') {
      warn('⚠️  Opening PRODUCTION database in Prisma Studio');
      warn('Be extremely careful with any data modifications!');
    }
    
    info(`🔍 Opening ${config.description} in Prisma Studio...`);
    
    try {
      execWithEnv('prisma studio', env);
    } catch (studioError) {
      error(`Failed to open studio: ${studioError.message}`);
    }
  },

  // Generate Prisma client
  async generate(env) {
    validateEnvironment(env);
    const config = getEnvConfig(env);
    
    info(`🔧 Generating Prisma client for ${config.description}...`);
    
    try {
      execWithEnv('prisma generate', env);
      success(`Prisma client generated successfully`);
    } catch (generateError) {
      error(`Failed to generate client: ${generateError.message}`);
    }
  }
};

// Help command
function showHelp() {
  console.log(`
🗄️  Prisma-Compliant Database Manager

USAGE:
  npm run db <command> <environment> [options]

ENVIRONMENTS:
  development    Local SQLite database
  production     Remote PostgreSQL database

COMMANDS:
  
  Development Commands:
  reset development --force      Reset local database (DESTRUCTIVE)
  seed development              Add test data to local database
  
  Production Commands:
  migrate production --force    Apply pending migrations (RECOMMENDED)
  status production            View migration status
  seed production --force      Add test data (DESTRUCTIVE)
  
  Utility Commands:
  studio <env>                 Open database in Prisma Studio
  generate <env>               Generate Prisma client
  help                        Show this help

EXAMPLES:
  npm run db reset development --force
  npm run db migrate production --force
  npm run db status production
  npm run db studio development

PRISMA BEST PRACTICES:
  ✅ Use 'migrate production --force' for production deployments
  ✅ Never use reset commands on production
  ✅ Always review migrations before applying to production
  ✅ Use environment-specific commands

For more info: https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production
`);
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    return;
  }
  
  const [command, env, ...flags] = args;
  const options = {
    force: flags.includes('--force'),
    acceptDataLoss: flags.includes('--accept-data-loss')
  };
  
  if (!commands[command]) {
    error(`Unknown command: ${command}. Run 'npm run db help' for available commands.`);
  }
  
  try {
    await commands[command](env, options);
  } catch (err) {
    error(`Command failed: ${err.message}`);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});