import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthGuard, type RequestWithUser } from '../src/guards/auth.guard.js';
import type { JWTService, TokenPayload } from '../src/jwt.js';

// Mock ExecutionContext
function createMockContext(
  request: RequestWithUser,
  type: 'http' | 'graphql' = 'http',
): ExecutionContext {
  const mockHttpContext = {
    getRequest: () => request,
  };

  return {
    getType: () => type,
    switchToHttp: () => mockHttpContext,
    // For GraphQL context simulation
    getArgs: () => [{}, {}, { req: request }, {}],
    getArgByIndex: (index: number) => [null, null, { req: request }, null][index],
    getClass: () => ({}),
    getHandler: () => ({}),
  } as unknown as ExecutionContext;
}

// Mock JWT Service
function createMockJwtService(verifyResult?: TokenPayload | Error): JWTService {
  return {
    sign: vi.fn(),
    verify: vi.fn().mockImplementation(async () => {
      if (verifyResult instanceof Error) {
        throw verifyResult;
      }
      return verifyResult;
    }),
    decode: vi.fn(),
  };
}

describe('AuthGuard', () => {
  const validPayload: TokenPayload = {
    sub: 'user-123',
    tenantId: 'tenant-456',
    role: 'member',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canActivate', () => {
    it('accepts valid Bearer token', async () => {
      const jwtService = createMockJwtService(validPayload);
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {
        headers: { authorization: 'Bearer valid-token' },
      };
      const context = createMockContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
    });

    it('sets user on request after successful verification', async () => {
      const jwtService = createMockJwtService(validPayload);
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {
        headers: { authorization: 'Bearer valid-token' },
      };
      const context = createMockContext(request);

      await guard.canActivate(context);

      expect(request.user).toEqual(validPayload);
    });

    it('rejects missing Authorization header', async () => {
      const jwtService = createMockJwtService(validPayload);
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {
        headers: {},
      };
      const context = createMockContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Missing authentication token');
    });

    it('rejects non-Bearer tokens', async () => {
      const jwtService = createMockJwtService(validPayload);
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      };
      const context = createMockContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Missing authentication token');
    });

    it('rejects expired tokens', async () => {
      const jwtService = createMockJwtService(new Error('Token expired'));
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {
        headers: { authorization: 'Bearer expired-token' },
      };
      const context = createMockContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired token');
    });

    it('rejects malformed tokens', async () => {
      const jwtService = createMockJwtService(new Error('Malformed token'));
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {
        headers: { authorization: 'Bearer malformed' },
      };
      const context = createMockContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid or expired token');
    });

    it('works with REST context', async () => {
      const jwtService = createMockJwtService(validPayload);
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {
        headers: { authorization: 'Bearer valid-token' },
      };
      const context = createMockContext(request, 'http');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('extracts token correctly from Bearer header', async () => {
      const jwtService = createMockJwtService(validPayload);
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {
        headers: { authorization: 'Bearer my-actual-token-value' },
      };
      const context = createMockContext(request);

      await guard.canActivate(context);

      expect(jwtService.verify).toHaveBeenCalledWith('my-actual-token-value');
    });
  });

  describe('edge cases', () => {
    it('handles empty Bearer token', async () => {
      const jwtService = createMockJwtService(validPayload);
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {
        headers: { authorization: 'Bearer ' },
      };
      const context = createMockContext(request);

      // Empty token after "Bearer " should still be passed to verify
      // which will then fail validation
      const mockVerify = jwtService.verify as ReturnType<typeof vi.fn>;
      mockVerify.mockRejectedValueOnce(new Error('Invalid token'));

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('handles request without headers object', async () => {
      const jwtService = createMockJwtService(validPayload);
      const guard = new AuthGuard(jwtService);

      const request: RequestWithUser = {};
      const context = createMockContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });
});
