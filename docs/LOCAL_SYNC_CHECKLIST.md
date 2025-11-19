# Local Synchronization Checklist ✅

## Pre-Sync Verification

### ✅ All Entities Have Cascade Delete Configured

**CASCADE DELETE (11 relationships):**
- ✅ Wallet → User
- ✅ Portfolio → User
- ✅ KycVerification → User
- ✅ Investment → User
- ✅ Investment → Property
- ✅ Reward → User
- ✅ Reward → Investment
- ✅ PaymentMethod → User
- ✅ CardDetails → PaymentMethod
- ✅ Property → Organization
- ✅ OrganizationAdmin → Organization

**SET NULL (5 relationships - for audit preservation):**
- ✅ Transaction → User
- ✅ Transaction → Wallet
- ✅ Transaction → Organization
- ✅ Transaction → Property
- ✅ Transaction → PaymentMethod

**Total: 16/16 relationships configured (100%)** ✅

---

## Synchronize Configuration

### ✅ ormconfig.ts Settings

```typescript
synchronize: process.env.NODE_ENV !== 'production' || process.env.ENABLE_SYNC === 'true'
```

**Behavior:**
- ✅ **Local/Development**: Synchronize enabled automatically
- ✅ **Production**: Synchronize disabled (safe)
- ✅ **Override**: Can enable with `ENABLE_SYNC=true` if needed

---

## Safe Local Sync Steps

### 1. ✅ Verify Environment
```bash
# Make sure NODE_ENV is NOT set to 'production'
echo $NODE_ENV  # Should be empty or 'development'
```

### 2. ✅ Backup Your Local Database (Optional but Recommended)
```bash
# If you have important test data, backup first
pg_dump $DATABASE_URL > backup.sql
```

### 3. ✅ Start Your Application
```bash
npm run start:dev
```

### 4. ✅ Watch for Schema Changes
TypeORM will log schema changes in development mode:
- Creating new tables
- Adding new columns
- Updating foreign key constraints
- Applying cascade delete rules

### 5. ✅ Verify Cascade Constraints
After sync, verify constraints were created:

```sql
-- Check cascade delete constraints
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
  AND rc.delete_rule IN ('CASCADE', 'SET NULL')
ORDER BY tc.table_name;
```

---

## Expected Behavior After Sync

### When You Delete a User:
✅ Wallet deleted (CASCADE)  
✅ Portfolio deleted (CASCADE)  
✅ KYC deleted (CASCADE)  
✅ Investments deleted (CASCADE)  
✅ Rewards deleted (CASCADE)  
✅ PaymentMethods deleted (CASCADE)  
✅ Transactions.userId set to NULL (SET NULL - preserved for audit)

### When You Delete a Property:
✅ Investments deleted (CASCADE)  
✅ Transactions.propertyId set to NULL (SET NULL - preserved for audit)

### When You Delete an Organization:
✅ Properties deleted (CASCADE)  
✅ OrganizationAdmins deleted (CASCADE)  
✅ Transactions.organizationId set to NULL (SET NULL - preserved for audit)

### When You Delete an Investment:
✅ Rewards deleted (CASCADE)

---

## Troubleshooting

### Issue: Foreign Key Constraint Errors
**Solution**: Make sure synchronize ran successfully. Check TypeORM logs for schema creation messages.

### Issue: Tables Not Created
**Solution**: Check that `autoLoadEntities: true` is set in ormconfig.ts

### Issue: Cascade Not Working
**Solution**: Verify constraints in database using the SQL query above. If missing, run the migration manually.

---

## ✅ Ready to Sync!

All entities are configured with cascade delete. You can safely start your local development server and TypeORM will sync the schema automatically.

**No manual migration needed for local development!** 🚀

