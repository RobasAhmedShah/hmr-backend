# Mobile Investments API

## Overview

Mobile-optimized investments endpoints at `/api/mobile/investments` with field transformations and computed values.

## Endpoints

### 1. POST /api/mobile/investments

Create a new investment.

**Authentication**: Required

**Request Body**:
```json
{
  "propertyId": "uuid-or-display-code",
  "tokenCount": 2.5,
  "transactionFee": 0  // Optional
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "displayCode": "INV-000001",
  "property": {
    "id": "uuid",
    "displayCode": "PROP-000001",
    "title": "Marina View Residences",
    "images": ["/docs/properties/img1.jpg"],
    "tokenPrice": 1000,
    "status": "active",
    "city": "Karachi",
    "country": "Pakistan"
  },
  "tokens": 2.5,
  "investedAmount": 2500,
  "currentValue": 2500,
  "roi": 0,
  "rentalYield": 10,
  "monthlyRentalIncome": 20.83,
  "status": "confirmed",
  "paymentStatus": "completed",
  "purchaseDate": "2025-01-12T10:00:00.000Z",
  "createdAt": "2025-01-12T10:00:00.000Z",
  "updatedAt": "2025-01-12T10:00:00.000Z"
}
```

**Errors**:
- `400`: Insufficient wallet balance
- `400`: Not enough tokens available
- `404`: Property not found
- `401`: Unauthorized (invalid token)

---

### 2. GET /api/mobile/investments

Get all investments for the authenticated user.

**Authentication**: Required

**Response** (200):
```json
{
  "investments": [
    {
      "id": "uuid",
      "displayCode": "INV-000001",
      "property": {
        "id": "uuid",
        "displayCode": "PROP-000001",
        "title": "Marina View Residences",
        "images": ["/docs/properties/img1.jpg"],
        "tokenPrice": 1050,
        "status": "active",
        "city": "Karachi",
        "country": "Pakistan"
      },
      "tokens": 2.5,
      "investedAmount": 2500,
      "currentValue": 2625,
      "roi": 5,
      "rentalYield": 10,
      "monthlyRentalIncome": 20.83,
      "status": "confirmed",
      "paymentStatus": "completed",
      "purchaseDate": "2025-01-12T10:00:00.000Z",
      "createdAt": "2025-01-12T10:00:00.000Z",
      "updatedAt": "2025-01-12T10:00:00.000Z"
    }
  ]
}
```

---

### 3. GET /api/mobile/investments/:id

Get a single investment by ID or displayCode.

**Authentication**: Required

**Path Parameters**:
- `id`: Investment UUID or displayCode (e.g., "INV-000001")

**Response** (200):
Same structure as single investment object in the list endpoint.

**Errors**:
- `404`: Investment not found
- `403`: Forbidden (not your investment)

---

## Field Transformations

The mobile API transforms backend field names and computes additional values:

| Backend Field | Mobile Field | Notes |
|--------------|--------------|-------|
| `tokensPurchased` | `tokens` | Converted to number |
| `amountUSDT` | `investedAmount` | Converted to number |
| `tokens * currentTokenPrice` | `currentValue` | Computed field |
| `(currentValue - investedAmount) / investedAmount * 100` | `roi` | Computed ROI percentage |
| `expectedROI` | `rentalYield` | Converted to number |
| `(investedAmount * rentalYield / 100) / 12` | `monthlyRentalIncome` | Computed monthly income |
| `createdAt` | `purchaseDate` | Alias for purchase date |
| `property` | `property` | Nested object with selected fields |

## Computed Values

### Current Value
Calculated as: `tokens * property.tokenPrice`

### ROI (Return on Investment)
Calculated as: `((currentValue - investedAmount) / investedAmount) * 100`

### Monthly Rental Income
Calculated as: `(investedAmount * rentalYield / 100) / 12`

## Testing

### Test with cURL

```bash
# Create investment (requires authentication token)
curl -X POST http://localhost:3000/api/mobile/investments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "propertyId": "PROP-000001",
    "tokenCount": 2.5
  }'

# Get user's investments
curl -X GET http://localhost:3000/api/mobile/investments \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get single investment
curl -X GET http://localhost:3000/api/mobile/investments/INV-000001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test with Insomnia/Postman

1. **Create Investment**:
   - Method: `POST`
   - URL: `{{base_url}}/api/mobile/investments`
   - Headers:
     - `Authorization: Bearer {{auth_token}}`
     - `Content-Type: application/json`
   - Body:
     ```json
     {
       "propertyId": "PROP-000001",
       "tokenCount": 2.5
     }
     ```

2. **Get Investments**:
   - Method: `GET`
   - URL: `{{base_url}}/api/mobile/investments`
   - Headers:
     - `Authorization: Bearer {{auth_token}}`

3. **Get Investment**:
   - Method: `GET`
   - URL: `{{base_url}}/api/mobile/investments/INV-000001`
   - Headers:
     - `Authorization: Bearer {{auth_token}}`

## Implementation Details

### Files Created

- `src/mobile-investments/dto/create-investment.dto.ts` - Create investment DTO
- `src/mobile-investments/mobile-investments.service.ts` - Service with transformation logic
- `src/mobile-investments/mobile-investments.controller.ts` - Controller with endpoints
- `src/mobile-investments/mobile-investments.module.ts` - Module configuration

### Dependencies

- Uses existing `InvestmentsService` (wrapped)
- Uses existing `Investment` entity
- No breaking changes to existing `/investments` endpoints

## Security

- All endpoints require authentication (`@UseGuards(JwtAuthGuard)`)
- User can only access their own investments
- Investment creation uses authenticated user's ID automatically
- Single investment endpoint verifies ownership before returning

## Business Logic

### Investment Creation Flow

1. Validates property exists (by UUID or displayCode)
2. Validates sufficient tokens available
3. Validates user has sufficient wallet balance
4. Creates investment in database transaction
5. Updates wallet balance and property available tokens
6. Emits investment completed event
7. Returns transformed investment response

### Investment Retrieval

- Automatically filters by authenticated user
- Includes property details with selected fields
- Computes current value, ROI, and monthly income
- Transforms field names for mobile app compatibility

## Notes

- Property ID can be UUID or displayCode
- Investment ID can be UUID or displayCode
- All decimal values are converted to numbers for JSON response
- ROI is calculated based on current token price vs purchase price
- Monthly rental income is estimated based on expected ROI

