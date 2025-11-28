import * as jose from 'jose';

import { loadPrivateKey, loadPublicKey } from './keys.js';

/**
 * JWT token payload structure.
 * Contains user identity and tenant context for RLS.
 */
export interface TokenPayload {
  /** User ID (subject claim) */
  sub: string;
  /** Tenant ID for multi-tenant isolation */
  tenantId: string;
  /** User role for RBAC */
  role: string;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
}

/**
 * JWT service interface for sign/verify/decode operations.
 */
export interface JWTService {
  /**
   * Signs a payload and returns a JWT token.
   * @param payload - Token payload without iat/exp (auto-generated)
   * @returns Signed JWT string
   */
  sign(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string>;

  /**
   * Verifies a JWT token and returns the payload.
   * @param token - JWT string to verify
   * @returns Verified token payload
   * @throws JOSEError if token is invalid or expired
   */
  verify(token: string): Promise<TokenPayload>;

  /**
   * Decodes a JWT token without verification.
   * @param token - JWT string to decode
   * @returns Decoded payload or null if malformed
   */
  decode(token: string): TokenPayload | null;
}

/** Access token TTL: 15 minutes */
export const ACCESS_TOKEN_TTL = '15m';

/** Access token TTL in seconds (for calculations) */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/**
 * Creates a JWT service instance with RS256 signing.
 * Keys are loaded from environment variables on first use.
 *
 * @example
 * ```typescript
 * const jwtService = await createJWTService();
 * const token = await jwtService.sign({
 *   sub: 'user-uuid',
 *   tenantId: 'tenant-uuid',
 *   role: 'member',
 * });
 * const payload = await jwtService.verify(token);
 * ```
 */
export async function createJWTService(): Promise<JWTService> {
  const privateKey = await loadPrivateKey();
  const publicKey = await loadPublicKey();

  return {
    async sign(payload) {
      return new jose.SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_TTL)
        .sign(privateKey);
    },

    async verify(token) {
      const { payload } = await jose.jwtVerify(token, publicKey, {
        algorithms: ['RS256'],
      });
      return payload as unknown as TokenPayload;
    },

    decode(token) {
      try {
        const payload = jose.decodeJwt(token);
        return payload as unknown as TokenPayload;
      } catch {
        return null;
      }
    },
  };
}
