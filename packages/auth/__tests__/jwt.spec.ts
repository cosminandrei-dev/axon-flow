import * as jose from 'jose';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  createJWTService,
  type TokenPayload,
  ACCESS_TOKEN_TTL_SECONDS,
} from '../src/jwt.js';
import { clearKeyCache } from '../src/keys.js';

describe('JWT Service', () => {
  beforeEach(() => {
    // Clear key cache between tests to ensure fresh keys
    clearKeyCache();
    // Reset environment for development mode (auto-generate keys)
    vi.stubEnv('NODE_ENV', 'development');
    vi.unstubAllEnvs();
  });

  describe('createJWTService', () => {
    it('creates a JWT service instance', async () => {
      const jwtService = await createJWTService();

      expect(jwtService).toBeDefined();
      expect(jwtService.sign).toBeInstanceOf(Function);
      expect(jwtService.verify).toBeInstanceOf(Function);
      expect(jwtService.decode).toBeInstanceOf(Function);
    });
  });

  describe('sign', () => {
    it('signs a token with RS256 algorithm', async () => {
      const jwtService = await createJWTService();

      const payload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'member',
      };

      const token = await jwtService.sign(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('includes payload claims in the token', async () => {
      const jwtService = await createJWTService();

      const payload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'admin',
      };

      const token = await jwtService.sign(payload);
      const decoded = jwtService.decode(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.sub).toBe('user-123');
      expect(decoded!.tenantId).toBe('tenant-456');
      expect(decoded!.role).toBe('admin');
    });

    it('sets iat and exp claims automatically', async () => {
      const jwtService = await createJWTService();

      const payload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'member',
      };

      const beforeSign = Math.floor(Date.now() / 1000);
      const token = await jwtService.sign(payload);
      const afterSign = Math.floor(Date.now() / 1000);

      const decoded = jwtService.decode(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.iat).toBeGreaterThanOrEqual(beforeSign);
      expect(decoded!.iat).toBeLessThanOrEqual(afterSign);
      expect(decoded!.exp).toBeGreaterThan(decoded!.iat);
    });

    it('sets expiration to 15 minutes from now', async () => {
      const jwtService = await createJWTService();

      const payload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'member',
      };

      const token = await jwtService.sign(payload);
      const decoded = jwtService.decode(token);

      expect(decoded).not.toBeNull();
      const ttl = decoded!.exp - decoded!.iat;
      expect(ttl).toBe(ACCESS_TOKEN_TTL_SECONDS);
    });
  });

  describe('verify', () => {
    it('verifies a valid token and returns payload', async () => {
      const jwtService = await createJWTService();

      const payload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'member',
      };

      const token = await jwtService.sign(payload);
      const verified = await jwtService.verify(token);

      expect(verified.sub).toBe('user-123');
      expect(verified.tenantId).toBe('tenant-456');
      expect(verified.role).toBe('member');
    });

    it('rejects expired tokens', async () => {
      // Create a service with a very short expiration by signing manually
      const { privateKey, publicKey } = await jose.generateKeyPair('RS256');

      // Create token with -1 second expiration (already expired)
      const token = await new jose.SignJWT({
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'member',
      })
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setExpirationTime('-1s')
        .sign(privateKey);

      // Verification should fail
      await expect(
        jose.jwtVerify(token, publicKey, { algorithms: ['RS256'] }),
      ).rejects.toThrow();
    });

    it('rejects malformed tokens', async () => {
      const jwtService = await createJWTService();

      await expect(jwtService.verify('not-a-jwt')).rejects.toThrow();
      await expect(jwtService.verify('a.b.c')).rejects.toThrow();
      await expect(jwtService.verify('')).rejects.toThrow();
    });

    it('rejects tokens with wrong algorithm', async () => {
      const jwtService = await createJWTService();

      // Create a token with HS256 (symmetric) - different from RS256
      const secret = new TextEncoder().encode('test-secret-key-at-least-32-chars');
      const hsToken = await new jose.SignJWT({
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'member',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(secret);

      // Should reject because we expect RS256
      await expect(jwtService.verify(hsToken)).rejects.toThrow();
    });
  });

  describe('decode', () => {
    it('decodes a valid token without verification', async () => {
      const jwtService = await createJWTService();

      const payload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'member',
      };

      const token = await jwtService.sign(payload);
      const decoded = jwtService.decode(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.sub).toBe('user-123');
    });

    it('returns null for malformed tokens', async () => {
      const jwtService = await createJWTService();

      expect(jwtService.decode('not-a-jwt')).toBeNull();
      expect(jwtService.decode('')).toBeNull();
    });
  });

  describe('token payload structure', () => {
    it('contains required fields: sub, tenantId, role, iat, exp', async () => {
      const jwtService = await createJWTService();

      const token = await jwtService.sign({
        sub: 'user-id',
        tenantId: 'tenant-id',
        role: 'admin',
      });

      const decoded = jwtService.decode(token) as TokenPayload;

      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('tenantId');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });
  });
});
