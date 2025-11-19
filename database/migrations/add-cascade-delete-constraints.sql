-- Migration: Add Cascade Delete to Foreign Key Constraints
-- Date: 2025-01-XX
-- Description: Updates all foreign key constraints to cascade delete child records when parent is deleted
--              For nullable relationships, uses SET NULL to preserve audit records

-- ============================================================================
-- USER-RELATED CASCADE DELETES
-- ============================================================================

-- Wallets → Users: CASCADE DELETE
ALTER TABLE wallets
DROP CONSTRAINT IF EXISTS wallets_userId_fkey,
ADD CONSTRAINT wallets_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Portfolios → Users: CASCADE DELETE
ALTER TABLE portfolio
DROP CONSTRAINT IF EXISTS portfolio_userId_fkey,
ADD CONSTRAINT portfolio_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES users(id) 
ON DELETE CASCADE;

-- KYC Verifications → Users: CASCADE DELETE
ALTER TABLE kyc_verifications
DROP CONSTRAINT IF EXISTS kyc_verifications_userId_fkey,
ADD CONSTRAINT kyc_verifications_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Investments → Users: CASCADE DELETE
ALTER TABLE investments
DROP CONSTRAINT IF EXISTS investments_userId_fkey,
ADD CONSTRAINT investments_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Rewards → Users: CASCADE DELETE
ALTER TABLE rewards
DROP CONSTRAINT IF EXISTS rewards_userId_fkey,
ADD CONSTRAINT rewards_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Transactions → Users: SET NULL (nullable, preserve for audit)
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_userId_fkey,
ADD CONSTRAINT transactions_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES users(id) 
ON DELETE SET NULL;

-- ============================================================================
-- PROPERTY-RELATED CASCADE DELETES
-- ============================================================================

-- Investments → Properties: CASCADE DELETE
ALTER TABLE investments
DROP CONSTRAINT IF EXISTS investments_propertyId_fkey,
ADD CONSTRAINT investments_propertyId_fkey 
FOREIGN KEY ("propertyId") 
REFERENCES properties(id) 
ON DELETE CASCADE;

-- Transactions → Properties: SET NULL (nullable, preserve for audit)
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_propertyId_fkey,
ADD CONSTRAINT transactions_propertyId_fkey 
FOREIGN KEY ("propertyId") 
REFERENCES properties(id) 
ON DELETE SET NULL;

-- ============================================================================
-- ORGANIZATION-RELATED CASCADE DELETES
-- ============================================================================

-- Properties → Organizations: CASCADE DELETE
ALTER TABLE properties
DROP CONSTRAINT IF EXISTS properties_organizationId_fkey,
ADD CONSTRAINT properties_organizationId_fkey 
FOREIGN KEY ("organizationId") 
REFERENCES organizations(id) 
ON DELETE CASCADE;

-- Transactions → Organizations: SET NULL (nullable, preserve for audit)
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_organizationId_fkey,
ADD CONSTRAINT transactions_organizationId_fkey 
FOREIGN KEY ("organizationId") 
REFERENCES organizations(id) 
ON DELETE SET NULL;

-- ============================================================================
-- INVESTMENT-RELATED CASCADE DELETES
-- ============================================================================

-- Rewards → Investments: CASCADE DELETE
ALTER TABLE rewards
DROP CONSTRAINT IF EXISTS rewards_investmentId_fkey,
ADD CONSTRAINT rewards_investmentId_fkey 
FOREIGN KEY ("investmentId") 
REFERENCES investments(id) 
ON DELETE CASCADE;

-- ============================================================================
-- WALLET-RELATED CASCADE DELETES
-- ============================================================================

-- Transactions → Wallets: SET NULL (nullable, preserve for audit)
ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_walletId_fkey,
ADD CONSTRAINT transactions_walletId_fkey 
FOREIGN KEY ("walletId") 
REFERENCES wallets(id) 
ON DELETE SET NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all constraints were created successfully
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  rc.delete_rule,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    tc.table_name IN ('wallets', 'portfolio', 'kyc_verifications', 'investments', 'rewards', 'transactions', 'properties')
    OR ccu.table_name IN ('users', 'properties', 'organizations', 'investments', 'wallets')
  )
ORDER BY tc.table_name, tc.constraint_name;

