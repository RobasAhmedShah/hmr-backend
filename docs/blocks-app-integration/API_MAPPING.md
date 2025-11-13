# API Mapping: Mobile App Requirements → Backend Implementation

**Version**: 1.0  
**Last Updated**: 2025-01-12  
**Purpose**: Complete mapping of Blocks mobile app API requirements to existing NestJS backend endpoints

---

## Legend

- ✅ **COMPLETE**: Endpoint exists and fully matches requirements
- 🔄 **PARTIAL**: Endpoint exists but needs modifications/enhancements
- ❌ **MISSING**: Endpoint does not exist, needs full implementation
- 🔧 **NEEDS_UPDATE**: Endpoint exists but field names/structure misaligned

---

## 1. Authentication & User Management

### 1.1 User Registration
**Status**: ❌ MISSING  
**Required**: `POST /api/auth/register`  
**Existing**: `POST /admin/users` (admin-only, not for self-registration)

**Gap Analysis**:
- Backend has admin endpoint for creating users but no self-registration with Magic Link
- Need new endpoint with Magic DID token validation
- Auto-creates: User, Wallet, KYC (pending), Portfolio

**Implementation Notes**:
```typescript
// NEW: POST /api/mobile/auth/register
// Body: { didToken: string, email: string, fullName: string, phone?: string }
// Process: Validate Magic DID → Create User → Auto-create Wallet/KYC/Portfolio
```

**Backend Reference**: `src/admin/admin.service.ts::createUser()`  
**Reuse**: User creation logic, just add Magic validation layer

---

### 1.2 User Login
**Status**: ❌ MISSING  
**Required**: `POST /api/auth/login`  
**Existing**: `POST /org/auth/login` (org admins only, password-based)

**Gap Analysis**:
- No Magic Link authentication for mobile users
- Existing login is password-based for org admins
- Need DID token validation and JWT issuance

**Implementation Notes**:
```typescript
// NEW: POST /api/mobile/auth/login
// Body: { didToken: string }
// Process: Validate Magic DID → Find/Create User → Issue JWT
// Returns: { user, token, refreshToken }
```

**Backend Reference**: `src/organization-admins/organization-admins.controller.ts::login()`  
**Create**: New MobileAuthModule with Magic SDK integration

---

### 1.3 Refresh Token
**Status**: ❌ MISSING  
**Required**: `POST /api/auth/refresh`

**Implementation Notes**:
```typescript
// NEW: POST /api/mobile/auth/refresh
// Body: { refreshToken: string }
// Returns: { token, refreshToken }
```

---

### 1.4 Logout
**Status**: ❌ MISSING  
**Required**: `POST /api/auth/logout`

**Implementation Notes**:
```typescript
// NEW: POST /api/mobile/auth/logout
// Headers: Authorization: Bearer <token>
// Process: Invalidate token, clear server-side session
```

---

### 1.5 Get Current User
**Status**: 🔄 PARTIAL  
**Required**: `GET /api/auth/me`  
**Existing**: None directly, but `GET /admin/users` supports filtering

**Gap Analysis**:
- Can leverage `GET /users/:id` with JWT-extracted userId
- Need to add authentication guard to extract user from token

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/auth/me
// Headers: Authorization: Bearer <token>
// Process: Extract userId from JWT → Return user profile
```

**Backend Reference**: `src/users/users.service.ts::findByIdOrDisplayCode()`  
**Reuse**: Existing user lookup, add auth guard

---

## 2. Properties

### 2.1 Get All Properties (with filters)
**Status**: 🔧 NEEDS_UPDATE  
**Required**: `GET /api/properties`  
**Existing**: `GET /properties`

**Existing Functionality**:
- ✅ Basic listing: `GET /properties`
- ✅ Filter by organization: `GET /properties?org=ORG-000001`
- ✅ Get by slug: `GET /properties?slug=marina-view`
- ✅ Get by displayCode: `GET /properties?displayCode=PROP-000001`

**Missing Filters**:
- ❌ Pagination (page, limit)
- ❌ Filter by city
- ❌ Filter by status (funding, construction, completed)
- ❌ Filter by minROI
- ❌ Filter by maxPricePerToken
- ❌ Search (title, location, city)
- ❌ Filter by category (Trending, High Yield, New Listings, Completed)

**Field Alignment**:
| Frontend Field | Backend Field | Status |
|----------------|---------------|--------|
| `id` | `id` | ✅ |
| `displayCode` | `displayCode` | ✅ |
| `title` | `title` | ✅ |
| `location` | ❌ Missing | 🔧 Need to add or compute from city |
| `city` | `city` | ✅ |
| `valuation` | `totalValueUSDT` | 🔧 Field name mismatch |
| `tokenPrice` | `pricePerTokenUSDT` | 🔧 Field name mismatch |
| `minInvestment` | ❌ Missing | 🔧 Compute from pricePerTokenUSDT |
| `totalTokens` | `totalTokens` | ✅ |
| `soldTokens` | Computed: `totalTokens - availableTokens` | 🔧 |
| `estimatedROI` | `expectedROI` | 🔧 Field name mismatch |
| `estimatedYield` | ❌ Missing | 🔧 Same as expectedROI? |
| `completionDate` | ❌ Missing | 🔧 Add to Property entity |
| `status` | `status` | ✅ |
| `images` | `images` | ✅ |
| `description` | `description` | ✅ |
| `amenities` | `features.amenities` | ✅ |
| `builder` | `organization` relation | 🔧 Map organization → builder |

**Implementation Notes**:
```typescript
// ENHANCE: GET /api/mobile/properties
// Query params: page, limit, city, status, minROI, maxPricePerToken, search, filter
// Process: Add QueryBuilder with filters, pagination, sorting
// Transform: Map backend fields to frontend expected names
```

**Backend Reference**: `src/properties/properties.controller.ts::findAll()`  
**Action**: Extend with new mobile-optimized endpoint

---

### 2.2 Get Property by ID
**Status**: ✅ COMPLETE  
**Required**: `GET /api/properties/:id`  
**Existing**: `GET /properties/:id`

**Existing Functionality**:
- ✅ Supports UUID or displayCode
- ✅ Returns property with organization relation
- ✅ 404 if not found

**Field Transform Needed**:
- Map `totalValueUSDT` → `valuation`
- Map `pricePerTokenUSDT` → `tokenPrice`
- Map `expectedROI` → `estimatedROI`
- Compute `soldTokens` = `totalTokens - availableTokens`
- Map `organization` → `builder` format

**Backend Reference**: `src/properties/properties.controller.ts::findOne()`  
**Action**: Create mobile transformer to map field names

---

### 2.3 Search Properties
**Status**: ❌ MISSING  
**Required**: `GET /api/properties/search`

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/properties/search
// Query: query (required), city, status, minROI, maxPricePerToken
// Process: ILIKE search on title, slug, description, city, location
```

---

### 2.4 Get Property Financials
**Status**: 🔄 PARTIAL  
**Required**: `GET /api/properties/:id/financials`  
**Existing**: Data available in property entity, no dedicated endpoint

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/properties/:id/financials
// Returns: Aggregated financial data from property + investment analytics
```

---

### 2.5 Get Property Updates
**Status**: ❌ MISSING  
**Required**: `GET /api/properties/:id/updates`

**Gap Analysis**:
- Property entity has no updates/timeline field
- Need new entity: PropertyUpdate (id, propertyId, title, description, date, type)

---

### 2.6 Get Property Documents
**Status**: ❌ MISSING  
**Required**: `GET /api/properties/:id/documents`

**Gap Analysis**:
- Property entity has no documents field currently
- Need new entity: PropertyDocument (id, propertyId, name, type, verified, url, uploadedAt)

---

## 3. Investments & Portfolio

### 3.1 Create Investment
**Status**: ✅ COMPLETE  
**Required**: `POST /api/investments`  
**Existing**: `POST /investments/invest`

**Existing Functionality**:
- ✅ Token-based investment with validation
- ✅ Locks wallet and property (pessimistic)
- ✅ Validates balance and available tokens
- ✅ Creates investment record
- ✅ Creates transaction with traceability
- ✅ Credits organization liquidity
- ✅ Auto-generates INV-xxxxxx displayCode

**Field Mapping**:
| Frontend Field | Backend Field | Status |
|----------------|---------------|--------|
| `propertyId` | `propertyId` | ✅ |
| `amount` | `amountUSDT` (computed) | ✅ |
| `tokenCount` | `tokensToBuy` | ✅ |
| `transactionFee` | ❌ Not tracked | 🔧 Add if needed |

**Backend Reference**: `src/investments/investments.service.ts::invest()`  
**Action**: Use existing, may add transaction fee tracking

---

### 3.2 Get User Investments
**Status**: ✅ COMPLETE  
**Required**: `GET /api/investments`  
**Existing**: `GET /investments?userId=<uuid>`

**Existing Functionality**:
- ✅ Filter by userId (UUID or displayCode)
- ✅ Filter by organization
- ✅ Returns investments with user, property, organization relations

**Field Transform Needed**:
- Map `tokensPurchased` → `tokens`
- Map `amountUSDT` → `investedAmount`
- Compute `currentValue` from current token price
- Compute `roi` from rewards/current value
- Compute `rentalYield` and `monthlyRentalIncome` from rewards

**Backend Reference**: `src/investments/investments.controller.ts::findAll()`  
**Action**: Add mobile transformer for field mapping

---

### 3.3 Get Investment by ID
**Status**: ✅ COMPLETE  
**Required**: `GET /api/investments/:id`  
**Existing**: `GET /investments/:id`

**Backend Reference**: `src/investments/investments.controller.ts::findOne()`

---

### 3.4 Get Investment Details (for owned property page)
**Status**: 🔄 PARTIAL  
**Required**: `GET /api/investments/property/:propertyId`  
**Existing**: Can filter by propertyId, but no aggregated endpoint

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/investments/property/:propertyId
// Headers: Authorization (extract userId)
// Process: Get user's investment for this property + income history
// Returns: investment, property, ownershipDetails, incomeHistory, transactionHistory
```

**Backend References**:
- `src/investments/investments.service.ts::findByUserId()`
- `src/rewards/rewards.service.ts::findByUserId()`
- `src/transactions/transactions.service.ts::findByUser()`

---

### 3.5 Get Portfolio Summary
**Status**: ✅ COMPLETE  
**Required**: `GET /api/portfolio/summary`  
**Existing**: `GET /portfolio/user/:userId/detailed`

**Existing Functionality**:
- ✅ Portfolio summary (totalInvested, totalRewards, totalROI, activeInvestments)
- ✅ Summary statistics (totalCurrentValue, netROI, averageROI)
- ✅ Investments array with property details
- ✅ Rewards history

**Field Mapping**:
| Frontend Field | Backend Field | Status |
|----------------|---------------|--------|
| `totalInvested` | `totalInvestedUSDT` | ✅ |
| `totalValue` | Computed from current prices | 🔧 |
| `totalROI` | `totalROIUSDT` | ✅ |
| `monthlyRentalIncome` | Computed from recent rewards | 🔧 |
| `totalEarnings` | `totalRewardsUSDT` | ✅ |
| `investmentCount` | `activeInvestments` | ✅ |
| `distribution` | Computed per property | 🔧 |

**Backend Reference**: `src/portfolio/portfolio.controller.ts::getUserPortfolioDetailed()`  
**Action**: Use existing, add computed fields transform

---

### 3.6 Get Portfolio Performance
**Status**: ❌ MISSING  
**Required**: `GET /api/portfolio/performance?period=30d`

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/portfolio/performance
// Query: period ('7d' | '30d' | '90d' | '1y' | 'all')
// Process: Time-series data from investments + rewards + current values
// Returns: { period, data[], metrics }
```

---

## 4. Wallet & Transactions

### 4.1 Get Wallet Balance
**Status**: ✅ COMPLETE  
**Required**: `GET /api/wallet/balance`  
**Existing**: `GET /wallet/user/:userId`

**Existing Functionality**:
- ✅ Returns wallet with all USDT balances
- ✅ Supports UUID or displayCode

**Field Mapping**:
| Frontend Field | Backend Field | Status |
|----------------|---------------|--------|
| `usdc` | `balanceUSDT` | ✅ |
| `totalValue` | Computed from portfolio | 🔧 |
| `totalInvested` | From portfolio | 🔧 |
| `totalEarnings` | From portfolio/rewards | 🔧 |
| `pendingDeposits` | Filter transactions | 🔧 |

**Backend Reference**: `src/wallet/wallet.controller.ts::findByUser()`  
**Action**: Enhance to include computed fields

---

### 4.2 Get Transactions
**Status**: ✅ COMPLETE  
**Required**: `GET /api/wallet/transactions`  
**Existing**: `GET /transactions/user/:userId`

**Existing Functionality**:
- ✅ Filter by userId (UUID or displayCode)
- ✅ Returns transactions with all relations

**Missing Filters**:
- ❌ Filter by type
- ❌ Filter by status
- ❌ Pagination (page, limit)
- ❌ Filter by propertyId

**Field Mapping**:
| Frontend Field | Backend Field | Status |
|----------------|---------------|--------|
| `id` | `id` | ✅ |
| `type` | `type` | ✅ |
| `amount` | `amountUSDT` | ✅ |
| `date` | `createdAt` | ✅ |
| `description` | `description` | ✅ |
| `status` | `status` | ✅ |
| `currency` | Always 'USDC' | 🔧 |
| `propertyId` | `propertyId` | ✅ |
| `propertyTitle` | `property.title` | ✅ |
| `transactionHash` | `referenceId` | 🔧 |

**Backend Reference**: `src/transactions/transactions.controller.ts::findByUser()`  
**Action**: Add filters and pagination

---

### 4.3 Create Deposit
**Status**: 🔄 PARTIAL  
**Required**: `POST /api/wallet/deposit`  
**Existing**: `POST /wallet/deposit`, `POST /payment-methods/deposit`

**Existing Functionality**:
- ✅ Direct deposit: `POST /wallet/deposit`
- ✅ Payment method deposit: `POST /payment-methods/deposit`
- ✅ KYC verification check
- ✅ Event-driven wallet update

**Missing**:
- ❌ Method selection (card, binance, onchain)
- ❌ Payment URL generation for card/Binance Pay
- ❌ QR code generation for on-chain
- ❌ Wallet address provision for on-chain

**Backend Reference**: `src/wallet/wallet.controller.ts::deposit()`  
**Action**: Enhance with payment provider integrations

---

### 4.4 Create Withdrawal
**Status**: ❌ MISSING  
**Required**: `POST /api/wallet/withdraw`

**Gap Analysis**:
- No withdrawal functionality in backend
- Need to implement with KYC verification
- Need bank account/crypto address validation
- Need transaction creation and status tracking

---

### 4.5 Get Deposit Methods
**Status**: ❌ MISSING  
**Required**: `GET /api/wallet/deposit-methods`

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/wallet/deposit-methods
// Returns: Static configuration of available deposit methods
// { methods: [{ id, title, description, icon, color, enabled, fees }] }
```

---

### 4.6 Get Blockchain Networks
**Status**: ❌ MISSING  
**Required**: `GET /api/wallet/networks`

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/wallet/networks
// Returns: Static configuration of supported blockchain networks
// { networks: [{ id, name, icon, tokens, fee, enabled }] }
```

---

## 5. User Profile & Settings

### 5.1 Get User Profile
**Status**: 🔄 PARTIAL  
**Required**: `GET /api/profile`  
**Existing**: User data from `GET /admin/users/:id`

**Gap Analysis**:
- ✅ User basic info available
- ❌ Security settings not tracked
- ❌ Notification settings not tracked
- ❌ Need new entities: UserSecuritySettings, UserNotificationSettings

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/profile
// Headers: Authorization (extract userId)
// Returns: { userInfo, securitySettings, notificationSettings }
```

---

### 5.2 Update User Profile
**Status**: ✅ COMPLETE  
**Required**: `PATCH /api/profile`  
**Existing**: `PATCH /users/:id`

**Existing Functionality**:
- ✅ Dynamic field updates
- ✅ Supports UUID or displayCode

**Missing Fields in User Entity**:
- ❌ `dob` (date of birth)
- ❌ `address`
- ❌ `profileImage`

**Backend Reference**: `src/users/users.controller.ts::update()`  
**Action**: Add missing fields to User entity

---

### 5.3 Update Security Settings
**Status**: ❌ MISSING  
**Required**: `PATCH /api/profile/security`

**Gap Analysis**:
- Need new entity: UserSecuritySettings
- Fields: userId, twoFactorAuth, biometricLogin, passwordLastChanged

---

### 5.4 Update Notification Settings
**Status**: ❌ MISSING  
**Required**: `PATCH /api/profile/notifications`

**Gap Analysis**:
- Need new entity: UserNotificationSettings
- Fields: userId, pushNotifications, emailNotifications, smsNotifications, etc.

---

### 5.5 Get Bank Accounts
**Status**: ❌ MISSING  
**Required**: `GET /api/profile/bank-accounts`

**Gap Analysis**:
- Need new entity: BankAccount (id, userId, bankName, accountNumber, accountType, isPrimary)

---

### 5.6 Add Bank Account
**Status**: ❌ MISSING  
**Required**: `POST /api/profile/bank-accounts`

---

### 5.7 Remove Bank Account
**Status**: ❌ MISSING  
**Required**: `DELETE /api/profile/bank-accounts/:id`

---

### 5.8 Set Primary Bank Account
**Status**: ❌ MISSING  
**Required**: `PATCH /api/profile/bank-accounts/:id/primary`

---

## 6. Bookmarks

### 6.1 Get User Bookmarks
**Status**: ❌ MISSING  
**Required**: `GET /api/bookmarks`

**Gap Analysis**:
- Need new entity: Bookmark (id, userId, propertyId, createdAt)

---

### 6.2 Add Bookmark
**Status**: ❌ MISSING  
**Required**: `POST /api/bookmarks`

---

### 6.3 Remove Bookmark
**Status**: ❌ MISSING  
**Required**: `DELETE /api/bookmarks/:propertyId`

---

### 6.4 Toggle Bookmark
**Status**: ❌ MISSING  
**Required**: `POST /api/bookmarks/toggle`

**Implementation Notes**:
```typescript
// NEW: POST /api/mobile/bookmarks/toggle
// Body: { propertyId }
// Returns: { isBookmarked, bookmark? }
```

---

## 7. Notifications

### 7.1 Get Notifications
**Status**: ❌ MISSING  
**Required**: `GET /api/notifications`

**Gap Analysis**:
- Need new entity: Notification (id, userId, type, title, body, data, read, createdAt)
- Need pagination support

---

### 7.2 Mark Notification as Read
**Status**: ❌ MISSING  
**Required**: `PATCH /api/notifications/:id/read`

---

### 7.3 Mark All Notifications as Read
**Status**: ❌ MISSING  
**Required**: `PATCH /api/notifications/read-all`

---

### 7.4 Register Push Token
**Status**: ❌ MISSING  
**Required**: `POST /api/notifications/push-token`

**Gap Analysis**:
- Need new entity: PushToken (id, userId, token, platform, deviceId, createdAt)

---

### 7.5 Unregister Push Token
**Status**: ❌ MISSING  
**Required**: `DELETE /api/notifications/push-token`

---

## 8. Support & Content

### 8.1 Get FAQs
**Status**: ❌ MISSING  
**Required**: `GET /api/support/faqs`

**Gap Analysis**:
- Need new entity: FAQ (id, category, question, answer, order)

---

### 8.2 Get Contact Information
**Status**: ❌ MISSING  
**Required**: `GET /api/support/contact`

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/support/contact
// Returns: Static configuration or database-backed contact info
```

---

### 8.3 Submit Support Request
**Status**: ❌ MISSING  
**Required**: `POST /api/support/contact`

**Gap Analysis**:
- Need new entity: SupportTicket (id, userId, subject, message, type, priority, status, createdAt)

---

### 8.4 Get Privacy Policy
**Status**: ❌ MISSING  
**Required**: `GET /api/content/privacy-policy`

**Gap Analysis**:
- Need new entity: ContentPage (id, type, sections, lastUpdated)

---

### 8.5 Get Terms of Service
**Status**: ❌ MISSING  
**Required**: `GET /api/content/terms-of-service`

---

### 8.6 Get Available Languages
**Status**: ❌ MISSING  
**Required**: `GET /api/content/languages`

**Implementation Notes**:
```typescript
// NEW: GET /api/mobile/content/languages
// Returns: Static list of supported languages
```

---

## Summary Statistics

### By Status
- ✅ **COMPLETE**: 8 endpoints (17%)
- 🔄 **PARTIAL**: 7 endpoints (15%)
- 🔧 **NEEDS_UPDATE**: 2 endpoints (4%)
- ❌ **MISSING**: 29 endpoints (63%)

**Total Required**: 46 endpoints

### By Priority Category

#### High Priority (15 endpoints)
- Authentication: 0/5 complete
- Properties (basic): 1/2 complete
- Investments (basic): 3/3 complete
- Wallet: 2/2 complete
- Transactions: 1/1 complete
- User Profile (basic): 1/2 complete

**High Priority Coverage**: 53% (8/15)

#### Medium Priority (18 endpoints)
- Bookmarks: 0/4 complete
- Portfolio: 1/2 complete
- Deposits/Withdrawals: 1/4 complete
- Notifications: 0/5 complete
- Security Settings: 0/3 complete

**Medium Priority Coverage**: 11% (2/18)

#### Low Priority (13 endpoints)
- Support & Content: 0/6 complete
- Bank Accounts: 0/4 complete
- Push Tokens: 0/2 complete
- Languages: 0/1 complete

**Low Priority Coverage**: 0% (0/13)

---

## Field Name Standardization Required

### Property Fields
- Backend: `totalValueUSDT` → Frontend: `valuation`
- Backend: `pricePerTokenUSDT` → Frontend: `tokenPrice`
- Backend: `expectedROI` → Frontend: `estimatedROI`
- Backend: `organization` → Frontend: `builder`

**Recommendation**: Create DTO transformers in mobile module to map field names consistently

### Investment Fields
- Backend: `tokensPurchased` → Frontend: `tokens`
- Backend: `amountUSDT` → Frontend: `investedAmount`

### Wallet/Transaction Fields
- Backend: `balanceUSDT` → Frontend: `usdc`
- Backend: `referenceId` → Frontend: `transactionHash`

---

## Next Steps

1. **Immediate** (Phase 1):
   - Implement Magic Link authentication endpoints
   - Add field transformers for properties and investments
   - Implement missing filters for properties (pagination, search, city, status)
   - Add wallet aggregated endpoint with computed fields

2. **Short-term** (Phase 2):
   - Create new entities: Bookmark, Notification, UserSecuritySettings, UserNotificationSettings
   - Implement bookmarks CRUD
   - Implement notifications system with WebSocket integration
   - Add withdrawal functionality

3. **Long-term** (Phase 3):
   - Create content management entities (FAQ, ContentPage, SupportTicket)
   - Implement bank account management
   - Add push notification infrastructure
   - Implement multi-language support

---

## Database Schema Changes Required

### New Entities Needed
1. `Bookmark` (userId, propertyId, createdAt)
2. `Notification` (userId, type, title, body, data, read, createdAt)
3. `UserSecuritySettings` (userId, twoFactorAuth, biometricLogin)
4. `UserNotificationSettings` (userId, 10+ boolean fields)
5. `BankAccount` (userId, bankName, accountNumber, accountType, isPrimary)
6. `PushToken` (userId, token, platform, deviceId)
7. `PropertyUpdate` (propertyId, title, description, date, type)
8. `PropertyDocument` (propertyId, name, type, verified, url)
9. `FAQ` (category, question, answer, order)
10. `ContentPage` (type, sections, lastUpdated)
11. `SupportTicket` (userId, subject, message, type, priority, status)

### Existing Entity Modifications
1. **User**: Add `dob`, `address`, `profileImage`
2. **Property**: Add `completionDate`, `location`, possibly `minInvestment`
3. **Transaction**: Consider adding `transactionHash` field separate from `referenceId`

---

## Cross-Reference

- **Database Schema**: See `DATABASE_SCHEMA_ALIGNMENT.md`
- **Auth Implementation**: See `AUTH_INTEGRATION.md`
- **Real-time Events**: See `REALTIME_ARCHITECTURE.md`
- **Implementation Phases**: See `API_IMPLEMENTATION_PLAN.md`
- **Cursor Prompts**: See `CURSOR_PROMPTS.md`
- **Mobile Endpoints**: See `MOBILE_APP_ENDPOINTS.md`

