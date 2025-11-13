# Blocks App Flow Documentation: Contexts, Services & User Interactions

**Version**: 1.0  
**Last Updated**: 2025-01-12  
**Purpose**: Complete documentation of how contexts, services, and features interact in the Blocks mobile app

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Context Hierarchy](#2-context-hierarchy)
3. [Service Layer](#3-service-layer)
4. [User Interaction Flows](#4-user-interaction-flows)
5. [Investment Flow](#5-investment-flow)
6. [Wallet & Deposit Flow](#6-wallet--deposit-flow)
7. [State Update Cascades](#7-state-update-cascades)
8. [Notification System](#8-notification-system)
9. [Data Synchronization](#9-data-synchronization)

---

## 1. Architecture Overview

### Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Context Layer (State)                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │  │
│  │  │ AuthContext  │  │  AppContext  │  │ Guidance  │ │  │
│  │  │              │  │              │  │  Context  │ │  │
│  │  │ - Token      │  │ - Wallet     │  │           │ │  │
│  │  │ - Auth State │  │ - Portfolio  │  │ - Plan    │ │  │
│  │  │ - Biometrics │  │ - Properties │  │           │ │  │
│  │  │              │  │ - Profile    │  │           │ │  │
│  │  │              │  │ - Bookmarks  │  │           │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └───────────┘ │  │
│  └─────────┼──────────────────┼────────────────────────┘  │
│            │                  │                            │
│  ┌─────────▼──────────────────▼────────────────────────┐  │
│  │              Service Layer (Hooks)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │useWallet │  │usePortfolio│ │useProperty│         │  │
│  │  │          │  │            │ │          │         │  │
│  │  │useProfile│  │useNotifications│useChatbot│         │  │
│  │  └────┬─────┘  └─────┬─────┘  └─────┬────┘         │  │
│  └───────┼───────────────┼──────────────┼──────────────┘  │
│          │               │               │                 │
│  ┌───────▼───────────────▼───────────────▼──────────────┐  │
│  │         Notification Helper & Utilities              │  │
│  │  - NotificationHelper (local notifications)          │  │
│  │  - useNotifications (permissions, channels)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              UI Components (Screens)                 │  │
│  │  - Home, Portfolio, Wallet, Profile, Property        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Context Hierarchy

### 2.1 Context Dependencies

```
AuthContext (Root)
  │
  ├─> AppContext (Depends on AuthContext for auth state)
  │     │
  │     ├─> useWallet (reads AppContext.state.balance)
  │     ├─> usePortfolio (reads AppContext.state.investments)
  │     ├─> useProperty (reads AppContext.state.properties)
  │     └─> useProfile (reads AppContext.state.userInfo)
  │
  └─> GuidanceContext (Independent)
```

### 2.2 AuthContext

**Purpose**: Authentication state management

**State**:
```typescript
{
  token: string | null,
  isAuthenticated: boolean,
  isLoading: boolean,
  isBiometricSupported: boolean,
  isBiometricEnrolled: boolean
}
```

**Key Methods**:
- `signIn(token, enableBiometrics)` - Store token, update auth state
- `signOut()` - Clear tokens, reset auth state
- `loginWithBiometrics()` - Authenticate with biometrics
- `enableBiometrics()` - Enable biometric login
- `disableBiometrics()` - Disable biometric login

**Effects**:
- Controls route protection (redirects to signin if not authenticated)
- Provides token for API calls
- Manages SecureStore for token persistence

**Storage**:
- `TOKEN_KEY`: Standard auth token
- `BIOMETRIC_TOKEN_KEY`: Biometric auth token

---

### 2.3 AppContext

**Purpose**: Global application state (wallet, portfolio, properties, profile, bookmarks)

**State Structure**:
```typescript
{
  balance: WalletBalance,           // Wallet state
  transactions: Transaction[],       // Transaction history
  investments: Investment[],         // User investments
  properties: Property[],            // All properties
  userInfo: UserInfo,               // User profile
  securitySettings: SecuritySettings,
  notificationSettings: NotificationSettings,
  bankAccounts: BankAccount[],
  bookmarkedPropertyIds: string[]   // Bookmark IDs
}
```

**Key Methods**:

#### Wallet Actions
- `deposit(amount, method)` - Add funds to wallet
- `withdraw(amount)` - Remove funds from wallet

#### Investment Actions
- `invest(amount, propertyId, tokenCount)` - Create/update investment

#### Property Actions
- `getProperty(id)` - Get property by ID
- `toggleBookmark(propertyId)` - Toggle bookmark

#### Portfolio Actions
- `getInvestments()` - Get all investments
- `getTotalValue()` - Calculate total portfolio value
- `getTotalInvested()` - Calculate total invested
- `getTotalROI()` - Calculate total ROI percentage
- `getMonthlyRentalIncome()` - Calculate monthly income

#### Profile Actions
- `updateUserInfo(updates)` - Update user profile
- `updateSecuritySettings(updates)` - Update security settings
- `updateNotificationSettings(updates)` - Update notification settings
- `addBankAccount(account)` - Add bank account
- `removeBankAccount(accountId)` - Remove bank account
- `setPrimaryBankAccount(accountId)` - Set primary bank account

**Storage**:
- `BOOKMARKS_STORAGE_KEY`: Bookmarked property IDs (SecureStore)

---

### 2.4 GuidanceContext

**Purpose**: Investment guidance/planning state

**State**:
```typescript
{
  investmentPlan: {
    investmentAmount: number
  }
}
```

**Key Methods**:
- `updateInvestmentPlan(updates)` - Update plan
- `resetPlan()` - Reset to default

**Usage**: Used in portfolio guidance screens for investment planning

---

## 3. Service Layer

### 3.1 useWallet Hook

**Source**: `services/useWallet.ts`

**Dependencies**: `AppContext`

**What it does**:
- Wraps `AppContext` wallet state and actions
- Provides loading state
- Exposes `balance`, `transactions`, `deposit()`, `withdraw()`

**Flow**:
```
Component → useWallet() → AppContext.deposit/withdraw → State Update → Notification
```

---

### 3.2 usePortfolio Hook

**Source**: `services/usePortfolio.ts`

**Dependencies**: `AppContext`

**What it does**:
- Reads investments from `AppContext.state.investments`
- Calculates portfolio metrics (totalValue, totalInvested, totalROI, monthlyRentalIncome)
- Provides loading state

**Computed Values**:
```typescript
totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0)
totalROI = ((totalValue - totalInvested) / totalInvested) * 100
monthlyRentalIncome = investments.reduce((sum, inv) => sum + inv.monthlyRentalIncome, 0)
```

---

### 3.3 useProperty Hook

**Source**: `services/useProperty.ts`

**Dependencies**: `AppContext`

**What it does**:
- Fetches property by ID from `AppContext.state.properties`
- Provides loading state
- Returns property or null

---

### 3.4 useProfile Hook

**Source**: `services/useProfile.ts`

**Dependencies**: None (uses mock data currently)

**What it does**:
- Returns profile data (userInfo, settings, bankAccounts, FAQs, etc.)
- Currently returns mock data (needs backend integration)

---

### 3.5 useNotifications Hook

**Source**: `services/useNotifications.ts`

**Dependencies**: None (Expo Notifications API)

**What it does**:
- Manages notification permissions
- Sets up Android notification channels
- Gets Expo push token
- Handles Do Not Disturb scheduling
- Provides permission checking utilities

**Notification Channels**:
- `DEFAULT`: General notifications
- `INVESTMENT`: Investment updates
- `PROPERTY`: Property alerts
- `SECURITY`: Security alerts
- `MARKETING`: Marketing & offers

---

### 3.6 NotificationHelper

**Source**: `services/notificationHelper.ts`

**Dependencies**: `useNotifications`, `NotificationSettings`

**What it does**:
- Sends local notifications for app events
- Respects user notification settings
- Handles Do Not Disturb window
- Provides helper methods for common events

**Methods**:
- `investmentSuccess()` - Investment confirmation
- `depositSuccess()` - Deposit confirmation
- `withdrawalSuccess()` - Withdrawal confirmation
- `propertyMilestone()` - Property updates
- `securityAlert()` - Security alerts
- `featureAnnouncement()` - Feature announcements
- `portfolioMilestone()` - Portfolio milestones

---

## 4. User Interaction Flows

### 4.1 App Initialization Flow

```
App Launch
  │
  ├─> AuthContext.Provider mounts
  │     │
  │     ├─> Check SecureStore for token
  │     ├─> Check biometric hardware
  │     ├─> Set auth state
  │     └─> Route protection logic
  │           │
  │           ├─> If authenticated → Home
  │           └─> If not authenticated → Signin
  │
  └─> AppContext.Provider mounts
        │
        ├─> Load bookmarks from SecureStore
        ├─> Initialize state with mock data
        └─> Ready for user interactions
```

---

### 4.2 Login Flow

```
User enters email → Magic Link OTP
  │
  ├─> User receives OTP email
  ├─> User enters OTP
  │
  └─> Magic SDK validates OTP
        │
        ├─> Get DID token from Magic
        ├─> Call backend: POST /api/mobile/auth/login
        │     │
        │     ├─> Backend validates DID token
        │     ├─> Find or create user
        │     └─> Return JWT token
        │
        └─> AuthContext.signIn(token)
              │
              ├─> Store token in SecureStore
              ├─> Update auth state
              └─> Route to Home
```

---

### 4.3 Property Browsing Flow

```
User opens Home/Properties screen
  │
  ├─> Component uses AppContext.state.properties
  │     │
  │     └─> Display property list
  │
  └─> User clicks property
        │
        ├─> Navigate to /property/[id]
        ├─> useProperty(id) hook
        │     │
        │     └─> AppContext.getProperty(id)
        │           │
        │           └─> Return property from state
        │
        └─> Display property details
```

---

### 4.4 Bookmark Flow

```
User clicks bookmark icon on property
  │
  └─> AppContext.toggleBookmark(propertyId)
        │
        ├─> Check if already bookmarked
        │     │
        │     ├─> If bookmarked → Remove from array
        │     └─> If not bookmarked → Add to array
        │
        ├─> Update state.bookmarkedPropertyIds
        └─> Persist to SecureStore (BOOKMARKS_STORAGE_KEY)
              │
              └─> UI updates (icon changes)
```

---

## 5. Investment Flow

### 5.1 Complete Investment Flow Diagram

```
User clicks "Invest" on property detail screen
  │
  ├─> Check wallet balance (AppContext.state.balance.usdc)
  │     │
  │     ├─> If insufficient → Redirect to deposit screen
  │     └─> If sufficient → Continue
  │
  ├─> Open investment modal
  │     │
  │     └─> User enters amount/token count
  │
  └─> AppContext.invest(amount, propertyId, tokenCount)
        │
        ├─> VALIDATION
        │     ├─> Check balance >= amount
        │     └─> Find property in state
        │
        ├─> UPDATE PROPERTY STATE
        │     └─> property.soldTokens += tokenCount
        │
        ├─> UPDATE/CREATE INVESTMENT
        │     │
        │     ├─> Check if investment exists for property
        │     │     │
        │     │     ├─> If exists → Update existing
        │     │     │     ├─> inv.tokens += tokenCount
        │     │     │     ├─> inv.investedAmount += amount
        │     │     │     ├─> Recalculate currentValue (tokens × price × 1.15)
        │     │     │     ├─> Recalculate ROI
        │     │     │     └─> Recalculate monthlyRentalIncome
        │     │     │
        │     │     └─> If new → Create investment
        │     │           ├─> id: `inv-${Date.now()}`
        │     │           ├─> tokens: tokenCount
        │     │           ├─> investedAmount: amount
        │     │           ├─> currentValue: tokenCount × price × 1.15
        │     │           ├─> roi: ((currentValue - amount) / amount) * 100
        │     │           └─> monthlyRentalIncome: (currentValue × yield) / 12
        │
        ├─> CREATE TRANSACTION
        │     └─> Add transaction to state.transactions
        │           ├─> type: 'investment'
        │           ├─> amount: -amount
        │           ├─> propertyId: propertyId
        │           └─> status: 'completed'
        │
        ├─> UPDATE WALLET BALANCE
        │     └─> balance.usdc -= amount
        │
        ├─> UPDATE PORTFOLIO METRICS
        │     ├─> balance.totalInvested = sum of all investedAmount
        │     ├─> balance.totalEarnings = sum of (currentValue - investedAmount)
        │     └─> balance.totalValue = balance.usdc + portfolio value
        │
        └─> TRIGGER NOTIFICATIONS
              │
              ├─> NotificationHelper.investmentSuccess()
              │     ├─> Check notificationSettings.investmentUpdates
              │     ├─> Check Do Not Disturb window
              │     └─> Send local notification
              │
              └─> Check portfolio milestones
                    │
                    ├─> Calculate totalPortfolioValue
                    ├─> Check if crossed milestone ($10k, $25k, $50k, etc.)
                    └─> If crossed → NotificationHelper.portfolioMilestone()
```

### 5.2 Investment State Updates Cascade

```
Investment Created/Updated
  │
  ├─> AppContext.state.investments[] updated
  │     │
  │     ├─> usePortfolio() recalculates:
  │     │     ├─> totalValue (sum of currentValue)
  │     │     ├─> totalInvested (sum of investedAmount)
  │     │     ├─> totalROI (percentage)
  │     │     └─> monthlyRentalIncome (sum)
  │     │
  │     └─> Portfolio screen auto-updates
  │
  ├─> AppContext.state.balance updated
  │     │
  │     ├─> useWallet() reflects new balance
  │     └─> Wallet screen auto-updates
  │
  ├─> AppContext.state.properties[] updated
  │     │
  │     ├─> Property.soldTokens increased
  │     └─> Property detail screen shows updated progress
  │
  ├─> AppContext.state.transactions[] updated
  │     │
  │     └─> Transaction history shows new investment
  │
  └─> Notification sent
        │
        └─> User sees notification (if enabled)
```

### 5.3 Investment Calculation Details

**Current Value Calculation**:
```typescript
currentValue = tokensPurchased × property.tokenPrice × 1.15
// 1.15 = 15% growth estimate (hardcoded for now)
```

**ROI Calculation**:
```typescript
roi = ((currentValue - investedAmount) / investedAmount) × 100
```

**Monthly Rental Income**:
```typescript
monthlyRentalIncome = (currentValue × property.estimatedYield / 100) / 12
```

**Portfolio Total Value**:
```typescript
totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
```

---

## 6. Wallet & Deposit Flow

### 6.1 Deposit Flow

```
User clicks "Deposit" on wallet screen
  │
  ├─> Navigate to deposit method selection
  │     │
  │     └─> User selects method (Card, Binance, On-chain)
  │
  ├─> User enters amount
  │
  └─> AppContext.deposit(amount, method)
        │
        ├─> SIMULATE API DELAY (300ms)
        │
        ├─> CREATE TRANSACTION
        │     └─> Add to state.transactions
        │           ├─> id: `tx-${Date.now()}`
        │           ├─> type: 'deposit'
        │           ├─> amount: amount
        │           ├─> status: 'completed'
        │           └─> description: `Deposit via ${method}`
        │
        ├─> UPDATE WALLET BALANCE
        │     ├─> balance.usdc += amount
        │     └─> balance.totalValue += amount
        │
        └─> TRIGGER NOTIFICATION
              │
              └─> NotificationHelper.depositSuccess()
                    ├─> Check notificationSettings.paymentReminders
                    ├─> Check Do Not Disturb
                    └─> Send notification: "Deposit Successful! 💰"
```

### 6.2 Withdrawal Flow

```
User clicks "Withdraw" on wallet screen
  │
  ├─> Check balance >= amount
  │     │
  │     └─> If insufficient → Show error
  │
  ├─> User selects bank account
  │
  └─> AppContext.withdraw(amount)
        │
        ├─> VALIDATION
        │     └─> Check balance.usdc >= amount
        │
        ├─> CREATE TRANSACTION
        │     └─> Add to state.transactions
        │           ├─> type: 'withdraw'
        │           ├─> amount: -amount
        │           └─> status: 'completed'
        │
        ├─> UPDATE WALLET BALANCE
        │     ├─> balance.usdc -= amount
        │     └─> balance.totalValue -= amount
        │
        └─> TRIGGER NOTIFICATION
              │
              └─> NotificationHelper.withdrawalSuccess()
                    └─> Send notification: "Withdrawal Successful! ✅"
```

### 6.3 Wallet State Structure

```typescript
WalletBalance {
  usdc: number,              // Available balance
  totalValue: number,        // usdc + portfolio current value
  totalInvested: number,     // Sum of all investments
  totalEarnings: number,     // Sum of (currentValue - investedAmount)
  pendingDeposits: number    // Pending deposit transactions
}
```

**How totalValue is calculated**:
```typescript
// After investment:
totalValue = balance.usdc + portfolioTotalValue

// Portfolio total value:
portfolioTotalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
```

---

## 7. State Update Cascades

### 7.1 Investment → Multiple State Updates

```
User invests $2,500 in Property A
  │
  ├─> AppContext.invest() called
  │     │
  │     ├─> UPDATE: state.investments[]
  │     │     │
  │     │     └─> Triggers: usePortfolio() recalculation
  │     │           ├─> totalValue changes
  │     │           ├─> totalInvested changes
  │     │           ├─> totalROI changes
  │     │           └─> monthlyRentalIncome changes
  │     │
  │     ├─> UPDATE: state.balance
  │     │     │
  │     │     ├─> usdc decreases by $2,500
  │     │     ├─> totalInvested increases
  │     │     ├─> totalEarnings recalculated
  │     │     └─> totalValue recalculated
  │     │           │
  │     │           └─> Triggers: useWallet() update
  │     │
  │     ├─> UPDATE: state.properties[]
  │     │     │
  │     │     └─> Property A: soldTokens increases
  │     │           │
  │     │           └─> Property detail screen shows updated progress
  │     │
  │     ├─> UPDATE: state.transactions[]
  │     │     │
  │     │     └─> New investment transaction added
  │     │           │
  │     │           └─> Transaction history updates
  │     │
  │     └─> TRIGGER: Notifications
  │           │
  │           ├─> Investment success notification
  │           └─> Portfolio milestone check
  │
  └─> UI UPDATES (Automatic via React)
        ├─> Portfolio screen re-renders
        ├─> Wallet screen re-renders
        ├─> Property detail screen re-renders
        └─> Transaction history re-renders
```

### 7.2 Deposit → Wallet & Transaction Updates

```
User deposits $5,000
  │
  ├─> AppContext.deposit() called
  │     │
  │     ├─> UPDATE: state.balance
  │     │     ├─> usdc += $5,000
  │     │     └─> totalValue += $5,000
  │     │           │
  │     │           └─> Triggers: useWallet() update
  │     │
  │     ├─> UPDATE: state.transactions[]
  │     │     └─> New deposit transaction added
  │     │
  │     └─> TRIGGER: Notification
  │           └─> Deposit success notification
  │
  └─> UI UPDATES
        ├─> Wallet screen shows new balance
        └─> Transaction history shows deposit
```

### 7.3 Bookmark → Local Storage Update

```
User toggles bookmark
  │
  ├─> AppContext.toggleBookmark() called
  │     │
  │     ├─> UPDATE: state.bookmarkedPropertyIds[]
  │     │     │
  │     │     └─> Add or remove property ID
  │     │
  │     └─> PERSIST: SecureStore
  │           └─> Save to BOOKMARKS_STORAGE_KEY
  │
  └─> UI UPDATES
        └─> Bookmark icon changes state
```

---

## 8. Notification System

### 8.1 Notification Flow Architecture

```
Event Occurs (Investment, Deposit, etc.)
  │
  ├─> AppContext action completes
  │     │
  │     └─> NotificationHelper method called
  │           │
  │           ├─> Check notificationSettings
  │           │     │
  │           │     ├─> Check if notification type enabled
  │           │     ├─> Check Do Not Disturb window
  │           │     └─> Check if should show
  │           │
  │           ├─> sendLocalNotification()
  │           │     │
  │           │     ├─> Check permissions
  │           │     ├─> Check DND window
  │           │     ├─> Determine sound (respect DND)
  │           │     └─> Schedule notification
  │           │
  │           └─> Notification appears
```

### 8.2 Notification Types & Triggers

| Event | Trigger | Notification Type | Settings Check |
|-------|---------|-------------------|----------------|
| **Investment Success** | `AppContext.invest()` | `investmentUpdates` | `notificationSettings.investmentUpdates` |
| **Deposit Success** | `AppContext.deposit()` | `paymentReminders` | `notificationSettings.paymentReminders` |
| **Withdrawal Success** | `AppContext.withdraw()` | `paymentReminders` | `notificationSettings.paymentReminders` |
| **Portfolio Milestone** | `AppContext.invest()` (milestone check) | `portfolioMilestones` | `notificationSettings.portfolioMilestones` |
| **Property Milestone** | Property funding update | `propertyAlerts` | `notificationSettings.propertyAlerts` |
| **Security Alert** | Security event | `securityAlerts` | Always shown (bypasses DND) |
| **Feature Announcement** | App update | `marketingOffers` | `notificationSettings.marketingOffers` |

### 8.3 Do Not Disturb Logic

```typescript
DND Window: 10 PM - 8 AM

Check Flow:
  1. Is notification type enabled? → No → Don't show
  2. Is DND enabled? → Yes
  3. Is current time in DND window? → Yes
  4. Is notification type 'securityAlerts'? → No → Don't show
  5. Otherwise → Show (but silent)
```

### 8.4 Notification Channels (Android)

- **DEFAULT**: General notifications (importance: DEFAULT)
- **INVESTMENT**: Investment updates (importance: HIGH)
- **PROPERTY**: Property alerts (importance: HIGH)
- **SECURITY**: Security alerts (importance: MAX)
- **MARKETING**: Marketing & offers (importance: LOW)

---

## 9. Data Synchronization

### 9.1 Current State (Mock Data)

**Current Implementation**:
- All data is stored in `AppContext` state (in-memory)
- Bookmarks persisted to SecureStore
- Auth tokens persisted to SecureStore
- **No backend synchronization yet**

**Data Sources**:
- `mockProperties` - Property data
- `mockWallet` - Initial balance & transactions
- `mockPortfolio` - Initial investments
- `mockProfile` - User profile data

### 9.2 Future Backend Integration Flow

```
User Action → AppContext Update → API Call → Backend → WebSocket Event → State Update
```

**Example: Investment with Backend**

```
User invests
  │
  ├─> AppContext.invest() (optimistic update)
  │     │
  │     └─> Update local state immediately
  │
  ├─> API Call: POST /api/mobile/investments
  │     │
  │     ├─> Backend validates
  │     ├─> Creates investment record
  │     ├─> Updates wallet balance
  │     ├─> Updates property tokens
  │     └─> Emits WebSocket events
  │
  ├─> WebSocket Events Received
  │     │
  │     ├─> 'investment:created' → Update investment
  │     ├─> 'wallet:balance_updated' → Update balance
  │     └─> 'property:funding_updated' → Update property
  │
  └─> State Sync Complete
```

### 9.3 WebSocket Event Flow (Future)

```
Backend Event Emitted
  │
  ├─> WebSocket Gateway broadcasts
  │     │
  │     ├─> To user room: 'user:{userId}'
  │     └─> To property room: 'property:{propertyId}'
  │
  ├─> Socket Service receives event
  │     │
  │     └─> Update AppContext state
  │           │
  │           ├─> Update balance
  │           ├─> Update investments
  │           ├─> Update properties
  │           └─> Trigger notifications
  │
  └─> UI Auto-updates via React
```

### 9.4 Data Refresh Strategy

**On App Launch**:
```
App Launch
  │
  ├─> AuthContext checks token
  │
  └─> If authenticated:
        │
        ├─> API: GET /api/mobile/wallet
        ├─> API: GET /api/mobile/investments
        ├─> API: GET /api/mobile/portfolio/summary
        ├─> API: GET /api/mobile/properties
        └─> Update AppContext state
```

**On Screen Focus**:
```
Screen Focus
  │
  └─> Refresh relevant data
        │
        ├─> Portfolio screen → Refresh investments
        ├─> Wallet screen → Refresh balance
        └─> Property screen → Refresh property details
```

---

## 10. Complete User Journey Examples

### 10.1 First Investment Journey

```
1. User opens app
   └─> AuthContext checks auth → Authenticated → Home screen

2. User browses properties
   └─> AppContext.state.properties displayed

3. User clicks property
   └─> Navigate to /property/[id]
       └─> useProperty(id) → AppContext.getProperty(id)

4. User clicks "Invest"
   └─> Check balance (useWallet → AppContext.state.balance)
       ├─> If insufficient → Redirect to deposit
       └─> If sufficient → Open investment modal

5. User enters amount
   └─> AppContext.invest(amount, propertyId, tokenCount)
       │
       ├─> Update state.investments
       ├─> Update state.balance
       ├─> Update state.properties
       ├─> Update state.transactions
       └─> NotificationHelper.investmentSuccess()

6. UI Updates
   └─> Portfolio screen shows new investment
   └─> Wallet screen shows updated balance
   └─> Property screen shows updated progress
   └─> Notification appears
```

### 10.2 Deposit & Invest Journey

```
1. User wants to invest but has insufficient balance
   └─> Redirected to deposit screen

2. User selects deposit method
   └─> Navigate to deposit method screen

3. User enters amount
   └─> AppContext.deposit(amount, method)
       │
       ├─> Update state.balance
       ├─> Update state.transactions
       └─> NotificationHelper.depositSuccess()

4. User returns to property
   └─> Balance now sufficient

5. User invests
   └─> AppContext.invest() → Success
```

### 10.3 Portfolio View Journey

```
1. User navigates to Portfolio tab
   └─> usePortfolio() hook
       │
       └─> Reads AppContext.state.investments
           │
           ├─> Calculates totalValue
           ├─> Calculates totalInvested
           ├─> Calculates totalROI
           └─> Calculates monthlyRentalIncome

2. User clicks investment
   └─> Navigate to /portfolio/ownproperty/propertydetails?id={propertyId}
       │
       └─> usePortfolio() → Find investment by property.id
           │
           └─> Display investment details
               ├─> Ownership details
               ├─> Income & returns
               ├─> Property performance
               └─> Transaction history
```

---

## 11. Key Interactions Summary

### 11.1 Context Dependencies

```
AuthContext (Independent)
  └─> Provides: isAuthenticated, token

AppContext (Depends on AuthContext)
  └─> Provides: All app state (wallet, portfolio, properties, profile)

GuidanceContext (Independent)
  └─> Provides: Investment plan state
```

### 11.2 Service Dependencies

```
useWallet → AppContext (reads balance, calls deposit/withdraw)
usePortfolio → AppContext (reads investments, calculates metrics)
useProperty → AppContext (reads properties)
useProfile → Mock data (needs backend integration)
useNotifications → Expo Notifications API (independent)
NotificationHelper → useNotifications, NotificationSettings
```

### 11.3 State Update Chain

```
User Action
  │
  ├─> AppContext method called
  │     │
  │     ├─> State updated
  │     │     │
  │     │     └─> React re-renders components
  │     │
  │     └─> Notification triggered
  │           │
  │           └─> NotificationHelper sends notification
  │
  └─> UI updates automatically
```

### 11.4 Data Flow Direction

```
User Input → Context Action → State Update → Service Hook → Component Re-render
```

**Example**:
```
User clicks Invest
  → AppContext.invest()
  → state.investments updated
  → usePortfolio() recalculates
  → Portfolio component re-renders
```

---

## 12. Integration Points for Backend

### 12.1 Current Gaps

1. **No API Calls**: All data is mock/local state
2. **No WebSocket**: No real-time updates
3. **No Persistence**: Only bookmarks and auth tokens persisted
4. **No Sync**: State doesn't sync with backend

### 12.2 Required Integration Points

#### AppContext.invest()
```typescript
// Current: Local state update only
// Future: 
1. Optimistic update (local state)
2. API: POST /api/mobile/investments
3. On success: Confirm state
4. On error: Revert optimistic update
5. Listen for WebSocket: 'investment:created'
```

#### AppContext.deposit()
```typescript
// Current: Local state update only
// Future:
1. API: POST /api/mobile/wallet/deposit
2. Wait for payment processing
3. Listen for WebSocket: 'wallet:balance_updated'
4. Update state from WebSocket event
```

#### AppContext State Initialization
```typescript
// Current: Mock data
// Future:
1. On mount: Fetch from backend
   - GET /api/mobile/wallet
   - GET /api/mobile/investments
   - GET /api/mobile/portfolio/summary
   - GET /api/mobile/properties
2. Update state with real data
```

#### WebSocket Integration
```typescript
// Future:
1. Connect on app launch (if authenticated)
2. Join user room: 'user:{userId}'
3. Subscribe to property rooms as needed
4. Listen for events:
   - 'wallet:balance_updated' → Update balance
   - 'investment:created' → Add investment
   - 'reward:distributed' → Update portfolio
   - 'property:funding_updated' → Update property
   - 'notification:new' → Show notification
```

---

## Summary

### Key Takeaways

1. **AppContext is the Central State**: All app data flows through AppContext
2. **Service Hooks are Thin Wrappers**: They read from AppContext and provide computed values
3. **State Updates Cascade**: One action (e.g., invest) updates multiple state slices
4. **Notifications are Event-Driven**: Triggered after state updates
5. **Current Implementation is Local**: No backend sync yet (mock data)
6. **Future Integration**: WebSocket + API calls will sync state with backend

### Data Flow Pattern

```
User Action
  ↓
AppContext Method
  ↓
State Update (Multiple slices)
  ↓
Service Hooks Recalculate
  ↓
Components Re-render
  ↓
Notifications Triggered
```

This architecture provides a clean separation of concerns and makes it easy to integrate with the backend when ready.

---

## Cross-Reference

- **Backend Integration**: See `blocks-app-integration/API_MAPPING.md`
- **Real-time Updates**: See `blocks-app-integration/REALTIME_ARCHITECTURE.md`
- **API Endpoints**: See `blocks-app-integration/MOBILE_APP_ENDPOINTS.md`
- **Implementation Plan**: See `blocks-app-integration/API_IMPLEMENTATION_PLAN.md`

