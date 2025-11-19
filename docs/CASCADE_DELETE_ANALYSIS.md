# Cascade Delete Analysis

## Current Status: **PARTIAL** Cascade Delete Implementation

Your system has **cascade delete configured for only 3 relationships** out of many. Most foreign key relationships do NOT have cascade delete enabled.

---

## ✅ Relationships WITH Cascade Delete

### 1. PaymentMethod → User
```typescript
// src/payment-methods/entities/payment-method.entity.ts
@ManyToOne(() => User, (user) => user.paymentMethods, { onDelete: 'CASCADE' })
```
**Behavior**: When a User is deleted, all their PaymentMethods are automatically deleted.

### 2. CardDetails → PaymentMethod
```typescript
// src/payment-methods/entities/card-details.entity.ts
@ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.cardDetails, { onDelete: 'CASCADE' })
```
**Behavior**: When a PaymentMethod is deleted, its CardDetails are automatically deleted.

### 3. OrganizationAdmin → Organization
```typescript
// src/organization-admins/entities/organization-admin.entity.ts
@ManyToOne(() => Organization, { onDelete: 'CASCADE' })
```
**Behavior**: When an Organization is deleted, all its OrganizationAdmins are automatically deleted.

---

## ❌ Relationships WITHOUT Cascade Delete

### User-Related (Child → Parent)
These entities reference User but will NOT be deleted when User is deleted:

1. **Wallet → User** ❌
   - Location: `src/wallet/entities/wallet.entity.ts`
   - Current: `@ManyToOne(() => User)` (no cascade)
   - **Issue**: Deleting a user leaves orphaned wallet records

2. **Portfolio → User** ❌
   - Location: `src/portfolio/entities/portfolio.entity.ts`
   - Current: `@ManyToOne(() => User)` (no cascade)
   - **Issue**: Deleting a user leaves orphaned portfolio records

3. **KycVerification → User** ❌
   - Location: `src/kyc/entities/kyc-verification.entity.ts`
   - Current: `@ManyToOne(() => User)` (no cascade)
   - **Issue**: Deleting a user leaves orphaned KYC records

4. **Investment → User** ❌
   - Location: `src/investments/entities/investment.entity.ts`
   - Current: `@ManyToOne(() => User)` (no cascade)
   - **Issue**: Deleting a user leaves orphaned investment records

5. **Reward → User** ❌
   - Location: `src/rewards/entities/reward.entity.ts`
   - Current: `@ManyToOne(() => User)` (no cascade)
   - **Issue**: Deleting a user leaves orphaned reward records

6. **Transaction → User** ❌
   - Location: `src/transactions/entities/transaction.entity.ts`
   - Current: `@ManyToOne(() => User, { nullable: true })` (no cascade)
   - **Issue**: Deleting a user leaves orphaned transaction records

### Property-Related

7. **Investment → Property** ❌
   - Location: `src/investments/entities/investment.entity.ts`
   - Current: `@ManyToOne(() => Property)` (no cascade)
   - **Issue**: Deleting a property leaves orphaned investment records

8. **Transaction → Property** ❌
   - Location: `src/transactions/entities/transaction.entity.ts`
   - Current: `@ManyToOne(() => Property, { nullable: true })` (no cascade)
   - **Issue**: Deleting a property leaves orphaned transaction records

### Organization-Related

9. **Property → Organization** ❌
   - Location: `src/properties/entities/property.entity.ts`
   - Current: `@ManyToOne(() => Organization)` (no cascade)
   - **Issue**: Deleting an organization leaves orphaned property records

10. **Transaction → Organization** ❌
    - Location: `src/transactions/entities/transaction.entity.ts`
    - Current: `@ManyToOne(() => Organization, { nullable: true })` (no cascade)
    - **Issue**: Deleting an organization leaves orphaned transaction records

### Investment-Related

11. **Reward → Investment** ❌
    - Location: `src/rewards/entities/reward.entity.ts`
    - Current: `@ManyToOne(() => Investment)` (no cascade)
    - **Issue**: Deleting an investment leaves orphaned reward records

### Wallet-Related

12. **Transaction → Wallet** ❌
    - Location: `src/transactions/entities/transaction.entity.ts`
    - Current: `@ManyToOne(() => Wallet, { nullable: true })` (no cascade)
    - **Issue**: Deleting a wallet leaves orphaned transaction records

---

## What Happens When You Delete a Parent?

### Current Behavior (Without Cascade)

When you delete a parent record (e.g., User), the database will:

1. **If child records exist**: PostgreSQL will **REJECT the delete** with a foreign key constraint error:
   ```
   ERROR: update or delete on table "users" violates foreign key constraint
   DETAIL: Key (id)=(xxx) is still referenced from table "wallets".
   ```

2. **If child records don't exist**: The delete will succeed, but this is rare in practice.

### With Cascade Delete Enabled

When cascade delete is enabled, deleting a parent will:
- ✅ Automatically delete all child records
- ✅ No foreign key constraint errors
- ✅ Clean deletion of related data

---

## Recommendations

### Option 1: Add Cascade Delete (Recommended for Most Cases)

Add `{ onDelete: 'CASCADE' }` to relationships where child records should be deleted when parent is deleted:

```typescript
// Example: Wallet → User
@ManyToOne(() => User, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'userId' })
user: User;
```

**When to use**: When child records have no meaning without the parent (e.g., Wallet without User, Portfolio without User).

### Option 2: Soft Delete (Alternative)

Instead of hard deletes, mark records as deleted:

```typescript
@Column({ type: 'boolean', default: false })
isDeleted: boolean;
```

**When to use**: When you need to preserve historical data (e.g., Transactions, Investments for audit purposes).

### Option 3: Set NULL (For Optional Relationships)

For nullable foreign keys, you might want to set them to NULL instead of deleting:

```typescript
@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
```

**When to use**: When the relationship is optional and child records should remain (e.g., Transaction → User for system transactions).

---

## Migration Required

If you want to add cascade delete to existing relationships, you'll need to:

1. **Update Entity Files**: Add `{ onDelete: 'CASCADE' }` to `@ManyToOne` decorators
2. **Create Migration**: Update foreign key constraints in the database
3. **Test**: Verify cascade behavior works as expected

### Example Migration SQL

```sql
-- Add cascade delete to wallets → users
ALTER TABLE wallets
DROP CONSTRAINT IF EXISTS wallets_userId_fkey,
ADD CONSTRAINT wallets_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Add cascade delete to portfolios → users
ALTER TABLE portfolios
DROP CONSTRAINT IF EXISTS portfolios_userId_fkey,
ADD CONSTRAINT portfolios_userId_fkey 
FOREIGN KEY ("userId") 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Repeat for other relationships...
```

---

## Summary

| Category | With Cascade | Without Cascade | Total |
|----------|-------------|-----------------|-------|
| User Children | 1 (PaymentMethod) | 5 (Wallet, Portfolio, KYC, Investment, Reward, Transaction) | 6 |
| Property Children | 0 | 2 (Investment, Transaction) | 2 |
| Organization Children | 1 (OrgAdmin) | 2 (Property, Transaction) | 3 |
| Investment Children | 0 | 1 (Reward) | 1 |
| Wallet Children | 0 | 1 (Transaction) | 1 |
| PaymentMethod Children | 1 (CardDetails) | 0 | 1 |
| **TOTAL** | **3** | **11** | **14** |

**Current Cascade Coverage: 21% (3/14 relationships)**

---

## Next Steps

1. **Decide on deletion strategy** for each relationship
2. **Add cascade delete** where appropriate
3. **Create migrations** to update database constraints
4. **Test cascade behavior** thoroughly
5. **Document** which relationships cascade and which don't

