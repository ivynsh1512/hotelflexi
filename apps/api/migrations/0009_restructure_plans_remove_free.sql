-- Migration: 0009_restructure_plans_remove_free.sql
-- Restructures HotelFlexi subscription tiers:
-- 1. Free Starter plan is removed/deactivated (is_active = 0)
-- 2. Essential Plan: ₹499/mo (₹4,990/year) — Front-Desk PMS, Direct Booking Engine, Siren Housekeeping, GST, Dine-Out (includes 14-day free trial on signup)
-- 3. Pro Plan: ₹999/mo (₹9,990/year) — 2-Way OTA Live Channel Manager (MMT, Agoda, Booking.com, Airbnb, Expedia), Wedding Engine, Custom Website with Domain & Maintenance
-- 4. Enterprise Plan: ₹1,999/mo (₹19,990/year) — Multi-property chain, white-label apps & custom integrations

-- Deactivate Free Starter Plan
UPDATE subscription_plans SET is_active = 0 WHERE id = 'starter';

-- Update / Insert Essential Plan (₹499/mo)
INSERT OR REPLACE INTO subscription_plans (
  id, name, description, monthly_price_paise, annual_price_paise,
  max_properties, max_rooms, max_users, has_pms, has_booking_engine,
  has_channel_manager, max_channel_connections, has_ai_agent, ai_monthly_limit,
  has_advanced_reports, has_accounting, has_multi_property, has_custom_website,
  has_website_maintenance, is_active, sort_order, created_at, updated_at
) VALUES (
  'essential',
  'Essential',
  'Full-featured PMS Front-Desk, Direct Booking Engine, FlexiLink Self Check-In, Housekeeping Siren, GST Folios & Dine-Out',
  49900,
  499000,
  1,
  30,
  5,
  1,
  1,
  1,
  4,
  1,
  200,
  1,
  1,
  0,
  0,
  0,
  1,
  1,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Update / Insert Pro Plan (₹999/mo - formerly Growth)
INSERT OR REPLACE INTO subscription_plans (
  id, name, description, monthly_price_paise, annual_price_paise,
  max_properties, max_rooms, max_users, has_pms, has_booking_engine,
  has_channel_manager, max_channel_connections, has_ai_agent, ai_monthly_limit,
  has_advanced_reports, has_accounting, has_multi_property, has_custom_website,
  has_website_maintenance, is_active, sort_order, created_at, updated_at
) VALUES (
  'pro',
  'Pro',
  'Everything in Essential plus 2-Way Live OTA Channel Manager, Wedding Engine, Custom Website with Free Domain, Hosting & Maintenance',
  99900,
  999000,
  3,
  75,
  15,
  1,
  1,
  1,
  10,
  1,
  600,
  1,
  1,
  1,
  1,
  1,
  1,
  2,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Mirror growth ID to Pro pricing and features for seamless backwards compatibility
UPDATE subscription_plans SET
  name = 'Pro',
  description = 'Everything in Essential plus 2-Way Live OTA Channel Manager, Wedding Engine, Custom Website with Free Domain, Hosting & Maintenance',
  monthly_price_paise = 99900,
  annual_price_paise = 999000,
  max_rooms = 75,
  max_users = 15,
  has_channel_manager = 1,
  max_channel_connections = 10,
  has_custom_website = 1,
  has_website_maintenance = 1,
  is_active = 1,
  sort_order = 2
WHERE id = 'growth';

-- Update / Insert Enterprise Plan (₹1,999/mo)
INSERT OR REPLACE INTO subscription_plans (
  id, name, description, monthly_price_paise, annual_price_paise,
  max_properties, max_rooms, max_users, has_pms, has_booking_engine,
  has_channel_manager, max_channel_connections, has_ai_agent, ai_monthly_limit,
  has_advanced_reports, has_accounting, has_multi_property, has_custom_website,
  has_website_maintenance, is_active, sort_order, created_at, updated_at
) VALUES (
  'enterprise',
  'Enterprise',
  'Multi-property hotel chain infrastructure, white-label Android mobile app, custom CRS & dedicated technical manager',
  199900,
  1999000,
  999,
  9999,
  999,
  1,
  1,
  1,
  999,
  1,
  10000,
  1,
  1,
  1,
  1,
  1,
  1,
  3,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
