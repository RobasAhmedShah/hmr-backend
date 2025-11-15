-- Migration: Add Magic wallet fields to users table
-- Date: 2025-01-12
-- Description: Adds Magic wallet address and DID fields for embedded wallet integration

-- Add Magic wallet address column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "magicWalletAddress" VARCHAR(255) NULL;

-- Add Magic wallet DID column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "magicWalletDid" VARCHAR(500) NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_magic_wallet_address ON users("magicWalletAddress");

-- Add comments for documentation
COMMENT ON COLUMN users."magicWalletAddress" IS 'Magic embedded wallet address (Ethereum address)';
COMMENT ON COLUMN users."magicWalletDid" IS 'Magic wallet Decentralized ID (DID)';

