# Mobile App Backend Integration Prompt for Cursor Agent

## Context

You are working on the Blocks mobile app (React Native/Expo). The app currently uses **mock data** stored in `AppContext` state. We need to **replace the mock data with real API calls** to the NestJS backend without disturbing the existing app structure, flow, or user experience.

## Current State

- **AppContext** stores all data in-memory (mock data)
- **Service hooks** (useWallet, usePortfolio, etc.) read from AppContext
- **User interactions** update AppContext state locally
- **No backend integration** - everything is local/mock

## Goal

Replace mock data with API calls while maintaining:
- ✅ Same component structure
- ✅ Same user flow
- ✅ Same state management pattern
- ✅ Same service hooks interface
- ✅ Optimistic updates for better UX

## Backend API Base URL

```
Development: http://localhost:3000

```

All endpoints are under `/api/mobile/*` namespace.

## Authentication

- **JWT Token**: Store in SecureStore (already implemented in AuthContext)
- **Header**: `Authorization: Bearer <token>`
- **Token Key**: Use existing `TOKEN_KEY` from AuthContext

## Integration Strategy

### Phase 1: Create API Service Layer (NEW)

**Location**: Create `services/api/` directory

**Purpose**: Centralized API client that wraps all backend calls

**Files to Create**:

1. **`services/api/apiClient.ts`** - Base API client with auth headers
2. **`services/api/auth.api.ts`** - Authentication endpoints
3. **`services/api/properties.api.ts`** - Properties endpoints
4. **`services/api/investments.api.ts`** - Investments endpoints
5. **`services/api/wallet.api.ts`** - Wallet endpoints
6. **`services/api/transactions.api.ts`** - Transactions endpoints
7. **`services/api/profile.api.ts`** - Profile endpoints

### Phase 2: Update AppContext (MODIFY)

**Location**: `contexts/AppContext.tsx`

**Changes**:
- Keep existing state structure (DO NOT CHANGE)
- Add API calls on mount/refresh
- Keep optimistic updates for user actions
- Sync with backend after optimistic updates

### Phase 3: Update Service Hooks (MINIMAL CHANGES)

**Location**: `services/useWallet.ts`, `services/usePortfolio.ts`, etc.

**Changes**:
- Keep existing interface (DO NOT CHANGE)
- Hooks should still read from AppContext
- AppContext will now have real data instead of mock

## Detailed Implementation Guide

### Step 1: Create API Client Base

**File**: `services/api/apiClient.ts`

```typescript
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Get token from SecureStore (same key used by AuthContext)
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Automatically add Authorization header if token exists
    // This ensures ALL API requests include the auth token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      try {
        await SecureStore.deleteItemAsync('TOKEN_KEY');
      } catch (error) {
        console.error('Error clearing token:', error);
      }
      
      // You might want to emit an event or call a callback here
      // to trigger re-authentication in the app
      throw new Error('Authentication required. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
```

### Step 2: Create API Service Files

**File**: `services/api/auth.api.ts`

```typescript
import { apiClient } from './apiClient';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    displayCode: string;
    email: string;
    fullName: string;
    phone?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/api/mobile/auth/login', dto);
  },

  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/api/mobile/auth/register', dto);
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    return apiClient.post<{ token: string; refreshToken: string }>('/api/mobile/auth/refresh', {
      refreshToken,
    });
  },

  logout: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/api/mobile/auth/logout');
  },

  getMe: async (): Promise<AuthResponse['user']> => {
    return apiClient.get<AuthResponse['user']>('/api/mobile/auth/me');
  },
};
```

**File**: `services/api/wallet.api.ts`

```typescript
import { apiClient } from './apiClient';

export interface WalletResponse {
  usdc: number;
  totalValue: number;
  totalInvested: number;
  totalEarnings: number;
  pendingDeposits: number;
}

export const walletApi = {
  getWallet: async (): Promise<WalletResponse> => {
    return apiClient.get<WalletResponse>('/api/mobile/wallet');
  },
};
```

**File**: `services/api/investments.api.ts`

```typescript
import { apiClient } from './apiClient';

export interface Investment {
  id: string;
  displayCode: string;
  property: {
    id: string;
    displayCode: string;
    title: string;
    images: string[];
    tokenPrice: number;
    status: string;
    city: string;
    country: string;
  } | null;
  tokens: number;
  investedAmount: number;
  currentValue: number;
  roi: number;
  rentalYield: number;
  monthlyRentalIncome: number;
  status: string;
  paymentStatus: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvestmentDto {
  propertyId: string;
  tokenCount: number;
}

export const investmentsApi = {
  getInvestments: async (): Promise<{ investments: Investment[] }> => {
    return apiClient.get<{ investments: Investment[] }>('/api/mobile/investments');
  },

  getInvestment: async (id: string): Promise<Investment> => {
    return apiClient.get<Investment>(`/api/mobile/investments/${id}`);
  },

  createInvestment: async (dto: CreateInvestmentDto): Promise<Investment> => {
    return apiClient.post<Investment>('/api/mobile/investments', dto);
  },
};
```

**File**: `services/api/properties.api.ts`

```typescript
import { apiClient } from './apiClient';

export interface Property {
  id: string;
  displayCode: string;
  title: string;
  location: string | null;
  city: string;
  country: string;
  valuation: number;
  tokenPrice: number;
  minInvestment: number;
  totalTokens: number;
  soldTokens: number;
  availableTokens: number;
  estimatedROI: number;
  estimatedYield: number;
  completionDate: string | null;
  status: string;
  images: string[];
  description: string;
  amenities: string[];
  builder: {
    id: string | null;
    name: string | null;
    logo: string | null;
    rating: number;
    projectsCompleted: number;
  };
  features: string[];
  type: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFilterDto {
  page?: number;
  limit?: number;
  city?: string;
  status?: string;
  minROI?: number;
  maxPricePerToken?: number;
  search?: string;
  filter?: 'Trending' | 'High Yield' | 'New Listings' | 'Completed';
}

export interface PaginatedPropertiesResponse {
  data: Property[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const propertiesApi = {
  getProperties: async (filters?: PropertyFilterDto): Promise<PaginatedPropertiesResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return apiClient.get<PaginatedPropertiesResponse>(
      `/api/mobile/properties${queryString ? `?${queryString}` : ''}`
    );
  },

  getProperty: async (id: string): Promise<Property> => {
    return apiClient.get<Property>(`/api/mobile/properties/${id}`);
  },
};
```

**File**: `services/api/transactions.api.ts`

```typescript
import { apiClient } from './apiClient';

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  status: string;
  currency: string;
  propertyId: string | null;
  propertyTitle: string | null;
  transactionHash: string;
}

export interface TransactionFilterDto {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  propertyId?: string;
}

export interface PaginatedTransactionsResponse {
  data: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const transactionsApi = {
  getTransactions: async (filters?: TransactionFilterDto): Promise<PaginatedTransactionsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return apiClient.get<PaginatedTransactionsResponse>(
      `/api/mobile/transactions${queryString ? `?${queryString}` : ''}`
    );
  },
};
```

**File**: `services/api/profile.api.ts`

```typescript
import { apiClient } from './apiClient';

export interface ProfileResponse {
  userInfo: any; // User object
  securitySettings: any;
  notificationSettings: any;
}

export interface UpdateProfileDto {
  fullName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  address?: string;
  profileImage?: string;
}

export const profileApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get<ProfileResponse>('/api/mobile/profile');
  },

  updateProfile: async (dto: UpdateProfileDto): Promise<ProfileResponse> => {
    return apiClient.patch<ProfileResponse>('/api/mobile/profile', dto);
  },
};
```

### Step 3: Update AppContext

**File**: `contexts/AppContext.tsx`

**Key Changes**:

1. **Add API imports at top**:
```typescript
import { walletApi } from '../services/api/wallet.api';
import { investmentsApi } from '../services/api/investments.api';
import { propertiesApi } from '../services/api/properties.api';
import { transactionsApi } from '../services/api/transactions.api';
import { profileApi } from '../services/api/profile.api';
```

2. **Add loading states** (if not already present):
```typescript
const [isLoading, setIsLoading] = useState(false);
const [isRefreshing, setIsRefreshing] = useState(false);
```

3. **Add data fetching function**:
```typescript
const fetchAllData = async () => {
  try {
    setIsLoading(true);
    
    // Fetch all data in parallel
    const [walletData, investmentsData, propertiesData, transactionsData, profileData] = await Promise.all([
      walletApi.getWallet(),
      investmentsApi.getInvestments(),
      propertiesApi.getProperties({ limit: 100 }), // Adjust limit as needed
      transactionsApi.getTransactions({ limit: 100 }),
      profileApi.getProfile(),
    ]);

    // Update state with real data
    setState(prev => ({
      ...prev,
      balance: {
        usdc: walletData.usdc,
        totalValue: walletData.totalValue,
        totalInvested: walletData.totalInvested,
        totalEarnings: walletData.totalEarnings,
        pendingDeposits: walletData.pendingDeposits,
      },
      investments: investmentsData.investments,
      properties: propertiesData.data,
      transactions: transactionsData.data,
      userInfo: profileData.userInfo,
      securitySettings: profileData.securitySettings,
      notificationSettings: profileData.notificationSettings,
    }));
  } catch (error) {
    console.error('Error fetching data:', error);
    // Handle error (show toast, etc.)
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
};
```

4. **Call fetchAllData on mount** (in useEffect):
```typescript
useEffect(() => {
  // Only fetch if authenticated
  if (isAuthenticated) { // Get from AuthContext
    fetchAllData();
  }
}, [isAuthenticated]);
```

5. **Update invest() method** - Add optimistic update + API call:
```typescript
const invest = async (amount: number, propertyId: string, tokenCount: number) => {
  // OPTIMISTIC UPDATE (keep existing logic)
  // ... existing optimistic update code ...

  try {
    // API CALL
    const investment = await investmentsApi.createInvestment({
      propertyId,
      tokenCount,
    });

    // SYNC WITH BACKEND RESPONSE
    setState(prev => ({
      ...prev,
      investments: [...prev.investments, investment],
      // Update balance, transactions, etc. from backend response
    }));

    // Refresh wallet to get updated balance
    const walletData = await walletApi.getWallet();
    setState(prev => ({
      ...prev,
      balance: {
        usdc: walletData.usdc,
        totalValue: walletData.totalValue,
        totalInvested: walletData.totalInvested,
        totalEarnings: walletData.totalEarnings,
        pendingDeposits: walletData.pendingDeposits,
      },
    }));
  } catch (error) {
    // REVERT OPTIMISTIC UPDATE on error
    // ... revert logic ...
    console.error('Investment failed:', error);
    throw error;
  }
};
```

6. **Add refresh function**:
```typescript
const refreshData = async () => {
  setIsRefreshing(true);
  await fetchAllData();
};
```

### Step 4: Update AuthContext (REQUIRED)

**File**: `contexts/AuthContext.tsx`

**Complete AuthContext update to use backend API**:

1. **Import auth API**:
```typescript
import { authApi, LoginDto, RegisterDto } from '../services/api/auth.api';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'TOKEN_KEY'; // Or use your existing constant
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN_KEY'; // For refresh token
```

2. **Update signIn method**:
```typescript
const signIn = async (email: string, password: string, enableBiometrics?: boolean) => {
  try {
    setIsLoading(true);
    
    // Call backend login API
    const response = await authApi.login({ email, password });
    
    // Store tokens in SecureStore
    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
    
    // Update auth state
    setToken(response.token);
    setIsAuthenticated(true);
    
    // Handle biometrics if enabled
    if (enableBiometrics) {
      // Your existing biometric logic
      await enableBiometrics();
    }
    
    return response.user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

3. **Update register method** (if you have one):
```typescript
const register = async (email: string, password: string, fullName: string, phone?: string) => {
  try {
    setIsLoading(true);
    
    // Call backend register API
    const response = await authApi.register({ email, password, fullName, phone });
    
    // Store tokens in SecureStore
    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
    
    // Update auth state
    setToken(response.token);
    setIsAuthenticated(true);
    
    return response.user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Registration failed');
  } finally {
    setIsLoading(false);
  }
};
```

4. **Update signOut method**:
```typescript
const signOut = async () => {
  try {
    // Call backend logout API (optional - for token blacklisting)
    try {
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    }
    
    // Clear tokens from SecureStore
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    
    // Clear biometric token if exists
    await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
    
    // Reset auth state
    setToken(null);
    setIsAuthenticated(false);
  } catch (error) {
    console.error('Sign out error:', error);
    // Still reset state even if SecureStore fails
    setToken(null);
    setIsAuthenticated(false);
  }
};
```

5. **Add token refresh logic** (for handling expired tokens):
```typescript
const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return false;
    }
    
    const response = await authApi.refreshToken(refreshToken);
    
    // Update tokens
    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
    setToken(response.token);
    
    return true;
  } catch (error) {
    console.error('Token refresh error:', error);
    // Refresh failed - sign out user
    await signOut();
    return false;
  }
};
```

6. **Update initialization to check for existing token**:
```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        // Verify token is still valid by calling /me endpoint
        try {
          const user = await authApi.getMe();
          setToken(token);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid - try refresh
          const refreshed = await refreshAuthToken();
          if (!refreshed) {
            // Refresh failed - clear auth
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          }
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  checkAuth();
}, []);
```

**Important**: The `apiClient` automatically adds the `Authorization: Bearer <token>` header to all requests by reading from SecureStore. No need to manually add headers in each API call!

### Step 5: Add Pull-to-Refresh

**Location**: Screens that display data (Home, Portfolio, Wallet, etc.)

**Add refresh functionality**:

```typescript
import { useAppContext } from '../contexts/AppContext';

const { refreshData, isRefreshing } = useAppContext();

// In your screen component
<ScrollView
  refreshControl={
    <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
  }
>
  {/* Your content */}
</ScrollView>
```

## Important Notes

### 1. Field Name Mapping

The backend already returns fields in the format the mobile app expects:
- ✅ `tokens` (not `tokensPurchased`)
- ✅ `investedAmount` (not `amountUSDT`)
- ✅ `currentValue` (computed with 15% growth)
- ✅ `monthlyRentalIncome` (computed correctly)
- ✅ `purchaseDate` (not `createdAt`)

**No field mapping needed** - backend already matches mobile app format!

### 2. Calculation Alignment

Backend calculations match mobile app:
- ✅ `currentValue = tokens × price × 1.15` (15% growth)
- ✅ `roi = ((currentValue - investedAmount) / investedAmount) × 100`
- ✅ `monthlyRentalIncome = (currentValue × yield / 100) / 12`
- ✅ `totalEarnings = sum(currentValue - investedAmount)`

**No recalculation needed** - use backend values directly!

### 3. Transaction Amount Signs

- ✅ Investment transactions: **negative** amounts
- ✅ Deposit transactions: **positive** amounts
- ✅ Withdrawal transactions: **negative** amounts

Backend already handles this correctly.

### 4. Error Handling

Add error handling for:
- Network errors
- Authentication errors (401) → redirect to login
- Validation errors (400) → show error message
- Server errors (500) → show generic error

### 5. Loading States

- Show loading indicators during initial fetch
- Show refresh indicators during pull-to-refresh
- Keep optimistic updates for better UX

## Testing Checklist

After integration, test:

- [ ] **Authentication**:
  - [ ] Login with email/password works
  - [ ] Register creates new user
  - [ ] Token stored in SecureStore
  - [ ] Auth header automatically added to all requests
  - [ ] Token refresh works when expired
  - [ ] Logout clears tokens
- [ ] App loads data from backend on startup (only if authenticated)
- [ ] Login/Register works with backend
- [ ] Properties list loads from backend
- [ ] Property details load from backend
- [ ] Investment creation works (optimistic + sync)
- [ ] Wallet balance updates after investment
- [ ] Transactions list loads from backend
- [ ] Portfolio calculations match backend
- [ ] Pull-to-refresh works on all screens
- [ ] Error handling works (network errors, auth errors)
- [ ] Offline handling (graceful degradation)

## Environment Configuration

**File**: `app.json` or `app.config.js`

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3000"
    }
  }
}
```

For production, use environment variables or build-time configuration.

## Documentation References

- **Backend API Docs**: See `blocks-app-integration/MOBILE_APP_ENDPOINTS.md`
- **Current App Flow**: See `APP_FLOW_DOCUMENTATION.md`
- **Backend Alignment**: See `MOBILE_APP_BACKEND_ALIGNMENT.md` (in backend repo)

## MCP Tools Available

If you need to check Blocks-App documentation:
- Use `mcp_Blocks-Backend_Docs_search_Blocks_Backend_docs` to search docs
- Use `mcp_Blocks-Backend_Docs_fetch_Blocks_Backend_docs` to fetch full docs

## Final Reminders

1. **DO NOT** change component structure
2. **DO NOT** change service hook interfaces
3. **DO NOT** change user flow
4. **DO** keep optimistic updates for better UX
5. **DO** handle errors gracefully
6. **DO** maintain loading states
7. **DO** test thoroughly before committing

## Success Criteria

✅ App loads real data from backend  
✅ All user interactions work (invest, deposit, etc.)  
✅ Data syncs correctly after actions  
✅ Error handling works  
✅ Loading states work  
✅ Pull-to-refresh works  
✅ No breaking changes to existing code  

---

**Start with Step 1 (API Client) and work through each step sequentially. Test after each step before moving to the next.**

