# Organization Liquidity Tracking Implementation

## ✅ **Overview**

The HMR backend now includes **organization liquidity tracking** to mirror USDT flows when investors buy property tokens. This ensures proper accounting and capital-raising visibility for property developers.

---

## 🔧 **What Was Implemented**

### 1. **Organization Entity Update**
**File**: `src/organizations/entities/organization.entity.ts`

Added a new field to track total raised liquidity:

```typescript
@Column('numeric', { precision: 18, scale: 6, default: 0, transformer: DecimalTransformer })
liquidityUSDT: Decimal;
```

- **Type**: `DECIMAL(18,6)` for financial precision
- **Default**: `0`
- **Transformer**: Uses `DecimalTransformer` for Decimal.js compatibility

---

### 2. **Transaction Entity Update**
**File**: `src/transactions/entities/transaction.entity.ts`

Added nullable foreign key for organization-level inflows:

```typescript
@Index()
@Column({ type: 'uuid', nullable: true })
organizationId?: string | null;
```

Updated transaction type enum to include `'inflow'`:

```typescript
type: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'fee' | 'reward' | 'inflow';
```

---

### 3. **Investment Flow Update**
**File**: `src/investments/investments.service.ts`

Added organization liquidity crediting logic in the `invest()` method:

**Step 9**: Credit liquidity to the organization (property holder)
```typescript
const organization = await manager.findOne(Organization, {
  where: { id: property.organizationId },
  lock: { mode: 'pessimistic_write' },
});
if (!organization) throw new NotFoundException('Organization not found for property');

organization.liquidityUSDT = (organization.liquidityUSDT as Decimal).plus(amountUSDT);
await manager.save(Organization, organization);
```

**Step 10**: Record organization-side transaction (inflow)
```typescript
const orgTxn = manager.create(Transaction, {
  userId: actualUserId,
  walletId: wallet.id,
  organizationId: organization.id,
  type: 'inflow',
  amountUSDT,
  status: 'completed',
  referenceId: savedInvestment.id,
  description: `Liquidity inflow from investment ${invDisplayCode}`,
  displayCode: orgTxnDisplayCode,
});
await manager.save(Transaction, orgTxn);
```

---

### 4. **New API Endpoint**
**File**: `src/organizations/organizations.controller.ts`

Added liquidity analytics endpoint:

```typescript
GET /organizations/:id/liquidity
```

**Response Format**:
```json
{
  "organizationId": "ORG-000001",
  "organizationName": "HMR Builders",
  "liquidityUSDT": "250000.000000",
  "lastUpdated": "2025-10-17T14:32:01.123Z"
}
```

---

## 📊 **Transaction Flow Example**

When an investor buys property tokens:

| Step | Entity | Field Change | Example Value |
|------|--------|--------------|---------------|
| 1 | **Wallet** | `balanceUSDT: 5000 → 2500` | User funds deducted |
| 2 | **Property** | `availableTokens: 1000 → 997.5` | Tokens reduced |
| 3 | **Investment** | New record created | `tokensPurchased: 2.5` |
| 4 | **Transaction** | New 'investment' record | User perspective |
| 5 | **Organization** | `liquidityUSDT: 0 → 2500` | Receives investor USDT |
| 6 | **Transaction** | New 'inflow' record | Organization perspective |

---

## 🔐 **Atomicity & Consistency**

- All operations occur within a **single database transaction**
- **Pessimistic locks** ensure consistency across concurrent investments
- If any step fails, **entire transaction rolls back**
- No partial state updates possible

---

## 🚀 **API Usage Examples**

### 1. **Create Investment** (triggers liquidity flow)
```bash
POST /investments/invest
{
  "userId": "USR-000017",
  "propertyId": "PROP-000003",
  "tokensToBuy": 2.5
}
```

**Result**:
- Investor wallet: `-2500 USDT`
- Property tokens: `-2.5 tokens`
- Organization liquidity: `+2500 USDT`
- 2 transactions created: `investment` + `inflow`

### 2. **Check Organization Liquidity**
```bash
GET /organizations/ORG-000001/liquidity
```

**Response**:
```json
{
  "organizationId": "ORG-000001",
  "organizationName": "HMR Builders",
  "liquidityUSDT": "250000.000000",
  "lastUpdated": "2025-10-17T14:32:01.123Z"
}
```

### 3. **Get Organization Details** (includes liquidity)
```bash
GET /organizations/ORG-000001
```

**Response includes**:
```json
{
  "id": "uuid...",
  "displayCode": "ORG-000001",
  "name": "HMR Builders",
  "liquidityUSDT": "250000.000000",
  ...
}
```

---

## 🎯 **Key Features**

✅ **Dual-sided accounting**: Both investor and organization perspectives tracked  
✅ **Real-time liquidity updates**: Updated atomically with each investment  
✅ **Audit trail**: All inflows recorded in transactions table  
✅ **Financial precision**: `DECIMAL(18,6)` for accurate calculations  
✅ **displayCode support**: Works with both UUIDs and human-readable codes  
✅ **Pessimistic locking**: Prevents race conditions in concurrent investments  

---

## 📈 **Future Enhancements**

Potential additions for advanced analytics:

1. **Per-Property Liquidity Tracking**
   - Add `liquidityRaisedUSDT` to Property entity
   - Track capital raised per property

2. **Liquidity History Endpoint**
   ```
   GET /organizations/:id/liquidity/history
   ```
   - Timeline of liquidity changes
   - Aggregate inflows by time period

3. **Analytics Dashboard Data**
   ```
   GET /organizations/:id/analytics
   ```
   - Total properties
   - Total investments
   - Average investment size
   - Liquidity growth rate

4. **Organization Withdrawals**
   - Track outflows when organizations use raised capital
   - Balance between inflows and outflows

---

## ✅ **Status**

🟢 **Implementation Complete**  
🟢 **Build Successful**  
🟢 **Application Running**  
🟢 **Ready for Testing**

The organization liquidity tracking system is now fully operational and integrated into the investment flow!
