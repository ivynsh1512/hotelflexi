-- ==============================================================================
-- HOTEL FLEXI — DINE-OUT RESTAURANTS, SUPPORT TICKETS, 5-DIGIT CODE & FCM
-- Migration: 0006_dine_out_support_tickets_hotel_code.sql
-- ==============================================================================

-- 1. Add hotel_code to properties
ALTER TABLE properties ADD COLUMN hotel_code TEXT;

-- 2. Property Restaurants (Dine-Out & In-House Dining)
CREATE TABLE IF NOT EXISTS property_restaurants (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cuisine_type TEXT, -- e.g. 'North Indian, Awadhi, Mughlai, Continental'
  is_pure_veg INTEGER DEFAULT 0, -- 1 for 100% Pure Vegetarian
  open_time TEXT DEFAULT '07:00',
  close_time TEXT DEFAULT '23:00',
  meal_slots TEXT, -- JSON array of slots
  seating_capacity INTEGER DEFAULT 40,
  allow_outside_guests INTEGER DEFAULT 1, -- 1 allows guests staying in other resorts/hotels
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_restaurants_property ON property_restaurants(property_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_tenant ON property_restaurants(tenant_id);

-- 3. Restaurant Menu Items
CREATE TABLE IF NOT EXISTS restaurant_menu_items (
  id TEXT PRIMARY KEY,
  restaurant_id TEXT NOT NULL REFERENCES property_restaurants(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Starters', 'Main Course', 'Breads & Rice', 'Desserts', 'Beverages'
  price_paise INTEGER NOT NULL,
  is_veg INTEGER DEFAULT 1, -- 1 for Veg, 0 for Non-Veg
  is_available INTEGER DEFAULT 1,
  description TEXT,
  image_url TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_menu_restaurant ON restaurant_menu_items(restaurant_id);

-- 4. Dine-Out Table & Meal Reservations
CREATE TABLE IF NOT EXISTS dine_out_bookings (
  id TEXT PRIMARY KEY,
  booking_number TEXT UNIQUE NOT NULL, -- e.g. 'DINE-78214'
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL REFERENCES property_restaurants(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  is_inhouse_guest INTEGER DEFAULT 0,
  residing_hotel_name TEXT, -- For outside resort guests
  booking_date TEXT NOT NULL, -- YYYY-MM-DD
  booking_time TEXT NOT NULL, -- HH:MM
  guests_count INTEGER NOT NULL DEFAULT 2,
  special_requests TEXT,
  preordered_items_json TEXT, -- JSON array of items pre-ordered
  total_paise INTEGER DEFAULT 0,
  payment_method TEXT DEFAULT 'pay_at_restaurant', -- 'pay_online' or 'pay_at_restaurant'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  booking_status TEXT DEFAULT 'confirmed', -- 'confirmed', 'seated', 'completed', 'cancelled'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dine_property ON dine_out_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_dine_date ON dine_out_bookings(booking_date);

-- 5. Support Complaints / Tickets from Hoteliers to Super Admin
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL, -- e.g. 'TICK-83921'
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  hotel_code TEXT NOT NULL, -- 5-digit property code
  hotel_name TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  category TEXT NOT NULL, -- 'technical_bug', 'payment_issue', 'channel_sync', 'feature_request', 'other'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  resolution_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tickets_hotel_code ON support_tickets(hotel_code);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON support_tickets(tenant_id);

-- 6. Push Notification Subscriptions & FCM Tokens
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  property_id TEXT,
  user_id TEXT,
  token TEXT UNIQUE NOT NULL,
  device_info TEXT,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_tenant ON push_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
