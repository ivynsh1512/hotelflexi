-- Migration 0005: Channel Manager Core — Inventory, Restrictions, Sync Engine & Provider Adapters

-- 1. Daily Channel Restrictions Table (Stop-Sell, CTA, CTD, Min/Max Stay)
CREATE TABLE IF NOT EXISTS daily_restrictions (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  rate_plan_id TEXT DEFAULT 'ALL', -- 'ALL' or specific rate_plan id
  date TEXT NOT NULL,              -- YYYY-MM-DD
  closed INTEGER DEFAULT 0,        -- Stop-sell flag (1 = closed/stop-sell, 0 = open)
  closed_to_arrival INTEGER DEFAULT 0,   -- CTA (1 = closed to arrival)
  closed_to_departure INTEGER DEFAULT 0, -- CTD (1 = closed to departure)
  min_stay_arrival INTEGER DEFAULT 1,    -- Minimum length of stay on arrival date
  min_stay_through INTEGER DEFAULT 1,    -- Minimum length of stay through date
  max_stay INTEGER,                      -- Maximum length of stay
  override_inventory INTEGER,            -- Manual inventory cap (NULL = use calculated physical availability)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(room_type_id, rate_plan_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_restrictions_lookup ON daily_restrictions(property_id, room_type_id, date);

-- 2. Daily Rate Plan Price Overrides Table (for specific rate plans on specific dates)
CREATE TABLE IF NOT EXISTS daily_rate_plan_prices (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rate_plan_id TEXT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  price_paise INTEGER NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(rate_plan_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_rate_plan_prices_lookup ON daily_rate_plan_prices(rate_plan_id, date);

-- 3. Enhance Sync Jobs Table for Robust Production Queuing
ALTER TABLE sync_jobs ADD COLUMN idempotency_key TEXT;
ALTER TABLE sync_jobs ADD COLUMN channel_name TEXT;
ALTER TABLE sync_jobs ADD COLUMN room_type_id TEXT;
ALTER TABLE sync_jobs ADD COLUMN rate_plan_id TEXT;
ALTER TABLE sync_jobs ADD COLUMN start_date TEXT;
ALTER TABLE sync_jobs ADD COLUMN end_date TEXT;
ALTER TABLE sync_jobs ADD COLUMN next_retry_at INTEGER;
ALTER TABLE sync_jobs ADD COLUMN http_status INTEGER;
ALTER TABLE sync_jobs ADD COLUMN provider_response TEXT;
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status_retry ON sync_jobs(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_idempotency ON sync_jobs(idempotency_key);

-- 4. Enhance OTA Connections Table
ALTER TABLE ota_connections ADD COLUMN environment TEXT DEFAULT 'sandbox';
ALTER TABLE ota_connections ADD COLUMN last_successful_sync_at INTEGER;
ALTER TABLE ota_connections ADD COLUMN consecutive_failures INTEGER DEFAULT 0;
ALTER TABLE ota_connections ADD COLUMN credentials_json TEXT;
