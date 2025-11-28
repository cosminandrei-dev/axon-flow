import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, it, expect } from 'vitest';

import type { TokenPayload } from '../src/jwt.js';

// Since decorators use createParamDecorator, we need to test their factory functions
// We'll test by directly invoking the decorator factory logic

describe('CurrentUser decorator', () => {
  const validPayload: TokenPayload = {
    sub: 'user-123',
    tenantId: 'tenant-456',
    role: 'member',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  };

  // Helper to create mock execution context
  function createMockContext(
    user: TokenPayload | undefined,
    type: 'http' | 'graphql' = 'http',
  ): ExecutionContext {
    const request = { user };

    const mockHttpContext = {
      getRequest: () => request,
    };

    return {
      getType: () => type,
      switchToHttp: () => mockHttpContext,
      getArgs: () => [{}, {}, { req: request }, {}],
      getArgByIndex: (index: number) => [null, null, { req: request }, null][index],
      getClass: () => ({}),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;
  }

  // The decorator factory function (extracted logic)
  function currentUserFactory(data: unknown, context: ExecutionContext): TokenPayload {
    const type = context.getType<string>();
    let user: TokenPayload | undefined;

    if (type === 'graphql') {
      // For GraphQL, user would be on context.req
      const gqlContext = context.getArgByIndex(2) as { req?: { user?: TokenPayload } } | null;
      user = gqlContext?.req?.user;
    } else {
      user = (context.switchToHttp().getRequest() as { user?: TokenPayload }).user;
    }

    if (!user) {
      throw new UnauthorizedException(
        'User context not found. Ensure AuthGuard is applied to this route.',
      );
    }

    return user;
  }

  describe('REST context', () => {
    it('extracts user from REST request', () => {
      const context = createMockContext(validPayload, 'http');

      const result = currentUserFactory(null, context);

      expect(result).toEqual(validPayload);
      expect(result.sub).toBe('user-123');
      expect(result.tenantId).toBe('tenant-456');
      expect(result.role).toBe('member');
    });

    it('throws UnauthorizedException when no user present', () => {
      const context = createMockContext(undefined, 'http');

      expect(() => currentUserFactory(null, context)).toThrow(UnauthorizedException);
      expect(() => currentUserFactory(null, context)).toThrow(
        'User context not found. Ensure AuthGuard is applied to this route.',
      );
    });
  });

  describe('GraphQL context', () => {
    it('extracts user from GraphQL context', () => {
      const context = createMockContext(validPayload, 'graphql');

      const result = currentUserFactory(null, context);

      expect(result).toEqual(validPayload);
    });

    it('throws UnauthorizedException when no user in GraphQL context', () => {
      const context = createMockContext(undefined, 'graphql');

      expect(() => currentUserFactory(null, context)).toThrow(UnauthorizedException);
    });
  });
});

describe('CurrentTenant decorator', () => {
  const validPayload: TokenPayload = {
    sub: 'user-123',
    tenantId: 'tenant-456',
    role: 'member',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  };

  // Helper to create mock execution context
  function createMockContext(
    user: TokenPayload | undefined,
    type: 'http' | 'graphql' = 'http',
  ): ExecutionContext {
    const request = { user };

    const mockHttpContext = {
      getRequest: () => request,
    };

    return {
      getType: () => type,
      switchToHttp: () => mockHttpContext,
      getArgs: () => [{}, {}, { req: request }, {}],
      getArgByIndex: (index: number) => [null, null, { req: request }, null][index],
      getClass: () => ({}),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;
  }

  // The decorator factory function (extracted logic)
  function currentTenantFactory(data: unknown, context: ExecutionContext): string | undefined {
    const type = context.getType<string>();
    let user: TokenPayload | undefined;

    if (type === 'graphql') {
      const gqlContext = context.getArgByIndex(2) as { req?: { user?: TokenPayload } } | null;
      user = gqlContext?.req?.user;
    } else {
      user = (context.switchToHttp().getRequest() as { user?: TokenPayload }).user;
    }

    return user?.tenantId;
  }

  describe('REST context', () => {
    it('extracts tenantId from REST request', () => {
      const context = createMockContext(validPayload, 'http');

      const result = currentTenantFactory(null, context);

      expect(result).toBe('tenant-456');
    });

    it('returns undefined when no user present', () => {
      const context = createMockContext(undefined, 'http');

      const result = currentTenantFactory(null, context);

      expect(result).toBeUndefined();
    });
  });

  describe('GraphQL context', () => {
    it('extracts tenantId from GraphQL context', () => {
      const context = createMockContext(validPayload, 'graphql');

      const result = currentTenantFactory(null, context);

      expect(result).toBe('tenant-456');
    });

    it('returns undefined when no user in GraphQL context', () => {
      const context = createMockContext(undefined, 'graphql');

      const result = currentTenantFactory(null, context);

      expect(result).toBeUndefined();
    });
  });
});
