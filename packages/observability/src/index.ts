/**
 * Observability Package - Logging, Tracing, and Metrics
 * Provides structured logging, distributed tracing, and Prometheus metrics
 * @package @repo/observability
 */

// =============================================================================
// Types
// =============================================================================
export type {
  LogContext,
  Logger,
  CorrelationContext,
  TracerOptions,
  HttpMetricLabels,
  SerializedError,
} from './types.js';

// =============================================================================
// Logger
// =============================================================================
export {
  createLogger,
  logger,
  createChildLogger,
  serializeError,
} from './logger.js';

// Re-export Pino Logger type
export type { Logger as PinoLogger } from './logger.js';

// =============================================================================
// Correlation ID Middleware
// =============================================================================
export {
  correlationStorage,
  correlationMiddleware,
  getCorrelationId,
  getTenantId,
  getUserId,
  getCorrelationContext,
  runWithCorrelation,
  runWithContext,
  generateUUIDv7,
  CORRELATION_ID_HEADER,
} from './middleware/correlation.js';

// =============================================================================
// OpenTelemetry Tracer
// =============================================================================
export {
  initTracer,
  initTracerWithOptions,
  shutdownTracer,
  getTracer,
  createSpan,
  createSpanAsync,
  addSpanAttributes,
  addSpanEvent,
  trace,
  context,
  SpanStatusCode,
} from './tracer.js';

export type { Span } from './tracer.js';

// =============================================================================
// Prometheus Metrics
// =============================================================================
export {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  dbConnectionsActive,
  dbConnectionsTotal,
  dbQueryDuration,
  queueMessagesTotal,
  metricsMiddleware,
  getMetrics,
  getMetricsContentType,
  createCounter,
  createHistogram,
  createGauge,
  resetMetrics,
  Counter,
  Histogram,
  Gauge,
  Registry,
} from './metrics.js';
