-- Migration 0002: Add latitude and longitude to properties table for geo-location
ALTER TABLE properties ADD COLUMN latitude REAL;
ALTER TABLE properties ADD COLUMN longitude REAL;
