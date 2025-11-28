/**
 * Type-check test file for V-0.4.6
 * This file verifies that type-safe imports work correctly
 * The file only needs to compile - it doesn't need to run
 */
import { db, tenants, users, sessions, oauthAccounts } from '../src/index.js';
import type { TenantSettings } from '../src/schema/tenant.js';

// Verify type-safe query compilation
async function testTypeSafeQueries() {
  // Select all tenants - should have full type inference
  const allTenants = await db.select().from(tenants);

  // Type check: tenant properties should be typed
  for (const tenant of allTenants) {
    const _id: string = tenant.id;
    const _name: string = tenant.name;
    const _slug: string = tenant.slug;
    const _plan: string = tenant.plan;
    const _settings: TenantSettings | null = tenant.settings;
    const _createdAt: Date = tenant.createdAt;
    const _updatedAt: Date = tenant.updatedAt;
    const _deletedAt: Date | null = tenant.deletedAt;
  }

  // Select all users with tenant FK
  const allUsers = await db.select().from(users);
  for (const user of allUsers) {
    const _tenantId: string = user.tenantId;
    const _email: string = user.email;
  }

  // Select all sessions
  const allSessions = await db.select().from(sessions);
  for (const session of allSessions) {
    const _sessionToken: string = session.sessionToken;
    const _userId: string = session.userId;
    const _expires: Date = session.expires;
  }

  // Select all OAuth accounts
  const allOAuthAccounts = await db.select().from(oauthAccounts);
  for (const account of allOAuthAccounts) {
    const _provider: string = account.provider;
  }
}

export { testTypeSafeQueries };
