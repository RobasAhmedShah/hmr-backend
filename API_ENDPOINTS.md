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

---

## 2. Users (Admin)

### POST /admin/users
Create a user (auto-creates wallet; auto-generates `USR-xxxxxx` displayCode).

**Body:**
```json
{
  "fullName": "Ali Khan",
  "email": "ali@example.com",
  "phone": "+92300123456",
  "role": "user"
}
```

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
- Inserts investment + transaction records
- Auto-generates `INV-xxxxxx` displayCode

**Body:**
```json
npm 
```

### GET /investments
List all investments.

### GET /investments?userId=<uuid>
Get investments for a specific user.

### GET /investments/:id
Get investment by UUID or displayCode (e.g., INV-000001).

---

## 6. Rewards

### POST /rewards/distribute
Distribute ROI proportionally across all confirmed investments for a property (per plan/phase2.md):
- Calculates `roiShare = (tokensOwned / totalTokens) * totalRoi`
- Credits each investor's `wallet.balanceUSDT`
- Inserts reward + transaction records
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
   → Each auto-creates a wallet with `balanceUSDT: 0`

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

