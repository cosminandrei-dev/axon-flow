/**
 * OpenTelemetry Tracer Configuration
 * Distributed tracing with OTLP export for Jaeger/Tempo
 * @package @repo/observability
 */

import { trace, context, SpanStatusCode, type Span } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

import { getCorrelationId } from './middleware/correlation.js';
import type { TracerOptions } from './types.js';

/**
 * Default OTLP endpoint for trace export
 * Can be overridden via OTEL_EXPORTER_OTLP_ENDPOINT environment variable
 */
const DEFAULT_OTLP_ENDPOINT = 'http://localhost:4318/v1/traces';

/**
 * Global SDK instance reference for shutdown
 */
let globalSdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK with OTLP exporter
 * Call this before your application starts to enable distributed tracing
 *
 * @param serviceName - Name of the service for trace identification
 * @param serviceVersion - Version of the service (defaults to '0.0.0')
 * @returns Configured NodeSDK instance
 *
 * @example
 * ```typescript
 * // In main.ts, before app bootstrap
 * const sdk = initTracer('axon-flow-api', '1.0.0');
 *
 * // On shutdown
 * await shutdownTracer(sdk);
 * ```
 */
export const initTracer = (serviceName: string, serviceVersion = '0.0.0'): NodeSDK => {
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || DEFAULT_OTLP_ENDPOINT;

  const exporter = new OTLPTraceExporter({
    url: otlpEndpoint,
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
    }),
    traceExporter: exporter,
    instrumentations: [
      new HttpInstrumentation({
        // Ignore health check endpoints to reduce noise
        ignoreIncomingRequestHook: (request) => {
          const url = request.url || '';
          return url.includes('/health') || url.includes('/metrics');
        },
      }),
      new PgInstrumentation({
        // Include SQL in span attributes for debugging
        enhancedDatabaseReporting: true,
      }),
      new GraphQLInstrumentation({
        // Include GraphQL field names in spans
        mergeItems: true,
        allowValues: true,
      }),
    ],
  });

  sdk.start();
  globalSdk = sdk;

  return sdk;
};

/**
 * Initialize tracer with options object
 * Alternative to positional arguments for more complex configurations
 *
 * @param options - Tracer configuration options
 * @returns Configured NodeSDK instance or null if disabled
 */
export const initTracerWithOptions = (options: TracerOptions): NodeSDK | null => {
  if (options.enabled === false) {
    return null;
  }

  if (options.otlpEndpoint) {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = options.otlpEndpoint;
  }

  return initTracer(options.serviceName, options.serviceVersion);
};

/**
 * Gracefully shutdown the OpenTelemetry SDK
 * Flushes pending traces and releases resources
 *
 * @param sdk - NodeSDK instance to shutdown (optional, uses global if not provided)
 */
export const shutdownTracer = async (sdk?: NodeSDK): Promise<void> => {
  const sdkToShutdown = sdk || globalSdk;
  if (sdkToShutdown) {
    await sdkToShutdown.shutdown();
    if (sdkToShutdown === globalSdk) {
      globalSdk = null;
    }
  }
};

/**
 * Get the active tracer for creating spans
 * @param name - Tracer name (defaults to 'axon-flow')
 * @returns OpenTelemetry Tracer instance
 */
export const getTracer = (name = 'axon-flow') => {
  return trace.getTracer(name);
};

/**
 * Create and execute a span for a synchronous operation
 * Automatically includes correlation ID as span attribute
 *
 * @param name - Span name describing the operation
 * @param fn - Function to execute within the span
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const result = createSpan('process-payment', () => {
 *   return paymentService.process(order);
 * });
 * ```
 */
export const createSpan = <T>(name: string, fn: () => T): T => {
  const tracer = getTracer();

  return tracer.startActiveSpan(name, (span: Span) => {
    // Add correlation ID as span attribute
    span.setAttribute('correlation_id', getCorrelationId());

    try {
      const result = fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      span.recordException(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      span.end();
    }
  });
};

/**
 * Create and execute a span for an asynchronous operation
 * Automatically includes correlation ID as span attribute
 *
 * @param name - Span name describing the operation
 * @param fn - Async function to execute within the span
 * @returns Promise resolving to the function result
 *
 * @example
 * ```typescript
 * const result = await createSpanAsync('fetch-user', async () => {
 *   return await userService.findById(userId);
 * });
 * ```
 */
export const createSpanAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const tracer = getTracer();

  return tracer.startActiveSpan(name, async (span: Span) => {
    // Add correlation ID as span attribute
    span.setAttribute('correlation_id', getCorrelationId());

    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      span.recordException(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      span.end();
    }
  });
};

/**
 * Add attributes to the current active span
 * Useful for adding context without creating a new span
 *
 * @param attributes - Key-value pairs to add to the span
 */
export const addSpanAttributes = (attributes: Record<string, string | number | boolean>): void => {
  const span = trace.getActiveSpan();
  if (span) {
    for (const [key, value] of Object.entries(attributes)) {
      span.setAttribute(key, value);
    }
  }
};

/**
 * Record an event on the current active span
 * @param name - Event name
 * @param attributes - Optional event attributes
 */
export const addSpanEvent = (name: string, attributes?: Record<string, string | number | boolean>): void => {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
};

// Re-export useful OpenTelemetry types and utilities
export { trace, context, SpanStatusCode };
export type { Span };
