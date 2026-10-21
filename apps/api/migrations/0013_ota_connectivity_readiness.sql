-- Migration 0013: OTA Connectivity Provider Readiness & Compliance Hardening
-- Adds provider protocol metadata, OAuth 2.0 token lifecycle support,
-- performance composite indexes, and PCI DSS VCC tokenization policies.

-- 1. Enhance Channel Providers Catalog with Protocol & Certification Metadata
ALTER TABLE channel_providers ADD COLUMN api_version TEXT DEFAULT 'v2';
ALTER TABLE channel_providers ADD COLUMN auth_type TEXT DEFAULT 'api_key'; -- 'api_key', 'basic_auth', 'oauth2'
ALTER TABLE channel_providers ADD COLUMN oauth_token_url TEXT;
ALTER TABLE channel_providers ADD COLUMN certification_status TEXT DEFAULT 'pending_certification'; -- 'pending_certification', 'self_certified', 'pilot_active', 'certified_partner'
ALTER TABLE channel_providers ADD COLUMN pci_vcc_supported INTEGER DEFAULT 1;

-- Update existing provider definitions with official protocol specifications
UPDATE channel_providers SET
  api_version = 'ycs_v3_2025',
  auth_type = 'oauth2',
  oauth_token_url = 'https://supply.agoda.com/oauth/token',
  certification_status = 'pending_certification'
WHERE code = 'agoda';

UPDATE channel_providers SET
  api_version = 'eqc_v2',
  auth_type = 'basic_auth',
  certification_status = 'pending_certification'
WHERE code = 'expedia';

UPDATE channel_providers SET
  api_version = 'bxml_v2',
  auth_type = 'basic_auth',
  certification_status = 'onboarding_paused_by_provider'
WHERE code = 'booking_com';

UPDATE channel_providers SET
  api_version = 'ingommt_v1',
  auth_type = 'api_key',
  certification_status = 'enterprise_agreement_required'
WHERE code = 'makemytrip';

-- 2. Enhance Hotel Channel Connections with OAuth Lifecycle & Health Diagnostics
ALTER TABLE hotel_channel_connections ADD COLUMN oauth_access_token_encrypted TEXT;
ALTER TABLE hotel_channel_connections ADD COLUMN oauth_refresh_token_encrypted TEXT;
ALTER TABLE hotel_channel_connections ADD COLUMN oauth_token_expires_at INTEGER;
ALTER TABLE hotel_channel_connections ADD COLUMN health_check_status TEXT DEFAULT 'unknown'; -- 'healthy', 'degraded', 'unreachable', 'auth_expired'
ALTER TABLE hotel_channel_connections ADD COLUMN health_check_at INTEGER;
ALTER TABLE hotel_channel_connections ADD COLUMN pci_compliance_mode TEXT DEFAULT 'vcc_tokenized'; -- 'vcc_tokenized', 'direct_hotel_collection'

-- 3. Composite Performance Indexes for High-Concurrency Synchronizations
CREATE INDEX IF NOT EXISTS idx_sync_jobs_conn_status ON channel_sync_jobs(connection_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_retry_exec ON channel_sync_jobs(status, next_retry_at, attempt_count);
CREATE INDEX IF NOT EXISTS idx_chan_res_prop_dates ON channel_reservations(property_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reservations_room_date_lookup ON reservations(property_id, check_in_date, check_out_date, status);
CREATE INDEX IF NOT EXISTS idx_hotel_connections_health ON hotel_channel_connections(health_check_status);
