-- Migration 0010: Production-Grade Multi-Tenant Channel Manager Architecture

-- 1. CHANNEL PROVIDERS CATALOG
CREATE TABLE IF NOT EXISTS channel_providers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'ota',
  documentation_url TEXT,
  supports_rate_push INTEGER DEFAULT 1,
  supports_inventory_push INTEGER DEFAULT 1,
  supports_restriction_push INTEGER DEFAULT 1,
  supports_reservation_pull INTEGER DEFAULT 1,
  supports_webhooks INTEGER DEFAULT 1,
  enabled INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Seed Official Provider Definitions
INSERT OR IGNORE INTO channel_providers (id, code, display_name, provider_type, documentation_url, supports_rate_push, supports_inventory_push, supports_restriction_push, supports_reservation_pull, supports_webhooks, enabled, created_at, updated_at)
VALUES
  ('cp_bcom', 'booking_com', 'Booking.com', 'ota', 'https://developers.booking.com/api', 1, 1, 1, 1, 1, 1, 1729468800, 1729468800),
  ('cp_agoda', 'agoda', 'Agoda', 'ota', 'https://ycs.agoda.com/api', 1, 1, 1, 1, 1, 1, 1729468800, 1729468800),
  ('cp_expedia', 'expedia', 'Expedia Group', 'ota', 'https://developer.expediagroup.com', 1, 1, 1, 1, 1, 1, 1729468800, 1729468800),
  ('cp_mmt', 'makemytrip', 'MakeMyTrip & Goibibo', 'ota', 'https://in.goibibo.com/extranet', 1, 1, 1, 1, 1, 1, 1729468800, 1729468800),
  ('cp_tripadvisor', 'tripadvisor', 'Tripadvisor', 'metasearch', 'https://www.tripadvisor.com/InstantBooking', 1, 1, 1, 1, 0, 1, 1729468800, 1729468800),
  ('cp_airbnb', 'airbnb', 'Airbnb', 'ota', 'https://www.airbnb.com/partner', 1, 1, 1, 1, 1, 1, 1729468800, 1729468800);

-- 2. HOTEL CHANNEL CONNECTIONS
CREATE TABLE IF NOT EXISTS hotel_channel_connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES channel_providers(id) ON DELETE RESTRICT,
  external_property_id TEXT,
  connection_status TEXT NOT NULL DEFAULT 'pending_credentials',
  environment TEXT NOT NULL DEFAULT 'sandbox',
  credentials_encrypted TEXT,
  credentials_version INTEGER DEFAULT 1,
  credential_expires_at INTEGER,
  approved_at INTEGER,
  last_sync_at INTEGER,
  last_successful_sync_at INTEGER,
  consecutive_failures INTEGER DEFAULT 0,
  last_error_code TEXT,
  last_error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(property_id, provider_id)
);
CREATE INDEX IF NOT EXISTS idx_hotel_connections_tenant ON hotel_channel_connections(tenant_id, property_id);
CREATE INDEX IF NOT EXISTS idx_hotel_connections_status ON hotel_channel_connections(connection_status);

-- 3. PROPERTY MAPPINGS
CREATE TABLE IF NOT EXISTS channel_property_mappings (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  external_property_id TEXT NOT NULL,
  mapping_status TEXT NOT NULL DEFAULT 'active',
  verification_status TEXT NOT NULL DEFAULT 'verified',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(connection_id, external_property_id)
);

-- 4. ROOM TYPE MAPPINGS
CREATE TABLE IF NOT EXISTS channel_room_mappings (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  local_room_type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  external_room_type_id TEXT NOT NULL,
  channel_room_name TEXT,
  mapping_status TEXT NOT NULL DEFAULT 'active',
  occupancy_mapping_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(connection_id, local_room_type_id, external_room_type_id)
);
CREATE INDEX IF NOT EXISTS idx_chan_room_map_lookup ON channel_room_mappings(connection_id, local_room_type_id);

-- 5. RATE PLAN MAPPINGS
CREATE TABLE IF NOT EXISTS channel_rate_plan_mappings (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  local_rate_plan_id TEXT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  external_rate_plan_id TEXT NOT NULL,
  external_room_mapping_id TEXT REFERENCES channel_room_mappings(id) ON DELETE SET NULL,
  channel_rate_name TEXT,
  board_basis TEXT DEFAULT 'RO',
  cancellation_policy_mapping TEXT,
  tax_handling TEXT DEFAULT 'exclusive',
  mapping_status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(connection_id, local_rate_plan_id, external_rate_plan_id)
);
CREATE INDEX IF NOT EXISTS idx_chan_rate_map_lookup ON channel_rate_plan_mappings(connection_id, local_rate_plan_id);

-- 6. DURABLE SYNC JOBS OUTBOX
CREATE TABLE IF NOT EXISTS channel_sync_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  payload_reference TEXT,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  scheduled_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  next_retry_at INTEGER,
  http_status INTEGER,
  last_error_code TEXT,
  last_error_message TEXT,
  provider_response_json TEXT,
  correlation_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_exec ON channel_sync_jobs(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_key ON channel_sync_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant_prop ON channel_sync_jobs(tenant_id, property_id, created_at);

-- 7. AUDIT LEDGER EVENTS
CREATE TABLE IF NOT EXISTS channel_sync_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES channel_sync_jobs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  correlation_id TEXT,
  payload_summary TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_events_audit ON channel_sync_events(connection_id, created_at);

-- 8. CHANNEL RESERVATIONS LEDGER
CREATE TABLE IF NOT EXISTS channel_reservations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  external_reservation_id TEXT NOT NULL,
  local_reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
  reservation_status TEXT NOT NULL,
  external_version INTEGER DEFAULT 1,
  external_created_at TEXT,
  external_updated_at TEXT,
  last_processed_at INTEGER NOT NULL,
  payload_hash TEXT NOT NULL,
  raw_payload_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(connection_id, external_reservation_id)
);
CREATE INDEX IF NOT EXISTS idx_chan_res_dedup ON channel_reservations(connection_id, external_reservation_id);

-- 9. RECONCILIATION RECORDS (Discrepancy Tracker)
CREATE TABLE IF NOT EXISTS channel_reconciliation_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  discrepancy_type TEXT NOT NULL,
  stay_date TEXT,
  room_type_id TEXT REFERENCES room_types(id) ON DELETE SET NULL,
  rate_plan_id TEXT REFERENCES rate_plans(id) ON DELETE SET NULL,
  local_value TEXT,
  channel_value TEXT,
  severity TEXT NOT NULL DEFAULT 'warning',
  resolution_status TEXT NOT NULL DEFAULT 'unresolved',
  resolved_by_user_id TEXT,
  resolved_at INTEGER,
  resolution_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reconciliation_query ON channel_reconciliation_records(tenant_id, property_id, resolution_status);
