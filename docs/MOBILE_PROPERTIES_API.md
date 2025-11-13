# Mobile Properties API

## Overview

Mobile-optimized properties endpoints at `/api/mobile/properties` with filtering, pagination, and field transformations.

## Endpoints

### 1. GET /api/mobile/properties

List properties with filters, pagination, and search.

**Authentication**: Public (can be changed to protected if needed)

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20, max: 100): Items per page
- `city` (optional): Filter by city
- `status` (optional): Filter by status (`planning`, `construction`, `active`, `onhold`, `soldout`, `completed`)
- `minROI` (optional): Minimum ROI percentage
- `maxPricePerToken` (optional): Maximum token price
- `search` (optional): Search in title, description, or city
- `filter` (optional): Predefined filter (`Trending`, `High Yield`, `New Listings`, `Completed`)

**Example Request**:
```bash
GET /api/mobile/properties?page=1&limit=20&city=Karachi&status=active&minROI=10&filter=Trending
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "displayCode": "PROP-000001",
      "title": "Marina View Residences",
      "location": "Karachi, Pakistan",
      "city": "Karachi",
      "country": "Pakistan",
      "valuation": 1000000,
      "tokenPrice": 1000,
      "minInvestment": 1000,
      "totalTokens": 1000,
      "soldTokens": 250,
      "availableTokens": 750,
      "estimatedROI": 10,
      "estimatedYield": 10,
      "completionDate": null,
      "status": "active",
      "images": ["/docs/properties/img1.jpg"],
      "description": "Luxury waterfront apartments...",
      "amenities": ["pool", "gym", "parking"],
      "builder": {
        "id": "uuid",
        "name": "HMR Builders",
        "logo": "https://example.com/logo.png",
        "rating": 0,
        "projectsCompleted": 0
      },
      "features": {
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 1500,
        "floors": 10,
        "units": 100
      },
      "type": "residential",
      "slug": "marina-view-residences",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-12T00:00:00.000Z"
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

### 2. GET /api/mobile/properties/:id

Get a single property by ID or displayCode.

**Authentication**: Public (can be changed to protected if needed)

**Path Parameters**:
- `id`: Property UUID or displayCode (e.g., "PROP-000001")

**Example Request**:
```bash
GET /api/mobile/properties/PROP-000001
# or
GET /api/mobile/properties/550e8400-e29b-41d4-a716-446655440000
```

**Response**: Same format as single property object in the list endpoint.

## Field Transformations

The mobile API transforms backend field names to match mobile app expectations:

| Backend Field | Mobile Field | Notes |
|--------------|--------------|-------|
| `totalValueUSDT` | `valuation` | Converted to number |
| `pricePerTokenUSDT` | `tokenPrice` | Converted to number |
| `expectedROI` | `estimatedROI` | Converted to number |
| `totalTokens - availableTokens` | `soldTokens` | Computed field |
| `organization` | `builder` | Nested object transformation |
| `features` | `amenities` | Extracted from features object |
| `features` | `features` | Structured features (bedrooms, bathrooms, etc.) |

## Predefined Filters

### Trending
Properties with more than 30% tokens sold.  
*Note: Future enhancement will use actual trending logic based on recent investments (last 7 days)*

### High Yield
Properties with ROI >= 10%

### New Listings
Properties created in the last 30 days

### Completed
Properties with status = 'completed'

## Testing

### Test with cURL

```bash
# List all properties
curl http://localhost:3000/api/mobile/properties

# List with pagination
curl "http://localhost:3000/api/mobile/properties?page=1&limit=10"

# Filter by city
curl "http://localhost:3000/api/mobile/properties?city=Karachi"

# Filter by status
curl "http://localhost:3000/api/mobile/properties?status=active"

# Search
curl "http://localhost:3000/api/mobile/properties?search=marina"

# Predefined filter
curl "http://localhost:3000/api/mobile/properties?filter=Trending"

# Combined filters
curl "http://localhost:3000/api/mobile/properties?city=Karachi&status=active&minROI=10&page=1&limit=20"

# Get single property
curl http://localhost:3000/api/mobile/properties/PROP-000001
```

### Test with Insomnia/Postman

1. **List Properties**:
   - Method: `GET`
   - URL: `{{base_url}}/api/mobile/properties`
   - Query Params:
     - `page`: 1
     - `limit`: 20
     - `city`: Karachi (optional)
     - `status`: active (optional)
     - `filter`: Trending (optional)

2. **Get Property**:
   - Method: `GET`
   - URL: `{{base_url}}/api/mobile/properties/PROP-000001`

## Implementation Details

### Files Created

- `src/mobile-properties/dto/property-filter.dto.ts` - Filter DTO with validation
- `src/mobile-properties/mobile-properties.service.ts` - Service with filtering and transformation logic
- `src/mobile-properties/mobile-properties.controller.ts` - Controller with endpoints
- `src/mobile-properties/mobile-properties.module.ts` - Module configuration

### Dependencies

- Uses existing `Property` entity
- Uses existing `PropertiesModule` for entity access
- No breaking changes to existing `/properties` endpoints

## Future Enhancements

1. **Trending Logic**: Implement actual trending based on recent investments (last 7 days)
2. **Builder Rating**: Add rating system for organizations
3. **Projects Completed**: Count completed properties per organization
4. **Completion Date**: Add `completionDate` field to Property entity
5. **Image URLs**: Transform relative paths to full URLs if needed
6. **Authentication**: Make endpoints protected if required

## Notes

- Endpoints are currently public (marked with `@Public()` decorator)
- Can be changed to protected by removing `@Public()` and adding `@UseGuards(JwtAuthGuard)`
- Field transformations ensure mobile app compatibility
- Pagination prevents large payloads
- Search uses case-insensitive ILIKE for PostgreSQL

