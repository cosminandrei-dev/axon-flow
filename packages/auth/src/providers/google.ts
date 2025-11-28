import Google from '@auth/core/providers/google';

/**
 * Google OAuth provider configuration for Auth.js.
 *
 * Requires environment variables:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 *
 * Uses PKCE (Proof Key for Code Exchange) for enhanced security.
 *
 * @example
 * ```typescript
 * // In your Auth.js configuration
 * import { googleProvider } from '@repo/auth/providers';
 *
 * export const authConfig = {
 *   providers: [googleProvider],
 *   // ...
 * };
 * ```
 */
export const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
});

/**
 * Google OAuth provider configuration object.
 * Useful for provider-specific customization.
 */
export const googleProviderConfig = {
  id: 'google',
  name: 'Google',
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
} as const;
