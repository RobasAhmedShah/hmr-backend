# API Implementation Plan: 3-Phase Breakdown

**Version**: 1.0  
**Last Updated**: 2025-01-12  
**Purpose**: Phased implementation roadmap for all 46 API endpoints required by Blocks mobile app

---

## Table of Contents

1. [Implementation Overview](#1-implementation-overview)
2. [Phase 1: Core Functionality (High Priority)](#2-phase-1-core-functionality-high-priority)
3. [Phase 2: Enhanced Features (Medium Priority)](#3-phase-2-enhanced-features-medium-priority)
4. [Phase 3: Additional Features (Low Priority)](#4-phase-3-additional-features-low-priority)
5. [Dependencies & Prerequisites](#5-dependencies--prerequisites)
6. [Testing Strategy](#6-testing-strategy)
7. [Deployment Plan](#7-deployment-plan)

---

## 1. Implementation Overview

### Total Scope
- **Total Endpoints**: 46
- **Existing (Complete)**: 8 (17%)
- **Existing (Partial)**: 7 (15%)
- **Missing**: 31 (67%)

### Timeline Estimate
- **Phase 1**: 2-3 weeks (15 endpoints)
- **Phase 2**: 3-4 weeks (18 endpoints)
- **Phase 3**: 2-3 weeks (13 endpoints)
- **Total**: 7-10 weeks

### Team Structure
- **Backend Developer**: Implement API endpoints
- **Frontend Developer**: Integrate with mobile app
- **QA Engineer**: Test endpoints and flows
- **DevOps**: Deploy and monitor

---

## 2. Phase 1: Core Functionality (High Priority)

**Goal**: Enable basic app functionality - login, browse properties, invest, view wallet

**Duration**: 2-3 weeks  
**Endpoints**: 15

### 2.1 Authentication (5 endpoints)

#### 2.1.1 POST /api/mobile/auth/login
**Status**: ❌ NEW  
**Dependencies**: Magic SDK, JwtModule  
**Estimated Time**: 2 days

**Implementation**:
```typescript
// src/mobile-auth/mobile-auth.controller.ts
@Post('login')
async login(@Body() dto: LoginDto) {
  // 1. Validate Magic DID token
  // 2. Find or create user
  // 3. Generate JWT
  // 4. Return user + tokens
}
```

**DTO**:
```typescript
export class LoginDto {
  @IsString() didToken: string;
  @IsEmail() email: string;
}
```

**Testing**:
- Valid DID token → Success
- Invalid DID token → 401
- Expired DID token → 401
- First-time user → Auto-registration

---

#### 2.1.2 POST /api/mobile/auth/register
**Status**: ❌ NEW  
**Dependencies**: Magic SDK, UsersService, WalletService, KycService, PortfolioService  
**Estimated Time**: 2 days

**Implementation**:
```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  // 1. Validate Magic DID token
  // 2. Check if email exists
  // 3. Transaction: Create User + Wallet + KYC + Portfolio
  // 4. Generate JWT
  // 5. Return user + tokens
}
```

**Auto-creates**:
- User (with magicIssuer)
- Wallet (balanceUSDT: 0)
- KYC (status: 'pending')
- Portfolio (totalInvested: 0)

---

#### 2.1.3 POST /api/mobile/auth/refresh
**Status**: ❌ NEW  
**Dependencies**: JwtModule  
**Estimated Time**: 0.5 days

**Implementation**:
```typescript
@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto) {
  // 1. Verify refresh token
  // 2. Generate new access + refresh tokens
  // 3. Return tokens
}
```

---

#### 2.1.4 POST /api/mobile/auth/logout
**Status**: ❌ NEW  
**Dependencies**: None (optional Redis for token blacklist)  
**Estimated Time**: 0.5 days

**Implementation**:
```typescript
@Post('logout')
@UseGuards(JwtAuthGuard)
async logout(@Request() req) {
  // Optional: Blacklist token
  return { message: 'Logged out successfully' };
}
```

---

#### 2.1.5 GET /api/mobile/auth/me
**Status**: 🔄 ADAPT FROM EXISTING  
**Existing**: Can use UsersService.findById()  
**Estimated Time**: 0.5 days

**Implementation**:
```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@Request() req) {
  return this.usersService.findById(req.user.id);
}
```

---

### 2.2 Properties (2 endpoints)

#### 2.2.1 GET /api/mobile/properties
**Status**: 🔧 ENHANCE EXISTING  
**Existing**: GET /properties  
**Estimated Time**: 2 days

**Enhancements Needed**:
- ✅ Pagination (page, limit)
- ✅ Filter by city
- ✅ Filter by status
- ✅ Filter by minROI
- ✅ Filter by maxPricePerToken
- ✅ Search (title, location, city)
- ✅ Filter by category (Trending, High Yield, etc.)
- 🔧 Transform response (field name mapping)

**Implementation**:
```typescript
@Get()
async findAll(@Query() query: PropertyFilterDto) {
  const properties = await this.propertiesService.findAllWithFilters(query);
  return this.transformProperties(properties);  // Map field names
}
```

**Query DTO**:
```typescript
export class PropertyFilterDto {
  @IsOptional() @IsInt() page?: number = 1;
  @IsOptional() @IsInt() limit?: number = 20;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsEnum(PropertyStatus) status?: PropertyStatus;
  @IsOptional() @IsNumber() minROI?: number;
  @IsOptional() @IsNumber() maxPricePerToken?: number;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(PropertyFilter) filter?: PropertyFilter;
}
```

**Field Transform**:
```typescript
private transformProperties(properties: Property[]) {
  return properties.map(p => ({
    ...p,
    valuation: p.totalValueUSDT,
    tokenPrice: p.pricePerTokenUSDT,
    estimatedROI: p.expectedROI,
    soldTokens: p.totalTokens - p.availableTokens,
    builder: {
      id: p.organization.id,
      name: p.organization.name,
      logo: p.organization.logoUrl,
    },
  }));
}
```

---

#### 2.2.2 GET /api/mobile/properties/:id
**Status**: ✅ USE EXISTING + TRANSFORM  
**Existing**: GET /properties/:id  
**Estimated Time**: 0.5 days

**Implementation**:
```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  const property = await this.propertiesService.findByIdOrDisplayCode(id);
  return this.transformProperty(property);
}
```

---

### 2.3 Investments (3 endpoints)

#### 2.3.1 POST /api/mobile/investments
**Status**: ✅ USE EXISTING  
**Existing**: POST /investments/invest  
**Estimated Time**: 0.5 days (add mobile wrapper)

**Implementation**:
```typescript
@Post()
@UseGuards(JwtAuthGuard)
async create(@Request() req, @Body() dto: CreateInvestmentDto) {
  return this.investmentsService.invest(
    req.user.id,
    dto.propertyId,
    new Decimal(dto.tokenCount),
  );
}
```

---

#### 2.3.2 GET /api/mobile/investments
**Status**: ✅ USE EXISTING + TRANSFORM  
**Existing**: GET /investments?userId=:id  
**Estimated Time**: 1 day (add transforms)

**Implementation**:
```typescript
@Get()
@UseGuards(JwtAuthGuard)
async getMyInvestments(@Request() req) {
  const investments = await this.investmentsService.findByUserId(req.user.id);
  return this.transformInvestments(investments);
}
```

**Transform**:
```typescript
private transformInvestments(investments: Investment[]) {
  return investments.map(i => ({
    ...i,
    tokens: i.tokensPurchased,
    investedAmount: i.amountUSDT,
    currentValue: i.tokensPurchased * i.property.pricePerTokenUSDT,
    purchaseDate: i.createdAt,
  }));
}
```

---

#### 2.3.3 GET /api/mobile/investments/:id
**Status**: ✅ USE EXISTING  
**Existing**: GET /investments/:id  
**Estimated Time**: 0.5 days

---

### 2.4 Wallet & Transactions (2 endpoints)

#### 2.4.1 GET /api/mobile/wallet
**Status**: 🔧 ENHANCE EXISTING  
**Existing**: GET /wallet/user/:userId  
**Estimated Time**: 1 day

**Enhancements**:
- Add computed fields (totalValue, totalInvested, totalEarnings, pendingDeposits)

**Implementation**:
```typescript
@Get()
@UseGuards(JwtAuthGuard)
async getWallet(@Request() req) {
  const wallet = await this.walletService.findByUser(req.user.id);
  const portfolio = await this.portfolioService.findByUser(req.user.id);
  const pendingDeposits = await this.calculatePendingDeposits(req.user.id);
  
  return {
    usdc: wallet.balanceUSDT,
    totalValue: wallet.balanceUSDT + portfolio.totalCurrentValue,
    totalInvested: portfolio.totalInvestedUSDT,
    totalEarnings: portfolio.totalRewardsUSDT,
    pendingDeposits,
  };
}
```

---

#### 2.4.2 GET /api/mobile/transactions
**Status**: 🔧 ENHANCE EXISTING  
**Existing**: GET /transactions/user/:userId  
**Estimated Time**: 1 day

**Enhancements**:
- Add filters (type, status, propertyId)
- Add pagination
- Transform response

**Implementation**:
```typescript
@Get('transactions')
@UseGuards(JwtAuthGuard)
async getTransactions(
  @Request() req,
  @Query() query: TransactionFilterDto,
) {
  return this.transactionsService.findByUserWithFilters(req.user.id, query);
}
```

---

### 2.5 User Profile (2 endpoints)

#### 2.5.1 GET /api/mobile/profile
**Status**: 🔄 NEW (aggregate endpoint)  
**Dependencies**: UsersService, UserSecuritySettingsService (new), UserNotificationSettingsService (new)  
**Estimated Time**: 1 day

**Implementation**:
```typescript
@Get()
@UseGuards(JwtAuthGuard)
async getProfile(@Request() req) {
  const user = await this.usersService.findById(req.user.id);
  const security = await this.securitySettingsService.findByUser(req.user.id);
  const notifications = await this.notificationSettingsService.findByUser(req.user.id);
  
  return {
    userInfo: user,
    securitySettings: security || DEFAULT_SECURITY_SETTINGS,
    notificationSettings: notifications || DEFAULT_NOTIFICATION_SETTINGS,
  };
}
```

---

#### 2.5.2 PATCH /api/mobile/profile
**Status**: ✅ USE EXISTING  
**Existing**: PATCH /users/:id  
**Estimated Time**: 0.5 days

**Implementation**:
```typescript
@Patch()
@UseGuards(JwtAuthGuard)
async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
  return this.usersService.update(req.user.id, dto);
}
```

---

### Phase 1 Summary

| Category | New | Enhance | Existing | Total Time |
|----------|-----|---------|----------|------------|
| **Authentication** | 4 | 1 | 0 | 5.5 days |
| **Properties** | 0 | 1 | 1 | 2.5 days |
| **Investments** | 0 | 1 | 2 | 2 days |
| **Wallet** | 0 | 2 | 0 | 2 days |
| **Profile** | 1 | 0 | 1 | 1.5 days |
| **TOTAL** | **5** | **5** | **5** | **13.5 days** |

**Phase 1 Deliverable**: Users can login, browse properties, invest, view wallet and profile

---

## 3. Phase 2: Enhanced Features (Medium Priority)

**Goal**: Add bookmarks, portfolio details, deposits/withdrawals, notifications

**Duration**: 3-4 weeks  
**Endpoints**: 18

### 3.1 Bookmarks (4 endpoints)

#### 3.1.1 POST /api/mobile/bookmarks/toggle
**Status**: ❌ NEW  
**Dependencies**: Bookmark entity (new)  
**Estimated Time**: 1 day

**Create Entity First**:
```typescript
// src/bookmarks/entities/bookmark.entity.ts
@Entity('bookmarks')
export class Bookmark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  @Index()
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @CreateDateColumn()
  createdAt: Date;

  @Index(['userId', 'propertyId'], { unique: true })
}
```

**Implementation**:
```typescript
@Post('toggle')
@UseGuards(JwtAuthGuard)
async toggle(@Request() req, @Body() dto: { propertyId: string }) {
  const existing = await this.bookmarksService.findOne(req.user.id, dto.propertyId);
  
  if (existing) {
    await this.bookmarksService.remove(existing.id);
    return { isBookmarked: false };
  } else {
    const bookmark = await this.bookmarksService.create(req.user.id, dto.propertyId);
    return { isBookmarked: true, bookmark };
  }
}
```

---

#### 3.1.2 GET /api/mobile/bookmarks
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

#### 3.1.3 POST /api/mobile/bookmarks
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

#### 3.1.4 DELETE /api/mobile/bookmarks/:propertyId
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

### 3.2 Portfolio (2 endpoints)

#### 3.2.1 GET /api/mobile/portfolio/summary
**Status**: ✅ USE EXISTING + ENHANCE  
**Existing**: GET /portfolio/user/:userId/detailed  
**Estimated Time**: 1 day

**Implementation**:
```typescript
@Get('summary')
@UseGuards(JwtAuthGuard)
async getSummary(@Request() req) {
  const portfolio = await this.portfolioService.getUserPortfolioDetailed(req.user.id);
  
  // Add distribution calculation
  const distribution = await this.calculateDistribution(req.user.id);
  
  return {
    ...portfolio.summary,
    distribution,
  };
}
```

---

#### 3.2.2 GET /api/mobile/portfolio/performance
**Status**: ❌ NEW  
**Estimated Time**: 2 days

**Implementation**:
```typescript
@Get('performance')
@UseGuards(JwtAuthGuard)
async getPerformance(@Request() req, @Query() query: { period: string }) {
  const investments = await this.investmentsService.findByUserId(req.user.id);
  const rewards = await this.rewardsService.findByUserId(req.user.id);
  
  const timeSeries = await this.calculateTimeSeries(investments, rewards, query.period);
  
  return {
    period: query.period,
    data: timeSeries,
    metrics: this.calculateMetrics(timeSeries),
  };
}
```

---

### 3.3 Deposits & Withdrawals (4 endpoints)

#### 3.3.1 POST /api/mobile/wallet/deposit
**Status**: 🔧 ENHANCE EXISTING  
**Existing**: POST /wallet/deposit, POST /payment-methods/deposit  
**Estimated Time**: 2 days

**Enhancements**:
- Add method selection (card, binance, onchain)
- Payment provider integration stubs

---

#### 3.3.2 POST /api/mobile/wallet/withdraw
**Status**: ❌ NEW  
**Estimated Time**: 2 days

**Implementation**:
```typescript
@Post('withdraw')
@UseGuards(JwtAuthGuard)
async withdraw(@Request() req, @Body() dto: WithdrawDto) {
  // 1. Verify KYC
  // 2. Check balance
  // 3. Create withdrawal transaction
  // 4. Process withdrawal
}
```

---

#### 3.3.3 GET /api/mobile/wallet/deposit-methods
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

**Implementation**:
```typescript
@Get('deposit-methods')
@UseGuards(JwtAuthGuard)
async getDepositMethods() {
  return DEPOSIT_METHODS_CONFIG;  // Static configuration
}
```

---

#### 3.3.4 GET /api/mobile/wallet/networks
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

### 3.4 Notifications (5 endpoints)

#### 3.4.1 GET /api/mobile/notifications
**Status**: ❌ NEW  
**Dependencies**: Notification entity (new)  
**Estimated Time**: 1.5 days

**Create Entity**:
```typescript
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: any;

  @Column({ type: 'boolean', default: false })
  @Index()
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Implementation**:
```typescript
@Get()
@UseGuards(JwtAuthGuard)
async getNotifications(
  @Request() req,
  @Query() query: NotificationFilterDto,
) {
  return this.notificationsService.findByUser(req.user.id, query);
}
```

---

#### 3.4.2 PATCH /api/mobile/notifications/:id/read
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

#### 3.4.3 PATCH /api/mobile/notifications/read-all
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

#### 3.4.4 POST /api/mobile/notifications/push-token
**Status**: ❌ NEW  
**Dependencies**: PushToken entity (new)  
**Estimated Time**: 1 day

---

#### 3.4.5 DELETE /api/mobile/notifications/push-token
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

### 3.5 Security & Settings (3 endpoints)

#### 3.5.1 PATCH /api/mobile/profile/security
**Status**: ❌ NEW  
**Dependencies**: UserSecuritySettings entity (new)  
**Estimated Time**: 1 day

---

#### 3.5.2 PATCH /api/mobile/profile/notifications
**Status**: ❌ NEW  
**Dependencies**: UserNotificationSettings entity (new)  
**Estimated Time**: 1 day

---

#### 3.5.3 GET /api/mobile/investments/property/:propertyId
**Status**: 🔄 NEW (aggregate)  
**Estimated Time**: 1.5 days

---

### Phase 2 Summary

| Category | New | Enhance | Existing | Total Time |
|----------|-----|---------|----------|------------|
| **Bookmarks** | 4 | 0 | 0 | 2.5 days |
| **Portfolio** | 1 | 1 | 0 | 3 days |
| **Deposits/Withdrawals** | 3 | 1 | 0 | 5 days |
| **Notifications** | 5 | 0 | 0 | 4 days |
| **Settings** | 3 | 0 | 0 | 3.5 days |
| **TOTAL** | **16** | **2** | **0** | **18 days** |

**Phase 2 Deliverable**: Full-featured app with bookmarks, notifications, deposits/withdrawals

---

## 4. Phase 3: Additional Features (Low Priority)

**Goal**: Support content, FAQs, bank accounts, property details

**Duration**: 2-3 weeks  
**Endpoints**: 13

### 4.1 Support & Content (6 endpoints)

#### 4.1.1 GET /api/mobile/support/faqs
**Status**: ❌ NEW  
**Dependencies**: FAQ entity  
**Estimated Time**: 1 day

---

#### 4.1.2 GET /api/mobile/support/contact
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days (static config)

---

#### 4.1.3 POST /api/mobile/support/contact
**Status**: ❌ NEW  
**Dependencies**: SupportTicket entity  
**Estimated Time**: 1.5 days

---

#### 4.1.4 GET /api/mobile/content/privacy-policy
**Status**: ❌ NEW  
**Dependencies**: ContentPage entity  
**Estimated Time**: 1 day

---

#### 4.1.5 GET /api/mobile/content/terms-of-service
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

#### 4.1.6 GET /api/mobile/content/languages
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days (static config)

---

### 4.2 Bank Accounts (4 endpoints)

#### 4.2.1 GET /api/mobile/profile/bank-accounts
**Status**: ❌ NEW  
**Dependencies**: BankAccount entity  
**Estimated Time**: 1 day

---

#### 4.2.2 POST /api/mobile/profile/bank-accounts
**Status**: ❌ NEW  
**Estimated Time**: 1.5 days

---

#### 4.2.3 DELETE /api/mobile/profile/bank-accounts/:id
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

#### 4.2.4 PATCH /api/mobile/profile/bank-accounts/:id/primary
**Status**: ❌ NEW  
**Estimated Time**: 0.5 days

---

### 4.3 Property Details (3 endpoints)

#### 4.3.1 GET /api/mobile/properties/search
**Status**: ❌ NEW  
**Estimated Time**: 1.5 days

---

#### 4.3.2 GET /api/mobile/properties/:id/financials
**Status**: 🔄 NEW (aggregate)  
**Estimated Time**: 1 day

---

#### 4.3.3 GET /api/mobile/properties/:id/updates
**Status**: ❌ NEW  
**Dependencies**: PropertyUpdate entity  
**Estimated Time**: 1 day

---

### Phase 3 Summary

| Category | New | Enhance | Existing | Total Time |
|----------|-----|---------|----------|------------|
| **Support & Content** | 6 | 0 | 0 | 5 days |
| **Bank Accounts** | 4 | 0 | 0 | 3.5 days |
| **Property Details** | 3 | 0 | 0 | 3.5 days |
| **TOTAL** | **13** | **0** | **0** | **12 days** |

**Phase 3 Deliverable**: Complete app with all features

---

## 5. Dependencies & Prerequisites

### Backend Dependencies

```json
{
  "@magic-sdk/admin": "^2.x",
  "@nestjs/websockets": "^10.x",
  "@nestjs/platform-socket.io": "^10.x",
  "socket.io": "^4.x",
  "@nestjs/jwt": "^10.x",
  "@nestjs/passport": "^10.x",
  "passport-jwt": "^4.x"
}
```

### Database Migrations

**Phase 1**:
```sql
-- Add Magic fields to users
ALTER TABLE users 
ADD COLUMN magic_issuer VARCHAR(255) UNIQUE NULL,
ADD COLUMN magic_public_address VARCHAR(255) NULL,
ADD COLUMN dob DATE NULL,
ADD COLUMN address VARCHAR(512) NULL,
ADD COLUMN profile_image VARCHAR(512) NULL;

-- Add property fields
ALTER TABLE properties 
ADD COLUMN location VARCHAR(255) NULL,
ADD COLUMN completion_date DATE NULL;
```

**Phase 2**:
```sql
-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_security_settings table
CREATE TABLE user_security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  two_factor_auth BOOLEAN DEFAULT FALSE,
  biometric_login BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_notification_settings table
CREATE TABLE user_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  investment_updates BOOLEAN DEFAULT TRUE,
  property_alerts BOOLEAN DEFAULT TRUE,
  monthly_reports BOOLEAN DEFAULT TRUE,
  marketing_offers BOOLEAN DEFAULT FALSE,
  security_alerts BOOLEAN DEFAULT TRUE,
  payment_reminders BOOLEAN DEFAULT TRUE,
  portfolio_milestones BOOLEAN DEFAULT TRUE,
  do_not_disturb JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create push_tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(32) NOT NULL,
  device_id VARCHAR(128),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);
```

**Phase 3**:
```sql
-- Create FAQs table
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(128) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content_pages table
CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(64) UNIQUE NOT NULL,
  sections JSONB NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support_tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  priority VARCHAR(32) DEFAULT 'medium',
  status VARCHAR(32) DEFAULT 'open',
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bank_accounts table
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(255) NOT NULL,
  account_type VARCHAR(32) NOT NULL,
  routing_number VARCHAR(64),
  is_primary BOOLEAN DEFAULT FALSE,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create property_updates table
CREATE TABLE property_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(32) NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create property_documents table
CREATE TABLE property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  url VARCHAR(512) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Testing Strategy

### Unit Tests
- Service methods for all new functionality
- DTO validation
- Field transformations
- Computed value calculations

### Integration Tests
- API endpoint tests with Supertest
- Database integration
- Magic SDK integration (mocked)
- WebSocket events

### E2E Tests
- Complete user flows:
  - Registration → Login → Browse → Invest → View Portfolio
  - Deposit → Invest → Receive Reward
  - Create Bookmark → View Bookmarks → Remove
  - Receive Notification → Mark Read

### Performance Tests
- Load testing for high-traffic endpoints
- WebSocket connection stress test
- Database query optimization

---

## 7. Deployment Plan

### Phase 1 Deployment
1. Deploy database migrations
2. Deploy Magic SDK integration
3. Deploy authentication endpoints
4. Deploy enhanced property/investment endpoints
5. Verify WebSocket gateway
6. Frontend integration testing
7. Beta release to internal testers

### Phase 2 Deployment
1. Deploy new entities (Bookmark, Notification, Settings)
2. Deploy bookmarks, notifications, settings endpoints
3. Deploy portfolio performance endpoint
4. Deploy deposit/withdrawal enhancements
5. Integration testing
6. Beta release to select users

### Phase 3 Deployment
1. Deploy remaining entities (FAQ, ContentPage, SupportTicket, BankAccount, PropertyUpdate, PropertyDocument)
2. Deploy support & content endpoints
3. Deploy bank account management
4. Deploy property details endpoints
5. Full integration testing
6. Production release

---

## Summary

### Overall Progress Tracking

| Phase | Endpoints | Duration | Completion |
|-------|-----------|----------|------------|
| **Phase 1** | 15 | 2-3 weeks | 0% |
| **Phase 2** | 18 | 3-4 weeks | 0% |
| **Phase 3** | 13 | 2-3 weeks | 0% |
| **TOTAL** | **46** | **7-10 weeks** | **0%** |

### Key Milestones

- **Week 3**: Phase 1 complete - MVP ready for internal testing
- **Week 7**: Phase 2 complete - Full-featured app ready for beta
- **Week 10**: Phase 3 complete - Production-ready with all features

---

## Cross-Reference

- **API Mapping**: See `API_MAPPING.md` for detailed status of each endpoint
- **Database Schema**: See `DATABASE_SCHEMA_ALIGNMENT.md` for entity definitions
- **Authentication**: See `AUTH_INTEGRATION.md` for Magic Link implementation
- **Real-time**: See `REALTIME_ARCHITECTURE.md` for WebSocket integration
- **Implementation Prompts**: See `CURSOR_PROMPTS.md` for step-by-step guidance
- **Mobile Namespace**: See `MOBILE_APP_ENDPOINTS.md` for API structure

