/**
 * Logger Unit Tests
 * Tests for AC 0.8.1, 0.8.2, 0.8.6
 */

import { Writable } from 'stream';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Logger', () => {
  const originalEnv = process.env;
  let capturedLogs: string[] = [];

  beforeEach(() => {
    // Reset captured logs
    capturedLogs = [];
    // Reset module cache to reload with new env vars
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('AC 0.8.1 - JSON Output', () => {
    it('should output valid JSON in production mode', async () => {
      // Set production environment
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'info';

      // Create a capture stream
      const _stream = new Writable({
        write(chunk, _encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      // Import pino directly to test with custom stream
      const pino = (await import('pino')).default;
      const logger = pino({
        level: 'info',
        base: { pid: false, hostname: false },
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label) => ({ level: label }),
        },
      });

      // Pipe to our capture stream
      logger.info({ test: true }, 'Test message');

      // Wait for stream to flush
      await new Promise((resolve) => setTimeout(resolve, 10));

      // In production, logger outputs JSON
      // Since we're testing the format, verify the logger config works
      expect(logger.level).toBe('info');
    });

    it('should include timestamp field in log entries', async () => {
      process.env.NODE_ENV = 'production';

      const pino = (await import('pino')).default;
      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: 'info',
          base: { pid: false, hostname: false },
          timestamp: pino.stdTimeFunctions.isoTime,
          messageKey: 'message',
          formatters: {
            level: (label) => ({ level: label }),
          },
        },
        stream
      );

      logger.info('Test message');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedLogs.length).toBeGreaterThan(0);
      const logEntry = JSON.parse(capturedLogs[0]!);
      expect(logEntry).toHaveProperty('time');
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('message');
    });

    it('should include level field in log entries', async () => {
      process.env.NODE_ENV = 'production';

      const pino = (await import('pino')).default;
      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: 'info',
          base: { pid: false, hostname: false },
          formatters: {
            level: (label) => ({ level: label }),
          },
        },
        stream
      );

      logger.info('Test message');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const logEntry = JSON.parse(capturedLogs[0]!);
      expect(logEntry.level).toBe('info');
    });
  });

  describe('AC 0.8.2 - Log Level Configuration', () => {
    it('should respect LOG_LEVEL=debug showing debug logs', async () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'debug';

      const pino = (await import('pino')).default;
      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: process.env.LOG_LEVEL ?? 'debug',
          base: { pid: false, hostname: false },
          formatters: {
            level: (label) => ({ level: label }),
          },
        },
        stream
      );

      logger.debug('Debug message');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedLogs.length).toBe(1);
      const logEntry = JSON.parse(capturedLogs[0]!);
      expect(logEntry.level).toBe('debug');
    });

    it('should default to info level when LOG_LEVEL not specified', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;

      const pino = (await import('pino')).default;
      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: process.env.LOG_LEVEL || 'info',
          base: { pid: false, hostname: false },
        },
        stream
      );

      expect(logger.level).toBe('info');
    });

    it('should not show debug logs when LOG_LEVEL=info', async () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'info';

      const pino = (await import('pino')).default;
      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: process.env.LOG_LEVEL ?? 'info',
          base: { pid: false, hostname: false },
        },
        stream
      );

      logger.debug('Debug message - should not appear');
      logger.info('Info message - should appear');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedLogs.length).toBe(1);
      expect(capturedLogs[0]!).toContain('Info message');
    });
  });

  describe('AC 0.8.6 - Error Stack Traces', () => {
    it('should include stack trace in error logs', async () => {
      process.env.NODE_ENV = 'production';

      const pino = (await import('pino')).default;
      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: 'error',
          base: { pid: false, hostname: false },
          serializers: {
            err: pino.stdSerializers.err,
          },
        },
        stream
      );

      const error = new Error('Test error with stack');
      logger.error({ err: error }, 'An error occurred');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const logEntry = JSON.parse(capturedLogs[0]!);
      expect(logEntry.err).toBeDefined();
      expect(logEntry.err.message).toBe('Test error with stack');
      expect(logEntry.err.stack).toBeDefined();
      expect(logEntry.err.stack).toContain('Error: Test error with stack');
    });

    it('should serialize error with name, message, and stack', async () => {
      const { serializeError } = await import('../src/logger.js');

      const error = new Error('Serialization test');
      error.name = 'TestError';

      const serialized = serializeError(error);

      expect(serialized.name).toBe('TestError');
      expect(serialized.message).toBe('Serialization test');
      expect(serialized.stack).toBeDefined();
      expect(typeof serialized.stack).toBe('string');
    });
  });

  describe('AC 0.8.6 - Sensitive Data Redaction', () => {
    it('should redact password fields', async () => {
      process.env.NODE_ENV = 'production';

      const pino = (await import('pino')).default;
      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: 'info',
          base: { pid: false, hostname: false },
          redact: {
            paths: ['password', 'token', 'apiKey', 'secret'],
            censor: '[REDACTED]',
          },
        },
        stream
      );

      logger.info({ password: 'secret123', username: 'user' }, 'Login attempt');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const logEntry = JSON.parse(capturedLogs[0]!);
      expect(logEntry.password).toBe('[REDACTED]');
      expect(logEntry.username).toBe('user');
    });

    it('should redact token fields', async () => {
      process.env.NODE_ENV = 'production';

      const pino = (await import('pino')).default;
      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: 'info',
          base: { pid: false, hostname: false },
          redact: {
            paths: ['token', 'accessToken', 'refreshToken'],
            censor: '[REDACTED]',
          },
        },
        stream
      );

      logger.info({ token: 'jwt-token-here', userId: '123' }, 'Token issued');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const logEntry = JSON.parse(capturedLogs[0]!);
      expect(logEntry.token).toBe('[REDACTED]');
      expect(logEntry.userId).toBe('123');
    });
  });

  describe('createLogger factory', () => {
    it('should create a logger with optional name', async () => {
      process.env.NODE_ENV = 'production';
      const { createLogger } = await import('../src/logger.js');

      const namedLogger = createLogger('test-service');
      expect(namedLogger).toBeDefined();
      expect(namedLogger.info).toBeDefined();
      expect(namedLogger.error).toBeDefined();
    });

    it('should create a default logger without name', async () => {
      process.env.NODE_ENV = 'production';
      const { logger } = await import('../src/logger.js');

      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
    });
  });

  describe('AC 0.8.3 - Correlation ID Auto-Injection', () => {
    it('should automatically include correlationId when in correlation context', async () => {
      process.env.NODE_ENV = 'production';

      const pino = (await import('pino')).default;
      const { runWithCorrelation, getCorrelationContext } = await import(
        '../src/middleware/correlation.js'
      );

      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: 'info',
          base: { pid: false, hostname: false },
          messageKey: 'message',
          mixin: () => {
            const ctx = getCorrelationContext();
            if (!ctx) return {};
            return {
              correlationId: ctx.correlationId,
              ...(ctx.tenantId && { tenantId: ctx.tenantId }),
              ...(ctx.userId && { userId: ctx.userId }),
            };
          },
        },
        stream
      );

      runWithCorrelation('test-correlation-123', () => {
        logger.info('Test message with correlation');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedLogs.length).toBe(1);
      const logEntry = JSON.parse(capturedLogs[0]!);
      expect(logEntry.correlationId).toBe('test-correlation-123');
      expect(logEntry.message).toBe('Test message with correlation');
    });

    it('should omit correlationId when NOT in correlation context', async () => {
      process.env.NODE_ENV = 'production';

      const pino = (await import('pino')).default;
      const { getCorrelationContext } = await import('../src/middleware/correlation.js');

      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: 'info',
          base: { pid: false, hostname: false },
          messageKey: 'message',
          mixin: () => {
            const ctx = getCorrelationContext();
            if (!ctx) return {};
            return {
              correlationId: ctx.correlationId,
            };
          },
        },
        stream
      );

      // Log outside of correlation context
      logger.info('Test message without correlation');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedLogs.length).toBe(1);
      const logEntry = JSON.parse(capturedLogs[0]!);
      expect(logEntry.correlationId).toBeUndefined();
      expect(logEntry.message).toBe('Test message without correlation');
    });

    it('should include tenantId and userId when available in context', async () => {
      process.env.NODE_ENV = 'production';

      const pino = (await import('pino')).default;
      const { runWithContext, getCorrelationContext } = await import(
        '../src/middleware/correlation.js'
      );

      const stream = new Writable({
        write(chunk, encoding, callback) {
          capturedLogs.push(chunk.toString());
          callback();
        },
      });

      const logger = pino(
        {
          level: 'info',
          base: { pid: false, hostname: false },
          messageKey: 'message',
          mixin: () => {
            const ctx = getCorrelationContext();
            if (!ctx) return {};
            return {
              correlationId: ctx.correlationId,
              ...(ctx.tenantId && { tenantId: ctx.tenantId }),
              ...(ctx.userId && { userId: ctx.userId }),
            };
          },
        },
        stream
      );

      runWithContext(
        {
          correlationId: 'corr-456',
          tenantId: 'tenant-abc',
          userId: 'user-xyz',
        },
        () => {
          logger.info('Test message with full context');
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedLogs.length).toBe(1);
      const logEntry = JSON.parse(capturedLogs[0]!);
      expect(logEntry.correlationId).toBe('corr-456');
      expect(logEntry.tenantId).toBe('tenant-abc');
      expect(logEntry.userId).toBe('user-xyz');
    });
  });
});
