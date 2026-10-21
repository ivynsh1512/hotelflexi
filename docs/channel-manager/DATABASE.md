# HotelFlexi Channel Manager — Database Design & Schema
**Specification:** Cloudflare D1 Compatible SQLite Schema  
**Target Migration:** `0010_channel_manager_production.sql`

---

## 1. Overview
The Channel Manager database architecture extends the existing HotelFlexi schema without modifying existing business tables (`properties`, `rooms`, `room_types`, `rate_plans`, `reservations`). It introduces rigorous foreign keys, check constraints, monotonic versioning, and reconciliation audit structures.

---

## 2. Table Specifications

### 2.1 `channel_providers`
Catalog of supported distribution providers and global capabilities.
```sql
CREATE TABLE IF NOT EXISTS channel_providers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- 'booking_com', 'agoda', 'expedia', 'makemytrip', 'tripadvisor'
  display_name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'ota', -- 'ota', 'gds', 'metasearch'
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
```

### 2.2 `hotel_channel_connections` (Enhanced Connection Management)
Stores tenant and property connections with status lifecycle.
```sql
CREATE TABLE IF NOT EXISTS hotel_channel_connections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL REFERENCES channel_providers(id) ON DELETE RESTRICT,
  external_property_id TEXT,
  connection_status TEXT NOT NULL DEFAULT 'pending_credentials',
  -- 'not_configured', 'pending_credentials', 'pending_approval', 'sandbox', 'active', 'paused', 'error', 'revoked'
  environment TEXT NOT NULL DEFAULT 'sandbox', -- 'sandbox' or 'production'
  credentials_encrypted TEXT, -- Tenant-scoped AES-GCM encrypted payload
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
```

### 2.3 `channel_room_mappings`
Maps internal `room_types` to external OTA room IDs.
```sql
CREATE TABLE IF NOT EXISTS channel_room_mappings (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  local_room_type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  external_room_type_id TEXT NOT NULL,
  channel_room_name TEXT,
  mapping_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending_verification', 'disabled'
  occupancy_mapping_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(connection_id, local_room_type_id, external_room_type_id)
);
CREATE INDEX IF NOT EXISTS idx_room_mappings_lookup ON channel_room_mappings(connection_id, local_room_type_id);
```

### 2.4 `channel_rate_plan_mappings`
Maps internal commercial rate plans to external OTA rate identifiers.
```sql
CREATE TABLE IF NOT EXISTS channel_rate_plan_mappings (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  local_rate_plan_id TEXT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  external_rate_plan_id TEXT NOT NULL,
  external_room_mapping_id TEXT REFERENCES channel_room_mappings(id) ON DELETE SET NULL,
  channel_rate_name TEXT,
  board_basis TEXT DEFAULT 'RO', -- 'RO' (Room Only), 'BB' (Bed & Breakfast), 'HB', 'FB'
  cancellation_policy_mapping TEXT,
  tax_handling TEXT DEFAULT 'exclusive',
  mapping_status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(connection_id, local_rate_plan_id, external_rate_plan_id)
);
CREATE INDEX IF NOT EXISTS idx_rate_mappings_lookup ON channel_rate_plan_mappings(connection_id, local_rate_plan_id);
```

### 2.5 `channel_sync_jobs` (Outbox & Queue Ledger)
Durable job queue for asynchronous push operations.
```sql
CREATE TABLE IF NOT EXISTS channel_sync_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'availability_push', 'rates_push', 'restrictions_push', 'full_sync', 'reservation_pull'
  payload_reference TEXT, -- JSON payload or key reference
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'succeeded', 'retry_scheduled', 'failed', 'cancelled'
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
CREATE INDEX IF NOT EXISTS idx_sync_jobs_worker ON channel_sync_jobs(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_idem ON channel_sync_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant ON channel_sync_jobs(tenant_id, property_id, created_at);
```

### 2.6 `channel_sync_events`
Append-only audit trail with correlation tracking.
```sql
CREATE TABLE IF NOT EXISTS channel_sync_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES channel_sync_jobs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'job_created', 'dispatch_attempt', 'dispatch_success', 'dispatch_failure', 'job_deadletter'
  correlation_id TEXT,
  payload_summary TEXT, -- Redacted summary (no credentials or PII)
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_events_conn ON channel_sync_events(connection_id, created_at);
```

### 2.7 `channel_reservations` (OTA Booking Ledger)
Tracks external OTA reservations and ensures zero duplication.
```sql
CREATE TABLE IF NOT EXISTS channel_reservations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  external_reservation_id TEXT NOT NULL,
  local_reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
  reservation_status TEXT NOT NULL, -- 'confirmed', 'modified', 'cancelled'
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
CREATE INDEX IF NOT EXISTS idx_chan_res_lookup ON channel_reservations(connection_id, external_reservation_id);
```

### 2.8 `channel_reconciliation_records`
Persistent ledger for discrepancy detection and automated or manual resolution.
```sql
CREATE TABLE IF NOT EXISTS channel_reconciliation_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  connection_id TEXT NOT NULL REFERENCES hotel_channel_connections(id) ON DELETE CASCADE,
  discrepancy_type TEXT NOT NULL, -- 'inventory_mismatch', 'rate_mismatch', 'missing_external_booking', 'duplicate_event', 'failed_cancellation'
  stay_date TEXT,
  room_type_id TEXT REFERENCES room_types(id) ON DELETE SET NULL,
  rate_plan_id TEXT REFERENCES rate_plans(id) ON DELETE SET NULL,
  local_value TEXT,
  channel_value TEXT,
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  resolution_status TEXT NOT NULL DEFAULT 'unresolved', -- 'unresolved', 'auto_reconciled', 'manually_resolved', 'ignored'
  resolved_by_user_id TEXT,
  resolved_at INTEGER,
  resolution_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reconciliation_lookup ON channel_reconciliation_records(tenant_id, property_id, resolution_status);
```
