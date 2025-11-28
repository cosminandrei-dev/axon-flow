/**
 * Correlation ID Middleware Unit Tests
 * Tests for AC 0.8.3
 */

import { describe, it, expect, vi } from 'vitest';

import {
  correlationMiddleware,
  getCorrelationId,
  getTenantId,
  getUserId,
  runWithCorrelation,
  runWithContext,
  generateUUIDv7,
  CORRELATION_ID_HEADER,
} from '../src/middleware/correlation.js';

describe('Correlation ID Middleware', () => {
  describe('AC 0.8.3 - UUID v7 Generation', () => {
    it('should generate UUID v7 format string', () => {
      const uuid = generateUUIDv7();

      // UUID format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUIDv7();
      const uuid2 = generateUUIDv7();
      const uuid3 = generateUUIDv7();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
    });

    it('should generate time-ordered UUIDs', () => {
      const uuid1 = generateUUIDv7();
      // Small delay to ensure different timestamp
      const uuid2 = generateUUIDv7();

      // First 8 chars are timestamp-based, so should be sortable
      const time1 = uuid1.substring(0, 8);
      const time2 = uuid2.substring(0, 8);

      // Later UUID should have same or higher timestamp prefix
      expect(time2 >= time1).toBe(true);
    });

    it('should have version 7 in the correct position', () => {
      const uuid = generateUUIDv7();
      const parts = uuid.split('-');

      // Third segment should start with '7'
      expect(parts[2]?.startsWith('7')).toBe(true);
    });
  });

  describe('AC 0.8.3 - Correlation ID Extraction', () => {
    it('should return "no-correlation-id" when not in context', () => {
      const correlationId = getCorrelationId();
      expect(correlationId).toBe('no-correlation-id');
    });

    it('should return correlation ID when in context', () => {
      const testId = 'test-correlation-123';

      runWithCorrelation(testId, () => {
        const correlationId = getCorrelationId();
        expect(correlationId).toBe(testId);
      });
    });

    it('should propagate correlation ID through nested sync calls', () => {
      const testId = 'nested-correlation-456';

      runWithCorrelation(testId, () => {
        // Nested function call
        const innerFn = () => {
          return getCorrelationId();
        };
        expect(innerFn()).toBe(testId);
      });
    });
  });

  describe('AC 0.8.3 - AsyncLocalStorage Propagation', () => {
    it('should propagate correlation ID through async operations', async () => {
      const testId = 'async-correlation-789';

      await runWithCorrelation(testId, async () => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));

        const correlationId = getCorrelationId();
        expect(correlationId).toBe(testId);
      });
    });

    it('should propagate correlation ID through Promise.all', async () => {
      const testId = 'promise-all-correlation';

      await runWithCorrelation(testId, async () => {
        const results = await Promise.all([
          Promise.resolve().then(() => getCorrelationId()),
          Promise.resolve().then(() => getCorrelationId()),
          Promise.resolve().then(() => getCorrelationId()),
        ]);

        expect(results).toEqual([testId, testId, testId]);
      });
    });

    it('should maintain separate contexts in concurrent operations', async () => {
      const id1 = 'concurrent-1';
      const id2 = 'concurrent-2';

      const results = await Promise.all([
        runWithCorrelation(id1, async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return getCorrelationId();
        }),
        runWithCorrelation(id2, async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return getCorrelationId();
        }),
      ]);

      expect(results[0]).toBe(id1);
      expect(results[1]).toBe(id2);
    });
  });

  describe('AC 0.8.3 - Full Context Propagation', () => {
    it('should propagate full context with tenant and user IDs', () => {
      const context = {
        correlationId: 'ctx-correlation',
        tenantId: 'tenant-123',
        userId: 'user-456',
      };

      runWithContext(context, () => {
        expect(getCorrelationId()).toBe('ctx-correlation');
        expect(getTenantId()).toBe('tenant-123');
        expect(getUserId()).toBe('user-456');
      });
    });

    it('should return undefined for missing context fields', () => {
      runWithCorrelation('only-correlation', () => {
        expect(getCorrelationId()).toBe('only-correlation');
        expect(getTenantId()).toBeUndefined();
        expect(getUserId()).toBeUndefined();
      });
    });
  });

  describe('AC 0.8.3 - Middleware Header Extraction', () => {
    it('should extract correlation ID from X-Correlation-ID header', () => {
      const middleware = correlationMiddleware();
      const existingId = 'header-correlation-id';

      const req = {
        headers: { [CORRELATION_ID_HEADER]: existingId },
      };
      const res = {
        setHeader: vi.fn(),
      };

      let capturedId: string | undefined;
      const next = vi.fn(() => {
        capturedId = getCorrelationId();
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(capturedId).toBe(existingId);
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', existingId);
    });

    it('should generate UUID v7 if no header present', () => {
      const middleware = correlationMiddleware();

      const req = {
        headers: {},
      };
      const res = {
        setHeader: vi.fn(),
      };

      let capturedId: string | undefined;
      const next = vi.fn(() => {
        capturedId = getCorrelationId();
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(capturedId).toBeDefined();
      expect(capturedId).not.toBe('no-correlation-id');

      // Should be a valid UUID v7
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(capturedId).toMatch(uuidRegex);
    });

    it('should set correlation ID in response header', () => {
      const middleware = correlationMiddleware();
      const testId = 'response-header-test';

      const req = {
        headers: { [CORRELATION_ID_HEADER]: testId },
      };
      const res = {
        setHeader: vi.fn(),
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', testId);
    });

    it('should handle array header value', () => {
      const middleware = correlationMiddleware();
      const testId = 'array-header-id';

      const req = {
        headers: { [CORRELATION_ID_HEADER]: [testId, 'second-value'] },
      };
      const res = {
        setHeader: vi.fn(),
      };

      let capturedId: string | undefined;
      const next = vi.fn(() => {
        capturedId = getCorrelationId();
      });

      middleware(req, res, next);

      expect(capturedId).toBe(testId); // Should use first value
    });
  });

  describe('CORRELATION_ID_HEADER constant', () => {
    it('should be lowercase x-correlation-id', () => {
      expect(CORRELATION_ID_HEADER).toBe('x-correlation-id');
    });
  });
});
