-- Migration 0018: Add Google Business Profile Review URL to property_settings
ALTER TABLE property_settings ADD COLUMN google_review_url TEXT;
