# Cursor AI Implementation Prompts

**Version**: 1.0  
**Last Updated**: 2025-01-12  
**Purpose**: Ready-to-use prompts for implementing Blocks mobile app backend integration phase by phase

---

## How to Use These Prompts

1. **Copy the entire prompt** for the feature you're implementing
2. **Paste into Cursor AI** in your NestJS backend project
3. **Review the generated code** before accepting
4. **Test the implementation** using the provided test cases
5. **Move to the next prompt** after verification

**Important**: Always provide context by attaching:
- `blocks-app-integration/` folder (all documents)
- Relevant existing modules (`src/users/`, `src/properties/`, etc.)
- Entity files from `src/*/entities/`

---

## Table of Contents

### Phase 1: Core Functionality
1. [Magic Link Authentication Module](#prompt-1-magic-link-authentication-module)
2. [Mobile Auth Controller & Service](#prompt-2-mobile-auth-controller--service)
3. [JWT Strategy & Auth Guard](#prompt-3-jwt-strategy--auth-guard)
4. [Properties Mobile Endpoint](#prompt-4-properties-mobile-endpoint)
5. [Wallet Aggregated Endpoint](#prompt-5-wallet-aggregated-endpoint)
6. [Transactions with Filters](#prompt-6-transactions-with-filters)
7. [User Profile Aggregated Endpoint](#prompt-7-user-profile-aggregated-endpoint)

### Phase 2: Enhanced Features
8. [Bookmarks Module](#prompt-8-bookmarks-module)
9. [Notifications Module](#prompt-9-notifications-module)
10. [User Settings Modules](#prompt-10-user-settings-modules)
11. [Portfolio Performance Endpoint](#prompt-11-portfolio-performance-endpoint)
12. [Withdrawal System](#prompt-12-withdrawal-system)

### Phase 3: Additional Features
13. [Support & Content Module](#prompt-13-support--content-module)
14. [Bank Accounts Module](#prompt-14-bank-accounts-module)
15. [Property Details Enhancement](#prompt-15-property-details-enhancement)

### WebSocket Integration
16. [Real-time WebSocket Gateway](#prompt-16-real-time-websocket-gateway)

---

## PROMPT 1: Magic Link Authentication Module

```
I need to implement Magic Link passwordless authentication for the Blocks mobile app. Please create a complete MobileAuthModule with the following specifications:

CONTEXT:
- Existing backend: NestJS with TypeORM, PostgreSQL
- User entity exists at: src/admin/entities/user.entity.ts
- Existing modules: UsersModule, WalletModule, KycModule, PortfolioModule
- Event-driven architecture with @nestjs/event-emitter already set up

REQUIREMENTS:
1. Install required dependencies:
   - @magic-sdk/admin
   - @nestjs/jwt
   - @nestjs/passport
   - passport-jwt

2. Create src/mobile-auth/ directory with:
   - mobile-auth.module.ts
   - mobile-auth.controller.ts
   - mobile-auth.service.ts
   - services/magic.service.ts (for Magic SDK integration)
   - strategies/jwt.strategy.ts
   - guards/jwt-auth.guard.ts
   - dto/login.dto.ts
   - dto/register.dto.ts
   - dto/refresh-token.dto.ts

3. MagicService should:
   - Initialize Magic Admin SDK with secret key from config
   - Implement validateDidToken(didToken: string) method
   - Return { issuer, email, publicAddress } after validation
   - Throw UnauthorizedException for invalid tokens

4. MobileAuthService should:
   - Implement login(didToken, email) method
     * Validate DID token with MagicService
     * Find user by magicIssuer or auto-register
     * Generate JWT tokens
     * Return { user, token, refreshToken }
   - Implement register(didToken, email) method
     * Validate DID token
     * Create user in transaction with Wallet, KYC, Portfolio
     * Generate JWT tokens
   - Implement refreshToken(refreshToken) method
   - Implement validateUser(userId) method

5. MobileAuthController should have endpoints:
   - POST /api/mobile/auth/login
   - POST /api/mobile/auth/register
   - POST /api/mobile/auth/refresh
   - POST /api/mobile/auth/logout (with @UseGuards(JwtAuthGuard))
   - GET /api/mobile/auth/me (with @UseGuards(JwtAuthGuard))

6. Update User entity to add:
   - magicIssuer: string (unique, nullable)
   - magicPublicAddress: string (nullable)
   - authMethod: 'magic' | 'password' (default: 'magic')

7. JwtStrategy should:
   - Validate JWT from Authorization header
   - Extract user from JWT payload
   - Verify user is active

8. Environment variables needed:
   - MAGIC_SECRET_KEY
   - MAGIC_PUBLISHABLE_KEY
   - JWT_SECRET
   - JWT_EXPIRES_IN
   - JWT_REFRESH_EXPIRES_IN

IMPORTANT:
- DO NOT break existing org admin password authentication
- Reuse existing UsersService methods where possible
- Use transactions for user registration
- Follow existing code patterns in the codebase
- Add proper error handling with descriptive messages

REFERENCES:
- See blocks-app-integration/AUTH_INTEGRATION.md for complete implementation details
- Existing UsersService: src/users/users.service.ts
- Existing User entity: src/admin/entities/user.entity.ts

Please implement this step by step, starting with the MagicService, then MobileAuthService, then the controller and DTOs.
```

---

## PROMPT 2: Mobile Auth Controller & Service

```
Implement the mobile authentication endpoints with the following detailed specifications:

CONTEXT:
- MagicService already implemented
- User entity updated with magicIssuer field
- JWT module configured

CREATE:
1. src/mobile-auth/mobile-auth.controller.ts
   - POST login endpoint that:
     * Accepts { didToken: string, email: string }
     * Validates DID token via MagicService
     * Finds or creates user
     * Returns { user, token, refreshToken }
   
   - POST register endpoint that:
     * Accepts { didToken: string, email: string, fullName: string, phone?: string }
     * Validates DID token
     * Creates user in transaction with auto-created entities (Wallet, KYC, Portfolio)
     * Returns { user, token, refreshToken }
   
   - POST refresh endpoint that:
     * Accepts { refreshToken: string }
     * Validates and generates new tokens
     * Returns { token, refreshToken }
   
   - POST logout endpoint:
     * Protected with JwtAuthGuard
     * Returns success message
   
   - GET me endpoint:
     * Protected with JwtAuthGuard
     * Returns current user from JWT

2. src/mobile-auth/mobile-auth.service.ts
   - Inject: MagicService, UsersService, JwtService, DataSource
   - Implement all methods listed above
   - Use transactions for user registration
   - Proper error handling for all edge cases

3. DTOs with class-validator decorators:
   - LoginDto: { didToken, email }
   - RegisterDto: { didToken, email, fullName, phone? }
   - RefreshTokenDto: { refreshToken }

VALIDATION:
- All DTOs should use class-validator decorators
- Email format validation
- Non-empty string validation
- Proper error messages

ERROR HANDLING:
- UnauthorizedException for invalid DID tokens
- ConflictException for existing email on registration
- BadRequestException for malformed requests

REFERENCES:
- blocks-app-integration/AUTH_INTEGRATION.md sections 4.2-4.4
```

---

## PROMPT 3: JWT Strategy & Auth Guard

```
Create JWT authentication strategy and guard for protecting mobile endpoints:

REQUIREMENTS:
1. src/mobile-auth/strategies/jwt.strategy.ts
   - Extend PassportStrategy(Strategy)
   - Extract JWT from Authorization Bearer token
   - Validate against JWT_SECRET from config
   - Load user from database using UsersService
   - Verify user exists and is active
   - Return user object for @Request() req.user

2. src/mobile-auth/guards/jwt-auth.guard.ts
   - Extend AuthGuard('jwt')
   - Support @Public() decorator for public routes
   - Inject Reflector for metadata reading
   - Proper error handling for invalid tokens

3. Create decorators:
   - src/common/decorators/public.decorator.ts
     * @Public() decorator for public routes
   - src/common/decorators/current-user.decorator.ts
     * @CurrentUser() parameter decorator

USAGE EXAMPLE:
```typescript
@Controller('api/mobile/investments')
@UseGuards(JwtAuthGuard)  // Protect entire controller
export class MobileInvestmentsController {
  
  @Get()
  @Roles(UserRole.USER)  // Only users can access
  async getMyInvestments(@CurrentUser() user: User) {
    return this.service.findByUserId(user.id);
  }
}
```

TESTING:
- Valid token → Success, user attached to request
- Invalid token → 401 Unauthorized
- Expired token → 401 Unauthorized
- Missing token → 401 Unauthorized
- Public routes → Bypass authentication

REFERENCES:
- blocks-app-integration/AUTH_INTEGRATION.md section 4.5-4.6
```

---

## PROMPT 4: Properties Mobile Endpoint

```
Enhance the properties endpoint for mobile app with filters, pagination, and field transformations:

CONTEXT:
- Existing PropertiesController at src/properties/properties.controller.ts
- Existing PropertiesService at src/properties/properties.service.ts
- Property entity at src/properties/entities/property.entity.ts
- Organization entity at src/organizations/entities/organization.entity.ts

REQUIREMENTS:
1. Create src/mobile/controllers/mobile-properties.controller.ts
   - Namespace: /api/mobile/properties
   - GET / endpoint with filters:
     * page?: number (default: 1)
     * limit?: number (default: 20)
     * city?: string
     * status?: string
     * minROI?: number
     * maxPricePerToken?: number
     * search?: string (searches title, slug, description, city)
     * filter?: 'Trending' | 'High Yield' | 'New Listings' | 'Completed'
   
   - GET /:id endpoint (UUID or displayCode support)
   - Both return transformed responses

2. Create src/mobile/services/mobile-properties.service.ts
   - Inject PropertiesService and queryBuilder
   - Implement findAllWithFilters(query: PropertyFilterDto)
   - Apply filters dynamically
   - Implement pagination
   - Transform response fields

3. Field Transformations:
   ```typescript
   {
     valuation: property.totalValueUSDT,  // NOT totalValueUSDT
     tokenPrice: property.pricePerTokenUSDT,  // NOT pricePerTokenUSDT
     estimatedROI: property.expectedROI,  // NOT expectedROI
     soldTokens: property.totalTokens - property.availableTokens,  // Computed
     builder: {  // Transform organization → builder
       id: property.organization.id,
       name: property.organization.name,
       logo: property.organization.logoUrl,
       rating: 0,  // TODO: Implement rating system
       projectsCompleted: 0,  // TODO: Count completed properties
     },
   }
   ```

4. Filter Logic:
   - 'Trending': High funding progress in last 7 days
   - 'High Yield': estimatedROI >= 10
   - 'New Listings': created in last 30 days
   - 'Completed': status === 'completed'

5. Create DTO:
   - src/mobile/dto/property-filter.dto.ts
   - All fields optional with defaults
   - Validation decorators

DO NOT:
- Modify existing PropertiesController (used by admin/org apps)
- Break existing property endpoints
- Remove any existing functionality

REUSE:
- Existing PropertiesService methods
- Existing Property entity
- Existing relations

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 2.1-2.2
- blocks-app-integration/DATABASE_SCHEMA_ALIGNMENT.md section 2
```

---

## PROMPT 5: Wallet Aggregated Endpoint

```
Create an aggregated wallet endpoint that combines wallet balance with computed portfolio values:

REQUIREMENTS:
1. Create src/mobile/controllers/mobile-wallet.controller.ts
   - Namespace: /api/mobile/wallet
   - Protected with JwtAuthGuard
   - GET / endpoint that returns:
     ```typescript
     {
       usdc: number,  // walletbalanceUSDT
       totalValue: number,  // wallet + portfolio current value
       totalInvested: number,  // from Portfolio.totalInvestedUSDT
       totalEarnings: number,  // from Portfolio.totalRewardsUSDT
       pendingDeposits: number,  // sum of pending deposit transactions
     }
     ```

2. Create src/mobile/services/mobile-wallet.service.ts
   - Inject: WalletService, PortfolioService, TransactionsService
   - Method: getAggregatedWallet(userId: string)
   - Compute portfolio current value from investments
   - Sum pending deposit transactions
   - Return aggregated data

3. Computation Logic:
   ```typescript
   // Portfolio current value
   const investments = await this.investmentsService.findByUserId(userId);
   const currentValue = investments.reduce((sum, inv) => {
     return sum + (inv.tokensPurchased * inv.property.pricePerTokenUSDT);
   }, 0);

   // Pending deposits
   const pendingDeposits = await this.transactionsService.sumPendingDeposits(userId);
   ```

4. Add method to TransactionsService:
   - sumPendingDeposits(userId: string): Promise<number>
   - Query transactions where type='deposit' AND status='pending'
   - Return sum of amountUSDT

REUSE:
- Existing WalletService.findByUser()
- Existing PortfolioService.findByUser()
- Existing InvestmentsService.findByUserId()

DO NOT:
- Modify existing WalletController
- Break existing wallet endpoints

TESTING:
- User with balance, investments → Correct totals
- User with pending deposits → Included in pendingDeposits
- User with no investments → portfolio values = 0
- User with no wallet → Error handling

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 4.1
- blocks-app-integration/DATABASE_SCHEMA_ALIGNMENT.md section 4
```

---

## PROMPT 6: Transactions with Filters

```
Enhance transactions endpoint with filters, pagination, and field transformations:

REQUIREMENTS:
1. Create src/mobile/controllers/mobile-transactions.controller.ts
   - Namespace: /api/mobile/transactions
   - Protected with JwtAuthGuard
   - GET / endpoint with filters:
     * page?: number (default: 1)
     * limit?: number (default: 20)
     * type?: 'deposit' | 'withdraw' | 'investment' | 'rental_income' | 'transfer'
     * status?: 'completed' | 'pending' | 'failed'
     * propertyId?: string

2. Create src/mobile/services/mobile-transactions.service.ts
   - Inject TransactionsService and queryBuilder
   - Method: findByUserWithFilters(userId: string, filters: TransactionFilterDto)
   - Apply dynamic filters
   - Implement pagination
   - Transform response fields

3. Field Transformations:
   ```typescript
   {
     id: transaction.id,
     type: transaction.type === 'reward' ? 'rental_income' : transaction.type,
     amount: transaction.amountUSDT,  // NOT amountUSDT
     date: transaction.createdAt,  // NOT createdAt
     description: transaction.description,
     status: transaction.status,
     currency: 'USDC',  // Always USDC
     propertyId: transaction.propertyId,
     propertyTitle: transaction.property?.title,  // From relation
     transactionHash: transaction.referenceId,  // NOT referenceId
   }
   ```

4. Create DTO:
   - src/mobile/dto/transaction-filter.dto.ts
   - Validation decorators
   - Optional pagination fields

5. Add to TransactionsService:
   - Ensure eager loading of property relation
   - Add findByUserWithFilters method

REUSE:
- Existing TransactionsService
- Existing Transaction entity
- Existing relations

DO NOT:
- Modify existing TransactionsController
- Break existing transaction endpoints

TESTING:
- Filter by type → Correct transactions
- Filter by status → Correct filtering
- Pagination → Correct page/limit
- Property relation → Title populated

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 4.2
- blocks-app-integration/DATABASE_SCHEMA_ALIGNMENT.md section 5
```

---

## PROMPT 7: User Profile Aggregated Endpoint

```
Create aggregated profile endpoint combining user info, security settings, and notification settings:

REQUIREMENTS:
1. First, create two new entities:
   
   src/users/entities/user-security-settings.entity.ts:
   ```typescript
   @Entity('user_security_settings')
   export class UserSecuritySettings {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'uuid', unique: true })
     userId: string;

     @OneToOne(() => User, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'userId' })
     user: User;

     @Column({ type: 'boolean', default: false })
     twoFactorAuth: boolean;

     @Column({ type: 'boolean', default: false })
     biometricLogin: boolean;

     @Column({ type: 'timestamptz', nullable: true })
     passwordLastChanged?: Date;

     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

   src/users/entities/user-notification-settings.entity.ts:
   ```typescript
   @Entity('user_notification_settings')
   export class UserNotificationSettings {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'uuid', unique: true })
     userId: string;

     @OneToOne(() => User, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'userId' })
     user: User;

     @Column({ type: 'boolean', default: true })
     pushNotifications: boolean;

     @Column({ type: 'boolean', default: true })
     emailNotifications: boolean;

     @Column({ type: 'boolean', default: false })
     smsNotifications: boolean;

     @Column({ type: 'boolean', default: true })
     investmentUpdates: boolean;

     @Column({ type: 'boolean', default: true })
     propertyAlerts: boolean;

     @Column({ type: 'boolean', default: true })
     monthlyReports: boolean;

     @Column({ type: 'boolean', default: false })
     marketingOffers: boolean;

     @Column({ type: 'boolean', default: true })
     securityAlerts: boolean;

     @Column({ type: 'boolean', default: true })
     paymentReminders: boolean;

     @Column({ type: 'boolean', default: true })
     portfolioMilestones: boolean;

     @Column({ type: 'jsonb', nullable: true })
     doNotDisturb?: {
       enabled: boolean;
       startTime?: string;
       endTime?: string;
     };

     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

2. Create services for these entities:
   - src/users/services/user-security-settings.service.ts
   - src/users/services/user-notification-settings.service.ts

3. Create src/mobile/controllers/mobile-profile.controller.ts:
   - GET /api/mobile/profile (aggregated)
   - PATCH /api/mobile/profile (update user info)
   - PATCH /api/mobile/profile/security (update security settings)
   - PATCH /api/mobile/profile/notifications (update notification settings)

4. All endpoints protected with JwtAuthGuard

5. GET /profile should return:
   ```typescript
   {
     userInfo: {
       id, email, fullName, phone, dob, address, profileImage, createdAt
     },
     securitySettings: {
       twoFactorAuth, biometricLogin, passwordLastChanged
     },
     notificationSettings: {
       pushNotifications, emailNotifications, smsNotifications, ...
     }
   }
   ```

6. If settings don't exist, return defaults

MIGRATIONS:
Run these SQL statements first:
```sql
CREATE TABLE user_security_settings (...);
CREATE TABLE user_notification_settings (...);
```

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 5.1-5.4
- blocks-app-integration/DATABASE_SCHEMA_ALIGNMENT.md section 11.3-11.4
```

---

## PROMPT 8: Bookmarks Module

```
Create a complete bookmarks module for users to bookmark properties:

REQUIREMENTS:
1. Create entity src/bookmarks/entities/bookmark.entity.ts:
   ```typescript
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

     // Unique constraint: user can only bookmark a property once
     @Index(['userId', 'propertyId'], { unique: true })
   }
   ```

2. Create module, service, controller:
   - src/bookmarks/bookmarks.module.ts
   - src/bookmarks/bookmarks.service.ts
   - src/bookmarks/bookmarks.controller.ts

3. Controller endpoints (namespace: /api/mobile/bookmarks):
   - GET / → List user's bookmarks (with property details)
   - POST / → Add bookmark
   - DELETE /:propertyId → Remove bookmark
   - POST /toggle → Toggle bookmark (smart endpoint)

4. BookmarksService methods:
   - findByUser(userId: string)
   - findOne(userId: string, propertyId: string)
   - create(userId: string, propertyId: string)
   - remove(id: string)
   - toggle(userId: string, propertyId: string)

5. DTOs:
   - CreateBookmarkDto: { propertyId: string }
   - ToggleBookmarkDto: { propertyId: string }

6. Eager load property relation when listing bookmarks

MIGRATION:
```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_property_id ON bookmarks(property_id);
```

TESTING:
- Add bookmark → Success
- Add duplicate → 409 Conflict (handle gracefully)
- Remove bookmark → Success
- Toggle bookmark → Add if not exists, remove if exists
- List bookmarks → Includes property details

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 6
- blocks-app-integration/DATABASE_SCHEMA_ALIGNMENT.md section 11.1
```

---

## PROMPT 9: Notifications Module

```
Create a complete notifications module with CRUD operations:

REQUIREMENTS:
1. Create entity src/notifications/entities/notification.entity.ts:
   ```typescript
   @Entity('notifications')
   export class Notification {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'uuid' })
     @Index()
     userId: string;

     @ManyToOne(() => User, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'userId' })
     user: User;

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

2. Create module, service, controller:
   - src/notifications/notifications.module.ts
   - src/notifications/notifications.service.ts
   - src/notifications/notifications.controller.ts

3. Controller endpoints (namespace: /api/mobile/notifications):
   - GET / → List notifications (with filters: unreadOnly, type, pagination)
   - PATCH /:id/read → Mark as read
   - PATCH /read-all → Mark all as read
   - POST /push-token → Register push token
   - DELETE /push-token → Unregister push token

4. NotificationsService methods:
   - findByUser(userId: string, filters: NotificationFilterDto)
   - markAsRead(id: string)
   - markAllAsRead(userId: string)
   - create(userId: string, notification: CreateNotificationDto)  // For system use

5. DTOs:
   - NotificationFilterDto: { page?, limit?, unreadOnly?, type? }
   - CreateNotificationDto: { type, title, body, data? }

6. Create PushToken entity and service for push token management:
   ```typescript
   @Entity('push_tokens')
   export class PushToken {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'uuid' })
     @Index()
     userId: string;

     @Column({ type: 'text' })
     token: string;

     @Column({ type: 'varchar', length: 32 })
     platform: 'ios' | 'android' | 'web';

     @Column({ type: 'varchar', length: 128, nullable: true })
     deviceId?: string;

     @Column({ type: 'boolean', default: true })
     active: boolean;

     @CreateDateColumn()
     createdAt: Date;

     @Index(['userId', 'deviceId'], { unique: true })
   }
   ```

MIGRATION:
```sql
CREATE TABLE notifications (...);
CREATE TABLE push_tokens (...);
```

INTEGRATION WITH WEBSOCKET:
- When creating notification, emit WebSocket event:
  ```typescript
  this.eventEmitter.emit('notification.created', {
    userId,
    notification,
    timestamp: new Date().toISOString(),
  });
  ```

TESTING:
- Create notification → Success, WebSocket event emitted
- List notifications → Correct filtering
- Mark as read → Updates read flag
- Mark all as read → All user notifications marked
- Register push token → Saved
- Duplicate device → Updates existing token

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 7
- blocks-app-integration/REALTIME_ARCHITECTURE.md section 3.6
- blocks-app-integration/DATABASE_SCHEMA_ALIGNMENT.md section 11.2, 11.6
```

---

## PROMPT 10: User Settings Modules

```
Implement security and notification settings update endpoints:

CONTEXT:
- UserSecuritySettings and UserNotificationSettings entities already created
- Services already created

REQUIREMENTS:
1. Add to src/mobile/controllers/mobile-profile.controller.ts:
   
   PATCH /api/mobile/profile/security:
   ```typescript
   @Patch('security')
   @UseGuards(JwtAuthGuard)
   async updateSecurity(@Request() req, @Body() dto: UpdateSecurityDto) {
     return this.securitySettingsService.updateOrCreate(req.user.id, dto);
   }
   ```

   PATCH /api/mobile/profile/notifications:
   ```typescript
   @Patch('notifications')
   @UseGuards(JwtAuthGuard)
   async updateNotifications(@Request() req, @Body() dto: UpdateNotificationSettingsDto) {
     return this.notificationSettingsService.updateOrCreate(req.user.id, dto);
   }
   ```

2. Create DTOs:
   - src/users/dto/update-security.dto.ts:
     ```typescript
     export class UpdateSecurityDto {
       @IsOptional() @IsBoolean() twoFactorAuth?: boolean;
       @IsOptional() @IsBoolean() biometricLogin?: boolean;
       @IsOptional() @IsString() currentPassword?: string;
       @IsOptional() @IsString() newPassword?: string;
     }
     ```

   - src/users/dto/update-notification-settings.dto.ts:
     ```typescript
     export class UpdateNotificationSettingsDto {
       @IsOptional() @IsBoolean() pushNotifications?: boolean;
       @IsOptional() @IsBoolean() emailNotifications?: boolean;
       @IsOptional() @IsBoolean() smsNotifications?: boolean;
       @IsOptional() @IsBoolean() investmentUpdates?: boolean;
       @IsOptional() @IsBoolean() propertyAlerts?: boolean;
       @IsOptional() @IsBoolean() monthlyReports?: boolean;
       @IsOptional() @IsBoolean() marketingOffers?: boolean;
       @IsOptional() @IsBoolean() securityAlerts?: boolean;
       @IsOptional() @IsBoolean() paymentReminders?: boolean;
       @IsOptional() @IsBoolean() portfolioMilestones?: boolean;
       @IsOptional() doNotDisturb?: {
         enabled: boolean;
         startTime?: string;
         endTime?: string;
       };
     }
     ```

3. Service methods:
   - updateOrCreate(userId: string, data: Partial<Settings>)
   - If settings exist, update; otherwise create with defaults

TESTING:
- Update security settings → Saved
- Update notification settings → Saved
- Update with partial data → Only specified fields updated
- First-time update → Creates with defaults for unspecified fields

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 5.3-5.4
```

---

## PROMPT 11: Portfolio Performance Endpoint

```
Create portfolio performance endpoint with time-series data:

REQUIREMENTS:
1. Add to src/mobile/controllers/mobile-portfolio.controller.ts:
   
   GET /api/mobile/portfolio/performance?period=30d:
   ```typescript
   @Get('performance')
   @UseGuards(JwtAuthGuard)
   async getPerformance(
     @Request() req,
     @Query() query: { period: '7d' | '30d' | '90d' | '1y' | 'all' },
   ) {
     return this.portfolioService.getPerformance(req.user.id, query.period);
   }
   ```

2. Add to src/portfolio/portfolio.service.ts:
   
   Method: getPerformance(userId: string, period: string)
   
   Logic:
   - Calculate date range based on period
   - Get all investments and rewards for user
   - Group by date
   - Calculate daily:
     * Total value (sum of current investment values)
     * Total invested (cumulative)
     * Total earnings (cumulative rewards)
   - Calculate metrics:
     * Total return (current value - invested)
     * Total return percentage
     * Average ROI

3. Return format:
   ```typescript
   {
     period: string,
     data: [
       {
         date: string,
         value: number,
         invested: number,
         earnings: number,
       },
       ...
     ],
     metrics: {
       totalReturn: number,
       totalReturnPercentage: number,
       averageROI: number,
     },
   }
   ```

4. Optimization:
   - Cache results for 1 hour
   - Use efficient SQL queries
   - Limit data points (e.g., 7d = daily, 1y = weekly)

TESTING:
- 7d period → 7 data points
- 30d period → 30 data points
- All period → All data from first investment
- No investments → Empty data array, zero metrics

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 3.6
```

---

## PROMPT 12: Withdrawal System

```
Implement withdrawal functionality with KYC verification and bank account support:

REQUIREMENTS:
1. Create endpoint POST /api/mobile/wallet/withdraw:
   ```typescript
   @Post('withdraw')
   @UseGuards(JwtAuthGuard)
   async withdraw(@Request() req, @Body() dto: WithdrawDto) {
     // 1. Verify KYC status
     // 2. Check balance >= amount
     // 3. Check bank account exists
     // 4. Create withdrawal transaction
     // 5. Deduct from balance
     // 6. Emit WebSocket event
     // 7. Return transaction
   }
   ```

2. WithdrawDto:
   ```typescript
   export class WithdrawDto {
     @IsNumber() @Min(1) amount: number;
     @IsEnum(WithdrawMethod) method: 'bank' | 'crypto';
     @IsOptional() @IsUUID() bankAccountId?: string;
     @IsOptional() @IsString() walletAddress?: string;
     @IsOptional() @IsEnum(CryptoNetwork) network?: 'polygon' | 'bnb' | 'ethereum';
   }
   ```

3. Validation checks:
   - KYC status must be 'verified'
   - Balance must be >= amount
   - Bank account must exist if method='bank'
   - Wallet address must be valid if method='crypto'

4. Create withdrawal transaction:
   - type: 'withdrawal'
   - status: 'pending' (requires manual approval)
   - Deduct from wallet.balanceUSDT
   - Add to wallet.lockedUSDT (until approved/rejected)

5. Emit WebSocket event:
   ```typescript
   this.eventEmitter.emit('transaction.status_changed', {
     userId,
     transactionId: transaction.id,
     transaction: { ... },
     timestamp: new Date().toISOString(),
   });
   ```

ERROR HANDLING:
- KYC not verified → 403 Forbidden
- Insufficient balance → 400 Bad Request
- Bank account not found → 404 Not Found
- Invalid wallet address → 400 Bad Request

TESTING:
- Valid withdrawal → Success, balance updated
- Unverified KYC → Error
- Insufficient balance → Error
- Invalid bank account → Error

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 4.4
```

---

## PROMPT 13: Support & Content Module

```
Create support and content management module for FAQs, contact, and content pages:

REQUIREMENTS:
1. Create entities:
   - src/support/entities/faq.entity.ts
   - src/support/entities/content-page.entity.ts
   - src/support/entities/support-ticket.entity.ts

2. Create module, service, controller:
   - src/support/support.module.ts
   - src/support/support.service.ts
   - src/support/support.controller.ts

3. Controller endpoints (namespace: /api/mobile/support):
   - GET /faqs → List FAQs (optional filter by category)
   - GET /contact → Get contact information (static config)
   - POST /contact → Submit support ticket
   - GET /content/privacy-policy → Get privacy policy
   - GET /content/terms-of-service → Get terms of service
   - GET /content/languages → List supported languages (static)

4. FAQ Entity:
   ```typescript
   @Entity('faqs')
   export class FAQ {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'varchar', length: 128 })
     @Index()
     category: string;

     @Column({ type: 'text' })
     question: string;

     @Column({ type: 'text' })
     answer: string;

     @Column({ type: 'integer', default: 0 })
     order: number;

     @Column({ type: 'boolean', default: true })
     active: boolean;

     @CreateDateColumn()
     createdAt: Date;

     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

5. ContentPage Entity:
   ```typescript
   @Entity('content_pages')
   export class ContentPage {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'varchar', length: 64, unique: true })
     type: string;  // 'privacy-policy', 'terms-of-service'

     @Column({ type: 'jsonb' })
     sections: {
       id: string;
       title: string;
       content: string[];
       order: number;
     }[];

     @Column({ type: 'timestamptz' })
     lastUpdated: Date;

     @CreateDateColumn()
     createdAt: Date;
   }
   ```

6. SupportTicket Entity:
   ```typescript
   @Entity('support_tickets')
   export class SupportTicket {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'uuid', nullable: true })
     userId?: string;

     @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
     @JoinColumn({ name: 'userId' })
     user?: User;

     @Column({ type: 'varchar', length: 255 })
     subject: string;

     @Column({ type: 'text' })
     message: string;

     @Column({ type: 'varchar', length: 32 })
     type: 'email' | 'phone' | 'chat';

     @Column({ type: 'varchar', length: 32, default: 'medium' })
     priority: 'low' | 'medium' | 'high';

     @Column({ type: 'varchar', length: 32, default: 'open' })
     status: 'open' | 'in_progress' | 'resolved' | 'closed';

     @Column({ type: 'text', nullable: true })
     response?: string;

     @CreateDateColumn()
     createdAt: Date;

     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

MIGRATIONS:
```sql
CREATE TABLE faqs (...);
CREATE TABLE content_pages (...);
CREATE TABLE support_tickets (...);
```

STATIC CONFIGS:
- Contact information (email, phone, address, business hours)
- Supported languages list

TESTING:
- List FAQs → Returns active FAQs
- Filter FAQs by category → Correct filtering
- Submit support ticket → Created
- Get content pages → Returns sections
- Get languages → Returns static list

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 8
- blocks-app-integration/DATABASE_SCHEMA_ALIGNMENT.md section 11.9-11.11
```

---

## PROMPT 14: Bank Accounts Module

```
Create bank accounts management module for withdrawal destinations:

REQUIREMENTS:
1. Create entity src/bank-accounts/entities/bank-account.entity.ts:
   ```typescript
   @Entity('bank_accounts')
   export class BankAccount {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'uuid' })
     @Index()
     userId: string;

     @ManyToOne(() => User, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'userId' })
     user: User;

     @Column({ type: 'varchar', length: 255 })
     bankName: string;

     @Column({ type: 'varchar', length: 255 })
     accountNumber: string;  // TODO: Encrypt in production

     @Column({ type: 'varchar', length: 32 })
     accountType: 'Checking' | 'Savings';

     @Column({ type: 'varchar', length: 64, nullable: true })
     routingNumber?: string;

     @Column({ type: 'boolean', default: false })
     isPrimary: boolean;

     @Column({ type: 'varchar', length: 32, default: 'pending' })
     status: 'pending' | 'verified' | 'rejected';

     @CreateDateColumn()
     createdAt: Date;

     @UpdateDateColumn()
     updatedAt: Date;
   }
   ```

2. Create module, service, controller:
   - src/bank-accounts/bank-accounts.module.ts
   - src/bank-accounts/bank-accounts.service.ts
   - src/bank-accounts/bank-accounts.controller.ts

3. Controller endpoints (namespace: /api/mobile/profile/bank-accounts):
   - GET / → List user's bank accounts
   - POST / → Add new bank account (requires verified KYC)
   - DELETE /:id → Remove bank account
   - PATCH /:id/primary → Set as primary (unsets others)

4. BankAccountsService methods:
   - findByUser(userId: string)
   - create(userId: string, data: CreateBankAccountDto)
   - remove(id: string)
   - setPrimary(userId: string, accountId: string)

5. DTOs:
   - CreateBankAccountDto: { bankName, accountNumber, accountType, routingNumber?, isPrimary? }

6. Validation:
   - Require verified KYC before adding bank account
   - When setting primary, unset other accounts' isPrimary
   - Cannot remove primary account if it's the only one

SECURITY:
- Account numbers should be encrypted at rest (use encryption library)
- Mask account numbers in responses (show last 4 digits only)
- Log all bank account operations for audit

MIGRATION:
```sql
CREATE TABLE bank_accounts (...);
```

TESTING:
- Add bank account with verified KYC → Success
- Add bank account without KYC → 403 Forbidden
- Set as primary → Updates isPrimary flags
- Remove account → Success
- List accounts → Account numbers masked

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 5.5-5.8
- blocks-app-integration/DATABASE_SCHEMA_ALIGNMENT.md section 11.5
```

---

## PROMPT 15: Property Details Enhancement

```
Add property search, financials, and updates endpoints:

REQUIREMENTS:
1. Add to src/mobile/controllers/mobile-properties.controller.ts:

   GET /api/mobile/properties/search:
   ```typescript
   @Get('search')
   async search(@Query() query: PropertySearchDto) {
     // ILIKE search on title, slug, description, city, location
     return this.propertiesService.search(query);
   }
   ```

   GET /api/mobile/properties/:id/financials:
   ```typescript
   @Get(':id/financials')
   async getFinancials(@Param('id') id: string) {
     // Aggregate financial data
     return this.propertiesService.getFinancials(id);
   }
   ```

   GET /api/mobile/properties/:id/updates:
   ```typescript
   @Get(':id/updates')
   async getUpdates(@Param('id') id: string, @Query() query: { limit?: number }) {
     return this.propertyUpdatesService.findByProperty(id, query.limit);
   }
   ```

2. Create PropertyUpdate entity and service:
   ```typescript
   @Entity('property_updates')
   export class PropertyUpdate {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ type: 'uuid' })
     @Index()
     propertyId: string;

     @ManyToOne(() => Property, { onDelete: 'CASCADE' })
     @JoinColumn({ name: 'propertyId' })
     property: Property;

     @Column({ type: 'varchar', length: 255 })
     title: string;

     @Column({ type: 'text' })
     description: string;

     @Column({ type: 'date' })
     date: Date;

     @Column({ type: 'varchar', length: 32 })
     type: 'project' | 'financial' | 'community';

     @Column({ type: 'integer', default: 0 })
     order: number;

     @CreateDateColumn()
     createdAt: Date;
   }
   ```

3. PropertySearchDto:
   ```typescript
   export class PropertySearchDto {
     @IsString() @IsNotEmpty() query: string;
     @IsOptional() @IsString() city?: string;
     @IsOptional() @IsString() status?: string;
     @IsOptional() @IsNumber() minROI?: number;
     @IsOptional() @IsNumber() maxPricePerToken?: number;
   }
   ```

4. Financials response:
   ```typescript
   {
     propertyId: string;
     propertyTitle: string;
     valuation: number;
     tokenPrice: number;
     totalTokens: number;
     soldTokens: number;
     estimatedROI: number;
     estimatedYield: number;
     fundingProgress: number;
     rentalIncome?: {
       monthly: number;
       lastDistribution: string;
       nextDistribution: string;
     };
   }
   ```

MIGRATION:
```sql
CREATE TABLE property_updates (...);
CREATE TABLE property_documents (...);
```

TESTING:
- Search properties → Returns matching properties
- Get financials → Aggregated financial data
- Get updates → Ordered by date
- No updates → Empty array

REFERENCES:
- blocks-app-integration/API_MAPPING.md section 2.3-2.6
- blocks-app-integration/DATABASE_SCHEMA_ALIGNMENT.md section 11.7-11.8
```

---

## PROMPT 16: Real-time WebSocket Gateway

```
Implement WebSocket gateway for real-time updates:

CONTEXT:
- NestJS with @nestjs/event-emitter already set up
- JWT authentication module exists

REQUIREMENTS:
1. Install dependencies:
   - @nestjs/websockets
   - @nestjs/platform-socket.io
   - socket.io

2. Create src/websocket/realtime.gateway.ts:
   - Namespace: /mobile
   - JWT authentication via handshake
   - Auto-join user room on connection: `user:{userId}`
   - Subscribe/unsubscribe to property rooms: `property:{propertyId}`

3. Event listeners from @nestjs/event-emitter:
   - @OnEvent('wallet.balance_updated') → emit 'wallet:balance_updated'
   - @OnEvent('investment.created') → emit 'investment:created'
   - @OnEvent('transaction.status_changed') → emit 'transaction:status_changed'
   - @OnEvent('property.funding_updated') → emit 'property:funding_updated'
   - @OnEvent('reward.distributed') → emit 'reward:distributed'
   - @OnEvent('notification.created') → emit 'notification:new'
   - @OnEvent('portfolio.updated') → emit 'portfolio:updated'

4. Gateway methods:
   - handleConnection(client: Socket): Validate JWT, join user room
   - handleDisconnect(client: Socket): Clean up tracking
   - handleSubscribeProperty(client: Socket, data: { propertyId }): Join property room
   - handleUnsubscribeProperty(client: Socket, data: { propertyId }): Leave property room
   - handlePing(client: Socket): Health check

5. Tracking:
   - Map<userId, Set<socketId>> for connection tracking
   - Methods: isUserConnected(userId), getUserSocketCount(userId)

6. Security:
   - Validate JWT from handshake.auth.token or headers.authorization
   - Disconnect if authentication fails
   - Only allow users to join their own user room

INTEGRATION:
Add to existing services to emit events:
```typescript
// Example in WalletService
async deposit(userId: string, amount: number) {
  // ... existing logic ...
  
  this.eventEmitter.emit('wallet.balance_updated', {
    userId,
    walletId: wallet.id,
    balance: { ... },
    change: { ... },
    timestamp: new Date().toISOString(),
  });
}
```

TESTING:
- Connect with valid JWT → Success
- Connect without JWT → Disconnect with error
- Subscribe to property → Joined room
- Emit event → Client receives event
- Multiple connections from same user → All receive events

CORS:
Enable CORS in gateway decorator:
```typescript
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/mobile',
})
```

REFERENCES:
- blocks-app-integration/REALTIME_ARCHITECTURE.md sections 3-4
- blocks-app-integration/AUTH_INTEGRATION.md for JWT validation
```

---

## Testing Strategy

After implementing each feature, test with:

### Unit Tests
```bash
npm run test -- --testPathPattern=mobile-auth
npm run test -- --testPathPattern=mobile-properties
# etc.
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing with Insomnia/Postman
1. Register/Login → Get JWT
2. Test protected endpoints with Bearer token
3. Verify field transformations
4. Test error scenarios

---

## Summary

These prompts are designed to be:
- **Self-contained**: Each can be used independently
- **Context-aware**: Reference existing code patterns
- **Non-destructive**: Add functionality without breaking existing apps
- **Testable**: Include testing guidelines

Use them sequentially following the phases in `API_IMPLEMENTATION_PLAN.md` for best results.

---

## Cross-Reference

- **API Mapping**: See `API_MAPPING.md` for complete endpoint specifications
- **Database Schema**: See `DATABASE_SCHEMA_ALIGNMENT.md` for all entity definitions
- **Authentication**: See `AUTH_INTEGRATION.md` for Magic Link details
- **Real-time**: See `REALTIME_ARCHITECTURE.md` for WebSocket implementation
- **Implementation Plan**: See `API_IMPLEMENTATION_PLAN.md` for phased timeline
- **Mobile Endpoints**: See `MOBILE_APP_ENDPOINTS.md` for API structure

