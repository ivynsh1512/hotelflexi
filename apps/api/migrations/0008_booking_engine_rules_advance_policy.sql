-- ==============================================================================
-- HOTEL FLEXI — BOOKING ENGINE ADVANCE POLICY & PROPERTY RULES
-- Migration: 0008_booking_engine_rules_advance_policy.sql
-- ==============================================================================

ALTER TABLE property_settings ADD COLUMN advance_payment_policy TEXT DEFAULT 'full';
ALTER TABLE property_settings ADD COLUMN advance_payment_percent INTEGER DEFAULT 100;
ALTER TABLE property_settings ADD COLUMN advance_payment_fixed_paise INTEGER DEFAULT 0;
ALTER TABLE property_settings ADD COLUMN booking_engine_terms TEXT;
