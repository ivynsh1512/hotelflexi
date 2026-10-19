-- Migration: 0007_update_subscription_plans_and_growth_website.sql
-- Updates subscription tiers:
-- 1. Free Starter (₹0/mo) with basic PMS & booking engine
-- 2. Essential Plan (₹499/mo) with live Channel Manager, FlexiLink & Siren (granted in 14-day free trial)
-- 3. Growth Plan (₹1,499/mo) with Custom Website & Managed Maintenance included
-- 4. Enterprise Plan (₹3,999/mo)

ALTER TABLE subscription_plans ADD COLUMN has_custom_website INTEGER DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN has_website_maintenance INTEGER DEFAULT 0;
ALTER TABLE feature_entitlements ADD COLUMN has_custom_website INTEGER DEFAULT 0;
ALTER TABLE feature_entitlements ADD COLUMN has_website_maintenance INTEGER DEFAULT 0;

-- 1. Free Starter Plan (₹0 / mo with limitations)
UPDATE subscription_plans SET
  name = 'Free Starter',
  description = 'Free forever for boutique homestays & small guesthouses (manual updates & booking engine)',
  monthly_price_paise = 0,
  annual_price_paise = 0,
  max_properties = 1,
  max_rooms = 10,
  max_users = 2,
  has_pms = 1,
  has_booking_engine = 1,
  has_channel_manager = 0,
  max_channel_connections = 0,
  has_ai_agent = 1,
  ai_monthly_limit = 60,
  has_advanced_reports = 0,
  has_accounting = 0,
  has_multi_property = 0,
  has_custom_website = 0,
  has_website_maintenance = 0,
  is_active = 1,
  sort_order = 1
WHERE id = 'starter';

-- 2. Essential Plan (₹499 / mo - previous starter features transferred forward, given in 14-day free trial)
UPDATE subscription_plans SET
  name = 'Essential',
  description = 'Full-featured PMS with 2-Way Live OTA Channel Manager, FlexiLink & Housekeeping Siren',
  monthly_price_paise = 49900,
  annual_price_paise = 499000,
  max_properties = 1,
  max_rooms = 30,
  max_users = 5,
  has_pms = 1,
  has_booking_engine = 1,
  has_channel_manager = 1,
  max_channel_connections = 4,
  has_ai_agent = 1,
  ai_monthly_limit = 200,
  has_advanced_reports = 1,
  has_accounting = 1,
  has_multi_property = 0,
  has_custom_website = 0,
  has_website_maintenance = 0,
  is_active = 1,
  sort_order = 2
WHERE id = 'essential';

-- 3. Growth Plan (₹1,499 / mo - includes custom website with domain, hosting & maintenance)
UPDATE subscription_plans SET
  name = 'Growth',
  description = 'Best for growing hotels & resorts. Includes Custom Website with Domain, Hosting & Annual Maintenance',
  monthly_price_paise = 149900,
  annual_price_paise = 1499000,
  max_properties = 3,
  max_rooms = 75,
  max_users = 15,
  has_pms = 1,
  has_booking_engine = 1,
  has_channel_manager = 1,
  max_channel_connections = 10,
  has_ai_agent = 1,
  ai_monthly_limit = 600,
  has_advanced_reports = 1,
  has_accounting = 1,
  has_multi_property = 1,
  has_custom_website = 1,
  has_website_maintenance = 1,
  is_active = 1,
  sort_order = 3
WHERE id = 'growth';

-- 4. Enterprise Plan (₹3,999 / mo)
UPDATE subscription_plans SET
  name = 'Enterprise',
  description = 'Tailored hospitality infrastructure with multi-property scale, custom CRS & dedicated account manager',
  monthly_price_paise = 399900,
  annual_price_paise = 3999000,
  max_properties = 999,
  max_rooms = 9999,
  max_users = 999,
  has_pms = 1,
  has_booking_engine = 1,
  has_channel_manager = 1,
  max_channel_connections = 999,
  has_ai_agent = 1,
  ai_monthly_limit = 10000,
  has_advanced_reports = 1,
  has_accounting = 1,
  has_multi_property = 1,
  has_custom_website = 1,
  has_website_maintenance = 1,
  is_active = 1,
  sort_order = 4
WHERE id = 'enterprise';
