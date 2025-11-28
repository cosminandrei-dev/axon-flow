/**
 * Correlation ID Middleware
 * Propagates correlation IDs through async operations using AsyncLocalStorage
 * @package @repo/observability
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

import type { CorrelationContext } from '../types.js';

/**
 * AsyncLocalStorage instance for correlation context
 * Provides request-scoped storage that propagates through async operations
 */
export const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Generate a UUID v7 (time-ordered) identifier
 * UUID v7 provides time-ordered IDs which are useful for log aggregation and debugging
 *
 * Format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
 * - First 48 bits: Unix timestamp in milliseconds
 * - 4 bits: Version (7)
 * - 12 bits: Random
 * - 2 bits: Variant
 * - 62 bits: Random
 *
 * @returns UUID v7 string
 */
export const generateUUIDv7 = (): string => {
  const timestamp = Date.now();

  // Get timestamp as hex (48 bits = 12 hex chars)
  const timestampHex = timestamp.toString(16).padStart(12, '0');

  // Generate random bytes for the rest
  const randomPart = randomUUID().replace(/-/g, '');

  // Build UUID v7:
  // time_high (8 chars) - time_mid (4 chars) - ver + time_low (4 chars) - variant + rand (4 chars) - rand (12 chars)
  const timeHigh = timestampHex.slice(0, 8);
  const timeMid = timestampHex.slice(8, 12);
  const verTimeLow = '7' + randomPart.slice(0, 3);
  const variantRand = ((parseInt(randomPart.slice(3, 4), 16) & 0x3) | 0x8).toString(16) + randomPart.slice(4, 7);
  const rand = randomPart.slice(7, 19);

  return `${timeHigh}-${timeMid}-${verTimeLow}-${variantRand}-${rand}`;
};

/**
 * Get the current correlation ID from AsyncLocalStorage
 * Returns 'no-correlation-id' if not in a correlation context
 *
 * @returns Current correlation ID or fallback
 */
export const getCorrelationId = (): string => {
  return correlationStorage.getStore()?.correlationId || 'no-correlation-id';
};

/**
 * Get the current tenant ID from AsyncLocalStorage
 * @returns Current tenant ID or undefined
 */
export const getTenantId = (): string | undefined => {
  return correlationStorage.getStore()?.tenantId;
};

/**
 * Get the current user ID from AsyncLocalStorage
 * @returns Current user ID or undefined
 */
export const getUserId = (): string | undefined => {
  return correlationStorage.getStore()?.userId;
};

/**
 * Get the full correlation context from AsyncLocalStorage
 * @returns Current correlation context or undefined
 */
export const getCorrelationContext = (): CorrelationContext | undefined => {
  return correlationStorage.getStore();
};

/**
 * Run a function within a correlation context
 * Creates a new correlation scope for the duration of the function
 *
 * @param correlationId - Correlation ID to use
 * @param fn - Function to execute within the context
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const result = runWithCorrelation('abc-123', () => {
 *   // getCorrelationId() returns 'abc-123' here
 *   return processRequest();
 * });
 * ```
 */
export const runWithCorrelation = <T>(correlationId: string, fn: () => T): T => {
  return correlationStorage.run({ correlationId }, fn);
};

/**
 * Run a function within a full correlation context
 * Creates a new correlation scope with all context fields
 *
 * @param context - Full correlation context
 * @param fn - Function to execute within the context
 * @returns Result of the function
 */
export const runWithContext = <T>(context: CorrelationContext, fn: () => T): T => {
  return correlationStorage.run(context, fn);
};

/**
 * Express/NestJS middleware types
 * Defined inline to avoid dependency on express types in this package
 */
interface Request {
  headers: Record<string, string | string[] | undefined>;
}

interface Response {
  setHeader(name: string, value: string): void;
}

type NextFunction = () => void;

/**
 * HTTP header name for correlation ID
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Express/NestJS middleware factory for correlation ID propagation
 * Extracts correlation ID from X-Correlation-ID header or generates a new one
 *
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * // Express
 * app.use(correlationMiddleware());
 *
 * // NestJS
 * app.use(correlationMiddleware());
 * ```
 */
export const correlationMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const existingId = req.headers[CORRELATION_ID_HEADER];
    const correlationId =
      (typeof existingId === 'string' ? existingId : Array.isArray(existingId) ? existingId[0] : undefined) ||
      generateUUIDv7();

    // Set the correlation ID in the response header
    res.setHeader('X-Correlation-ID', correlationId);

    // Run the rest of the request within the correlation context
    correlationStorage.run({ correlationId }, () => {
      next();
    });
  };
};
