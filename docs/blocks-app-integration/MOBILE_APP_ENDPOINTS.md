# Mobile App Endpoints: API Namespace & Structure

**Version**: 1.0  
**Last Updated**: 2025-01-12  
**Purpose**: Complete API structure definition for `/api/mobile/*` namespace with request/response specifications

---

## Table of Contents

1. [Namespace Overview](#1-namespace-overview)
2. [Authentication Endpoints](#2-authentication-endpoints)
3. [Properties Endpoints](#3-properties-endpoints)
4. [Investments Endpoints](#4-investments-endpoints)
5. [Wallet Endpoints](#5-wallet-endpoints)
6. [Transactions Endpoints](#6-transactions-endpoints)
7. [Portfolio Endpoints](#7-portfolio-endpoints)
8. [User Profile Endpoints](#8-user-profile-endpoints)
9. [Bookmarks Endpoints](#9-bookmarks-endpoints)
10. [Notifications Endpoints](#10-notifications-endpoints)
11. [Support & Content Endpoints](#11-support--content-endpoints)
12. [Error Responses](#12-error-responses)
13. [Rate Limiting](#13-rate-limiting)

---

## 1. Namespace Overview

### Why `/api/mobile/*`?

- **Separation of Concerns**: Isolate mobile app endpoints from admin/org endpoints
- **Mobile-Optimized**: Tailored responses with reduced payloads
- **Versioning**: Future-proof with potential `/api/mobile/v2/*`
- **Non-Destructive**: Existing apps (admin, org) remain untouched

### API Base URL

**Production**: `https://api.blocks.com`  
**Staging**: `https://staging-api.blocks.com`  
**Development**: `http://localhost:3000`

### Authentication

All endpoints (except auth) require:
```
Authorization: Bearer <jwt_token>
```

### Content Type

All requests and responses use JSON:
```
Content-Type: application/json
```

---

## 2. Authentication Endpoints

### 2.1 Login

**POST** `/api/mobile/auth/login`

**Description**: Authenticate user with Magic DID token

**Request Body**:
```json
{
  "didToken": "WyI...",  // Magic DID token (required)
  "email": "user@example.com"  // Email used for Magic login (required)
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "displayCode": "USR-000001",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+923001234567",
    "profileImage": null,
    "createdAt": "2025-01-12T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- `401`: Invalid DID token
- `401`: Email mismatch
- `403`: User account disabled

---

### 2.2 Register

**POST** `/api/mobile/auth/register`

**Description**: Register new user with Magic authentication

**Request Body**:
```json
{
  "didToken": "WyI...",
  "email": "user@example.com",
  "fullName": "John Doe",
  "phone": "+923001234567"  // Optional
}
```

**Response** (201):
```json
{
  "user": { ... },  // Same as login
  "token": "...",
  "refreshToken": "..."
}
```

**Errors**:
- `400`: Invalid input
- `409`: Email already exists
- `401`: Invalid DID token

---

### 2.3 Refresh Token

**POST** `/api/mobile/auth/refresh`

**Description**: Refresh expired access token

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):
```json
{
  "token": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

**Errors**:
- `401`: Invalid or expired refresh token

---

### 2.4 Logout

**POST** `/api/mobile/auth/logout`

**Authentication**: Required

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

### 2.5 Get Current User

**GET** `/api/mobile/auth/me`

**Authentication**: Required

**Response** (200):
```json
{
  "id": "uuid",
  "displayCode": "USR-000001",
  "email": "user@example.com",
  "fullName": "John Doe",
  "phone": "+923001234567",
  "dob": "1990-01-15",
  "address": "123 Main St, Karachi",
  "profileImage": "https://example.com/image.jpg",
  "role": "user",
  "isActive": true,
  "createdAt": "2025-01-12T10:00:00.000Z",
  "updatedAt": "2025-01-12T10:00:00.000Z"
}
```

---

## 3. Properties Endpoints

### 3.1 List Properties

**GET** `/api/mobile/properties`

**Authentication**: Required

**Query Parameters**:
```
page=1                    // Page number (default: 1)
limit=20                  // Items per page (default: 20, max: 100)
city=Karachi              // Filter by city
status=funding            // Filter by status (funding, construction, completed)
minROI=10                 // Minimum ROI percentage
maxPricePerToken=1500     // Maximum token price
search=marina             // Search in title, location, city
filter=Trending           // Predefined filter (Trending, High Yield, New Listings, Completed)
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "displayCode": "PROP-000001",
      "title": "Marina View Residences",
      "location": "DHA Phase 8, Karachi",
      "city": "Karachi",
      "valuation": 1000000,
      "tokenPrice": 1000,
      "minInvestment": 1000,
      "totalTokens": 1000,
      "soldTokens": 250,
      "estimatedROI": 10,
      "estimatedYield": 10,
      "completionDate": "2026-12-31",
      "status": "funding",
      "images": ["https://example.com/img1.jpg"],
      "description": "Luxury waterfront apartments...",
      "amenities": ["pool", "gym", "parking"],
      "builder": {
        "id": "uuid",
        "name": "HMR Builders",
        "logo": "https://example.com/logo.png",
        "rating": 4.5,
        "projectsCompleted": 12
      },
      "features": {
        "bedrooms": 3,
        "bathrooms": 2,
        "area": 1500,
        "floors": 10,
        "units": 100
      },
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

---

### 3.2 Get Property by ID

**GET** `/api/mobile/properties/:id`

**Authentication**: Required

**Path Parameters**:
- `id`: Property UUID or displayCode (e.g., "PROP-000001")

**Response** (200):
```json
{
  "id": "uuid",
  "displayCode": "PROP-000001",
  "title": "Marina View Residences",
  "location": "DHA Phase 8, Karachi",
  "city": "Karachi",
  "valuation": 1000000,
  "tokenPrice": 1000,
  "minInvestment": 1000,
  "totalTokens": 1000,
  "soldTokens": 250,
  "estimatedROI": 10,
  "estimatedYield": 10,
  "completionDate": "2026-12-31",
  "status": "funding",
  "images": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
  "description": "Luxury waterfront apartments with stunning views...",
  "amenities": ["pool", "gym", "parking", "security"],
  "builder": {
    "id": "uuid",
    "name": "HMR Builders",
    "logo": "https://example.com/logo.png",
    "rating": 4.5,
    "projectsCompleted": 12
  },
  "features": {
    "bedrooms": 3,
    "bathrooms": 2,
    "area": 1500,
    "floors": 10,
    "units": 100
  },
  "documents": [
    {
      "id": "uuid",
      "name": "Title Deed",
      "type": "deed",
      "verified": true,
      "url": "https://example.com/deed.pdf"
    }
  ],
  "updates": [
    {
      "id": "uuid",
      "title": "Construction Update",
      "description": "Foundation work completed...",
      "date": "2025-01-10",
      "type": "project"
    }
  ],
  "rentalIncome": {
    "monthly": 5000,
    "lastDistribution": "2025-01-01",
    "nextDistribution": "2025-02-01"
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-12T00:00:00.000Z"
}
```

**Errors**:
- `404`: Property not found

---

### 3.3 Search Properties

**GET** `/api/mobile/properties/search`

**Authentication**: Required

**Query Parameters**:
```
query=marina              // Search term (required)
city=Karachi              // Filter by city
status=funding            // Filter by status
minROI=10                 // Minimum ROI
maxPricePerToken=1500     // Maximum token price
```

**Response** (200):
Same as List Properties

---

### 3.4 Get Property Financials

**GET** `/api/mobile/properties/:id/financials`

**Authentication**: Required

**Response** (200):
```json
{
  "propertyId": "uuid",
  "propertyTitle": "Marina View Residences",
  "valuation": 1000000,
  "tokenPrice": 1000,
  "totalTokens": 1000,
  "soldTokens": 250,
  "estimatedROI": 10,
  "estimatedYield": 10,
  "fundingProgress": 25,
  "rentalIncome": {
    "monthly": 5000,
    "lastDistribution": "2025-01-01T00:00:00.000Z",
    "nextDistribution": "2025-02-01T00:00:00.000Z"
  }
}
```

---

### 3.5 Get Property Updates

**GET** `/api/mobile/properties/:id/updates`

**Authentication**: Required

**Query Parameters**:
```
limit=10  // Max updates to return (default: 10)
```

**Response** (200):
```json
{
  "updates": [
    {
      "id": "uuid",
      "title": "Construction Update",
      "description": "Foundation work completed ahead of schedule...",
      "date": "2025-01-10",
      "type": "project"
    }
  ]
}
```

---

## 4. Investments Endpoints

### 4.1 Create Investment

**POST** `/api/mobile/investments`

**Authentication**: Required

**Request Body**:
```json
{
  "propertyId": "uuid",
  "tokenCount": 2.5,
  "transactionFee": 0  // Optional
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "displayCode": "INV-000001",
  "userId": "uuid",
  "propertyId": "uuid",
  "property": {
    "id": "uuid",
    "title": "Marina View Residences",
    "tokenPrice": 1000
  },
  "tokens": 2.5,
  "investedAmount": 2500,
  "status": "confirmed",
  "paymentStatus": "completed",
  "purchaseDate": "2025-01-12T10:00:00.000Z",
  "createdAt": "2025-01-12T10:00:00.000Z"
}
```

**Errors**:
- `400`: Insufficient balance
- `400`: Not enough tokens available
- `404`: Property not found
- `403`: KYC not verified

---

### 4.2 Get User Investments

**GET** `/api/mobile/investments`

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
        "images": ["https://example.com/img1.jpg"],
        "tokenPrice": 1000
      },
      "tokens": 2.5,
      "investedAmount": 2500,
      "currentValue": 2625,  // Current token price × tokens
      "roi": 5,  // (currentValue - investedAmount) / investedAmount * 100
      "rentalYield": 8,
      "monthlyRentalIncome": 16.67,
      "purchaseDate": "2025-01-12T10:00:00.000Z",
      "createdAt": "2025-01-12T10:00:00.000Z"
    }
  ]
}
```

---

### 4.3 Get Investment by ID

**GET** `/api/mobile/investments/:id`

**Authentication**: Required

**Response** (200):
Same structure as single investment object above

**Errors**:
- `404`: Investment not found
- `403`: Not authorized (not your investment)

---

### 4.4 Get Investment Details (for owned property)

**GET** `/api/mobile/investments/property/:propertyId`

**Authentication**: Required

**Description**: Get user's investment details for a specific property with income history

**Response** (200):
```json
{
  "investment": {
    "id": "uuid",
    "tokens": 2.5,
    "investedAmount": 2500,
    "currentValue": 2625,
    "purchaseDate": "2025-01-12T10:00:00.000Z"
  },
  "property": {
    "id": "uuid",
    "title": "Marina View Residences",
    "tokenPrice": 1050,
    "status": "generating-income"
  },
  "ownershipDetails": {
    "ownershipPercentage": 0.25,
    "tokensOwned": 2.5,
    "totalValue": 2625
  },
  "incomeHistory": [
    {
      "id": "uuid",
      "amount": 16.67,
      "date": "2025-01-01T00:00:00.000Z",
      "status": "distributed"
    }
  ],
  "transactionHistory": [
    {
      "id": "uuid",
      "type": "investment",
      "amount": 2500,
      "date": "2025-01-12T10:00:00.000Z",
      "status": "completed"
    }
  ]
}
```

**Errors**:
- `404`: Property not found
- `404`: No investment found for this property

---

## 5. Wallet Endpoints

### 5.1 Get Wallet Balance

**GET** `/api/mobile/wallet`

**Authentication**: Required

**Response** (200):
```json
{
  "usdc": 5000,
  "totalValue": 12500,  // wallet + portfolio current value
  "totalInvested": 7500,
  "totalEarnings": 250,
  "pendingDeposits": 1000
}
```

---

### 5.2 Deposit Funds

**POST** `/api/mobile/wallet/deposit`

**Authentication**: Required

**Request Body**:
```json
{
  "amount": 5000,
  "method": "card",  // 'card' | 'binance' | 'onchain'
  "paymentMethodId": "uuid",  // Optional, for card
  "network": "polygon"  // Optional, for onchain
}
```

**Response** (201):
```json
{
  "transaction": {
    "id": "uuid",
    "type": "deposit",
    "amount": 5000,
    "status": "pending",
    "createdAt": "2025-01-12T10:00:00.000Z"
  },
  "paymentUrl": "https://payment-provider.com/checkout/...",  // For card/binance
  "walletAddress": "0x...",  // For onchain
  "qrCode": "data:image/png;base64,..."  // For onchain
}
```

**Errors**:
- `403`: KYC not verified
- `400`: Invalid payment method

---

### 5.3 Withdraw Funds

**POST** `/api/mobile/wallet/withdraw`

**Authentication**: Required

**Request Body**:
```json
{
  "amount": 2000,
  "method": "bank",  // 'bank' | 'crypto'
  "bankAccountId": "uuid",  // Required for bank
  "walletAddress": "0x...",  // Required for crypto
  "network": "polygon"  // Required for crypto
}
```

**Response** (201):
```json
{
  "transaction": {
    "id": "uuid",
    "type": "withdrawal",
    "amount": 2000,
    "status": "pending",
    "description": "Withdrawal to bank account",
    "createdAt": "2025-01-12T10:00:00.000Z"
  },
  "estimatedArrival": "2025-01-15T00:00:00.000Z"
}
```

**Errors**:
- `403`: KYC not verified
- `400`: Insufficient balance
- `404`: Bank account not found

---

### 5.4 Get Deposit Methods

**GET** `/api/mobile/wallet/deposit-methods`

**Authentication**: Required

**Response** (200):
```json
{
  "methods": [
    {
      "id": "card",
      "title": "Debit/Credit Card",
      "description": "Instant deposit with Visa/Mastercard",
      "icon": "credit-card",
      "color": "#4F46E5",
      "enabled": true,
      "fees": {
        "percentage": 2.5,
        "minimum": 0
      }
    },
    {
      "id": "binance",
      "title": "Binance Pay",
      "description": "Pay with Binance",
      "icon": "binance",
      "color": "#F3BA2F",
      "enabled": true,
      "fees": {
        "percentage": 0,
        "minimum": 0
      }
    },
    {
      "id": "onchain",
      "title": "On-Chain Transfer",
      "description": "Transfer USDC from your wallet",
      "icon": "wallet",
      "color": "#10B981",
      "enabled": true,
      "fees": {
        "percentage": 0,
        "minimum": 0
      }
    }
  ]
}
```

---

### 5.5 Get Blockchain Networks

**GET** `/api/mobile/wallet/networks`

**Authentication**: Required

**Response** (200):
```json
{
  "networks": [
    {
      "id": "polygon",
      "name": "Polygon",
      "icon": "polygon-icon-url",
      "tokens": ["USDC", "USDT"],
      "fee": "~$0.01",
      "enabled": true
    },
    {
      "id": "bnb",
      "name": "BNB Chain",
      "icon": "bnb-icon-url",
      "tokens": ["USDC", "USDT", "BUSD"],
      "fee": "~$0.05",
      "enabled": true
    },
    {
      "id": "ethereum",
      "name": "Ethereum",
      "icon": "ethereum-icon-url",
      "tokens": ["USDC", "USDT"],
      "fee": "~$5-15",
      "enabled": false
    }
  ]
}
```

---

## 6. Transactions Endpoints

### 6.1 Get Transactions

**GET** `/api/mobile/transactions`

**Authentication**: Required

**Query Parameters**:
```
page=1                    // Page number
limit=20                  // Items per page
type=deposit              // Filter by type
status=completed          // Filter by status
propertyId=uuid           // Filter by property
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
      "transactionHash": "0x..."
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
      "transactionHash": "TXN-000005"
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
    "total": 15,
    "totalPages": 1
  }
}
```

---

## 7. Portfolio Endpoints

### 7.1 Get Portfolio Summary

**GET** `/api/mobile/portfolio/summary`

**Authentication**: Required

**Response** (200):
```json
{
  "totalInvested": 7500,
  "totalValue": 7875,
  "totalROI": 375,
  "monthlyRentalIncome": 50,
  "totalEarnings": 150,
  "investmentCount": 3,
  "distribution": [
    {
      "propertyId": "uuid",
      "propertyTitle": "Marina View Residences",
      "percentage": 31.75,
      "value": 2500
    },
    {
      "propertyId": "uuid",
      "propertyTitle": "Gulberg Heights",
      "percentage": 63.49,
      "value": 5000
    },
    {
      "propertyId": "uuid",
      "propertyTitle": "DHA Luxury Villas",
      "percentage": 4.76,
      "value": 375
    }
  ]
}
```

---

### 7.2 Get Portfolio Performance

**GET** `/api/mobile/portfolio/performance`

**Authentication**: Required

**Query Parameters**:
```
period=30d  // '7d' | '30d' | '90d' | '1y' | 'all'
```

**Response** (200):
```json
{
  "period": "30d",
  "data": [
    {
      "date": "2025-01-01",
      "value": 7500,
      "invested": 7500,
      "earnings": 0
    },
    {
      "date": "2025-01-05",
      "value": 7550,
      "invested": 7500,
      "earnings": 50
    },
    {
      "date": "2025-01-12",
      "value": 7875,
      "invested": 7500,
      "earnings": 150
    }
  ],
  "metrics": {
    "totalReturn": 375,
    "totalReturnPercentage": 5,
    "averageROI": 6.67
  }
}
```

---

## 8. User Profile Endpoints

### 8.1 Get Profile

**GET** `/api/mobile/profile`

**Authentication**: Required

**Response** (200):
```json
{
  "userInfo": {
    "id": "uuid",
    "displayCode": "USR-000001",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+923001234567",
    "dob": "1990-01-15",
    "address": "123 Main St, Karachi",
    "profileImage": "https://example.com/image.jpg",
    "createdAt": "2025-01-12T10:00:00.000Z"
  },
  "securitySettings": {
    "twoFactorAuth": false,
    "biometricLogin": true,
    "passwordLastChanged": null
  },
  "notificationSettings": {
    "pushNotifications": true,
    "emailNotifications": true,
    "smsNotifications": false,
    "investmentUpdates": true,
    "propertyAlerts": true,
    "monthlyReports": true,
    "marketingOffers": false,
    "securityAlerts": true,
    "paymentReminders": true,
    "portfolioMilestones": true,
    "doNotDisturb": {
      "enabled": false,
      "startTime": "22:00",
      "endTime": "08:00"
    }
  }
}
```

---

### 8.2 Update Profile

**PATCH** `/api/mobile/profile`

**Authentication**: Required

**Request Body** (all fields optional):
```json
{
  "fullName": "John Michael Doe",
  "phone": "+923001234567",
  "dob": "1990-01-15",
  "address": "123 Main St, Karachi, Pakistan",
  "profileImage": "https://example.com/new-image.jpg"
}
```

**Response** (200):
Updated user object

---

### 8.3 Update Security Settings

**PATCH** `/api/mobile/profile/security`

**Authentication**: Required

**Request Body**:
```json
{
  "twoFactorAuth": true,
  "biometricLogin": true
}
```

**Response** (200):
```json
{
  "twoFactorAuth": true,
  "biometricLogin": true,
  "passwordLastChanged": null,
  "updatedAt": "2025-01-12T10:00:00.000Z"
}
```

---

### 8.4 Update Notification Settings

**PATCH** `/api/mobile/profile/notifications`

**Authentication**: Required

**Request Body** (all fields optional):
```json
{
  "pushNotifications": true,
  "emailNotifications": false,
  "investmentUpdates": true,
  "doNotDisturb": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "08:00"
  }
}
```

**Response** (200):
Updated notification settings object

---

### 8.5 Get Bank Accounts

**GET** `/api/mobile/profile/bank-accounts`

**Authentication**: Required

**Response** (200):
```json
{
  "accounts": [
    {
      "id": "uuid",
      "bankName": "HBL",
      "accountNumber": "****1234",  // Masked
      "accountType": "Checking",
      "isPrimary": true,
      "status": "verified",
      "createdAt": "2025-01-12T10:00:00.000Z"
    }
  ]
}
```

---

### 8.6 Add Bank Account

**POST** `/api/mobile/profile/bank-accounts`

**Authentication**: Required (KYC verified)

**Request Body**:
```json
{
  "bankName": "HBL",
  "accountNumber": "1234567890",
  "accountType": "Checking",
  "routingNumber": "HBLIPKKA",
  "isPrimary": true
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "bankName": "HBL",
  "accountNumber": "****7890",
  "accountType": "Checking",
  "isPrimary": true,
  "status": "pending",
  "createdAt": "2025-01-12T10:00:00.000Z"
}
```

**Errors**:
- `403`: KYC not verified

---

### 8.7 Remove Bank Account

**DELETE** `/api/mobile/profile/bank-accounts/:id`

**Authentication**: Required

**Response** (200):
```json
{
  "message": "Bank account removed successfully"
}
```

---

### 8.8 Set Primary Bank Account

**PATCH** `/api/mobile/profile/bank-accounts/:id/primary`

**Authentication**: Required

**Response** (200):
Updated bank account with `isPrimary: true`

---

## 9. Bookmarks Endpoints

### 9.1 Get Bookmarks

**GET** `/api/mobile/bookmarks`

**Authentication**: Required

**Response** (200):
```json
{
  "bookmarks": [
    {
      "id": "uuid",
      "property": {
        "id": "uuid",
        "displayCode": "PROP-000001",
        "title": "Marina View Residences",
        "location": "DHA Phase 8, Karachi",
        "tokenPrice": 1000,
        "estimatedROI": 10,
        "images": ["https://example.com/img1.jpg"],
        "status": "funding"
      },
      "createdAt": "2025-01-12T10:00:00.000Z"
    }
  ]
}
```

---

### 9.2 Add Bookmark

**POST** `/api/mobile/bookmarks`

**Authentication**: Required

**Request Body**:
```json
{
  "propertyId": "uuid"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "propertyId": "uuid",
  "createdAt": "2025-01-12T10:00:00.000Z"
}
```

**Errors**:
- `409`: Already bookmarked

---

### 9.3 Remove Bookmark

**DELETE** `/api/mobile/bookmarks/:propertyId`

**Authentication**: Required

**Response** (200):
```json
{
  "message": "Bookmark removed successfully"
}
```

---

### 9.4 Toggle Bookmark

**POST** `/api/mobile/bookmarks/toggle`

**Authentication**: Required

**Description**: Smart endpoint - adds if not bookmarked, removes if already bookmarked

**Request Body**:
```json
{
  "propertyId": "uuid"
}
```

**Response** (200):
```json
{
  "isBookmarked": true,
  "bookmark": {
    "id": "uuid",
    "propertyId": "uuid",
    "createdAt": "2025-01-12T10:00:00.000Z"
  }
}
```

---

## 10. Notifications Endpoints

### 10.1 Get Notifications

**GET** `/api/mobile/notifications`

**Authentication**: Required

**Query Parameters**:
```
page=1              // Page number
limit=20            // Items per page
unreadOnly=true     // Show only unread (default: false)
type=investment     // Filter by type
```

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "investment_confirmed",
      "title": "Investment Confirmed",
      "body": "Your investment of 2500 USDC in Marina View Residences has been confirmed.",
      "data": {
        "investmentId": "uuid",
        "propertyId": "uuid",
        "amount": 2500
      },
      "read": false,
      "createdAt": "2025-01-12T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "type": "reward_distributed",
      "title": "Reward Received",
      "body": "You received 16.67 USDC rental income from Marina View Residences.",
      "data": {
        "rewardId": "uuid",
        "propertyId": "uuid",
        "amount": 16.67
      },
      "read": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2,
    "unreadCount": 3
  }
}
```

---

### 10.2 Mark Notification as Read

**PATCH** `/api/mobile/notifications/:id/read`

**Authentication**: Required

**Response** (200):
```json
{
  "id": "uuid",
  "read": true,
  "updatedAt": "2025-01-12T10:00:00.000Z"
}
```

---

### 10.3 Mark All Notifications as Read

**PATCH** `/api/mobile/notifications/read-all`

**Authentication**: Required

**Response** (200):
```json
{
  "message": "All notifications marked as read",
  "count": 3
}
```

---

### 10.4 Register Push Token

**POST** `/api/mobile/notifications/push-token`

**Authentication**: Required

**Request Body**:
```json
{
  "token": "ExponentPushToken[...]",
  "platform": "ios",  // 'ios' | 'android' | 'web'
  "deviceId": "unique-device-id"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "token": "ExponentPushToken[...]",
  "platform": "ios",
  "active": true,
  "createdAt": "2025-01-12T10:00:00.000Z"
}
```

---

### 10.5 Unregister Push Token

**DELETE** `/api/mobile/notifications/push-token`

**Authentication**: Required

**Request Body**:
```json
{
  "deviceId": "unique-device-id"
}
```

**Response** (200):
```json
{
  "message": "Push token unregistered successfully"
}
```

---

## 11. Support & Content Endpoints

### 11.1 Get FAQs

**GET** `/api/mobile/support/faqs`

**Authentication**: Required

**Query Parameters**:
```
category=getting-started  // Optional filter
```

**Response** (200):
```json
{
  "faqs": [
    {
      "id": "uuid",
      "category": "Getting Started",
      "question": "How do I invest in a property?",
      "answer": "To invest in a property, browse the available properties, select one you're interested in, and click the 'Invest' button. You'll need to have sufficient balance in your wallet and verified KYC.",
      "order": 1
    }
  ]
}
```

---

### 11.2 Get Contact Information

**GET** `/api/mobile/support/contact`

**Authentication**: Required

**Response** (200):
```json
{
  "email": "support@blocks.com",
  "phone": "+92-300-1234567",
  "address": "123 Main Street, Karachi, Pakistan",
  "businessHours": "Monday - Friday: 9:00 AM - 6:00 PM",
  "emergencyContact": "+92-300-7654321"
}
```

---

### 11.3 Submit Support Request

**POST** `/api/mobile/support/contact`

**Authentication**: Required

**Request Body**:
```json
{
  "subject": "Issue with withdrawal",
  "message": "I'm unable to withdraw funds. The button is grayed out.",
  "type": "email"  // 'email' | 'phone' | 'chat'
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "subject": "Issue with withdrawal",
  "status": "open",
  "priority": "medium",
  "createdAt": "2025-01-12T10:00:00.000Z",
  "ticketNumber": "TICKET-000123",
  "message": "Your support request has been received. We'll get back to you within 24 hours."
}
```

---

### 11.4 Get Privacy Policy

**GET** `/api/mobile/content/privacy-policy`

**Authentication**: Required

**Response** (200):
```json
{
  "type": "privacy-policy",
  "sections": [
    {
      "id": "section-1",
      "title": "Introduction",
      "content": [
        "This Privacy Policy describes how Blocks collects, uses, and shares your personal information...",
        "By using our services, you agree to the collection and use of information in accordance with this policy."
      ],
      "order": 1
    },
    {
      "id": "section-2",
      "title": "Information We Collect",
      "content": [
        "We collect several types of information for various purposes...",
        "- Personal identification information (Name, email address, phone number)",
        "- Financial information (wallet balances, transactions)"
      ],
      "order": 2
    }
  ],
  "lastUpdated": "2025-01-01T00:00:00.000Z"
}
```

---

### 11.5 Get Terms of Service

**GET** `/api/mobile/content/terms-of-service`

**Authentication**: Required

**Response** (200):
Same structure as privacy policy

---

### 11.6 Get Available Languages

**GET** `/api/mobile/content/languages`

**Authentication**: Required

**Response** (200):
```json
{
  "languages": [
    {
      "code": "en",
      "name": "English",
      "nativeName": "English",
      "enabled": true,
      "default": true
    },
    {
      "code": "ur",
      "name": "Urdu",
      "nativeName": "اردو",
      "enabled": true,
      "default": false
    }
  ]
}
```

---

## 12. Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Descriptive error message",
  "error": "Bad Request",
  "timestamp": "2025-01-12T10:00:00.000Z",
  "path": "/api/mobile/properties"
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or invalid token |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 13. Rate Limiting

### Rate Limits by Endpoint Type

| Endpoint Type | Rate Limit | Window |
|---------------|------------|--------|
| **Authentication** | 5 requests | 60 seconds |
| **Read Operations** (GET) | 100 requests | 60 seconds |
| **Write Operations** (POST/PUT/PATCH) | 30 requests | 60 seconds |
| **WebSocket Connection** | 3 connections | 60 seconds |

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642000000
```

### Rate Limit Exceeded Response

```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later",
  "error": "Too Many Requests",
  "retryAfter": 45
}
```

---

## Summary

### Mobile API Structure

```
/api/mobile/
├── auth/
│   ├── login (POST)
│   ├── register (POST)
│   ├── refresh (POST)
│   ├── logout (POST)
│   └── me (GET)
├── properties/
│   ├── / (GET)
│   ├── /:id (GET)
│   ├── /search (GET)
│   ├── /:id/financials (GET)
│   └── /:id/updates (GET)
├── investments/
│   ├── / (GET, POST)
│   ├── /:id (GET)
│   └── /property/:propertyId (GET)
├── wallet/
│   ├── / (GET)
│   ├── /deposit (POST)
│   ├── /withdraw (POST)
│   ├── /deposit-methods (GET)
│   └── /networks (GET)
├── transactions/
│   └── / (GET)
├── portfolio/
│   ├── /summary (GET)
│   └── /performance (GET)
├── profile/
│   ├── / (GET, PATCH)
│   ├── /security (PATCH)
│   ├── /notifications (PATCH)
│   └── /bank-accounts/
│       ├── / (GET, POST)
│       ├── /:id (DELETE)
│       └── /:id/primary (PATCH)
├── bookmarks/
│   ├── / (GET, POST)
│   ├── /:propertyId (DELETE)
│   └── /toggle (POST)
├── notifications/
│   ├── / (GET)
│   ├── /:id/read (PATCH)
│   ├── /read-all (PATCH)
│   ├── /push-token (POST, DELETE)
└── support/
    ├── /faqs (GET)
    ├── /contact (GET, POST)
    └── /content/
        ├── /privacy-policy (GET)
        ├── /terms-of-service (GET)
        └── /languages (GET)
```

**Total Endpoints**: 46

---

## Cross-Reference

- **API Mapping**: See `API_MAPPING.md` for implementation status
- **Database Schema**: See `DATABASE_SCHEMA_ALIGNMENT.md` for entity definitions
- **Authentication**: See `AUTH_INTEGRATION.md` for JWT details
- **Real-time**: See `REALTIME_ARCHITECTURE.md` for WebSocket events
- **Implementation**: See `API_IMPLEMENTATION_PLAN.md` for timeline
- **Cursor Prompts**: See `CURSOR_PROMPTS.md` for implementation steps

