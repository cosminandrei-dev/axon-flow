import { randomUUID } from 'node:crypto';

/** Refresh token TTL: 7 days in milliseconds */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Refresh token TTL: 7 days in seconds */
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Refresh token data structure.
 */
export interface RefreshToken {
  /** Unique token identifier */
  token: string;
  /** Associated user ID */
  userId: string;
  /** Expiration timestamp */
  expiresAt: Date;
}

/**
 * Generates a secure refresh token.
 * Uses crypto.randomUUID for cryptographically secure random generation.
 *
 * @returns Secure random token string
 */
export function generateRefreshToken(): string {
  return randomUUID();
}

/**
 * Calculates the expiration date for a refresh token.
 *
 * @param issuedAt - When the token was issued (defaults to now)
 * @returns Expiration date (7 days from issuedAt)
 */
export function getRefreshTokenExpiry(issuedAt: Date = new Date()): Date {
  return new Date(issuedAt.getTime() + REFRESH_TOKEN_TTL_MS);
}

/**
 * Creates a new refresh token with expiry.
 *
 * @param userId - User ID to associate with the token
 * @returns RefreshToken object with token, userId, and expiresAt
 *
 * @example
 * ```typescript
 * const refreshToken = createRefreshToken('user-uuid');
 * // Store in database:
 * // await db.insert(sessions).values({
 * //   sessionToken: refreshToken.token,
 * //   userId: refreshToken.userId,
 * //   expires: refreshToken.expiresAt,
 * // });
 * ```
 */
export function createRefreshToken(userId: string): RefreshToken {
  return {
    token: generateRefreshToken(),
    userId,
    expiresAt: getRefreshTokenExpiry(),
  };
}

/**
 * Checks if a refresh token has expired.
 *
 * @param expiresAt - Token expiration date
 * @returns true if token has expired
 */
export function isRefreshTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
