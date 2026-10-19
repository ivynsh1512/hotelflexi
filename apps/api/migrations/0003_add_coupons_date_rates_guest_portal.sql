-- Migration 0003: Coupons, Date Rates, Guest Portal & FlexiLink, Child Pricing, Custom Gateway

-- 1. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
  discount_value INTEGER NOT NULL, -- percentage basis points (e.g. 1000 = 10%) or flat paise
  min_booking_amount_paise INTEGER DEFAULT 0,
  max_discount_paise INTEGER,
  valid_from TEXT, -- YYYY-MM-DD
  valid_to TEXT,   -- YYYY-MM-DD
  usage_limit INTEGER DEFAULT 100,
  times_used INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(property_id, code)
);
CREATE INDEX IF NOT EXISTS idx_coupons_prop ON coupons(property_id, code, is_active);

-- 2. Daily Custom Rates Overrides
CREATE TABLE IF NOT EXISTS daily_rates (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  price_paise INTEGER NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(room_type_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_rates_lookup ON daily_rates(room_type_id, date);

-- 3. Developer Setup Requests (Rs 499 service)
CREATE TABLE IF NOT EXISTS developer_setup_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  contact_phone TEXT,
  contact_email TEXT,
  amount_paise INTEGER DEFAULT 49900,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'in_progress', 'completed'
  payment_id TEXT,
  razorpay_order_id TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 4. Alter Reservations for FlexiLink & Guest Self Check-in
ALTER TABLE reservations ADD COLUMN guest_portal_token TEXT;
ALTER TABLE reservations ADD COLUMN guest_portal_expires_at INTEGER;
ALTER TABLE reservations ADD COLUMN guest_id_proof_url TEXT;
ALTER TABLE reservations ADD COLUMN guest_id_proof_type TEXT;
ALTER TABLE reservations ADD COLUMN children_id_proof_url TEXT;
ALTER TABLE reservations ADD COLUMN self_checkin_completed INTEGER DEFAULT 0;
ALTER TABLE reservations ADD COLUMN self_checkin_at INTEGER;

-- 5. Alter Properties for Logo, Gallery & Child Pricing
ALTER TABLE properties ADD COLUMN logo_url TEXT;
ALTER TABLE properties ADD COLUMN gallery_images TEXT; -- JSON array of URLs
ALTER TABLE properties ADD COLUMN child_cutoff_age INTEGER DEFAULT 10;
ALTER TABLE properties ADD COLUMN child_rate_paise INTEGER DEFAULT 0;

-- 6. Alter Property Settings for Hotel Owner's Razorpay Gateway
ALTER TABLE property_settings ADD COLUMN razorpay_key_id TEXT;
ALTER TABLE property_settings ADD COLUMN razorpay_key_secret TEXT;
ALTER TABLE property_settings ADD COLUMN razorpay_enabled INTEGER DEFAULT 0;
