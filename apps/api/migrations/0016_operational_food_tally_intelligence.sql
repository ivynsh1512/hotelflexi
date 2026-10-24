-- Migration 0016: Operational Excellence, Food Procurement, TallyPrime & Intelligence
-- Adds food inventory & recipes, TallyPrime accounting connector, marketing campaigns,
-- neutral guest reviews, competitor rate tracking, and room inspection lifecycle.

-- 1. ROOM READINESS & INSPECTION LIFECYCLE
ALTER TABLE rooms ADD COLUMN readiness_status TEXT DEFAULT 'ready'; -- 'dirty', 'cleaning', 'inspected', 'ready', 'maintenance', 'out_of_order'
ALTER TABLE rooms ADD COLUMN inspected_by TEXT;
ALTER TABLE rooms ADD COLUMN inspected_at INTEGER;
ALTER TABLE rooms ADD COLUMN inspection_notes TEXT;

-- 2. FOOD STOCK, RASAN & RECIPE FORECASTING
CREATE TABLE IF NOT EXISTS food_inventory_items (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'staples', -- 'staples', 'vegetables', 'dairy', 'spices', 'oil', 'meat', 'beverages', 'other'
  current_usable_stock REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg', -- 'kg', 'liters', 'packets', 'pieces'
  safety_stock REAL NOT NULL DEFAULT 10,
  minimum_order_quantity REAL NOT NULL DEFAULT 5,
  supplier_lead_days INTEGER NOT NULL DEFAULT 2,
  cost_per_unit_paise INTEGER NOT NULL DEFAULT 0,
  shelf_life_days INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_food_inv_prop ON food_inventory_items(property_id, tenant_id);

CREATE TABLE IF NOT EXISTS food_recipes_assumptions (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES food_inventory_items(id) ON DELETE CASCADE,
  standard_name TEXT NOT NULL, -- e.g. 'Standard Guest Rasan Consumption'
  grams_per_guest REAL NOT NULL, -- e.g. 500 grams (50kg per 100 guests)
  meal_type TEXT DEFAULT 'all', -- 'all', 'breakfast', 'lunch', 'dinner'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_food_rec_prop ON food_recipes_assumptions(property_id, tenant_id);

CREATE TABLE IF NOT EXISTS food_purchase_orders (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  po_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'ordered', 'received', 'cancelled'
  items_json TEXT NOT NULL, -- Array of { itemId, itemName, quantity, unit, costPerUnitPaise, totalPaise }
  total_amount_paise INTEGER NOT NULL DEFAULT 0,
  expected_delivery_date TEXT,
  created_by TEXT,
  approved_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_food_po_prop ON food_purchase_orders(property_id, tenant_id, status);

-- 3. TALLYPRIME ACCOUNTING CONNECTOR & SYNC
CREATE TABLE IF NOT EXISTS tally_connectors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL UNIQUE,
  connector_token TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  tally_port INTEGER NOT NULL DEFAULT 9000,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'disconnected'
  last_sync_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tally_conn_prop ON tally_connectors(property_id, tenant_id);

CREATE TABLE IF NOT EXISTS tally_ledger_mappings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  hotelflexi_category TEXT NOT NULL, -- 'room_revenue', 'food_revenue', 'gst_12', 'gst_18', 'cash', 'bank', 'razorpay'
  tally_ledger_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(property_id, hotelflexi_category)
);

CREATE TABLE IF NOT EXISTS tally_sync_queue (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  voucher_type TEXT NOT NULL, -- 'Sales', 'Receipt', 'Payment', 'Journal'
  entity_type TEXT NOT NULL,  -- 'invoice', 'payment', 'expense', 'refund'
  entity_id TEXT NOT NULL,
  payload_xml TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'synced', 'error'
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tally_queue_prop ON tally_sync_queue(property_id, status);

-- 4. AI MARKETING CAMPAIGNS & ATTRIBUTION
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'instagram', 'google_business', 'sms', 'email'
  content TEXT NOT NULL,
  target_audience TEXT,
  utm_campaign TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'approved', 'published'
  inquiries_count INTEGER NOT NULL DEFAULT 0,
  bookings_count INTEGER NOT NULL DEFAULT 0,
  revenue_generated_paise INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mktg_camp_prop ON marketing_campaigns(property_id, tenant_id);

-- 5. GUEST POST-STAY FEEDBACK & NEUTRAL REVIEWS
CREATE TABLE IF NOT EXISTS guest_reviews (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  reservation_id TEXT,
  guest_name TEXT NOT NULL,
  overall_rating INTEGER NOT NULL DEFAULT 5, -- 1 to 5
  cleanliness_rating INTEGER DEFAULT 5,
  staff_rating INTEGER DEFAULT 5,
  food_rating INTEGER DEFAULT 5,
  comfort_rating INTEGER DEFAULT 5,
  feedback_text TEXT,
  ai_polished_draft TEXT,
  is_private_feedback INTEGER DEFAULT 0,
  google_review_clicked INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_guest_rev_prop ON guest_reviews(property_id, tenant_id);

-- 6. COMPETITOR RATE TRACKING (Owner Rate Shopper)
CREATE TABLE IF NOT EXISTS competitor_rates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  check_date TEXT NOT NULL, -- YYYY-MM-DD
  room_category TEXT NOT NULL,
  observed_rate_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  source_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'verified_public'
  notes TEXT,
  observed_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comp_rates_prop ON competitor_rates(property_id, check_date);
