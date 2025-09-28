/**
 * Environment variable validation for production readiness
 * Ensures all required environment variables are properly configured
 */

interface EnvironmentConfig {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  description: string;
  productionOnly?: boolean;
}

const ENVIRONMENT_CONFIGS: EnvironmentConfig[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
    description: 'PostgreSQL database connection string',
  },

  // NextAuth.js
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    validator: (value) => value.length >= 32,
    description: 'NextAuth.js secret (minimum 32 characters)',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    description: 'NextAuth.js URL for the application',
  },

  // File Storage
  {
    name: 'BLOB_READ_WRITE_TOKEN',
    required: true,
    validator: (value) => value.startsWith('vercel_blob_rw_'),
    description: 'Vercel Blob storage token',
    productionOnly: true,
  },

  // CRON Security
  {
    name: 'CRON_SECRET',
    required: true,
    validator: (value) => value.length >= 32,
    description: 'CRON job authentication secret (minimum 32 characters)',
  },

  // Push Notifications (Optional in development)
  {
    name: 'VAPID_PUBLIC_KEY',
    required: false,
    validator: (value) => value.length > 80, // VAPID keys are base64 encoded and quite long
    description: 'VAPID public key for web push notifications',
    productionOnly: true,
  },
  {
    name: 'VAPID_PRIVATE_KEY',
    required: false,
    validator: (value) => value.length > 40,
    description: 'VAPID private key for web push notifications',
    productionOnly: true,
  },
  {
    name: 'VAPID_SUBJECT',
    required: false,
    validator: (value) => value.includes('@') || value.startsWith('mailto:'),
    description: 'VAPID subject (email address)',
    productionOnly: true,
  },
];

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const config of ENVIRONMENT_CONFIGS) {
    const value = process.env[config.name];

    // Check if required environment variable is missing
    if (config.required && !value) {
      if (config.productionOnly && !isProduction) {
        warnings.push(`${config.name} is not set (required in production): ${config.description}`);
      } else {
        errors.push(`Missing required environment variable: ${config.name} - ${config.description}`);
      }
      continue;
    }

    // Skip validation if not required or not set
    if (!value) continue;

    // Apply custom validation if provided
    if (config.validator && !config.validator(value)) {
      errors.push(`Invalid ${config.name}: ${config.description}`);
    }
  }

  // Additional production-specific checks
  if (isProduction) {
    // Check for secure database connection
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.includes('sslmode=require') && !dbUrl.includes('ssl=true')) {
      warnings.push('DATABASE_URL should use SSL in production (add ?sslmode=require)');
    }

    // Check for HTTPS NEXTAUTH_URL
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (nextAuthUrl && !nextAuthUrl.startsWith('https://')) {
      errors.push('NEXTAUTH_URL must use HTTPS in production');
    }

    // Check for development defaults
    if (process.env.NEXTAUTH_SECRET === 'your-random-secret-key-here-replace-in-production') {
      errors.push('NEXTAUTH_SECRET is using the default example value - must be changed in production');
    }

    if (process.env.CRON_SECRET === 'your-very-long-random-secret-key-for-cron-jobs-at-least-32-characters') {
      errors.push('CRON_SECRET is using the default example value - must be changed in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and throw error if invalid
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  if (result.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (!result.isValid) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Environment validation failed. Please check your environment variables.');
  }

  console.log('✅ Environment validation passed');
}

/**
 * Log environment status for debugging
 */
export function logEnvironmentStatus(): void {
  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`🔐 Auth: ${process.env.NEXTAUTH_SECRET ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📁 Storage: ${process.env.BLOB_READ_WRITE_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📬 Push: ${process.env.VAPID_PUBLIC_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`⏰ CRON: ${process.env.CRON_SECRET ? '✅ Configured' : '❌ Not configured'}`);

  if (isProduction) {
    console.log('🏭 Production mode - all validations enforced');
  } else {
    console.log('🔨 Development mode - some validations relaxed');
  }
}

const envValidationModule = {
  validateEnvironment,
  validateEnvironmentOrThrow,
  logEnvironmentStatus,
};

export default envValidationModule;