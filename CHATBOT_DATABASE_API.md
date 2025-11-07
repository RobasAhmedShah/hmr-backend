# Chatbot Database API Endpoints

## Overview

These endpoints are specifically designed for **AI chatbot tool calling** (Blocks chatbot). They use POST requests and return JSON responses with property data.

**Base URL:** `http://localhost:3000/api/database` (or your production URL)

---

## Endpoints

### 1. Get Property Details

**Endpoint:** `POST /api/database/getPropertyDetails`

**Purpose:** Retrieve detailed information about a specific property by ID, title, or display code.

**Request Body:**
```json
{
  "propertyId": "uuid-here"  // Optional: UUID of the property
}
```
OR
```json
{
  "displayCode": "PROP-000001"  // Optional: Display code like PROP-000001
}
```
OR
```json
{
  "propertyTitle": "Skyline Tower"  // Optional: Partial or full title (case-insensitive search)
}
```

**Response (Success):**
```json
{
  "id": "uuid...",
  "displayCode": "PROP-000001",
  "organizationId": "uuid...",
  "title": "Skyline Tower",
  "slug": "skyline-tower",
  "description": "Luxury residential property...",
  "type": "residential",
  "status": "active",
  "totalValueUSDT": "1000000.000000",
  "totalTokens": "1000.000000",
  "availableTokens": "750.000000",
  "pricePerTokenUSDT": "1000.000000",
  "expectedROI": "10.50",
  "city": "Islamabad",
  "country": "Pakistan",
  "features": {...},
  "images": [...],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

**Response (Not Found):**
```json
{
  "error": "Property not found"
}
```

**Response (Error):**
```json
{
  "statusCode": 500,
  "message": "Please provide propertyId, propertyTitle, or displayCode"
}
```

---

### 2. Search Properties

**Endpoint:** `POST /api/database/searchProperties`

**Purpose:** Search for properties with multiple filters (city, country, status, type, ROI, price).

**Request Body:**
```json
{
  "city": "Islamabad",           // Optional: City name (case-insensitive partial match)
  "country": "Pakistan",          // Optional: Country name (case-insensitive partial match)
  "status": "active",             // Optional: One of: planning, construction, active, onhold, soldout, completed
  "type": "residential",          // Optional: One of: residential, commercial, mixed
  "minROI": 8,                    // Optional: Minimum expected ROI (number)
  "maxPricePerToken": 1500        // Optional: Maximum price per token in USDT (number)
}
```

**All fields are optional** - you can provide any combination of filters.

**Response (Success):**
```json
[
  {
    "id": "uuid...",
    "displayCode": "PROP-000001",
    "title": "Skyline Tower",
    "type": "residential",
    "status": "active",
    "city": "Islamabad",
    "country": "Pakistan",
    "pricePerTokenUSDT": "1000.000000",
    "expectedROI": "10.50",
    ...
  },
  {
    "id": "uuid...",
    "displayCode": "PROP-000002",
    "title": "Marina Complex",
    ...
  }
]
```

**Response (No Results):**
```json
[]
```

**Note:** Results are limited to 20 properties, ordered by creation date (newest first).

---

### 3. Get Property Financials

**Endpoint:** `POST /api/database/getPropertyFinancials`

**Purpose:** Get financial metrics for a property including sold tokens calculation.

**Request Body:**
```json
{
  "propertyId": "uuid-here"  // Optional: UUID of the property
}
```
OR
```json
{
  "propertyTitle": "Skyline Tower"  // Optional: Property title (case-insensitive partial match)
}
```

**Response (Success):**
```json
{
  "property_id": "uuid...",
  "property_title": "Skyline Tower",
  "property_pricePerTokenUSDT": "1000.000000",
  "property_expectedROI": "10.50",
  "property_totalValueUSDT": "1000000.000000",
  "property_totalTokens": "1000.000000",
  "property_availableTokens": "750.000000",
  "soldTokens": "250.000000"  // Calculated: totalTokens - availableTokens
}
```

**Response (Not Found):**
```json
{
  "error": "Property not found"
}
```

---

## Important Notes

### ✅ POST Requests Return Responses

**Yes, POST requests return responses!** This is standard HTTP behavior. The response contains:
- **Success:** The requested data (property object, array of properties, or financial data)
- **Not Found:** An error object with `{ "error": "Property not found" }`
- **Error:** HTTP exception with status code and message

### 🔒 CORS Configuration

CORS is already configured in `main.ts` to allow all origins. The chatbot can call these endpoints from any domain.

### 🎯 Use Case

These endpoints are designed for **AI chatbot function calling**:
1. The chatbot receives a user query (e.g., "Show me properties in Islamabad")
2. The chatbot calls `POST /api/database/searchProperties` with `{ "city": "Islamabad" }`
3. The endpoint returns an array of properties
4. The chatbot formats and presents the data to the user

### 📝 Example Usage (cURL)

```bash
# Get property details
curl -X POST http://localhost:3000/api/database/getPropertyDetails \
  -H "Content-Type: application/json" \
  -d '{"displayCode": "PROP-000001"}'

# Search properties
curl -X POST http://localhost:3000/api/database/searchProperties \
  -H "Content-Type: application/json" \
  -d '{"city": "Islamabad", "minROI": 8}'

# Get financials
curl -X POST http://localhost:3000/api/database/getPropertyFinancials \
  -H "Content-Type: application/json" \
  -d '{"propertyTitle": "Skyline"}'
```

### 🔄 Integration with Existing APIs

These endpoints are **separate** from your existing REST APIs:
- Existing APIs: `/properties`, `/admin/organizations`, etc. (unchanged)
- Chatbot APIs: `/api/database/*` (new, for AI tool calling)

Both can coexist without conflicts.

---

## Environment Variable for Expo App

Set this in your Expo app's `.env` file:

```env
EXPO_PUBLIC_DATABASE_API_URL=http://localhost:3000/api/database
```

Or for production:

```env
EXPO_PUBLIC_DATABASE_API_URL=https://your-nestjs-backend.com/api/database
```

