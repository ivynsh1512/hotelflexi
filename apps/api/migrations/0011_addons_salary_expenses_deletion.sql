-- Migration 0011: Add-ons, Salary, Expenses, Deletion Requests, and Property Photos

-- 1. Tenant deletion request metadata
ALTER TABLE tenants ADD COLUMN deletion_requested_at TEXT DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN deletion_reason TEXT DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN deletion_status TEXT DEFAULT NULL; -- 'pending', 'approved', 'rejected'

-- 2. Property photos
ALTER TABLE properties ADD COLUMN photos TEXT DEFAULT '[]';

-- 3. Booking Engine Add-ons (e.g. River Rafting, Bungee Jumping, Bonfire, Transfers)
CREATE TABLE IF NOT EXISTS booking_addons (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'activity', -- 'activity', 'adventure', 'transport', 'food', 'wellness', 'other'
  pricing_type TEXT DEFAULT 'per_person', -- 'per_person', 'per_unit', 'per_hour', 'flat', 'free'
  price_paise INTEGER DEFAULT 0, -- 0 = free
  min_qty INTEGER DEFAULT 1,
  max_qty INTEGER DEFAULT 20,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reservation_addons (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  reservation_id TEXT NOT NULL,
  addon_id TEXT NOT NULL,
  addon_name TEXT NOT NULL,
  pricing_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price_paise INTEGER NOT NULL,
  total_price_paise INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 4. Staff Salaries
CREATE TABLE IF NOT EXISTS staff_salaries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  designation TEXT,
  department TEXT DEFAULT 'general', -- 'front_desk', 'housekeeping', 'fnb', 'maintenance', 'security', 'management', 'general'
  monthly_salary_paise INTEGER NOT NULL,
  joining_date TEXT,
  phone TEXT,
  email TEXT,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS salary_payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  staff_salary_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  payment_month TEXT NOT NULL, -- 'YYYY-MM'
  amount_paise INTEGER NOT NULL,
  bonus_paise INTEGER DEFAULT 0,
  deduction_paise INTEGER DEFAULT 0,
  net_paise INTEGER NOT NULL,
  payment_date TEXT NOT NULL,
  payment_mode TEXT DEFAULT 'bank_transfer', -- 'bank_transfer', 'cash', 'upi', 'cheque'
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. General Hotel Expenses
CREATE TABLE IF NOT EXISTS property_expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  category TEXT NOT NULL, -- 'maintenance', 'utilities', 'supplies', 'marketing', 'staff', 'vendor', 'food_beverage', 'other'
  title TEXT NOT NULL,
  description TEXT,
  amount_paise INTEGER NOT NULL,
  expense_type TEXT DEFAULT 'one_time', -- 'one_time', 'monthly', 'annual'
  expense_date TEXT NOT NULL,
  vendor_name TEXT,
  receipt_url TEXT,
  payment_mode TEXT DEFAULT 'cash', -- 'cash', 'bank_transfer', 'upi', 'card'
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_addons_lookup ON booking_addons(property_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_reservation_addons_res ON reservation_addons(reservation_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_salaries_tenant ON staff_salaries(tenant_id, property_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_tenant ON salary_payments(tenant_id, staff_salary_id);
CREATE INDEX IF NOT EXISTS idx_property_expenses_lookup ON property_expenses(tenant_id, property_id, expense_date);
