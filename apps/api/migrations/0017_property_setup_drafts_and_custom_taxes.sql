-- Migration 0017: Property Setup Drafts & Custom Tax Rules
-- Supports AI Natural-Language Property Setup sessions and Custom Percentage/Fixed Taxes

-- 1. Property Setup Drafts (Multi-chunk draft sessions with review & approval)
CREATE TABLE IF NOT EXISTS property_setup_drafts (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_title TEXT DEFAULT 'Property Setup Session',
  status TEXT DEFAULT 'draft', -- 'draft', 'applied', 'discarded'
  raw_input_chunks TEXT, -- JSON array of strings
  extracted_draft TEXT, -- JSON structured draft: propertyDetails, roomCategories, physicalRooms, ratePlans, packages, taxConfiguration, ambiguities
  applied_entities TEXT, -- JSON record of what was created/updated upon user approval
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_setup_drafts_property ON property_setup_drafts(property_id);
CREATE INDEX IF NOT EXISTS idx_setup_drafts_tenant ON property_setup_drafts(tenant_id);

-- 2. Property Tax & Fee Rules (Custom percentage taxes, fixed fees, resort fees, green cess)
CREATE TABLE IF NOT EXISTS property_tax_rules (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tax_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  rate_basis_points INTEGER DEFAULT 0, -- e.g. 500 = 5.00%, 1200 = 12.00%, 1800 = 18.00%
  fixed_amount_paise INTEGER DEFAULT 0, -- e.g. 10000 = ₹100.00
  scope TEXT NOT NULL DEFAULT 'room', -- 'room', 'fnb', 'all'
  frequency TEXT NOT NULL DEFAULT 'per_stay', -- 'per_night', 'per_stay', 'per_guest'
  is_inclusive INTEGER DEFAULT 0, -- 0 = exclusive (added to bill), 1 = inclusive in base tariff
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tax_rules_property ON property_tax_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_tax_rules_tenant ON property_tax_rules(tenant_id);
