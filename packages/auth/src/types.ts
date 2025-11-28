/**
 * Type augmentations for Auth.js to include tenantId and role.
 *
 * These declarations extend the Auth.js types to include our custom
 * user properties (tenantId, role) throughout the authentication flow.
 *
 * @module
 */

declare module '@auth/core/types' {
  /**
   * Extended User type with tenant and role.
   */
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    tenantId?: string;
    role?: string;
  }

  /**
   * Extended Session type with tenant and role on user.
   */
  interface Session {
    user: User;
    expires: string;
  }
}

declare module '@auth/core/jwt' {
  /**
   * Extended JWT type with tenant and role claims.
   */
  interface JWT {
    sub?: string;
    tenantId?: string;
    role?: string;
  }
}

// Re-export for convenience
export type { User, Session } from '@auth/core/types';
export type { JWT } from '@auth/core/jwt';
