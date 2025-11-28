-- Row-Level Security (RLS) Policies for Multi-Tenant Isolation
--
-- Architecture Decision: Tenant Isolation Strategy
-- ================================================
-- Direct RLS: tenants, users (have tenant_id column)
-- Indirect RLS: sessions, oauth_accounts (isolated via user_id -> users.tenant_id)
--
-- Sessions and OAuth accounts are NOT directly tenant-scoped because:
-- 1. Auth.js schema standard doesn't include tenant_id on sessions
-- 2. These tables are user-scoped, and users are tenant-scoped
-- 3. Access control flows: tenant -> user -> session/oauth
--
-- Enforcement: When app.current_tenant_id is set, only users from that
-- tenant are visible, which naturally restricts sessions/oauth to that tenant.
-- Application code must always set app.current_tenant_id in the database
-- session before executing queries.

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy for tenants table (SELECT, UPDATE, DELETE)
-- WITH CHECK ensures inserts/updates also respect tenant boundary
CREATE POLICY tenant_isolation ON tenants
  USING (id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (id = current_setting('app.current_tenant_id', true)::uuid);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy for users table (SELECT, UPDATE, DELETE, INSERT)
CREATE POLICY user_tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Unique constraint on oauth_accounts to prevent duplicate provider links
CREATE UNIQUE INDEX IF NOT EXISTS oauth_accounts_provider_account_idx
  ON oauth_accounts (provider, provider_account_id);
