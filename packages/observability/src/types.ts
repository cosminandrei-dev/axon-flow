/**
 * Type definitions for observability package
 * @package @repo/observability
 */

/**
 * Context object for structured logging
 * Provides correlation, tenant, and user information for log entries
 */
export interface LogContext {
  correlationId?: string;
  tenantId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Logger interface for structured logging operations
 * Wraps Pino logger with consistent API
 */
export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  child(bindings: LogContext): Logger;
}

/**
 * Correlation context stored in AsyncLocalStorage
 * Propagates request-scoped data through async operations
 */
export interface CorrelationContext {
  correlationId: string;
  tenantId?: string;
  userId?: string;
}

/**
 * Options for initializing the OpenTelemetry tracer
 */
export interface TracerOptions {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  enabled?: boolean;
}

/**
 * HTTP metrics labels for request tracking
 */
export interface HttpMetricLabels {
  method: string;
  path: string;
  status_code?: string;
}

/**
 * Serialized error object with stack trace
 */
export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  [key: string]: unknown;
}
