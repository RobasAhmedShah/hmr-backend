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

## 1.1. Organizations (Admin Management)

These endpoints are under the admin namespace for platform admins.

### POST /admin/organizations
Create an organization along with its organization admin (no auth layer, returns temp password once).

**Body:**
```json
{
  "name": "Hazara Builders",
  "description": "Leading construction company",
  "website": "https://hazarabuilders.com",
  "logoUrl": "https://example.com/logo.png",
  "adminEmail": "admin@hazara.com",
  "adminPassword": "admin123",
  "adminFullName": "Hazara Administrator"
}
```

**Response:**
```json
{
  "organization": { "id": "uuid...", "displayCode": "ORG-000003", "name": "Hazara Builders", "website": "https://hazarabuilders.com" },
  "admin": { "email": "admin@hazara.com", "tempPassword": "admin123", "fullName": "Hazara Administrator" },
  "message": "Organization created successfully. Admin credentials: admin@hazara.com / admin123"
}
```

### GET /admin/organizations
List organizations with admin summaries.

**Response:**
```json
[
  {
    "id": "uuid...",
    "displayCode": "ORG-000001",
    "name": "HMR Builders",
    "website": "https://hmrbuilders.com",
    "admin": { "email": "admin@hmrbuilders.com", "fullName": "HMR Administrator", "lastLogin": null }
  }
]
```

### PATCH /admin/organizations/:id
Update organization fields (name, description, website, logoUrl).

**Body (any subset):**
```json
{ "name": "Updated Name", "description": "Updated", "website": "https://updated.com", "logoUrl": "https://logo.png" }
```

### DELETE /admin/organizations/:id
Delete an organization (org admin is removed via cascade).

### POST /admin/organizations/:id/reset-password
Reset the organization admin password.

**Body (optional):**
```json
{ "newPassword": "TempPass789!" }
```

**Response:**
```json
{ "email": "admin@hazara.com", "tempPassword": "TempPass789!" }
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

### GET /admin/users?org=ORG-000001
Get all users who have invested in properties owned by a specific organization.

**Query Parameters:**
- `org` (string): Organization UUID or displayCode (e.g., "ORG-000001")

**Response:**
```json
[
  {
    "id": "uuid...",
    "displayCode": "USR-000001",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+923001234567",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-10-17T14:32:01.123Z",
    "updatedAt": "2025-10-17T15:45:30.456Z"
  },
  {
    "id": "uuid...",
    "displayCode": "USR-000002",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+923001234568",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-10-17T14:32:01.123Z",
    "updatedAt": "2025-10-17T15:45:30.456Z"
  }
]
```

**Note:** This endpoint returns only users who have at least one investment in properties owned by the specified organization. Users are returned as distinct records (no duplicates).

---

## 2.1. Users (Direct Management)

### PATCH /users/:id
Update user fields dynamically. You can update any field by passing the field name and its new value.

**Note:** `id` can be either a UUID or displayCode (e.g., "USR-000001").

**Body (all fields optional):**
```json
{
  "fullName": "Updated Full Name",
  "email": "updated@example.com",
  "phone": "+923001234567",
  "role": "admin",
  "isActive": false
}
```

**Response:**
```json
{
  "id": "uuid...",
  "displayCode": "USR-000001",
  "fullName": "Updated Full Name",
  "email": "updated@example.com",
  "phone": "+923001234567",
  "role": "admin",
  "isActive": false,
  "createdAt": "2025-10-17T14:32:01.123Z",
  "updatedAt": "2025-10-17T15:45:30.456Z"
}
```

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

### GET /properties?org=ORG-000001
Get all properties owned by a specific organization.

**Query Parameters:**
- `org` (string): Organization UUID or displayCode (e.g., "ORG-000001")

**Response:**
```json
[
  {
    "id": "uuid...",
    "displayCode": "PROP-000001",
    "organizationId": "uuid...",
    "organization": {
      "id": "uuid...",
      "displayCode": "ORG-000001",
      "name": "HMR Builders",
      "description": "Leading real estate developer"
    },
    "title": "Marina View Residences",
    "slug": "marina-view-residences",
    "description": "Luxury waterfront apartments",
    "type": "residential",
    "status": "active",
    "totalValueUSDT": "1000000.000000",
    "totalTokens": "1000.000000",
    "availableTokens": "750.000000",
    "pricePerTokenUSDT": "1000.000000",
    "expectedROI": "10.00",
    "city": "Karachi",
    "country": "Pakistan",
    "features": {"amenities": ["pool", "gym"]},
    "images": ["https://example.com/img1.jpg"],
    "createdAt": "2025-10-17T14:32:01.123Z",
    "updatedAt": "2025-10-17T15:45:30.456Z"
  }
]
```

### GET /properties/:id
Get property by UUID or displayCode (e.g., PROP-000001).

### PATCH /properties/:id
Update property fields dynamically. You can update any field by passing the field name and its new value.

**Body (all fields optional):**
```json
{
  "title": "Updated Property Title",
  "slug": "updated-property-slug",
  "description": "Updated description",
  "type": "commercial",
  "status": "active",
  "totalValueUSDT": 1500000,
  "totalTokens": 1500,
  "availableTokens": 1200,
  "pricePerTokenUSDT": 1000,
  "expectedROI": 12.5,
  "city": "Lahore",
  "country": "Pakistan",
  "features": {"amenities": ["pool", "gym", "parking"]},
  "images": ["https://example.com/updated-img1.jpg"]
}
```

**Note:** 
- `id` can be either a UUID or displayCode (e.g., "PROP-000001")
- Only provided fields will be updated
- If `totalValueUSDT` or `totalTokens` are updated, `pricePerTokenUSDT` will be automatically recalculated
- `status` can be any string value (not restricted to predefined values)

### PATCH /properties/:id/status
Update property status only. Status can be any string value.

**Body:**
```json
{
  "status": "active"
}
```

**Note:** `id` can be either a UUID or displayCode (e.g., "PROP-000001"). Status can be any string value like "active", "soldout", "maintenance", "under_construction", etc.

### DELETE /properties/:id
Delete a property permanently.

**Note:** `id` can be either a UUID or displayCode (e.g., "PROP-000001").

**Response:**
```json
{
  "message": "Property 'PROP-000001' has been deleted successfully"
}
```

---

## 4. Wallet

### POST /wallet/deposit
Deposit USDT into wallet (credits `balanceUSDT`; inserts deposit transaction).

**Requirements:** User must have verified KYC to make deposits.

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

### PATCH /wallet/:id
Update wallet fields dynamically. You can update any field by passing the field name and its new value.

**Note:** `id` can be either a wallet UUID or user displayCode (e.g., "USR-000001").

**Body (all fields optional):**
```json
{
  "balanceUSDT": 10000,
  "lockedUSDT": 500,
  "totalDepositedUSDT": 15000,
  "totalWithdrawnUSDT": 2000
}
```

**Response:**
```json
{
  "id": "uuid...",
  "userId": "uuid...",
  "balanceUSDT": "10000.000000",
  "lockedUSDT": "500.000000",
  "totalDepositedUSDT": "15000.000000",
  "totalWithdrawnUSDT": "2000.000000",
  "createdAt": "2025-10-17T14:32:01.123Z",
  "updatedAt": "2025-10-17T15:45:30.456Z"
}
```

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

### GET /investments?org=ORG-000001
Get all investments in properties owned by a specific organization.

**Query Parameters:**
- `org` (string): Organization UUID or displayCode (e.g., "ORG-000001")

**Response:**
```json
[
  {
    "id": "uuid...",
    "displayCode": "INV-000001",
    "userId": "uuid...",
    "user": {
      "id": "uuid...",
      "displayCode": "USR-000001",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "propertyId": "uuid...",
    "property": {
      "id": "uuid...",
      "displayCode": "PROP-000001",
      "title": "Marina View Residences",
      "organizationId": "uuid...",
      "organization": {
        "id": "uuid...",
        "displayCode": "ORG-000001",
        "name": "HMR Builders"
      }
    },
    "organizationId": "uuid...",
    "tokensPurchased": "2.500000",
    "amountUSDT": "2500.000000",
    "status": "active",
    "paymentStatus": "completed",
    "expectedROI": "10.00",
    "createdAt": "2025-10-17T14:32:01.123Z",
    "updatedAt": "2025-10-17T15:45:30.456Z"
  }
]
```

### GET /investments/:id
Get investment by UUID or displayCode (e.g., INV-000001).

### GET /investments/analytics/user/:userId
Get comprehensive investment analytics for a specific user.

**Parameters:**
- `userId` (string): User UUID or displayCode (e.g., "USR-000001")

**Response:**
```json
{
  "user": {
    "id": "uuid...",
    "displayCode": "USR-000001",
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "investments": [
    {
      "id": "uuid...",
      "displayCode": "INV-000001",
      "tokensPurchased": "2.500000",
      "amountUSDT": "2500.000000",
      "status": "active",
      "paymentStatus": "completed",
      "expectedROI": "10.00",
      "property": {
        "id": "uuid...",
        "displayCode": "PROP-000001",
        "title": "Marina View Residences",
        "organization": {
          "id": "uuid...",
          "displayCode": "ORG-000001",
          "name": "HMR Builders"
        }
      },
      "createdAt": "2025-10-17T14:32:01.123Z"
    }
  ],
  "analytics": {
    "totalInvestments": 5,
    "totalAmountUSDT": "12500.000000",
    "totalTokensPurchased": "12.500000",
    "averageInvestmentAmount": "2500.000000",
    "averageTokensPerInvestment": "2.500000",
    "totalExpectedROI": "50.00",
    "activeInvestments": 3,
    "completedInvestments": 2,
    "pendingInvestments": 0,
    "totalValueAtCurrentPrice": "12500.000000"
  }
}
```

### GET /investments/analytics/organization/:orgId
Get comprehensive investment analytics for a specific organization.

**Parameters:**
- `orgId` (string): Organization UUID or displayCode (e.g., "ORG-000001")

**Response:**
```json
{
  "organization": {
    "id": "uuid...",
    "displayCode": "ORG-000001",
    "name": "HMR Builders"
  },
  "investments": [
    {
      "id": "uuid...",
      "displayCode": "INV-000001",
      "user": {
        "id": "uuid...",
        "displayCode": "USR-000001",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "tokensPurchased": "2.500000",
      "amountUSDT": "2500.000000",
      "status": "active",
      "paymentStatus": "completed",
      "expectedROI": "10.00",
      "property": {
        "id": "uuid...",
        "displayCode": "PROP-000001",
        "title": "Marina View Residences"
      },
      "createdAt": "2025-10-17T14:32:01.123Z"
    }
  ],
  "analytics": {
    "totalInvestments": 25,
    "totalAmountUSDT": "125000.000000",
    "totalTokensPurchased": "125.000000",
    "averageInvestmentAmount": "5000.000000",
    "averageTokensPerInvestment": "5.000000",
    "totalExpectedROI": "250.00",
    "activeInvestments": 20,
    "completedInvestments": 5,
    "pendingInvestments": 0,
    "totalValueAtCurrentPrice": "125000.000000"
  }
}
```

### GET /investments/analytics/user/:userId/organization/:orgId
Get comprehensive investment analytics for a specific user within a specific organization.

**Parameters:**
- `userId` (string): User UUID or displayCode (e.g., "USR-000001")
- `orgId` (string): Organization UUID or displayCode (e.g., "ORG-000001")

**Response:**
```json
{
  "user": {
    "id": "uuid...",
    "displayCode": "USR-000001",
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "organization": {
    "id": "uuid...",
    "displayCode": "ORG-000001",
    "name": "HMR Builders"
  },
  "investments": [
    {
      "id": "uuid...",
      "displayCode": "INV-000001",
      "tokensPurchased": "2.500000",
      "amountUSDT": "2500.000000",
      "status": "active",
      "paymentStatus": "completed",
      "expectedROI": "10.00",
      "property": {
        "id": "uuid...",
        "displayCode": "PROP-000001",
        "title": "Marina View Residences"
      },
      "createdAt": "2025-10-17T14:32:01.123Z"
    }
  ],
  "analytics": {
    "totalInvestments": 3,
    "totalAmountUSDT": "7500.000000",
    "totalTokensPurchased": "7.500000",
    "averageInvestmentAmount": "2500.000000",
    "averageTokensPerInvestment": "2.500000",
    "totalExpectedROI": "30.00",
    "activeInvestments": 2,
    "completedInvestments": 1,
    "pendingInvestments": 0,
    "totalValueAtCurrentPrice": "7500.000000"
  }
}
```

**Analytics Fields Explained:**
- `totalInvestments`: Total number of investments
- `totalAmountUSDT`: Sum of all investment amounts in USDT
- `totalTokensPurchased`: Sum of all tokens purchased
- `averageInvestmentAmount`: Average investment amount per investment
- `averageTokensPerInvestment`: Average tokens per investment
- `totalExpectedROI`: Sum of all expected ROI percentages
- `activeInvestments`: Number of investments with "active" status
- `completedInvestments`: Number of investments with "confirmed" status
- `pendingInvestments`: Number of investments with "pending" status
- `totalValueAtCurrentPrice`: Current value of all tokens at current property prices

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

## 8. Payment Methods

### POST /payment-methods
Create a new payment method for a user (requires verified KYC).

**Body for Card Payment Method:**
```json
{
  "userId": "USR-000031",
  "type": "card",
  "provider": "Visa",
  "isDefault": true,
  "cardDetails": {
    "cardNumber": "4111111111111111",
    "cardholderName": "John Doe",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "cardType": "Visa",
    "cardCategory": "Credit",
    "billingAddress": "123 Main Street",
    "billingCity": "New York",
    "billingState": "NY",
    "billingPostalCode": "10001",
    "billingCountry": "United States",
    "issuingBank": "Chase Bank",
    "bankCode": "CHASE",
    "token": "tok_123456789",
    "isTokenized": true
  }
}
```

**Body for Bank Payment Method:**
```json
{
  "userId": "USR-000031",
  "type": "bank",
  "provider": "Bank of America",
  "isDefault": false
}
```

**Note:** `userId` can be either a UUID or displayCode (e.g., "USR-000031"). Card details are required only for `type: "card"`.

### GET /payment-methods?userId={userId}
Get all payment methods for a specific user.

**Query Parameters:**
- `userId` (required): User UUID or displayCode (e.g., "USR-000031")

**Response:**
```json
[
  {
    "id": "payment-method-uuid-1",
    "type": "card",
    "provider": "Visa",
    "status": "verified",
    "isDefault": true,
    "userId": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "cardDetails": {
      "id": "card-details-uuid",
      "cardNumber": "4111111111111111",
      "cardholderName": "John Doe",
      "expiryMonth": "12",
      "expiryYear": "2025",
      "cvv": "123",
      "cardType": "Visa",
      "cardCategory": "Credit",
      "billingAddress": "123 Main Street",
      "billingCity": "New York",
      "billingState": "NY",
      "billingPostalCode": "10001",
      "billingCountry": "United States",
      "issuingBank": "Chase Bank",
      "bankCode": "CHASE",
      "token": "tok_123456789",
      "isTokenized": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  {
    "id": "payment-method-uuid-2",
    "type": "bank",
    "provider": "Bank of America",
    "status": "verified",
    "isDefault": false,
    "userId": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "cardDetails": null
  }
]
```

### GET /payment-methods/:id
Get a specific payment method by ID.

### PATCH /payment-methods/:id/verify
Verify a payment method (change status to verified or disabled).

**Body:**
```json
{
  "status": "verified"
}
```

### PATCH /payment-methods/:id/default
Set or unset a payment method as default for the user.

**Body:**
```json
{
  "isDefault": true
}
```

**Note:** Setting one payment method as default will automatically unset other default payment methods for the same user.

### DELETE /payment-methods/:id
Soft delete a payment method (sets status to "disabled").

### POST /payment-methods/deposit
Initiate a deposit using a payment method. If no `methodId` is provided, uses the user's default payment method.

**Requirements:** User must have verified KYC to make deposits.

**Body with specific payment method:**
```json
{
  "userId": "USR-000031",
  "amountUSDT": 1000,
  "methodId": "payment-method-uuid"
}
```

**Body using default payment method:**
```json
{
  "userId": "USR-000031",
  "amountUSDT": 1000
}
```

**Response:**
```json
{
  "message": "Deposit initiated successfully",
  "amount": "1000"
}
```

**Note:** This endpoint checks KYC verification before processing and emits a `wallet.deposit_initiated` event that triggers the actual wallet deposit process.

---

## 9. KYC (Know Your Customer)

### POST /kyc
Create or update KYC verification for a user.

**Body:**
```json
{
  "userId": "USR-000031",
  "type": "cnic",
  "documentFrontUrl": "https://example.com/front.jpg",
  "documentBackUrl": "https://example.com/back.jpg",
  "selfieUrl": "https://example.com/selfie.jpg",
  "metadata": {
    "additionalInfo": "Any additional verification data"
  }
}
```

**Response:**
```json
{
  "id": "ebde11ec-5d5c-457d-ba87-b83f431962c1",
  "userId": "9e354ce4-c7ab-4d5b-ba6c-50783d4c01e1",
  "type": "cnic",
  "status": "pending",
  "documentFrontUrl": "https://example.com/front.jpg",
  "documentBackUrl": "https://example.com/back.jpg",
  "selfieUrl": "https://example.com/selfie.jpg",
  "reviewer": null,
  "rejectionReason": null,
  "metadata": {
    "additionalInfo": "Any additional verification data"
  },
  "submittedAt": "2025-10-22T11:50:05.198Z",
  "reviewedAt": null,
  "createdAt": "2025-10-22T08:38:25.822Z",
  "updatedAt": "2025-10-22T11:50:04.419Z"
}
```

**Note:** `userId` can be either a UUID or displayCode (e.g., "USR-000031"). If KYC already exists for the user, it will be updated with new information and status reset to "pending".

### GET /kyc
List all KYC verifications.

### GET /kyc/user/:userId
Get KYC verification for a specific user.

**Note:** `userId` can be either a UUID or displayCode (e.g., "USR-000031").

**Response:**
```json
{
  "id": "ebde11ec-5d5c-457d-ba87-b83f431962c1",
  "userId": "9e354ce4-c7ab-4d5b-ba6c-50783d4c01e1",
  "user": {
    "id": "9e354ce4-c7ab-4d5b-ba6c-50783d4c01e1",
    "displayCode": "USR-000031",
    "fullName": "Syed Wasay",
    "email": "wasay@gmail.com",
    "phone": "+9231000334455",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-10-22T08:38:25.822Z",
    "updatedAt": "2025-10-22T08:38:25.822Z"
  },
  "type": "cnic",
  "status": "pending",
  "documentFrontUrl": "https://example.com/front.jpg",
  "documentBackUrl": "https://example.com/back.jpg",
  "selfieUrl": "https://example.com/selfie.jpg",
  "reviewer": null,
  "rejectionReason": null,
  "metadata": {
    "additionalInfo": "Any additional verification data"
  },
  "submittedAt": "2025-10-22T11:50:05.198Z",
  "reviewedAt": null,
  "createdAt": "2025-10-22T08:38:25.822Z",
  "updatedAt": "2025-10-22T11:50:04.419Z"
}
```

### GET /kyc/:id
Get KYC verification by ID or user displayCode.

**Note:** `id` can be either a KYC verification UUID or a user displayCode (e.g., "USR-000031"). If a user displayCode is provided, it returns the most recent KYC verification for that user.

### PATCH /kyc/:id
Update KYC verification fields dynamically. You can update any field by passing the field name and its new value.

**Note:** `id` can be either a KYC verification UUID or user displayCode (e.g., "USR-000031"). If a user displayCode is provided, it updates the most recent KYC verification for that user.

**Body (all fields optional):**
```json
{
  "type": "passport",
  "status": "verified",
  "documentFrontUrl": "https://example.com/new-front.jpg",
  "documentBackUrl": "https://example.com/new-back.jpg",
  "selfieUrl": "https://example.com/new-selfie.jpg",
  "reviewer": "admin@example.com",
  "rejectionReason": null,
  "metadata": {
    "additionalInfo": "Updated verification data"
  }
}
```

**Response:**
```json
{
  "id": "ebde11ec-5d5c-457d-ba87-b83f431962c1",
  "userId": "9e354ce4-c7ab-4d5b-ba6c-50783d4c01e1",
  "type": "passport",
  "status": "verified",
  "documentFrontUrl": "https://example.com/new-front.jpg",
  "documentBackUrl": "https://example.com/new-back.jpg",
  "selfieUrl": "https://example.com/new-selfie.jpg",
  "reviewer": "admin@example.com",
  "rejectionReason": null,
  "metadata": {
    "additionalInfo": "Updated verification data"
  },
  "submittedAt": "2025-10-22T11:50:05.198Z",
  "reviewedAt": "2025-10-22T15:45:30.456Z",
  "createdAt": "2025-10-22T08:38:25.822Z",
  "updatedAt": "2025-10-22T15:45:30.456Z"
}
```

**Note:** When status is changed to "verified", it emits a `kyc.verified` event that triggers payment method status updates.

---

## 10. Rewards

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

4. **Add Payment Methods:**
   ```
   POST /payment-methods
   {
     "userId": "<ali_user_id>",
     "type": "card",
     "provider": "Visa",
     "isDefault": true,
     "cardDetails": {
       "cardNumber": "4111111111111111",
       "cardholderName": "Ali Khan",
       "expiryMonth": "12",
       "expiryYear": "2025",
       "cvv": "123",
       "cardType": "Visa",
       "cardCategory": "Credit",
       "billingAddress": "123 Main Street",
       "billingCity": "Karachi",
       "billingState": "Sindh",
       "billingPostalCode": "75500",
       "billingCountry": "Pakistan"
     }
   }
   ```
   → Creates payment method with card details

5. **Verify Payment Methods:**
   ```
   PATCH /payment-methods/<payment_method_id>/verify
   { "status": "verified" }
   ```
   → Enables payment method for deposits

6. **Deposit Funds via Payment Method:**
   ```
   POST /payment-methods/deposit
   { "userId": "<ali_user_id>", "amountUSDT": 5000 }
   ```
   → Uses default payment method to deposit funds
   
   ```
   POST /wallet/deposit
   { "userId": "<sara_user_id>", "amountUSDT": 2000 }
   ```
   → Direct wallet deposit (legacy method)

7. **Create Investments:**
   ```
   POST /investments
   { "userId": "<ali_user_id>", "propertyId": "<property_id>", "amountUSDT": 2500 }
   → Buys 2.5 tokens; property.availableTokens becomes 997.5
   
   POST /investments
   { "userId": "<sara_user_id>", "propertyId": "<property_id>", "amountUSDT": 1250 }
   → Buys 1.25 tokens; property.availableTokens becomes 996.25
   ```

8. **Distribute ROI (10% = 100,000 USDT):**
   ```
   POST /rewards/distribute
   { "propertyId": "<property_id>", "totalRoiUSDT": 100000 }
   ```
   → Ali gets 250 USDT (2.5/1000 * 100000)
   → Sara gets 125 USDT (1.25/1000 * 100000)

9. **Verify Balances:**
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
- **Payment Methods**: Users can add payment methods (card, bank, crypto) after KYC verification. Card details are stored in a separate entity with full validation.
- **Default Payment Methods**: Users can set one payment method as default for seamless deposits without specifying methodId.
- **Event-Driven Deposits**: Payment method deposits emit `wallet.deposit_initiated` events that trigger the actual wallet funding process.
- **Transactions**: Each investment creates one unified transaction (type: "investment") with full traceability.
- **Rewards**: ROI distribution creates one reward and one transaction per user (aggregated across all their investments in a property).
- **Traceability**: All transactions include `fromEntity`, `toEntity`, `propertyId`, and `organizationId` for complete audit trails.

---

## 10. Admin Dashboard & Analytics

### GET /admin/dashboard
Get comprehensive dashboard statistics with optional filtering.

**Query Parameters (all optional):**
- `userId`: Filter by specific user (UUID or displayCode like USR-000001)
- `organizationId`: Filter by specific organization (UUID or displayCode like ORG-000001)
- `propertyId`: Filter by specific property (UUID or displayCode like PROP-000001)

**Examples:**
- Platform-wide: `GET /admin/dashboard`
- User-specific: `GET /admin/dashboard?userId=USR-000001`
- Organization-specific: `GET /admin/dashboard?organizationId=ORG-000001`
- Property-specific: `GET /admin/dashboard?propertyId=PROP-000001`

**Response (Platform-wide):**
```json
{
  "overview": {
    "totalUsers": 150,
    "activeUsers": 142,
    "totalOrganizations": 5,
    "totalProperties": 25,
    "totalInvestments": 89,
    "totalInvestmentValue": "1250000.00",
    "totalTransactions": 234,
    "totalTransactionVolume": "1500000.00",
    "platformRevenue": "250000.00",
    "totalRewardsDistributed": "45000.00"
  },
  "users": {
    "total": 150,
    "active": 142,
    "inactive": 8,
    "newThisMonth": 23
  },
  "kyc": {
    "pending": 12,
    "verified": 130,
    "rejected": 8
  },
  "properties": {
    "active": 20,
    "soldout": 3,
    "construction": 2,
    "total": 25
  },
  "investments": {
    "count": 89,
    "totalValue": "1250000.00",
    "averageInvestment": "14044.94"
  },
  "transactions": {
    "count": 234,
    "totalVolume": "1500000.00",
    "byType": {
      "deposit": 45,
      "investment": 89,
      "reward": 67,
      "withdrawal": 12,
      "inflow": 21
    }
  },
  "recentActivity": {
    "recentInvestments": [...],
    "recentTransactions": [...],
    "recentUsers": [...],
    "pendingKycReviews": [...]
  }
}
```

**Response (User-specific):**
```json
{
  "user": {
    "id": "uuid...",
    "displayCode": "USR-000032",
    "fullName": "HMH",
    "email": "hmh@gmail.com",
    "phone": "923442244123",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-10-22T08:53:45.309Z",
    "updatedAt": "2025-10-22T08:53:45.309Z"
  },
  "wallet": {
    "id": "uuid...",
    "balanceUSDT": "100000.00",
    "lockedUSDT": "0.00",
    "totalDepositedUSDT": "4000.00",
    "totalWithdrawnUSDT": "0.00",
    "createdAt": "2025-10-22T08:53:45.309Z",
    "updatedAt": "2025-10-23T08:56:41.107Z"
  },
  "kyc": {
    "id": "uuid...",
    "type": "cnic",
    "status": "pending",
    "submittedAt": "2025-10-22T08:53:46.080Z",
    "reviewedAt": null,
    "rejectionReason": null
  },
  "investments": {
    "recent": [...],
    "totalValue": "0.00",
    "count": 0
  },
  "rewards": {
    "recent": [...],
    "totalAmount": "0.00",
    "count": 0
  },
  "transactions": {
    "recent": [...],
    "totalVolume": "4000.00",
    "count": 4
  },
  "paymentMethods": {
    "methods": [...],
    "verifiedCount": 0,
    "totalCount": 0
  },
  "portfolio": {
    "totalInvested": "0.00",
    "activeInvestments": 0,
    "totalEarned": "0.00",
    "totalROI": "0.00",
    "lastUpdated": "2025-10-23T08:56:41.107Z"
  }
}
```

### GET /admin/analytics
Get growth metrics and time-series analytics.

**Query Parameters:**
- `period`: '7d' | '30d' | '90d' | '1y' (fixed periods)
- `from`: ISO date string (custom range start)
- `to`: ISO date string (custom range end)
- `userId`: Filter by user (UUID or displayCode)
- `organizationId`: Filter by organization (UUID or displayCode)
- `propertyId`: Filter by property (UUID or displayCode)

**Examples:**
- Last 30 days: `GET /admin/analytics?period=30d`
- Custom range: `GET /admin/analytics?from=2024-01-01&to=2024-12-31`
- User analytics: `GET /admin/analytics?userId=USR-000001&period=90d`
- Organization analytics: `GET /admin/analytics?organizationId=ORG-000001&period=1y`

**Response:**
```json
{
  "period": {
    "from": "2024-10-01T00:00:00.000Z",
    "to": "2024-10-31T23:59:59.999Z"
  },
  "timeSeries": {
    "users": [
      { "date": "2024-10-01T00:00:00.000Z", "count": 5 },
      { "date": "2024-10-02T00:00:00.000Z", "count": 3 },
      ...
    ],
    "investments": [
      { "date": "2024-10-01T00:00:00.000Z", "count": 12, "volume": "150000.00" },
      { "date": "2024-10-02T00:00:00.000Z", "count": 8, "volume": "95000.00" },
      ...
    ],
    "rewards": [
      { "date": "2024-10-01T00:00:00.000Z", "count": 45, "amount": "12500.00" },
      { "date": "2024-10-02T00:00:00.000Z", "count": 38, "amount": "9800.00" },
      ...
    ],
    "transactions": [
      { "date": "2024-10-01T00:00:00.000Z", "count": 25, "volume": "180000.00" },
      { "date": "2024-10-02T00:00:00.000Z", "count": 18, "volume": "120000.00" },
      ...
    ],
    "kycVerifications": [
      { "date": "2024-10-01T00:00:00.000Z", "count": 8 },
      { "date": "2024-10-02T00:00:00.000Z", "count": 5 },
      ...
    ]
  },
  "aggregated": {
    "users": {
      "total": 23,
      "average": 0.74,
      "peak": { "date": "2024-10-15T00:00:00.000Z", "count": 5 }
    },
    "investments": {
      "total": 89,
      "totalValue": "1250000.00",
      "average": 2.87,
      "peak": { "date": "2024-10-20T00:00:00.000Z", "count": 8, "volume": "120000.00" }
    },
    "rewards": {
      "total": 67,
      "totalAmount": "45000.00",
      "average": 2.16,
      "peak": { "date": "2024-10-25T00:00:00.000Z", "count": 12, "amount": "3500.00" }
    },
    "transactions": {
      "total": 234,
      "totalVolume": "1500000.00",
      "average": 7.55,
      "peak": { "date": "2024-10-18T00:00:00.000Z", "count": 15, "volume": "180000.00" }
    }
  },
  "comparison": {
    "previousPeriod": {
      "users": { "total": 18, "average": 0.58, "peak": null },
      "investments": { "total": 65, "totalValue": "980000.00", "average": 2.10, "peak": null },
      "rewards": { "total": 45, "totalAmount": "32000.00", "average": 1.45, "peak": null },
      "transactions": { "total": 189, "totalVolume": "1200000.00", "average": 6.10, "peak": null }
    },
    "changePercentage": {
      "users": 27.78,
      "investments": 36.92,
      "rewards": 48.89,
      "transactions": 23.81
    }
  }
}
```

**Features:**
- **Dynamic Filtering**: Filter by user, organization, or property using UUID or displayCode
- **Time Periods**: Support for fixed periods (7d, 30d, 90d, 1y) and custom date ranges
- **Time-Series Data**: Daily aggregated metrics for users, investments, rewards, transactions, and KYC verifications
- **Growth Analytics**: Period-over-period comparison with percentage changes
- **Peak Analysis**: Identify highest activity days with counts and volumes
- **Comprehensive Metrics**: Total counts, averages, and financial aggregations

