/**
 * Tracer Unit Tests
 * Tests for AC 0.8.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock OpenTelemetry modules before importing tracer
vi.mock('@opentelemetry/sdk-node', () => {
  return {
    NodeSDK: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      shutdown: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => {
  return {
    OTLPTraceExporter: vi.fn().mockImplementation(() => ({})),
  };
});

vi.mock('@opentelemetry/instrumentation-http', () => {
  return {
    HttpInstrumentation: vi.fn().mockImplementation(() => ({})),
  };
});

vi.mock('@opentelemetry/instrumentation-pg', () => {
  return {
    PgInstrumentation: vi.fn().mockImplementation(() => ({})),
  };
});

vi.mock('@opentelemetry/instrumentation-graphql', () => {
  return {
    GraphQLInstrumentation: vi.fn().mockImplementation(() => ({})),
  };
});

vi.mock('@opentelemetry/resources', () => {
  return {
    resourceFromAttributes: vi.fn().mockImplementation(() => ({})),
  };
});

vi.mock('@opentelemetry/semantic-conventions', () => {
  return {
    ATTR_SERVICE_NAME: 'service.name',
    ATTR_SERVICE_VERSION: 'service.version',
  };
});

describe('Tracer', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('AC 0.8.4 - OpenTelemetry SDK Initialization', () => {
    it('should initialize OpenTelemetry SDK', async () => {
      const { initTracer } = await import('../src/tracer.js');
      const { NodeSDK } = await import('@opentelemetry/sdk-node');

      const sdk = initTracer('test-service');

      expect(sdk).toBeDefined();
      expect(NodeSDK).toHaveBeenCalled();
    });

    it('should start the SDK on initialization', async () => {
      const { initTracer } = await import('../src/tracer.js');

      const sdk = initTracer('test-service');

      expect(sdk.start).toHaveBeenCalled();
    });

    it('should configure service name and version', async () => {
      const { initTracer } = await import('../src/tracer.js');
      const { resourceFromAttributes } = await import('@opentelemetry/resources');

      initTracer('my-service', '1.2.3');

      expect(resourceFromAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          'service.name': 'my-service',
          'service.version': '1.2.3',
        })
      );
    });

    it('should use default version if not specified', async () => {
      const { initTracer } = await import('../src/tracer.js');
      const { resourceFromAttributes } = await import('@opentelemetry/resources');

      initTracer('my-service');

      expect(resourceFromAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          'service.version': '0.0.0',
        })
      );
    });
  });

  describe('AC 0.8.4 - OTLP Endpoint Configuration', () => {
    it('should use OTEL_EXPORTER_OTLP_ENDPOINT environment variable', async () => {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://custom-endpoint:4318';

      vi.resetModules();
      const { initTracer } = await import('../src/tracer.js');
      const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');

      initTracer('test-service');

      expect(OTLPTraceExporter).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://custom-endpoint:4318',
        })
      );
    });

    it('should use default endpoint when env var not set', async () => {
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

      vi.resetModules();
      const { initTracer } = await import('../src/tracer.js');
      const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');

      initTracer('test-service');

      expect(OTLPTraceExporter).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:4318/v1/traces',
        })
      );
    });
  });

  describe('AC 0.8.4 - Instrumentation', () => {
    it('should configure HTTP instrumentation', async () => {
      const { initTracer } = await import('../src/tracer.js');
      const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');

      initTracer('test-service');

      expect(HttpInstrumentation).toHaveBeenCalled();
    });

    it('should configure PostgreSQL instrumentation', async () => {
      const { initTracer } = await import('../src/tracer.js');
      const { PgInstrumentation } = await import('@opentelemetry/instrumentation-pg');

      initTracer('test-service');

      expect(PgInstrumentation).toHaveBeenCalled();
    });

    it('should configure GraphQL instrumentation', async () => {
      const { initTracer } = await import('../src/tracer.js');
      const { GraphQLInstrumentation } = await import('@opentelemetry/instrumentation-graphql');

      initTracer('test-service');

      expect(GraphQLInstrumentation).toHaveBeenCalled();
    });
  });

  describe('AC 0.8.4 - Graceful Shutdown', () => {
    it('should shutdown tracer gracefully', async () => {
      const { initTracer, shutdownTracer } = await import('../src/tracer.js');

      const sdk = initTracer('test-service');
      await shutdownTracer(sdk);

      expect(sdk.shutdown).toHaveBeenCalled();
    });
  });

  describe('initTracerWithOptions', () => {
    it('should accept options object', async () => {
      const { initTracerWithOptions } = await import('../src/tracer.js');

      const sdk = initTracerWithOptions({
        serviceName: 'options-service',
        serviceVersion: '2.0.0',
      });

      expect(sdk).toBeDefined();
    });

    it('should return null when disabled', async () => {
      const { initTracerWithOptions } = await import('../src/tracer.js');

      const sdk = initTracerWithOptions({
        serviceName: 'disabled-service',
        enabled: false,
      });

      expect(sdk).toBeNull();
    });

    it('should set custom OTLP endpoint from options', async () => {
      const { initTracerWithOptions } = await import('../src/tracer.js');

      initTracerWithOptions({
        serviceName: 'custom-endpoint-service',
        otlpEndpoint: 'http://custom:4318',
      });

      expect(process.env.OTEL_EXPORTER_OTLP_ENDPOINT).toBe('http://custom:4318');
    });
  });
});

describe('Span Creation', () => {
  // Test span helpers with mocked trace API
  vi.mock('@opentelemetry/api', () => {
    const mockSpan = {
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
      recordException: vi.fn(),
      end: vi.fn(),
      addEvent: vi.fn(),
    };

    const mockTracer = {
      startActiveSpan: vi.fn((name, fn) => fn(mockSpan)),
    };

    return {
      trace: {
        getTracer: vi.fn(() => mockTracer),
        getActiveSpan: vi.fn(() => mockSpan),
      },
      context: {},
      SpanStatusCode: {
        OK: 1,
        ERROR: 2,
      },
    };
  });

  it('should create span and execute function', async () => {
    const { createSpan } = await import('../src/tracer.js');

    const result = createSpan('test-span', () => {
      return 'test-result';
    });

    expect(result).toBe('test-result');
  });

  it('should include correlation ID as span attribute', async () => {
    // Set up correlation context
    const { runWithCorrelation } = await import('../src/middleware/correlation.js');
    const { createSpan } = await import('../src/tracer.js');
    const { trace } = await import('@opentelemetry/api');

    const tracer = trace.getTracer('test');
    const mockSpan = { setAttribute: vi.fn(), setStatus: vi.fn(), end: vi.fn() };
    (tracer.startActiveSpan as ReturnType<typeof vi.fn>).mockImplementation(
      (_name: string, fn: (span: unknown) => unknown) => fn(mockSpan)
    );

    runWithCorrelation('test-correlation-id', () => {
      createSpan('test-span', () => 'result');
    });

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('correlation_id', 'test-correlation-id');
  });

  it('should handle errors in span', async () => {
    const { createSpan } = await import('../src/tracer.js');
    const { trace, SpanStatusCode } = await import('@opentelemetry/api');

    const tracer = trace.getTracer('test');
    const mockSpan = {
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
      recordException: vi.fn(),
      end: vi.fn(),
    };
    (tracer.startActiveSpan as ReturnType<typeof vi.fn>).mockImplementation(
      (_name: string, fn: (span: unknown) => unknown) => fn(mockSpan)
    );

    const testError = new Error('Test error');

    expect(() =>
      createSpan('error-span', () => {
        throw testError;
      })
    ).toThrow('Test error');

    expect(mockSpan.setStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        code: SpanStatusCode.ERROR,
      })
    );
    expect(mockSpan.recordException).toHaveBeenCalled();
    expect(mockSpan.end).toHaveBeenCalled();
  });

  it('should add attributes to active span', async () => {
    const { addSpanAttributes } = await import('../src/tracer.js');
    const { trace } = await import('@opentelemetry/api');

    const mockSpan = { setAttribute: vi.fn() };
    vi.mocked(trace.getActiveSpan).mockReturnValue(mockSpan as unknown as ReturnType<typeof trace.getActiveSpan>);

    addSpanAttributes({ key1: 'value1', key2: 42, key3: true });

    expect(mockSpan.setAttribute).toHaveBeenCalledWith('key1', 'value1');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('key2', 42);
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('key3', true);
  });

  it('should add event to active span', async () => {
    const { addSpanEvent } = await import('../src/tracer.js');
    const { trace } = await import('@opentelemetry/api');

    const mockSpan = { addEvent: vi.fn() };
    vi.mocked(trace.getActiveSpan).mockReturnValue(mockSpan as unknown as ReturnType<typeof trace.getActiveSpan>);

    addSpanEvent('test-event', { detail: 'value' });

    expect(mockSpan.addEvent).toHaveBeenCalledWith('test-event', { detail: 'value' });
  });
});
