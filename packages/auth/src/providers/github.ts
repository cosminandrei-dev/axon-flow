import GitHub from '@auth/core/providers/github';

/**
 * GitHub OAuth provider configuration for Auth.js.
 *
 * Requires environment variables:
 * - GITHUB_CLIENT_ID
 * - GITHUB_CLIENT_SECRET
 *
 * Uses PKCE (Proof Key for Code Exchange) for enhanced security.
 *
 * @example
 * ```typescript
 * // In your Auth.js configuration
 * import { githubProvider } from '@repo/auth/providers';
 *
 * export const authConfig = {
 *   providers: [githubProvider],
 *   // ...
 * };
 * ```
 */
export const githubProvider = GitHub({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
});

/**
 * GitHub OAuth provider configuration object.
 * Useful for provider-specific customization.
 */
export const githubProviderConfig = {
  id: 'github',
  name: 'GitHub',
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
} as const;
