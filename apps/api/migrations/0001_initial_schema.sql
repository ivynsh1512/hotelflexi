-- ==============================================================================
-- HOTEL FLEXI — D1 INITIAL DATABASE SCHEMA MIGRATION
-- Migration: 0001_initial_schema.sql
-- ==============================================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  email_verified INTEGER DEFAULT 0,
  is_platform_admin INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price_paise INTEGER NOT NULL,
  annual_price_paise INTEGER NOT NULL,
  max_properties INTEGER DEFAULT 1,
  max_rooms INTEGER DEFAULT 10,
  max_users INTEGER DEFAULT 2,
  has_pms INTEGER DEFAULT 1,
  has_booking_engine INTEGER DEFAULT 1,
  has_channel_manager INTEGER DEFAULT 0,
  max_channel_connections INTEGER DEFAULT 0,
  has_ai_agent INTEGER DEFAULT 1,
  ai_monthly_limit INTEGER DEFAULT 100,
  has_advanced_reports INTEGER DEFAULT 0,
  has_accounting INTEGER DEFAULT 0,
  has_multi_property INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 3. TENANTS
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  account_access_status TEXT DEFAULT 'active', -- 'active', 'suspended', 'locked', 'past_due'
  suspension_reason TEXT,
  subscription_status TEXT DEFAULT 'trial', -- 'trial', 'active', 'past_due', 'grace_period', 'suspended', 'cancelled', 'expired'
  current_plan_id TEXT REFERENCES subscription_plans(id),
  trial_ends_at INTEGER,
  current_period_ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(account_access_status);

-- 4. TENANT MEMBERSHIPS
CREATE TABLE IF NOT EXISTS tenant_memberships (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'owner', 'manager', 'receptionist', 'accountant', 'housekeeping', 'read_only'
  permissions TEXT, -- Optional JSON overrides
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON tenant_memberships(tenant_id);

-- 5. FEATURE ENTITLEMENTS
CREATE TABLE IF NOT EXISTS feature_entitlements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  max_properties INTEGER NOT NULL,
  max_rooms INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  has_pms INTEGER NOT NULL,
  has_booking_engine INTEGER NOT NULL,
  has_channel_manager INTEGER NOT NULL,
  max_channel_connections INTEGER NOT NULL,
  has_ai_agent INTEGER NOT NULL,
  ai_monthly_limit INTEGER NOT NULL,
  has_advanced_reports INTEGER NOT NULL,
  has_accounting INTEGER NOT NULL,
  has_multi_property INTEGER NOT NULL,
  custom_overrides_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 6. PROPERTIES
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  currency TEXT DEFAULT 'INR',
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '11:00',
  cancellation_policy TEXT,
  description TEXT,
  amenities TEXT, -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);

-- 7. PROPERTY SETTINGS
CREATE TABLE IF NOT EXISTS property_settings (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE UNIQUE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gst_number TEXT,
  gst_rate_standard INTEGER DEFAULT 1200, -- 12.00%
  gst_rate_luxury INTEGER DEFAULT 1800,   -- 18.00%
  invoice_prefix TEXT DEFAULT 'HF-',
  next_invoice_number INTEGER DEFAULT 1001,
  enable_online_booking INTEGER DEFAULT 1,
  payment_terms TEXT,
  bank_account_details TEXT, -- JSON
  upi_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 8. ROOM TYPES
CREATE TABLE IF NOT EXISTS room_types (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  base_occupancy INTEGER DEFAULT 2,
  max_occupancy INTEGER DEFAULT 3,
  base_price_paise INTEGER NOT NULL,
  weekend_price_paise INTEGER,
  extra_adult_price_paise INTEGER DEFAULT 0,
  extra_child_price_paise INTEGER DEFAULT 0,
  description TEXT,
  amenities TEXT, -- JSON
  images TEXT, -- JSON
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_room_types_property ON room_types(property_id);

-- 9. ROOMS
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  room_number TEXT NOT NULL,
  floor TEXT,
  status TEXT DEFAULT 'available', -- 'available', 'occupied', 'reserved', 'maintenance', 'blocked', 'dirty'
  housekeeping_status TEXT DEFAULT 'clean', -- 'clean', 'dirty', 'inspected', 'in_progress'
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(property_id, room_number)
);
CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- 10. RATE PLANS
CREATE TABLE IF NOT EXISTS rate_plans (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_type_id TEXT REFERENCES room_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  meal_plan TEXT DEFAULT 'EP',
  price_multiplier INTEGER DEFAULT 100, -- percentage
  surcharge_paise INTEGER DEFAULT 0,
  is_non_refundable INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 11. ROOM BLOCKS
CREATE TABLE IF NOT EXISTS room_blocks (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL, -- YYYY-MM-DD inclusive
  end_date TEXT NOT NULL,   -- YYYY-MM-DD exclusive
  reason TEXT NOT NULL,     -- 'maintenance', 'owner_use', 'deep_cleaning', 'event', 'renovation'
  notes TEXT,
  created_by_user_id TEXT REFERENCES users(id),
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_room_blocks_lookup ON room_blocks(room_id, start_date, end_date, is_active);

-- 12. RESERVATIONS
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_number TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'direct', -- 'direct', 'walk_in', 'booking_engine', 'booking_com', 'agoda', 'makemytrip', 'phone'
  ota_reservation_id TEXT,
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  room_type_id TEXT NOT NULL REFERENCES room_types(id),
  rate_plan_id TEXT REFERENCES rate_plans(id),
  check_in_date TEXT NOT NULL,  -- YYYY-MM-DD inclusive
  check_out_date TEXT NOT NULL, -- YYYY-MM-DD exclusive
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  nightly_rate_paise INTEGER NOT NULL,
  total_room_charge_paise INTEGER NOT NULL,
  total_tax_paise INTEGER NOT NULL,
  total_discount_paise INTEGER DEFAULT 0,
  total_amount_paise INTEGER NOT NULL,
  paid_amount_paise INTEGER DEFAULT 0,
  balance_amount_paise INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'partially_paid', 'paid', 'refunded'
  cancellation_reason TEXT,
  cancelled_at INTEGER,
  special_requests TEXT,
  check_in_time_actual INTEGER,
  check_out_time_actual INTEGER,
  created_by_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reservations_lookup ON reservations(property_id, check_in_date, check_out_date, status);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON reservations(room_id, status);

-- 13. RESERVATION GUESTS
CREATE TABLE IF NOT EXISTS reservation_guests (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_primary INTEGER DEFAULT 1,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  id_type TEXT,
  id_number_masked TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'India',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reservation_guests_res ON reservation_guests(reservation_id);

-- 14. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'issued', -- 'draft', 'issued', 'paid', 'void', 'partially_paid'
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_gstin TEXT,
  issue_date TEXT NOT NULL,
  due_date TEXT,
  subtotal_paise INTEGER NOT NULL,
  cgst_paise INTEGER DEFAULT 0,
  sgst_paise INTEGER DEFAULT 0,
  igst_paise INTEGER DEFAULT 0,
  total_tax_paise INTEGER NOT NULL,
  discount_paise INTEGER DEFAULT 0,
  total_amount_paise INTEGER NOT NULL,
  paid_amount_paise INTEGER DEFAULT 0,
  balance_amount_paise INTEGER NOT NULL,
  tax_snapshot_json TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(property_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_invoices_prop ON invoices(property_id);

-- 15. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price_paise INTEGER NOT NULL,
  amount_paise INTEGER NOT NULL,
  tax_rate_basis_points INTEGER DEFAULT 1200,
  tax_amount_paise INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv ON invoice_items(invoice_id);

-- 16. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'upi', 'card', 'bank_transfer', 'razorpay'
  amount_paise INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'captured', -- 'pending', 'authorized', 'captured', 'failed', 'refunded'
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  reference_number TEXT,
  notes TEXT,
  recorded_by_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_res ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(property_id, created_at);

-- 17. RESERVATION PAYMENTS (Junction/Tracking)
CREATE TABLE IF NOT EXISTS reservation_payments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- 18. REFUNDS
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
  invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL,
  amount_paise INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'processed',
  gateway_refund_id TEXT,
  processed_by_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 19. EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- 20. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  vendor_name TEXT,
  description TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  expense_date TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  receipt_reference TEXT,
  created_by_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expenses_prop_date ON expenses(property_id, expense_date);

-- 21. HOUSEKEEPING TASKS
CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  task_type TEXT DEFAULT 'cleaning',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'verified'
  assigned_to_user_id TEXT REFERENCES users(id),
  scheduled_date TEXT NOT NULL,
  notes TEXT,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_housekeeping_status ON housekeeping_tasks(property_id, status);

-- 22. MAINTENANCE TICKETS
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'waiting_parts', 'resolved', 'closed'
  assigned_to_user_id TEXT REFERENCES users(id),
  resolved_at INTEGER,
  cost_paise INTEGER DEFAULT 0,
  created_by_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 23. COMPLAINTS
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  room_number TEXT,
  category TEXT DEFAULT 'service',
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'escalated'
  resolution_notes TEXT,
  resolved_by_user_id TEXT REFERENCES users(id),
  resolved_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 24. OTA CONNECTIONS
CREATE TABLE IF NOT EXISTS ota_connections (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL, -- 'booking_com', 'agoda', 'makemytrip', 'expedia', 'airbnb'
  status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error', 'pending_verification'
  hotel_channel_id TEXT,
  sync_rate_enabled INTEGER DEFAULT 1,
  sync_inventory_enabled INTEGER DEFAULT 1,
  sync_bookings_enabled INTEGER DEFAULT 1,
  last_sync_at INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(property_id, channel_name)
);

-- 25. OTA ROOM MAPPINGS
CREATE TABLE IF NOT EXISTS ota_room_mappings (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES ota_connections(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  local_room_type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  channel_room_type_id TEXT NOT NULL,
  channel_room_name TEXT,
  created_at INTEGER NOT NULL
);

-- 26. OTA RATE MAPPINGS
CREATE TABLE IF NOT EXISTS ota_rate_mappings (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES ota_connections(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  local_rate_plan_id TEXT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  channel_rate_plan_id TEXT NOT NULL,
  channel_rate_name TEXT,
  created_at INTEGER NOT NULL
);

-- 27. SYNC JOBS
CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES ota_connections(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  payload TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  started_at INTEGER,
  finished_at INTEGER,
  created_at INTEGER NOT NULL
);

-- 28. SYNC EVENTS
CREATE TABLE IF NOT EXISTS sync_events (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES sync_jobs(id) ON DELETE SET NULL,
  connection_id TEXT NOT NULL REFERENCES ota_connections(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at INTEGER NOT NULL
);

-- 29. CHANNEL BOOKINGS
CREATE TABLE IF NOT EXISTS channel_bookings (
  id TEXT PRIMARY KEY,
  connection_id TEXT NOT NULL REFERENCES ota_connections(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
  channel_booking_ref TEXT NOT NULL,
  channel_status TEXT NOT NULL,
  raw_payload TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(connection_id, channel_booking_ref)
);

-- 30. AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Assistant Conversation',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 31. AI MESSAGES
CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls_json TEXT,
  tool_results_json TEXT,
  created_at INTEGER NOT NULL
);

-- 32. AI ACTION LOGS
CREATE TABLE IF NOT EXISTS ai_action_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  input_params_json TEXT,
  output_result_json TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at INTEGER NOT NULL
);

-- 33. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  billing_cycle TEXT DEFAULT 'monthly',
  amount_paise INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  start_date INTEGER NOT NULL,
  current_period_start INTEGER NOT NULL,
  current_period_end INTEGER NOT NULL,
  cancel_at_period_end INTEGER DEFAULT 0,
  gateway_subscription_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 34. SUBSCRIPTION EVENTS
CREATE TABLE IF NOT EXISTS subscription_events (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details_json TEXT,
  created_at INTEGER NOT NULL
);

-- 35. PLATFORM EXPENSES (NovaX AI HotelFlexi Platform Expenses)
CREATE TABLE IF NOT EXISTS platform_expenses (
  id TEXT PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  category TEXT NOT NULL,
  invoice_ref TEXT,
  amount_paise INTEGER NOT NULL,
  tax_paise INTEGER DEFAULT 0,
  expense_date TEXT NOT NULL,
  payment_status TEXT DEFAULT 'paid',
  is_recurring INTEGER DEFAULT 0,
  notes TEXT,
  approved_by_admin TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 36. PLATFORM FINANCIAL EVENTS
CREATE TABLE IF NOT EXISTS platform_financial_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount_paise INTEGER NOT NULL,
  fee_paise INTEGER DEFAULT 0,
  net_paise INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  gateway_reference TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);

-- 37. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT,
  actor_type TEXT DEFAULT 'user',
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values_json TEXT,
  new_values_json TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at);

-- 38. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'system',
  link_url TEXT,
  is_read INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- 39. WEBHOOK EVENTS
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'processed',
  processed_at INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(source, event_id)
);

-- 40. IDEMPOTENCY RECORDS
CREATE TABLE IF NOT EXISTS idempotency_records (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  tenant_id TEXT,
  endpoint TEXT NOT NULL,
  request_hash TEXT,
  response_status INTEGER NOT NULL,
  response_body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_records(idempotency_key);

-- ==============================================================================
-- INITIAL SEED: SUBSCRIPTION PLANS
-- Starter (₹499), Essential (₹999), Growth (₹2,499), Pro (₹4,999), Enterprise (₹9,999+)
-- ==============================================================================
INSERT OR IGNORE INTO subscription_plans (
  id, name, description, monthly_price_paise, annual_price_paise,
  max_properties, max_rooms, max_users, has_pms, has_booking_engine,
  has_channel_manager, max_channel_connections, has_ai_agent, ai_monthly_limit,
  has_advanced_reports, has_accounting, has_multi_property, is_active, sort_order,
  created_at, updated_at
) VALUES 
('starter', 'Starter', 'Perfect for small homestays & boutique guesthouses', 49900, 499000, 1, 10, 2, 1, 1, 0, 0, 1, 50, 0, 0, 0, 1, 1, 1776550000, 1776550000),
('essential', 'Essential', 'Ideal for budget hotels & serviced apartments', 99900, 999000, 1, 25, 5, 1, 1, 1, 2, 1, 200, 1, 1, 0, 1, 2, 1776550000, 1776550000),
('growth', 'Growth', 'Best for growing mid-scale hotels & resorts', 249900, 2499000, 2, 60, 12, 1, 1, 1, 5, 1, 500, 1, 1, 1, 1, 3, 1776550000, 1776550000),
('pro', 'Pro', 'Complete power solution for busy hotels & chains', 499900, 4999000, 5, 150, 25, 1, 1, 1, 15, 1, 2000, 1, 1, 1, 1, 4, 1776550000, 1776550000),
('enterprise', 'Enterprise', 'Tailored hospitality infrastructure with multi-property scale', 999900, 9999000, 999, 9999, 999, 1, 1, 1, 999, 1, 10000, 1, 1, 1, 1, 5, 1776550000, 1776550000);
