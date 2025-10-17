# Transaction Entity Traceability Implementation

## ✅ **Overview**

The HMR backend now includes **comprehensive transaction traceability** with:
- Organization foreign key relationships
- Human-readable sender/receiver tracking (`fromEntity`, `toEntity`)
- Bidirectional relation support (Organization ↔ Transactions)
- Property reference tracking

---

## 🔧 **What Was Implemented**

### 1. **Transaction Entity Enhancements**
**File**: `src/transactions/entities/transaction.entity.ts`

#### **New Fields Added:**

```typescript
// Organization FK with indexed relation
@Index('IDX_transactions_organization')
@Column({ type: 'uuid', nullable: true })
organizationId?: string | null;

@ManyToOne(() => Organization, org => org.transactions, { nullable: true })
@JoinColumn({ name: 'organizationId' })
organization?: Organization;

// Property FK
@Index()
@Column({ type: 'uuid', nullable: true })
propertyId?: string | null;

@ManyToOne(() => Property, { nullable: true })
@JoinColumn({ name: 'propertyId' })
property?: Property;

// Human-readable traceability fields
@Column({ type: 'varchar', length: 128, nullable: true })
fromEntity?: string | null;  // Sender name (e.g., "Ali Khan")

@Column({ type: 'varchar', length: 128, nullable: true })
toEntity?: string | null;    // Receiver name (e.g., "HMR Builders")
```

#### **Updated Fields:**

```typescript
// Made userId and walletId nullable for organization transactions
@Column({ type: 'uuid', nullable: true })
userId?: string | null;

@Column({ type: 'uuid', nullable: true })
walletId?: string | null;
```

---

### 2. **Organization Entity Update**
**File**: `src/organizations/entities/organization.entity.ts`

Added reverse relation to access all organization transactions:

```typescript
@OneToMany(() => Transaction, txn => txn.organization)
transactions?: Transaction[];
```

**Benefits:**
- Direct access to all transactions via `organization.transactions`
- Supports eager/lazy loading
- Enables efficient querying with TypeORM relations

---

### 3. **Investment Flow Updates**
**File**: `src/investments/investments.service.ts`

#### **Enhanced User Fetching:**

```typescript
let user: User;
if (!isUserIdUuid) {
  const foundUser = await manager.findOne(User, { where: { displayCode: userId } });
  if (!foundUser) throw new NotFoundException('User not found');
  user = foundUser;
  actualUserId = user.id;
} else {
  const foundUser = await manager.findOne(User, { where: { id: userId } });
  if (!foundUser) throw new NotFoundException('User not found');
  user = foundUser;
}
```

#### **Transaction Creation with Traceability:**

```typescript
// Get display names for traceability
const userDisplayName = user.fullName || user.email;
const orgDisplayName = organization.name;

// User-side transaction
const txn = manager.create(Transaction, {
  userId: actualUserId,
  walletId: wallet.id,
  organizationId: organization.id,
  propertyId: property.id,
  type: 'investment',
  amountUSDT,
  status: 'completed',
  referenceId: savedInvestment.id,
  description: `Investment in ${property.title}`,
  fromEntity: userDisplayName,  // "Ali Khan" or "user@example.com"
  toEntity: orgDisplayName,      // "HMR Builders"
  displayCode: txnDisplayCode,
});

// Organization-side transaction (inflow)
const orgTxn = manager.create(Transaction, {
  userId: actualUserId,
  walletId: wallet.id,
  organizationId: organization.id,
  propertyId: property.id,
  type: 'inflow',
  amountUSDT,
  status: 'completed',
  referenceId: savedInvestment.id,
  description: `Liquidity inflow from ${userDisplayName}`,
  fromEntity: userDisplayName,
  toEntity: orgDisplayName,
  displayCode: orgTxnDisplayCode,
});
```

---

### 4. **New API Endpoints**

#### **GET /organizations/:id/transactions**
**File**: `src/organizations/organizations.controller.ts`

Fetch all transactions for an organization:

```typescript
@Get(':id/transactions')
async getTransactions(@Param('id') id: string) {
  const transactions = await this.organizationsService.findTransactions(id);
  return { success: true, transactions };
}
```

**Response Example:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid...",
      "displayCode": "TXN-000005",
      "type": "inflow",
      "amountUSDT": "2500.000000",
      "fromEntity": "Ali Khan",
      "toEntity": "HMR Builders",
      "propertyId": "uuid...",
      "status": "completed",
      "description": "Liquidity inflow from Ali Khan",
      "createdAt": "2025-10-17T14:32:01.123Z"
    }
  ]
}
```

---

## 📊 **Transaction Flow Example**

When **Ali Khan** invests **2500 USDT** in **Marina View Residences** (owned by **HMR Builders**):

### **Database Records Created:**

| Entity | Field | Value |
|--------|-------|-------|
| **Wallet** | `balanceUSDT` | `5000 → 2500` |
| **Property** | `availableTokens` | `1000 → 997.5` |
| **Organization** | `liquidityUSDT` | `0 → 2500` |
| **Investment** | `tokensPurchased` | `2.5` |
| **Transaction #1** (User) | `type` | `'investment'` |
| | `fromEntity` | `'Ali Khan'` |
| | `toEntity` | `'HMR Builders'` |
| | `organizationId` | `org-uuid` |
| | `propertyId` | `prop-uuid` |
| **Transaction #2** (Org) | `type` | `'inflow'` |
| | `fromEntity` | `'Ali Khan'` |
| | `toEntity` | `'HMR Builders'` |
| | `organizationId` | `org-uuid` |
| | `propertyId` | `prop-uuid` |

---

## 🔍 **Query Examples**

### **1. Get All Organization Transactions**

```typescript
const org = await orgRepo.findOne({
  where: { displayCode: 'ORG-000001' },
  relations: ['transactions'],
});
console.log(org.transactions);
```

### **2. SQL Query for Audit Trail**

```sql
SELECT 
  displayCode,
  fromEntity,
  toEntity,
  amountUSDT,
  type,
  description,
  createdAt
FROM transactions 
WHERE organizationId = '<org-uuid>'
ORDER BY createdAt DESC;
```

**Result:**
```
TXN-000005 | Ali Khan | HMR Builders | 2500.00 | inflow | Liquidity inflow... | 2025-10-17
TXN-000004 | Ali Khan | HMR Builders | 2500.00 | investment | Investment in... | 2025-10-17
```

### **3. Get Investment Trail**

```sql
SELECT 
  t.displayCode,
  t.fromEntity,
  t.toEntity,
  p.title as property_title,
  t.amountUSDT,
  t.createdAt
FROM transactions t
LEFT JOIN properties p ON t.propertyId = p.id
WHERE t.type IN ('investment', 'inflow')
  AND t.organizationId = '<org-uuid>'
ORDER BY t.createdAt DESC;
```

---

## 🎯 **Key Features**

✅ **Human-Readable Audit Trail** - See "Ali Khan → HMR Builders"  
✅ **Bidirectional Relations** - Access transactions from organization  
✅ **Property Linking** - Track which property each transaction relates to  
✅ **Dual Transaction Recording** - Both user and organization perspectives  
✅ **Database Indexed** - Optimized queries with `IDX_transactions_organization`  
✅ **Nullable Fields** - Flexible for different transaction types  

---

## 📈 **Use Cases**

### **1. Admin Dashboard**
```
GET /organizations/ORG-000001/transactions
```
Shows complete capital inflow history for HMR Builders.

### **2. User Investment History**
```sql
SELECT * FROM transactions 
WHERE userId = '<user-uuid>' 
AND type = 'investment'
ORDER BY createdAt DESC;
```

### **3. Property Performance**
```sql
SELECT 
  propertyId,
  COUNT(*) as investment_count,
  SUM(amountUSDT) as total_raised
FROM transactions
WHERE type = 'investment'
GROUP BY propertyId;
```

### **4. Organization Analytics**
```
GET /organizations/ORG-000001/liquidity
```
Returns total liquidity + can drill down into transaction history.

---

## 🔐 **Data Integrity**

- **Foreign Key Constraints**: Ensure referential integrity
- **Indexed Columns**: Fast lookups by organization, user, property
- **Atomic Transactions**: All changes commit or rollback together
- **Pessimistic Locking**: Prevents race conditions
- **Nullable Fields**: Supports various transaction scenarios

---

## 🚀 **API Usage Examples**

### **1. Get Organization Transactions**
```bash
GET /organizations/ORG-000001/transactions
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "displayCode": "TXN-000005",
      "type": "inflow",
      "fromEntity": "Ali Khan",
      "toEntity": "HMR Builders",
      "amountUSDT": "2500.000000",
      "propertyId": "uuid...",
      "status": "completed",
      "createdAt": "2025-10-17T14:32:01.123Z"
    }
  ]
}
```

### **2. Create Investment** (auto-populates traceability)
```bash
POST /investments/invest
{
  "userId": "USR-000017",
  "propertyId": "PROP-000003",
  "tokensToBuy": 2.5
}
```

**Result**: Creates 2 transactions with `fromEntity` and `toEntity` automatically populated.

---

## ✅ **Status**

🟢 **Implementation Complete**  
🟢 **Build Successful**  
🟢 **Application Running**  
🟢 **Ready for Testing**

The transaction traceability system provides complete visibility into all financial flows with human-readable audit trails and efficient database relations!
