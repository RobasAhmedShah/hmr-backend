-- Migration: Add property documents column to properties table
-- Date: 2025-11-20
-- Description: Adds a JSONB column for storing property-specific documents metadata

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS "documents" JSONB NULL;

COMMENT ON COLUMN properties."documents" IS 'Property-specific documents (metadata, URLs, etc.)';


