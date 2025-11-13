# Quick Cursor Prompt for Blocks Mobile App Backend Integration

Copy this entire prompt into Cursor:

---

**I need to integrate the NestJS backend API with my Blocks mobile app. The app currently uses mock data in AppContext. I want to replace mock data with real API calls WITHOUT changing the app structure, flow, or user experience.**

## Current State
- AppContext stores mock data in-memory
- Service hooks (useWallet, usePortfolio, etc.) read from AppContext
- User interactions update AppContext state locally
- No backend integration yet

## Goal
Replace mock data with API calls while maintaining:
- ✅ Same component structure
- ✅ Same user flow  
- ✅ Same state management pattern
- ✅ Same service hooks interface
- ✅ Optimistic updates for better UX

## Backend API
- Base URL: `http://localhost:3000` (dev) or env variable
- All endpoints: `/api/mobile/*`
- Auth: JWT token in `Authorization: Bearer <token>` header
- Token stored in SecureStore with key `TOKEN_KEY` (already implemented)

## Implementation Steps

### Step 1: Create API Service Layer
**Location**: Create `services/api/` directory

Create these files:
1. `services/api/apiClient.ts` - Base API client with auth headers
2. `services/api/wallet.api.ts` - Wallet endpoints
3. `services/api/investments.api.ts` - Investments endpoints  
4. `services/api/properties.api.ts` - Properties endpoints
5. `services/api/transactions.api.ts` - Transactions endpoints
6. `services/api/profile.api.ts` - Profile endpoints

**Reference**: See `MOBILE_APP_INTEGRATION_PROMPT.md` for complete code examples.

### Step 2: Update AppContext
**Location**: `contexts/AppContext.tsx`

**Changes**:
- Import API services
- Add `fetchAllData()` function to load data from backend
- Call `fetchAllData()` on mount (when authenticated)
- Update `invest()`, `deposit()`, etc. to call APIs after optimistic updates
- Add `refreshData()` function for pull-to-refresh

**Important**: Keep existing state structure and optimistic updates!

### Step 3: Update AuthContext (if needed)
**Location**: `contexts/AuthContext.tsx`

Ensure login/register call backend:
- `POST /api/mobile/auth/login` with `{ email, password }`
- `POST /api/mobile/auth/register` with `{ email, password, fullName, phone? }`
- Store token from response in SecureStore

### Step 4: Add Pull-to-Refresh
**Location**: All data screens (Home, Portfolio, Wallet, etc.)

Add RefreshControl to ScrollView/FlatList components.

## Key Points

1. **Field Names**: Backend already returns fields in mobile app format (tokens, investedAmount, currentValue, etc.) - NO mapping needed!

2. **Calculations**: Backend calculations match mobile app (15% growth, ROI, monthlyRentalIncome) - use backend values directly!

3. **Transaction Amounts**: Investment transactions are negative, deposits positive - backend handles this correctly.

4. **Optimistic Updates**: Keep existing optimistic update pattern, then sync with backend response.

5. **Error Handling**: Handle network errors, auth errors (401 → redirect to login), validation errors (400 → show message).

## Authentication Integration

**CRITICAL**: Authentication must be integrated first!

1. **Create `services/api/auth.api.ts`** with login, register, refresh, logout, getMe methods
2. **Update `AuthContext`** to call `authApi.login()` and `authApi.register()` instead of mock
3. **Store tokens**: Save `token` and `refreshToken` from API response to SecureStore
4. **Auth header**: `apiClient` automatically adds `Authorization: Bearer <token>` to ALL requests
5. **Token refresh**: Handle 401 errors and refresh tokens when expired

**The `apiClient` automatically includes auth headers - no manual header management needed!**

## API Endpoints Reference

**Authentication**:
- `POST /api/mobile/auth/login` → Body: `{ email, password }` → Returns: `{ user, token, refreshToken }`
- `POST /api/mobile/auth/register` → Body: `{ email, password, fullName, phone? }` → Returns: `{ user, token, refreshToken }`
- `POST /api/mobile/auth/refresh` → Body: `{ refreshToken }` → Returns: `{ token, refreshToken }`
- `POST /api/mobile/auth/logout` → Returns: `{ message }`
- `GET /api/mobile/auth/me` → Returns: `{ user }`

**Other Endpoints**:
- `GET /api/mobile/wallet` → Returns: `{ usdc, totalValue, totalInvested, totalEarnings, pendingDeposits }`
- `GET /api/mobile/investments` → Returns: `{ investments: [...] }`
- `POST /api/mobile/investments` → Body: `{ propertyId, tokenCount }`
- `GET /api/mobile/properties` → Query params: `?page=1&limit=20&city=...&status=...`
- `GET /api/mobile/properties/:id` → Returns single property
- `GET /api/mobile/transactions` → Query params: `?page=1&limit=20&type=...&status=...`
- `GET /api/mobile/profile` → Returns: `{ userInfo, securitySettings, notificationSettings }`
- `PATCH /api/mobile/profile` → Body: `{ fullName?, email?, phone?, ... }`

## Documentation References
- Full integration guide: `MOBILE_APP_INTEGRATION_PROMPT.md`
- Backend API docs: `blocks-app-integration/MOBILE_APP_ENDPOINTS.md`
- Current app flow: `APP_FLOW_DOCUMENTATION.md`
- Backend alignment: `MOBILE_APP_BACKEND_ALIGNMENT.md`

## MCP Tools Available
If stuck, use:
- `mcp_Blocks-Backend_Docs_search_Blocks_Backend_docs` to search docs
- `mcp_Blocks-Backend_Docs_fetch_Blocks_Backend_docs` to fetch full docs

## Success Criteria
✅ App loads real data from backend on startup
✅ All user interactions work (invest, deposit, etc.)
✅ Data syncs correctly after actions
✅ Error handling works
✅ Loading states work
✅ Pull-to-refresh works
✅ No breaking changes to existing code

**Start with Step 1 (API Client) and work sequentially. Test after each step.**

---

