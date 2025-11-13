-- Add password field to users table for traditional JWT authentication
-- This field is nullable to support existing users and optional password-based auth

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL;

-- Add index on email for faster login lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Note: Existing users will have NULL password
-- Users can set password via registration or password reset flow

