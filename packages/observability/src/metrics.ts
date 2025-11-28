/**
 * Prometheus Metrics
 * HTTP request metrics, custom counters, and default Node.js metrics
 * @package @repo/observability
 */

import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
  type CounterConfiguration,
  type HistogramConfiguration,
  type GaugeConfiguration,
} from 'prom-client';

/**
 * Prometheus metrics registry
 * All metrics are registered here for collection
 */
export const register = new Registry();

/**
 * Collect default Node.js metrics (heap, event loop, GC, etc.)
 * These provide baseline observability for Node.js applications
 */
collectDefaultMetrics({ register });

/**
 * HTTP request counter
 * Tracks total number of HTTP requests by method, path, and status code
 *
 * Labels:
 * - method: HTTP method (GET, POST, etc.)
 * - path: Request path (normalized)
 * - status_code: HTTP status code
 */
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'] as const,
  registers: [register],
});

/**
 * HTTP request duration histogram
 * Tracks request duration distribution by method and path
 *
 * Labels:
 * - method: HTTP method (GET, POST, etc.)
 * - path: Request path (normalized)
 *
 * Buckets optimized for web application latency (10ms to 10s)
 */
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Database connection pool gauge
 * Tracks active database connections by pool name
 *
 * Labels:
 * - pool: Connection pool identifier
 */
export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  labelNames: ['pool'] as const,
  registers: [register],
});

/**
 * Database connection pool total gauge
 * Tracks total database connections by pool name
 */
export const dbConnectionsTotal = new Gauge({
  name: 'db_connections_total',
  help: 'Total number of database connections in pool',
  labelNames: ['pool'] as const,
  registers: [register],
});

/**
 * Database query duration histogram
 * Tracks database query execution time
 */
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

/**
 * Queue message counter
 * Tracks messages processed by queue operations
 */
export const queueMessagesTotal = new Counter({
  name: 'queue_messages_total',
  help: 'Total number of queue messages processed',
  labelNames: ['queue', 'operation', 'status'] as const,
  registers: [register],
});

/**
 * Express/NestJS request types
 * Defined inline to avoid dependency on express types
 */
interface Request {
  method: string;
  path: string;
  route?: { path: string };
}

interface Response {
  statusCode: number;
  on(event: 'finish', callback: () => void): void;
}

type NextFunction = () => void;

/**
 * Metrics middleware for Express/NestJS
 * Automatically tracks HTTP request metrics
 *
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * // Express
 * app.use(metricsMiddleware());
 *
 * // NestJS
 * app.use(metricsMiddleware());
 * ```
 */
export const metricsMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const durationNs = Number(endTime - startTime);
      const durationSeconds = durationNs / 1e9;

      // Normalize path to avoid high cardinality
      // Use route pattern if available, otherwise use path
      const path = normalizePath(req.route?.path || req.path);

      httpRequestsTotal.inc({
        method: req.method,
        path,
        status_code: res.statusCode.toString(),
      });

      httpRequestDuration.observe({ method: req.method, path }, durationSeconds);
    });

    next();
  };
};

/**
 * Normalize a path to reduce cardinality
 * Replaces dynamic segments (UUIDs, IDs) with placeholders
 *
 * @param path - Original request path
 * @returns Normalized path
 */
const normalizePath = (path: string): string => {
  return path
    // Replace UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Remove trailing slash
    .replace(/\/$/, '') || '/';
};

/**
 * Get all metrics in Prometheus text format
 * Use this to expose a /metrics endpoint
 *
 * @returns Promise resolving to Prometheus format string
 *
 * @example
 * ```typescript
 * app.get('/metrics', async (req, res) => {
 *   res.set('Content-Type', getMetricsContentType());
 *   res.send(await getMetrics());
 * });
 * ```
 */
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

/**
 * Get the content type for Prometheus metrics
 * @returns Content-Type header value
 */
export const getMetricsContentType = (): string => {
  return register.contentType;
};

/**
 * Create a custom counter metric
 * @param config - Counter configuration
 * @returns Configured Counter instance
 */
export const createCounter = <T extends string>(
  config: Omit<CounterConfiguration<T>, 'registers'>
): Counter<T> => {
  return new Counter({
    ...config,
    registers: [register],
  });
};

/**
 * Create a custom histogram metric
 * @param config - Histogram configuration
 * @returns Configured Histogram instance
 */
export const createHistogram = <T extends string>(
  config: Omit<HistogramConfiguration<T>, 'registers'>
): Histogram<T> => {
  return new Histogram({
    ...config,
    registers: [register],
  });
};

/**
 * Create a custom gauge metric
 * @param config - Gauge configuration
 * @returns Configured Gauge instance
 */
export const createGauge = <T extends string>(
  config: Omit<GaugeConfiguration<T>, 'registers'>
): Gauge<T> => {
  return new Gauge({
    ...config,
    registers: [register],
  });
};

/**
 * Reset all metrics (useful for testing)
 */
export const resetMetrics = (): void => {
  register.resetMetrics();
};

// Re-export prom-client types for consumers
export { Counter, Histogram, Gauge, Registry };
