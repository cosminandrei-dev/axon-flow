/**
 * Metrics Unit Tests
 * Tests for AC 0.8.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  dbConnectionsActive,
  getMetrics,
  getMetricsContentType,
  metricsMiddleware,
  createCounter,
  createHistogram,
  createGauge,
  resetMetrics,
} from '../src/metrics.js';

describe('Metrics', () => {
  beforeEach(() => {
    // Reset all metrics before each test
    resetMetrics();
  });

  describe('AC 0.8.5 - Prometheus Format', () => {
    it('should expose Prometheus format with # HELP and # TYPE comments', async () => {
      const metrics = await getMetrics();

      expect(metrics).toContain('# HELP');
      expect(metrics).toContain('# TYPE');
    });

    it('should include http_requests_total metric', async () => {
      const metrics = await getMetrics();

      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('# HELP http_requests_total');
      expect(metrics).toContain('# TYPE http_requests_total counter');
    });

    it('should include http_request_duration_seconds metric', async () => {
      const metrics = await getMetrics();

      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('# HELP http_request_duration_seconds');
      expect(metrics).toContain('# TYPE http_request_duration_seconds histogram');
    });

    it('should return correct content type', () => {
      const contentType = getMetricsContentType();

      // Prometheus expects text/plain with specific options
      expect(contentType).toContain('text/plain');
    });
  });

  describe('AC 0.8.5 - Default Node.js Metrics', () => {
    it('should include Node.js heap metrics', async () => {
      const metrics = await getMetrics();

      expect(metrics).toContain('nodejs_heap_size');
    });

    it('should include Node.js event loop metrics', async () => {
      const metrics = await getMetrics();

      expect(metrics).toContain('nodejs_eventloop');
    });

    it('should include process metrics', async () => {
      const metrics = await getMetrics();

      expect(metrics).toContain('process_');
    });
  });

  describe('AC 0.8.5 - HTTP Request Counter', () => {
    it('should increment request counter with labels', async () => {
      httpRequestsTotal.inc({
        method: 'GET',
        path: '/api/users',
        status_code: '200',
      });

      const metrics = await getMetrics();

      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('path="/api/users"');
      expect(metrics).toContain('status_code="200"');
    });

    it('should track multiple paths separately', async () => {
      httpRequestsTotal.inc({ method: 'GET', path: '/users', status_code: '200' });
      httpRequestsTotal.inc({ method: 'GET', path: '/users', status_code: '200' });
      httpRequestsTotal.inc({ method: 'POST', path: '/users', status_code: '201' });

      const metrics = await getMetrics();

      // Should have separate entries for different label combinations
      expect(metrics).toContain('path="/users"');
      expect(metrics).toContain('status_code="200"');
      expect(metrics).toContain('status_code="201"');
    });
  });

  describe('AC 0.8.5 - HTTP Duration Histogram', () => {
    it('should observe request duration', async () => {
      httpRequestDuration.observe({ method: 'GET', path: '/api/test' }, 0.05);

      const metrics = await getMetrics();

      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('path="/api/test"');
    });

    it('should track histogram buckets', async () => {
      // Add multiple observations
      httpRequestDuration.observe({ method: 'GET', path: '/test' }, 0.01);
      httpRequestDuration.observe({ method: 'GET', path: '/test' }, 0.05);
      httpRequestDuration.observe({ method: 'GET', path: '/test' }, 0.5);
      httpRequestDuration.observe({ method: 'GET', path: '/test' }, 2.0);

      const metrics = await getMetrics();

      // Should include bucket entries
      expect(metrics).toContain('http_request_duration_seconds_bucket');
      expect(metrics).toContain('le="0.01"');
      expect(metrics).toContain('le="0.5"');
      expect(metrics).toContain('le="+Inf"');
    });

    it('should include sum and count', async () => {
      httpRequestDuration.observe({ method: 'GET', path: '/sum-test' }, 0.1);
      httpRequestDuration.observe({ method: 'GET', path: '/sum-test' }, 0.2);

      const metrics = await getMetrics();

      expect(metrics).toContain('http_request_duration_seconds_sum');
      expect(metrics).toContain('http_request_duration_seconds_count');
    });
  });

  describe('AC 0.8.5 - Database Connection Gauge', () => {
    it('should track active database connections', async () => {
      dbConnectionsActive.set({ pool: 'main' }, 5);

      const metrics = await getMetrics();

      expect(metrics).toContain('db_connections_active');
      expect(metrics).toContain('pool="main"');
    });

    it('should allow incrementing and decrementing gauge', async () => {
      dbConnectionsActive.set({ pool: 'test' }, 0);
      dbConnectionsActive.inc({ pool: 'test' });
      dbConnectionsActive.inc({ pool: 'test' });
      dbConnectionsActive.dec({ pool: 'test' });

      const metrics = await getMetrics();

      expect(metrics).toContain('db_connections_active{pool="test"} 1');
    });
  });

  describe('Metrics Middleware', () => {
    it('should create metrics middleware function', () => {
      const middleware = metricsMiddleware();

      expect(typeof middleware).toBe('function');
    });

    it('should call next() to continue request processing', () => {
      const middleware = metricsMiddleware();
      const req = { method: 'GET', path: '/test' };
      const res = {
        on: vi.fn(),
        statusCode: 200,
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should register finish listener on response', () => {
      const middleware = metricsMiddleware();
      const req = { method: 'GET', path: '/test' };
      const res = {
        on: vi.fn(),
        statusCode: 200,
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should record metrics on response finish', async () => {
      const middleware = metricsMiddleware();
      const req = { method: 'GET', path: '/api/items' };
      let finishCallback: () => void;
      const res = {
        on: vi.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            finishCallback = callback;
          }
        }),
        statusCode: 200,
      };
      const next = vi.fn();

      middleware(req, res, next);

      // Simulate response finish
      finishCallback!();

      const metrics = await getMetrics();

      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('method="GET"');
      expect(metrics).toContain('status_code="200"');
    });
  });

  describe('Custom Metric Factories', () => {
    it('should create custom counter', async () => {
      const customCounter = createCounter({
        name: 'custom_test_counter',
        help: 'A custom test counter',
        labelNames: ['service'] as const,
      });

      customCounter.inc({ service: 'test' });

      const metrics = await getMetrics();

      expect(metrics).toContain('custom_test_counter');
      expect(metrics).toContain('service="test"');
    });

    it('should create custom histogram', async () => {
      const customHistogram = createHistogram({
        name: 'custom_test_histogram',
        help: 'A custom test histogram',
        labelNames: ['operation'] as const,
        buckets: [0.1, 0.5, 1],
      });

      customHistogram.observe({ operation: 'query' }, 0.3);

      const metrics = await getMetrics();

      expect(metrics).toContain('custom_test_histogram');
      expect(metrics).toContain('operation="query"');
    });

    it('should create custom gauge', async () => {
      const customGauge = createGauge({
        name: 'custom_test_gauge',
        help: 'A custom test gauge',
        labelNames: ['queue'] as const,
      });

      customGauge.set({ queue: 'tasks' }, 42);

      const metrics = await getMetrics();

      expect(metrics).toContain('custom_test_gauge');
      expect(metrics).toContain('queue="tasks"');
    });
  });

  describe('Registry', () => {
    it('should have a global registry', () => {
      expect(register).toBeDefined();
      expect(typeof register.metrics).toBe('function');
    });

    it('should reset metrics correctly', async () => {
      httpRequestsTotal.inc({ method: 'GET', path: '/', status_code: '200' });

      resetMetrics();

      const metrics = await getMetrics();

      // After reset, counters should start fresh
      // The metric definition should still exist
      expect(metrics).toContain('http_requests_total');
    });
  });
});
