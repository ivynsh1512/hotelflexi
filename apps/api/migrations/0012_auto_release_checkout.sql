-- Migration 0012: Instant Room Turnaround on Checkout
ALTER TABLE property_settings ADD COLUMN auto_release_on_checkout INTEGER DEFAULT 1;
