/**
 * Auth Package - JWT Utilities, Guards, and Auth.js Configuration
 *
 * Provides authentication infrastructure for Axon Flow:
 * - JWT RS256 token signing/verification
 * - NestJS guards for protected routes
 * - Parameter decorators for user/tenant context
 * - OAuth provider configurations (Google, GitHub)
 * - Auth.js configuration with Drizzle adapter
 *
 * @packageDocumentation
 * @module @repo/auth
 */

// JWT Service
export {
  createJWTService,
  type JWTService,
  type TokenPayload,
  ACCESS_TOKEN_TTL,
  ACCESS_TOKEN_TTL_SECONDS,
} from './jwt.js';

// Key Management
export { loadPrivateKey, loadPublicKey, clearKeyCache } from './keys.js';

// Refresh Token
export {
  generateRefreshToken,
  getRefreshTokenExpiry,
  createRefreshToken,
  isRefreshTokenExpired,
  type RefreshToken,
  REFRESH_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_SECONDS,
} from './refresh-token.js';

// Auth.js Configuration
export {
  createAuthConfig,
  type DrizzleClient,
  type AuthUser,
  type AuthJWT,
  type AuthSession,
} from './config.js';

// Type Augmentations (side effects for module augmentation)
import './types.js';

// Re-export submodules for direct imports
export * from './guards/index.js';
export * from './decorators/index.js';
export * from './providers/index.js';
