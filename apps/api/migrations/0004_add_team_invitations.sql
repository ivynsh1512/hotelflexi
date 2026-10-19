-- 0004_add_team_invitations.sql
-- Enables hotel owners and managers to invite staff members by email.
-- When the invited user signs up or logs in via Google/Email, they are automatically linked to the tenant/property.

CREATE TABLE IF NOT EXISTS team_invitations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'receptionist',
  full_name TEXT,
  invited_by_user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  accepted_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON team_invitations(tenant_id);
