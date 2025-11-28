/**
 * Structured Logger with Pino
 * Outputs JSON in production, human-readable in development
 * @package @repo/observability
 */

import pino, { type Logger as PinoLogger } from 'pino';

import { getCorrelationContext } from './middleware/correlation.js';
import type { LogContext, SerializedError } from './types.js';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || 'info';

/**
 * Paths to redact from log output for security
 * These fields will be replaced with [REDACTED] in logs
 */
const REDACT_PATHS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

/**
 * Serialize an error object with stack trace preservation
 * @param err - Error object to serialize
 * @returns Serialized error with name, message, stack, and additional context
 */
export const serializeError = (err: Error): SerializedError => {
  const serialized: SerializedError = {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };

  // Include any additional properties from the error (e.g., code, context)
  const errorWithContext = err as Error & { code?: string; context?: unknown };
  if (errorWithContext.code) {
    serialized.code = errorWithContext.code;
  }
  if (errorWithContext.context && typeof errorWithContext.context === 'object') {
    Object.assign(serialized, errorWithContext.context);
  }

  return serialized;
};

/**
 * Create a configured Pino logger instance
 * @param name - Optional logger name for identification
 * @returns Configured Pino logger
 *
 * @example
 * ```typescript
 * const logger = createLogger('auth-service');
 * logger.info('User logged in', { userId: '123' });
 * ```
 */
export const createLogger = (name?: string): PinoLogger => {
  const transport = isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      };

  return pino({
    level: logLevel,
    transport,
    base: { pid: false, hostname: false },
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: 'message',
    formatters: {
      level: (label) => ({ level: label }),
    },
    // Mixin injects correlation context into every log entry automatically
    mixin: () => {
      const ctx = getCorrelationContext();
      if (!ctx) return {};
      return {
        correlationId: ctx.correlationId,
        ...(ctx.tenantId && { tenantId: ctx.tenantId }),
        ...(ctx.userId && { userId: ctx.userId }),
      };
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    ...(name && { name }),
  });
};

/**
 * Default logger instance for the application
 * Use this for general logging or create child loggers for specific contexts
 */
export const logger = createLogger();

/**
 * Create a child logger with bound context
 * Useful for adding correlation IDs or other context to all log entries
 *
 * @param bindings - Context to bind to all log entries
 * @returns Child logger with bound context
 *
 * @example
 * ```typescript
 * const requestLogger = createChildLogger({ correlationId: 'abc-123', tenantId: 'tenant-1' });
 * requestLogger.info('Processing request'); // includes correlationId and tenantId
 * ```
 */
export const createChildLogger = (bindings: LogContext): PinoLogger => {
  return logger.child(bindings);
};

export type { PinoLogger as Logger };
