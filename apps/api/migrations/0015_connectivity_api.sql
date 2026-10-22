-- Migration 0015: Secure External Connectivity API & Channellyx Readiness
-- Adds connectivity partners, partner property permissions, outbox events,
-- webhook subscriptions, and reservation no-show lifecycle tracking.

-- 1. CONNECTIVITY PARTNERS CATALOG
CREATE TABLE IF NOT EXISTS connectivity_partners (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_code TEXT NOT NULL UNIQUE, -- e.g. 'channellyx', 'siteminder', 'travelclick', 'custom_partner'
  api_key TEXT NOT NULL UNIQUE,      -- e.g. 'hf_live_...' or 'hf_test_...'
  api_secret_hash TEXT NOT NULL,     -- SHA-256 hash of secret
  api_secret_prefix TEXT NOT NULL,   -- First 8 chars of secret for identification
  mode TEXT NOT NULL DEFAULT 'production', -- 'production' or 'sandbox'
  rate_limit_per_minute INTEGER DEFAULT 120,
  webhook_url TEXT,
  webhook_secret TEXT,               -- HMAC signing secret
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conn_partners_key ON connectivity_partners(api_key);
CREATE INDEX IF NOT EXISTS idx_conn_partners_code ON connectivity_partners(partner_code);

-- 2. PARTNER PROPERTY SCOPING & ACCESS CONTROL (Multi-Tenant Isolation)
CREATE TABLE IF NOT EXISTS connectivity_partner_properties (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES connectivity_partners(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  UNIQUE(partner_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_conn_part_prop ON connectivity_partner_properties(partner_id, property_id);

-- 3. CONNECTIVITY OUTBOX (Durable Two-Way Event Dispatcher)
CREATE TABLE IF NOT EXISTS connectivity_outbox (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES connectivity_partners(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'reservation.created', 'reservation.modified', 'reservation.cancelled', 'reservation.no_show', 'rates.updated', 'availability.updated'
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'failed', 'dead_letter'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  next_retry_at INTEGER,
  last_attempt_at INTEGER,
  last_error TEXT,
  idempotency_key TEXT NOT NULL,
  correlation_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conn_outbox_queue ON connectivity_outbox(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_conn_outbox_key ON connectivity_outbox(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_conn_outbox_partner ON connectivity_outbox(partner_id, status);

-- 4. RESERVATIONS LIFECYCLE EXTENSIONS (No-Show & External References)
ALTER TABLE reservations ADD COLUMN no_show_at INTEGER;
ALTER TABLE reservations ADD COLUMN no_show_by TEXT;
ALTER TABLE reservations ADD COLUMN no_show_notes TEXT;
ALTER TABLE reservations ADD COLUMN external_reference_id TEXT;
CREATE INDEX IF NOT EXISTS idx_reservations_external_ref ON reservations(external_reference_id);
