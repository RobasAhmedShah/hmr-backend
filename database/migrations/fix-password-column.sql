-- Quick Fix: Ensure password column exists and is properly named
-- Run this directly on your Neon database if password column is missing or has wrong case

-- Step 1: Add password column if it doesn't exist (case-insensitive check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND LOWER(column_name) = 'password'
  ) THEN
    ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL;
    RAISE NOTICE 'Password column created';
  ELSE
    RAISE NOTICE 'Password column already exists';
  END IF;
END $$;

-- Step 2: Fix column name case if needed (PostgreSQL is case-sensitive for quoted identifiers)
-- If your column is named "Password" or "PASSWORD", this will rename it to lowercase "password"
DO $$
DECLARE
  col_name TEXT;
BEGIN
  SELECT column_name INTO col_name
  FROM information_schema.columns
  WHERE table_name = 'users' 
  AND LOWER(column_name) = 'password'
  AND column_name != 'password';
  
  IF col_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE users RENAME COLUMN "%s" TO password', col_name);
    RAISE NOTICE 'Renamed column % to password', col_name;
  END IF;
END $$;

-- Step 3: Verify the column exists and show its details
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'password';

-- Step 4: Create index on email if it doesn't exist (for faster login lookups)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

