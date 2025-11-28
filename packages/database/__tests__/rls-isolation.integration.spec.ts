/**
 * RLS Integration Tests for Multi-Tenant Isolation
 *
 * These tests verify that PostgreSQL Row-Level Security (RLS) policies
 * correctly enforce tenant isolation at the database level.
 *
 * @see docs/sprint-artifacts/tech-spec-epic-0.md lines 847-866
 * @see packages/database/migrations/0001_rls_policies.sql
 *
 * Note: RLS policies are only enforced for non-superuser roles.
 * When running locally with a superuser connection, RLS tests will be skipped.
 * In CI, a non-superuser role should be used for proper RLS testing.
 */

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { tenants, users } from '../src/schema/index.js';

/**
 * Test database connection.
 * Uses DATABASE_URL environment variable or falls back to local Docker Compose.
 */
const TEST_DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgres://axon:axon_dev_password@localhost:5432/axon_flow_dev';

/**
 * Helper to set the tenant context using raw SQL.
 * SET commands cannot use parameterized values in PostgreSQL.
 * UUID validation prevents SQL injection via defense-in-depth.
 */
function setTenantContext(tenantId: string): ReturnType<typeof sql> {
  // Validate tenantId is a well-formed UUID to prevent SQL injection
  // (defense-in-depth, matches production pattern in tenant.guard.ts)
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(tenantId)) {
    throw new Error(`Invalid tenant ID format: ${tenantId}`);
  }
  return sql.raw(`SET app.current_tenant_id = '${tenantId}'`);
}

/**
 * Helper to reset the tenant context.
 */
function resetTenantContext(): ReturnType<typeof sql> {
  return sql.raw(`RESET app.current_tenant_id`);
}

describe('Tenant RLS Isolation', () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof drizzle>;
  let isSuperuser = false;

  // Track created IDs for cleanup
  let tenant1Id: string;
  let tenant2Id: string;
  let userId: string;

  beforeAll(async () => {
    // Create dedicated connection for tests
    client = postgres(TEST_DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
    });
    db = drizzle(client);

    // Verify database connection
    const result = await db.execute(sql`SELECT 1 as connected`);
    expect(result).toBeDefined();

    // Check if RLS is enforced for the current user
    const userCheck = await db.execute(
      sql`SELECT current_user, current_setting('is_superuser', true) as is_superuser`,
    );
    isSuperuser =
      (userCheck as unknown as Array<{ is_superuser: string }>)[0]
        ?.is_superuser === 'on';

    if (isSuperuser) {
      console.warn(
        '\n⚠️  Running as superuser - RLS enforcement tests will be skipped.',
        '\n   For full RLS testing, use a non-superuser role (e.g., in CI).\n',
      );
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await db.execute(resetTenantContext());

      if (userId) {
        await db.execute(sql`DELETE FROM users WHERE id = ${userId}::uuid`);
      }
      if (tenant1Id) {
        await db.execute(
          sql`DELETE FROM tenants WHERE id = ${tenant1Id}::uuid`,
        );
      }
      if (tenant2Id) {
        await db.execute(
          sql`DELETE FROM tenants WHERE id = ${tenant2Id}::uuid`,
        );
      }
    } catch {
      // Ignore cleanup errors
    }

    await client.end();
  });

  describe('RLS Policy Structure', () => {
    it('should have RLS enabled on tenants table', async () => {
      const result = await db.execute(sql`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'tenants'
      `);
      const row = (result as unknown as Array<{ relrowsecurity: boolean }>)[0];
      expect(row?.relrowsecurity).toBe(true);
    });

    it('should have RLS enabled on users table', async () => {
      const result = await db.execute(sql`
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'users'
      `);
      const row = (result as unknown as Array<{ relrowsecurity: boolean }>)[0];
      expect(row?.relrowsecurity).toBe(true);
    });

    it('should have tenant_isolation policy on tenants table', async () => {
      const result = await db.execute(sql`
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'tenants' AND policyname = 'tenant_isolation'
      `);
      expect(
        (result as unknown as Array<{ policyname: string }>).length,
      ).toBeGreaterThan(0);
    });

    it('should have user_tenant_isolation policy on users table', async () => {
      const result = await db.execute(sql`
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'users' AND policyname = 'user_tenant_isolation'
      `);
      expect(
        (result as unknown as Array<{ policyname: string }>).length,
      ).toBeGreaterThan(0);
    });
  });

  describe('Test Data Setup', () => {
    it('should create test tenants and user', async () => {
      const timestamp = Date.now();

      const [tenant1] = await db
        .insert(tenants)
        .values({
          name: `Test Tenant A ${timestamp}`,
          slug: `test-tenant-a-${timestamp}`,
          plan: 'free',
        })
        .returning();

      const [tenant2] = await db
        .insert(tenants)
        .values({
          name: `Test Tenant B ${timestamp}`,
          slug: `test-tenant-b-${timestamp}`,
          plan: 'free',
        })
        .returning();

      if (!tenant1 || !tenant2) {
        throw new Error('Failed to create test tenants');
      }

      tenant1Id = tenant1.id;
      tenant2Id = tenant2.id;

      expect(tenant1Id).toBeDefined();
      expect(tenant2Id).toBeDefined();
      expect(tenant1Id).not.toBe(tenant2Id);

      const [user] = await db
        .insert(users)
        .values({
          email: `user-${timestamp}@tenant-a.test`,
          tenantId: tenant1Id,
          role: 'member',
          name: 'Test User A',
        })
        .returning();

      if (!user) {
        throw new Error('Failed to create test user');
      }

      userId = user.id;
      expect(userId).toBeDefined();
    });
  });

  describe('Cross-Tenant Data Access Prevention', () => {
    it('should set tenant context without error', async () => {
      if (!tenant1Id) {
        throw new Error('tenant1Id not set - previous test may have failed');
      }

      // Verify SET command works
      await expect(
        db.execute(setTenantContext(tenant1Id)),
      ).resolves.not.toThrow();
    });

    it('should block cross-tenant user access via RLS', async () => {
      if (isSuperuser) {
        console.warn('  ⏭️  Skipped: Running as superuser (RLS bypassed)');
        return;
      }

      if (!tenant2Id || !userId) {
        throw new Error('Test data not set - previous test may have failed');
      }

      await db.execute(setTenantContext(tenant2Id));
      const usersInTenant2 = await db.select().from(users);

      const containsTenant1User = usersInTenant2.some((u) => u.id === userId);
      expect(containsTenant1User).toBe(false);
    });

    it('should allow access to own tenant users via RLS', async () => {
      if (!tenant1Id || !userId) {
        throw new Error('Test data not set - previous test may have failed');
      }

      await db.execute(setTenantContext(tenant1Id));
      const usersInTenant1 = await db.select().from(users);

      expect(usersInTenant1.length).toBeGreaterThanOrEqual(1);
      expect(usersInTenant1.some((u) => u.id === userId)).toBe(true);
    });

    it('should enforce RLS on tenant table itself', async () => {
      if (isSuperuser) {
        console.warn('  ⏭️  Skipped: Running as superuser (RLS bypassed)');
        return;
      }

      if (!tenant1Id || !tenant2Id) {
        throw new Error('Test data not set - previous test may have failed');
      }

      await db.execute(setTenantContext(tenant1Id));
      const visibleTenants = await db.select().from(tenants);

      const tenant2Visible = visibleTenants.some((t) => t.id === tenant2Id);
      expect(tenant2Visible).toBe(false);

      const tenant1Visible = visibleTenants.some((t) => t.id === tenant1Id);
      expect(tenant1Visible).toBe(true);
    });

    it('should prevent inserting users into other tenants via WITH CHECK', async () => {
      if (isSuperuser) {
        console.warn('  ⏭️  Skipped: Running as superuser (RLS bypassed)');
        return;
      }

      if (!tenant1Id || !tenant2Id) {
        throw new Error('Test data not set - previous test may have failed');
      }

      await db.execute(setTenantContext(tenant1Id));
      const timestamp = Date.now();

      await expect(
        db.insert(users).values({
          email: `malicious-${timestamp}@attack.test`,
          tenantId: tenant2Id,
          role: 'member',
          name: 'Malicious User',
        }),
      ).rejects.toThrow();
    });
  });

  describe('RLS Policy Edge Cases', () => {
    it('should handle empty tenant context by blocking access', async () => {
      if (isSuperuser) {
        console.warn('  ⏭️  Skipped: Running as superuser (RLS bypassed)');
        return;
      }

      await db.execute(resetTenantContext());

      const visibleUsers = await db.select().from(users);
      const visibleTenants = await db.select().from(tenants);

      const testUserVisible = visibleUsers.some((u) => u.id === userId);
      const testTenantsVisible =
        visibleTenants.some((t) => t.id === tenant1Id) ||
        visibleTenants.some((t) => t.id === tenant2Id);

      expect(testUserVisible).toBe(false);
      expect(testTenantsVisible).toBe(false);
    });

    it('should handle non-existent tenant UUID gracefully', async () => {
      if (isSuperuser) {
        console.warn('  ⏭️  Skipped: Running as superuser (RLS bypassed)');
        return;
      }

      const fakeId = '00000000-0000-0000-0000-000000000000';
      await db.execute(setTenantContext(fakeId));

      const visibleUsers = await db.select().from(users);
      const visibleTenants = await db.select().from(tenants);

      expect(visibleUsers.some((u) => u.id === userId)).toBe(false);
      expect(visibleTenants.some((t) => t.id === tenant1Id)).toBe(false);
      expect(visibleTenants.some((t) => t.id === tenant2Id)).toBe(false);
    });
  });
});
