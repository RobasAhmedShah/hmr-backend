# Mobile Wallet & Transactions API

## Overview

Mobile-optimized wallet and transactions endpoints at `/api/mobile/wallet` and `/api/mobile/transactions` with aggregated data and filtering.

## Wallet Endpoints

### GET /api/mobile/wallet

Get aggregated wallet information including balance, total value, investments, and earnings.

**Authentication**: Required

**Response** (200):
```json
{
  "usdc": 5000,
  "totalValue": 12500,
  "totalInvested": 7500,
  "totalEarnings": 250,
  "pendingDeposits": 1000
}
```

**Field Descriptions**:
- `usdc`: Current wallet balance in USDC
- `totalValue`: Total value (wallet balance + portfolio current value)
- `totalInvested`: Total amount invested across all properties
- `totalEarnings`: Total rewards/earnings received
- `pendingDeposits`: Sum of pending deposit transactions

---

## Transactions Endpoints

### GET /api/mobile/transactions

Get user's transactions with filters, pagination, and field transformations.

**Authentication**: Required

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page
- `type` (optional): Filter by type (`deposit`, `withdrawal`, `investment`, `return`, `fee`, `reward`, `inflow`)
- `status` (optional): Filter by status (`pending`, `completed`, `failed`)
- `propertyId` (optional): Filter by property (UUID or displayCode)

**Example Request**:
```bash
GET /api/mobile/transactions?page=1&limit=20&type=deposit&status=completed
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "deposit",
      "amount": 5000,
      "date": "2025-01-12T10:00:00.000Z",
      "description": "Wallet deposit via card",
      "status": "completed",
      "currency": "USDC",
      "propertyId": null,
      "propertyTitle": null,
      "transactionHash": "TXN-000001"
    },
    {
      "id": "uuid",
      "type": "investment",
      "amount": 2500,
      "date": "2025-01-12T11:00:00.000Z",
      "description": "Investment in Marina View Residences",
      "status": "completed",
      "currency": "USDC",
      "propertyId": "uuid",
      "propertyTitle": "Marina View Residences",
      "transactionHash": "TXN-000002"
    },
    {
      "id": "uuid",
      "type": "rental_income",
      "amount": 16.67,
      "date": "2025-01-01T00:00:00.000Z",
      "description": "Rental income from Marina View Residences",
      "status": "completed",
      "currency": "USDC",
      "propertyId": "uuid",
      "propertyTitle": "Marina View Residences",
      "transactionHash": "RWD-000001"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## Field Transformations

### Wallet Response
- `balanceUSDT` → `usdc` (converted to number)
- Computed `totalValue` (wallet + portfolio current value)
- Computed `totalInvested` (from portfolio)
- Computed `totalEarnings` (from portfolio rewards)
- Computed `pendingDeposits` (sum of pending deposit transactions)

### Transaction Response
- `amountUSDT` → `amount` (converted to number)
- `createdAt` → `date`
- `reward` → `rental_income` (type mapping for mobile app)
- `displayCode` → `transactionHash`
- Always includes `currency: "USDC"`
- Includes property information when available

---

## Testing

### Test with cURL

```bash
# Get wallet (requires authentication token)
curl -X GET http://localhost:3000/api/mobile/wallet \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get transactions
curl -X GET "http://localhost:3000/api/mobile/transactions?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get transactions with filters
curl -X GET "http://localhost:3000/api/mobile/transactions?type=deposit&status=completed&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get transactions for specific property
curl -X GET "http://localhost:3000/api/mobile/transactions?propertyId=PROP-000001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test with Insomnia/Postman

1. **Get Wallet**:
   - Method: `GET`
   - URL: `{{base_url}}/api/mobile/wallet`
   - Headers:
     - `Authorization: Bearer {{auth_token}}`

2. **Get Transactions**:
   - Method: `GET`
   - URL: `{{base_url}}/api/mobile/transactions`
   - Headers:
     - `Authorization: Bearer {{auth_token}}`
   - Query Params:
     - `page`: 1
     - `limit`: 20
     - `type`: deposit (optional)
     - `status`: completed (optional)
     - `propertyId`: PROP-000001 (optional)

---

## Implementation Details

### Files Created

**Wallet Module**:
- `src/mobile-wallet/mobile-wallet.service.ts` - Aggregated wallet service
- `src/mobile-wallet/mobile-wallet.controller.ts` - Wallet controller
- `src/mobile-wallet/mobile-wallet.module.ts` - Module configuration

**Transactions Module**:
- `src/mobile-transactions/dto/transaction-filter.dto.ts` - Filter DTO with validation
- `src/mobile-transactions/mobile-transactions.service.ts` - Service with filtering and transformation
- `src/mobile-transactions/mobile-transactions.controller.ts` - Transactions controller
- `src/mobile-transactions/mobile-transactions.module.ts` - Module configuration

### Dependencies

- Uses existing `WalletService`, `PortfolioService`, `TransactionsService`
- Uses existing `Transaction` entity
- No breaking changes to existing endpoints

---

## Business Logic

### Wallet Aggregation

1. Fetches user's wallet balance
2. Fetches user's portfolio for investment and earnings data
3. Calculates total current value (wallet + portfolio)
4. Calculates pending deposits from transaction history
5. Returns aggregated response

### Transaction Filtering

1. Validates user ID (UUID or displayCode)
2. Applies filters (type, status, propertyId)
3. Supports property filtering by UUID or displayCode
4. Applies pagination
5. Transforms response fields for mobile app compatibility
6. Maps `reward` type to `rental_income` for mobile app

---

## Notes

- All endpoints require authentication
- User can only access their own wallet and transactions
- Property ID can be UUID or displayCode in filters
- Transaction type `reward` is mapped to `rental_income` for mobile app compatibility
- Pagination prevents large payloads
- All decimal values are converted to numbers for JSON response

