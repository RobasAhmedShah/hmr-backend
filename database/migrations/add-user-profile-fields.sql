-- Migration: Add user profile fields to users table
-- Date: 2025-01-12
-- Description: Adds missing fields for user profile (dob, address, profileImage)

-- Add date of birth column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "dob" DATE NULL;

-- Add address column (text for longer addresses)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "address" TEXT NULL;

-- Add profile image URL column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "profileImage" VARCHAR(500) NULL;

-- Add comments for documentation
COMMENT ON COLUMN users."dob" IS 'Date of birth';
COMMENT ON COLUMN users."address" IS 'User physical address';
COMMENT ON COLUMN users."profileImage" IS 'URL to user profile image';


