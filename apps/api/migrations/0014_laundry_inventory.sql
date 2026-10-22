-- Migration 0014: Linen & Laundry Inventory Tracking
-- Allows hotel owners to track bedsheet, pillow, and towel inventory across clean stock, in rooms, and out at laundry vendors

CREATE TABLE IF NOT EXISTS linen_inventory (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'bedding', -- 'bedding', 'towel', 'linen', 'other'
  total_stock INTEGER NOT NULL DEFAULT 0,
  in_rooms INTEGER NOT NULL DEFAULT 0,
  in_stock_clean INTEGER NOT NULL DEFAULT 0,
  in_laundry INTEGER NOT NULL DEFAULT 0,
  discarded INTEGER NOT NULL DEFAULT 0,
  par_level INTEGER NOT NULL DEFAULT 5,
  unit TEXT DEFAULT 'pcs',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_linen_prop_tenant ON linen_inventory(property_id, tenant_id);

CREATE TABLE IF NOT EXISTS laundry_transactions (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  reservation_id TEXT,
  room_number TEXT,
  action_type TEXT NOT NULL, -- 'checkout_laundry', 'checkout_reuse', 'vendor_sent', 'vendor_received', 'stock_adjust'
  items_summary TEXT, -- JSON array or readable summary of items and counts
  total_items INTEGER NOT NULL DEFAULT 0,
  vendor_name TEXT,
  notes TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_laundry_trans_prop ON laundry_transactions(property_id, tenant_id, created_at);
