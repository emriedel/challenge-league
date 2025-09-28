/**
 * Production-ready error monitoring and logging system
 * Provides structured logging and error tracking for Challenge League
 */

export interface LogContext {
  userId?: string;
  leagueId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration: number;
    operation: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    performance?: { duration: number; operation: string }
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined, // Include stack trace only in development
      };
    }

    if (performance) {
      entry.performance = performance;
    }

    return entry;
  }

  /**
   * Output log entry to appropriate destination
   */
  private output(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    // In development, use console with colors
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
        fatal: '\x1b[35m', // magenta
      };
      const reset = '\x1b[0m';
      const color = colors[entry.level] || '';

      console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`);
      if (entry.context) {
        console.log('  Context:', entry.context);
      }
      if (entry.error) {
        console.error('  Error:', entry.error);
      }
      if (entry.performance) {
        console.log('  Performance:', entry.performance);
      }
    } else {
      // In production, output structured JSON for log aggregation
      console.log(logString);
    }

    // TODO: In the future, integrate with external monitoring services
    // if (this.isProduction) {
    //   // Send to Sentry, DataDog, LogRocket, etc.
    //   this.sendToExternalService(entry);
    // }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.output(this.createLogEntry('debug', message, context));
    }
  }

  /**
   * Log general information
   */
  info(message: string, context?: LogContext): void {
    this.output(this.createLogEntry('info', message, context));
  }

  /**
   * Log warning conditions
   */
  warn(message: string, context?: LogContext): void {
    this.output(this.createLogEntry('warn', message, context));
  }

  /**
   * Log error conditions
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.output(this.createLogEntry('error', message, context, error));
  }

  /**
   * Log fatal errors that may require immediate attention
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    this.output(this.createLogEntry('fatal', message, context, error));
  }

  /**
   * Log API request/response performance
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    this.output(this.createLogEntry('info', `Performance: ${operation}`, context, undefined, { operation, duration }));
  }

  /**
   * Log user activity for security monitoring
   */
  security(message: string, context: LogContext): void {
    this.output(this.createLogEntry('warn', `Security: ${message}`, {
      ...context,
      category: 'security',
    }));
  }

  /**
   * Time execution of async operations
   */
  async time<T>(operation: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.performance(operation, duration, context);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${operation} failed after ${duration}ms`, error as Error, context);
      throw error;
    }
  }
}

// Singleton logger instance
export const logger = new Logger();

/**
 * Performance monitoring wrapper for API routes
 */
export function withPerformanceMonitoring<T extends any[], R>(
  operationName: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return logger.time(operationName, () => fn(...args), {
      operation: operationName,
    });
  };
}

/**
 * Error boundary helper for catching and logging unhandled errors
 */
export function captureError(error: Error, context?: LogContext): void {
  logger.error('Unhandled error', error, context);
}

/**
 * Rate limit monitoring - log when rate limits are hit
 */
export function logRateLimit(ip: string, endpoint: string, limit: number): void {
  logger.security('Rate limit exceeded', {
    ip,
    endpoint,
    limit,
    category: 'rate_limit',
  });
}

/**
 * Security event logging
 */
export function logSecurityEvent(event: string, context: LogContext): void {
  logger.security(event, context);
}

/**
 * Database operation monitoring
 */
export function logDatabaseOperation(operation: string, duration: number, context?: LogContext): void {
  logger.performance(`Database: ${operation}`, duration, context);
}

/**
 * Auth event logging
 */
export function logAuthEvent(event: 'login' | 'logout' | 'register' | 'failed_login', context: LogContext): void {
  logger.info(`Auth: ${event}`, {
    ...context,
    category: 'auth',
  });
}

export default {
  logger,
  withPerformanceMonitoring,
  captureError,
  logRateLimit,
  logSecurityEvent,
  logDatabaseOperation,
  logAuthEvent,
};