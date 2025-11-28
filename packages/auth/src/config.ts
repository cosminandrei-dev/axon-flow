import type { AuthConfig } from '@auth/core';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

/**
 * Database client interface for Auth.js Drizzle adapter.
 * Should be the DrizzleClient from @repo/database.
 */
export type DrizzleClient = Parameters<typeof DrizzleAdapter>[0];

/**
 * Extended user type with tenant and role information.
 */
export interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  tenantId?: string;
  role?: string;
}

/**
 * Extended JWT type with tenant and role claims.
 */
export interface AuthJWT {
  sub?: string;
  tenantId?: string;
  role?: string;
}

/**
 * Extended session type with tenant and role information.
 */
export interface AuthSession {
  user: AuthUser;
  expires: string;
}

/**
 * Creates an Auth.js configuration with Drizzle adapter.
 *
 * Features:
 * - Drizzle ORM adapter for database persistence
 * - JWT session strategy
 * - Extends token with tenantId and role
 * - Extends session with user tenantId and role
 *
 * @param db - Drizzle database client from @repo/database
 * @returns Auth.js configuration object
 *
 * @example
 * ```typescript
 * // In your Next.js API route or app
 * import { createAuthConfig } from '@repo/auth';
 * import { googleProvider, githubProvider } from '@repo/auth/providers';
 * import { db } from '@repo/database';
 *
 * export const authConfig = createAuthConfig(db);
 *
 * // Add providers
 * authConfig.providers = [googleProvider, githubProvider];
 * ```
 */
export function createAuthConfig(db: DrizzleClient): AuthConfig {
  return {
    adapter: DrizzleAdapter(db),
    providers: [], // Providers added by consuming app
    session: {
      strategy: 'jwt',
    },
    callbacks: {
      async jwt({ token, user }) {
        // On initial sign in, add tenantId and role from user
        if (user) {
          const authUser = user as AuthUser;
          token.tenantId = authUser.tenantId;
          token.role = authUser.role;
        }
        return token;
      },
      async session({ session, token }) {
        // Add token claims to session
        if (token && session.user) {
          session.user.id = token.sub!;
          (session.user as AuthUser).tenantId = token.tenantId as string | undefined;
          (session.user as AuthUser).role = token.role as string | undefined;
        }
        return session;
      },
    },
    // Security settings
    trustHost: true,
  };
}
