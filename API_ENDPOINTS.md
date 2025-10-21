# HMR Backend API Endpoints

All endpoints use JSON. The app runs on `http://localhost:3000` by default.

---

## 1. Organizations

### POST /organizations
Create a new organization (auto-generates `ORG-xxxxxx` displayCode).

**Body:**
```json
{
  "name": "HMR Builders",
  "description": "Leading real estate developer",
  "website": "https://hmrbuilders.com",
  "logoUrl": "https://example.com/logo.png"
}
```

**Note:** `liquidityUSDT` is automatically set to 0 when creating a new organization.

### GET /organizations
List all organizations.

### GET /organizations/:id
Get organization by UUID or displayCode (e.g., ORG-000001).

### GET /organizations/:id/liquidity
Get organization liquidity analytics.

**Response:**
```json
{
  "organizationId": "ORG-000001",
  "organizationName": "HMR Builders",
  "liquidityUSDT": "250000.000000",
  "lastUpdated": "2025-10-17T14:32:01.123Z"
}
```

### GET /organizations/:id/transactions
Get all transactions for an organization (with entity traceability).

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
      "description": "Liquidity inflow from Ali Khan",
      "createdAt": "2025-10-17T14:32:01.123Z"
    }
  ]
}
```

---

## 2. Users (Admin)

### POST /admin/users
Create a user (auto-creates wallet, KYC verification, and portfolio; auto-generates `USR-xxxxxx` displayCode).

**Auto-Creation Flow:**
1. **User** - Creates user with displayCode
2. **Wallet** - Creates wallet with zero balances
3. **KYC Verification** - Creates KYC record with `status: "pending"` and `type: "cnic"`
4. **Portfolio** - Creates portfolio with zero values and `activeInvestments: 0`

**Body:**
```json
{
  "fullName": "Ali Khan",
  "email": "ali@example.com",
  "phone": "+92300123456",
  "role": "user"
}
```

**Response:**
```json
{
  "id": "uuid...",
  "displayCode": "USR-000001",
  "fullName": "Ali Khan",
  "email": "ali@example.com",
  "phone": "+92300123456",
  "role": "user",
  "isActive": true,
  "createdAt": "2025-10-17T14:32:01.123Z"
}
```

**Note:** This endpoint automatically creates 4 related records:
- User record with displayCode
- Wallet with zero USDT balances
- KYC verification with "pending" status
- Portfolio with zero investment values

### GET /admin/users
List all users.

---

## 3. Properties

### POST /properties
Create a property (auto-computes `pricePerTokenUSDT = totalValueUSDT / totalTokens`; sets `availableTokens = totalTokens`; auto-generates `PROP-xxxxxx` displayCode).

**Body:**
```json
{
  "organizationId": "ORG-000001",
  "title": "Marina View Residences",
  "slug": "marina-view-residences",
  "description": "Luxury waterfront apartments",
  "type": "residential",
  "status": "active",
  "totalValueUSDT": 1000000,
  "totalTokens": 1000,
  "expectedROI": 10,
  "city": "Karachi",
  "country": "Pakistan",
  "features": {"amenities": ["pool", "gym"]},
  "images": ["https://example.com/img1.jpg"]
}
```

**Note:** `organizationId` can be either a UUID or a display code (e.g., "ORG-000001").

### GET /properties
List all properties.

### GET /properties?slug=marina-view-residences
Get property by slug.

### GET /properties?displayCode=PROP-000001
Get property by displayCode.

### GET /properties/:id
Get property by UUID or displayCode (e.g., PROP-000001).

---

## 4. Wallet

### POST /wallet/deposit
Deposit USDT into wallet (credits `balanceUSDT`; inserts deposit transaction).

**Body:**
```json
{
  "userId": "<uuid>",
  "amountUSDT": 5000
}
```

### GET /wallet/user/:userId
Get wallet for a specific user.

**Note:** `userId` can be either a UUID or a display code (e.g., "USR-000001").

### GET /wallet
List all wallets.

---

## 5. Investments

### POST /investments
Create investment (legacy amountUSDT-based method).

**Body:**
```json
{
  "userId": "<uuid>",
  "propertyId": "<uuid>",
  "amountUSDT": 2500
}
```

### POST /investments/invest
Create investment (new token-based method):
- Locks wallet + property (pessimistic_write)
- Validates `property.availableTokens >= tokensToBuy` and `wallet.balance >= amountUSDT`
- Computes `amountUSDT = tokensToBuy * pricePerTokenUSDT`
- Decrements `property.availableTokens` and `wallet.balanceUSDT`
- Credits organization liquidity
- Creates **one unified transaction** (type: "investment") with traceability
- Auto-generates `INV-xxxxxx` displayCode

**Body:**
```json
{
  "userId": "<uuid>",
  "propertyId": "<uuid>",
  "tokensToBuy": 2.5
}
```

### GET /investments
List all investments.

### GET /investments?userId=<uuid>
Get investments for a specific user.

**Note:** `userId` can be either a UUID or a display code (e.g., "USR-000001").

### GET /investments/:id
Get investment by UUID or displayCode (e.g., INV-000001).

---

## 6. Portfolio

### GET /portfolio/user/:userId/detailed
Get comprehensive portfolio for a specific user.

**Note**: userId can be UUID or displayCode (e.g., "USR-000001")

**Auto-Update Triggers**:
- Portfolio automatically updates when user makes investment
- Portfolio automatically updates when user receives rewards
- No manual POST endpoint needed

**Response includes**:
- User information (id, displayCode, name, email)
- Portfolio summary (totalInvested, totalRewards, totalROI, activeInvestments)
- Summary statistics (totalCurrentValue, netROI, averageROI)
- Investments array with property details, organization, tokens, current value, rewards per investment
- Rewards history with property context

---

## 7. Transactions

### GET /transactions
Get all transactions in the system.

**Response**: Array of transaction objects with related user, wallet, organization, and property details.

### GET /transactions/user/:userId
Get all transactions for a specific user.

**Note**: `userId` can be either a UUID or a display code (e.g., "USR-000001").

**Response**: Array of transaction objects for the specified user.

---

## 8. Rewards

### POST /rewards/distribute
Distribute ROI proportionally across all confirmed investments for a property:
- Groups all investments by user
- Calculates total `roiShare = (totalUserTokens / totalTokens) * totalRoi` per user
- Credits each investor's `wallet.balanceUSDT`
- Creates **one reward and one transaction per user** (aggregated across all their investments)
- Each transaction includes full traceability: `fromEntity`, `toEntity`, `propertyId`, `organizationId`
- Auto-generates `RWD-xxxxxx` displayCode for each reward

**Body:**
```json
{
  "propertyId": "<uuid>",
  "totalRoiUSDT": 100000
}
```

### GET /rewards
List all rewards.

### GET /rewards?userId=<uuid>
Get rewards for a specific user.

**Note:** `userId` can be either a UUID or a display code (e.g., "USR-000001").

### GET /rewards/:id
Get reward by UUID or displayCode (e.g., RWD-000001).

---

## Example Flow (matches plan/phase2.md test data)

1. **Create Organization:**
   ```
   POST /organizations
   { "name": "HMR Builders" }
   ```

2. **Create Property:**
   ```
   POST /properties
   {
     "organizationId": "<org_id_from_step_1>",
     "title": "Marina View Residences",
     "slug": "marina-view",
     "type": "residential",
     "status": "active",
     "totalValueUSDT": 1000000,
     "totalTokens": 1000,
     "expectedROI": 10
   }
   ```
   → Returns `pricePerTokenUSDT: 1000`, `availableTokens: 1000`

3. **Create Users:**
   ```
   POST /admin/users
   { "fullName": "Ali Khan", "email": "ali@example.com" }
   
   POST /admin/users
   { "fullName": "Sara Ahmed", "email": "sara@example.com" }
   ```
   → Each auto-creates:
   - User with displayCode (USR-000001, USR-000002)
   - Wallet with `balanceUSDT: 0`
   - KYC verification with `status: "pending"`
   - Portfolio with zero investment values

4. **Deposit Funds:**
   ```
   POST /wallet/deposit
   { "userId": "<ali_user_id>", "amountUSDT": 5000 }
   
   POST /wallet/deposit
   { "userId": "<sara_user_id>", "amountUSDT": 2000 }
   ```

5. **Create Investments:**
   ```
   POST /investments
   { "userId": "<ali_user_id>", "propertyId": "<property_id>", "amountUSDT": 2500 }
   → Buys 2.5 tokens; property.availableTokens becomes 997.5
   
   POST /investments
   { "userId": "<sara_user_id>", "propertyId": "<property_id>", "amountUSDT": 1250 }
   → Buys 1.25 tokens; property.availableTokens becomes 996.25
   ```

6. **Distribute ROI (10% = 100,000 USDT):**
   ```
   POST /rewards/distribute
   { "propertyId": "<property_id>", "totalRoiUSDT": 100000 }
   ```
   → Ali gets 250 USDT (2.5/1000 * 100000)
   → Sara gets 125 USDT (1.25/1000 * 100000)

7. **Verify Balances:**
   ```
   GET /wallet/user/<ali_user_id>
   → balanceUSDT: 2750 (5000 - 2500 + 250)
   
   GET /wallet/user/<sara_user_id>
   → balanceUSDT: 875 (2000 - 1250 + 125)
   ```

---

## Notes

- All decimal fields (USDT, tokens) use `Decimal.js` for precision (no floating-point errors).
- Sequential `displayCode` fields (USR/ORG/PROP/INV/TXN/RWD) are auto-generated via Postgres sequences.
- Investment flow uses pessimistic locks to prevent race conditions.
- Validation is enabled globally (class-validator).
- **User Creation**: Creating a user automatically creates 4 related records (User, Wallet, KYC, Portfolio) in a single transaction.
- **KYC Auto-Creation**: New users get a KYC record with `status: "pending"` and `type: "cnic"` by default.
- **Portfolio Auto-Creation**: New users get a portfolio with zero investment values and `activeInvestments: 0`.
- **Transactions**: Each investment creates one unified transaction (type: "investment") with full traceability.
- **Rewards**: ROI distribution creates one reward and one transaction per user (aggregated across all their investments in a property).
- **Traceability**: All transactions include `fromEntity`, `toEntity`, `propertyId`, and `organizationId` for complete audit trails.

