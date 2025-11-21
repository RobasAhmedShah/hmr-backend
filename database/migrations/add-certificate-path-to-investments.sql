-- Migration: Add certificatePath column to investments table
-- This column stores the path to the certificate PDF in Supabase storage

-- Add certificatePath column if it doesn't exist
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS "certificatePath" TEXT NULL;

-- Add comment to document the column
COMMENT ON COLUMN investments."certificatePath" IS 'Path to the certificate PDF file in Supabase storage (e.g., transactions/userId/transactionId.pdf)';

-- Verify the column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'investments' 
    AND column_name = 'certificatePath'
  ) THEN
    RAISE NOTICE '✅ certificatePath column added successfully to investments table';
  ELSE
    RAISE EXCEPTION '❌ Failed to add certificatePath column';
  END IF;
END $$;

