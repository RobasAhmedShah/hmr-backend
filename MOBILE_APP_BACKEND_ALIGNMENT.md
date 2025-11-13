# Mobile App & Backend Alignment Verification

## Overview

This document verifies that the backend API responses match what the mobile app expects based on `APP_FLOW_DOCUMENTATION.md`.

---

## ✅ Investment Calculations - ALIGNED

### Current Value Calculation

**Mobile App Expects** (from APP_FLOW_DOCUMENTATION.md line 508):
```typescript
currentValue = tokensPurchased × property.tokenPrice × 1.15
// 1.15 = 15% growth estimate (hardcoded for now)
```

**Backend Implementation** (`src/mobile-investments/mobile-investments.service.ts`):
```typescript
const baseValue = investment.tokensPurchased.mul(
  investment.property?.pricePerTokenUSDT || new Decimal(0),
);
const currentValue = baseValue.mul(1.15); // Apply 15% growth multiplier ✅
```

**Status**: ✅ **ALIGNED**

---

### ROI Calculation

**Mobile App Expects** (line 514):
```typescript
roi = ((currentValue - investedAmount) / investedAmount) × 100
```

**Backend Implementation**:
```typescript
const roiDecimal = investedAmount.gt(0)
  ? currentValue.minus(investedAmount).div(investedAmount).mul(100)
  : new Decimal(0);
```

**Status**: ✅ **ALIGNED**

---

### Monthly Rental Income Calculation

**Mobile App Expects** (line 519):
```typescript
monthlyRentalIncome = (currentValue × property.estimatedYield / 100) / 12
```

**Backend Implementation**:
```typescript
const annualIncome = currentValue.mul(rentalYield).div(100);
const monthlyRentalIncome = annualIncome.div(12);
```

**Status**: ✅ **ALIGNED**

---

## ✅ Investment Response Fields - ALIGNED

**Mobile App Expects** (from investment flow):
- `tokens` ✅
- `investedAmount` ✅
- `currentValue` ✅
- `roi` ✅
- `monthlyRentalIncome` ✅
- `purchaseDate` ✅
- `property` (nested object) ✅

**Backend Returns** (`src/mobile-investments/mobile-investments.service.ts`):
```typescript
{
  id, displayCode,
  property: { id, displayCode, title, images, tokenPrice, status, city, country },
  tokens,                    // ✅
  investedAmount,            // ✅
  currentValue,              // ✅
  roi,                       // ✅
  rentalYield,
  monthlyRentalIncome,       // ✅
  status, paymentStatus,
  purchaseDate,              // ✅ (alias for createdAt)
  createdAt, updatedAt
}
```

**Status**: ✅ **ALIGNED** - All required fields present

---

## ✅ Wallet Structure - ALIGNED

**Mobile App Expects** (from APP_FLOW_DOCUMENTATION.md line 601):
```typescript
WalletBalance {
  usdc: number,              // Available balance
  totalValue: number,        // usdc + portfolio current value
  totalInvested: number,     // Sum of all investments
  totalEarnings: number,     // Sum of (currentValue - investedAmount)
  pendingDeposits: number    // Pending deposit transactions
}
```

**Backend Returns** (`src/mobile-wallet/mobile-wallet.service.ts`):
```typescript
{
  usdc,                      // ✅ wallet.balanceUSDT
  totalValue,                // ✅ walletBalance + portfolioCurrentValue
  totalInvested,             // ✅ portfolio.summary.totalInvestedUSDT
  totalEarnings,             // ✅ Calculated from investments (currentValue - investedAmount)
  pendingDeposits            // ✅ Sum of pending deposit transactions
}
```

**Status**: ✅ **ALIGNED**

### Total Earnings Calculation

**Mobile App Expects** (line 453):
```typescript
totalEarnings = sum of (currentValue - investedAmount) for all investments
```

**Backend Implementation**:
```typescript
totalEarnings = investments.reduce((sum, inv) => {
  const baseValue = inv.tokensPurchased.mul(inv.property?.pricePerTokenUSDT || new Decimal(0));
  const currentValue = baseValue.mul(1.15); // 15% growth
  const earnings = currentValue.minus(inv.amountUSDT);
  return sum.plus(earnings);
}, new Decimal(0));
```

**Status**: ✅ **ALIGNED**

---

## ✅ Transaction Amount Signs - ALIGNED

**Mobile App Expects** (line 444):
```typescript
// Investment transaction
amount: -amount  // Negative for investments
```

**Backend Implementation** (`src/mobile-transactions/mobile-transactions.service.ts`):
```typescript
let amount = (transaction.amountUSDT as Decimal).toNumber();
if (transaction.type === 'investment') {
  amount = -Math.abs(amount); // Ensure negative for investments ✅
}
```

**Status**: ✅ **ALIGNED**

---

## ✅ Transaction Type Mapping - ALIGNED

**Mobile App Expects**:
- `reward` → `rental_income`

**Backend Implementation**:
```typescript
if (transaction.type === 'reward') {
  type = 'rental_income'; // Map reward to rental_income for mobile ✅
}
```

**Status**: ✅ **ALIGNED**

---

## ✅ Property soldTokens - ALIGNED

**Mobile App Expects** (line 420):
```typescript
property.soldTokens += tokenCount
```

**Backend Returns** (`src/mobile-properties/mobile-properties.service.ts`):
```typescript
const soldTokens = property.totalTokens.minus(property.availableTokens);
return {
  soldTokens: soldTokens.toNumber(), // ✅
  // ...
}
```

**Status**: ✅ **ALIGNED**

---

## ✅ Portfolio Calculations - ALIGNED

**Mobile App Expects** (line 224-227):
```typescript
totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0)
totalROI = ((totalValue - totalInvested) / totalInvested) * 100
monthlyRentalIncome = investments.reduce((sum, inv) => sum + inv.monthlyRentalIncome, 0)
```

**Backend Implementation**:
- Portfolio service calculates `totalCurrentValueUSDT` using investments with 15% growth ✅
- Wallet service aggregates these values correctly ✅

**Status**: ✅ **ALIGNED**

---

## ✅ Portfolio Current Value Calculation - ALIGNED

**Mobile App Expects** (line 616):
```typescript
portfolioTotalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
```

**Backend Implementation** (`src/portfolio/portfolio.service.ts`):
```typescript
// Calculate current value with 15% growth (matching mobile app calculation)
const baseValue = investment.tokensPurchased.mul(investment.property.pricePerTokenUSDT);
const currentValue = baseValue.mul(1.15); // Apply 15% growth multiplier ✅
```

**Status**: ✅ **ALIGNED**

---

## Summary

### ✅ All Calculations Aligned

| Calculation | Mobile App | Backend | Status |
|-------------|------------|---------|--------|
| Investment currentValue | `tokens × price × 1.15` | `tokens × price × 1.15` | ✅ |
| Investment ROI | `((currentValue - investedAmount) / investedAmount) × 100` | Same | ✅ |
| Investment monthlyRentalIncome | `(currentValue × yield / 100) / 12` | Same | ✅ |
| Wallet totalEarnings | `sum(currentValue - investedAmount)` | Same | ✅ |
| Transaction amount (investment) | Negative | Negative | ✅ |
| Transaction type (reward) | `rental_income` | `rental_income` | ✅ |
| Property soldTokens | Computed | Computed | ✅ |
| Portfolio totalValue | Sum of currentValue | Sum of currentValue | ✅ |

### ✅ All Field Names Aligned

| Mobile App Field | Backend Field | Status |
|------------------|---------------|--------|
| `tokens` | `tokens` | ✅ |
| `investedAmount` | `investedAmount` | ✅ |
| `currentValue` | `currentValue` | ✅ |
| `roi` | `roi` | ✅ |
| `monthlyRentalIncome` | `monthlyRentalIncome` | ✅ |
| `purchaseDate` | `purchaseDate` | ✅ |
| `usdc` | `usdc` | ✅ |
| `totalValue` | `totalValue` | ✅ |
| `totalInvested` | `totalInvested` | ✅ |
| `totalEarnings` | `totalEarnings` | ✅ |
| `pendingDeposits` | `pendingDeposits` | ✅ |

---

## Changes Made

1. ✅ **Investment currentValue**: Added 15% growth multiplier (1.15)
2. ✅ **Investment monthlyRentalIncome**: Changed to use `currentValue` instead of `investedAmount`
3. ✅ **Wallet totalEarnings**: Changed to calculate from investments (currentValue - investedAmount) instead of using totalRewardsUSDT
4. ✅ **Transaction amount**: Made investment transactions negative
5. ✅ **Portfolio currentValue**: Added 15% growth multiplier to match mobile app

---

## Testing Recommendations

1. **Test Investment Creation**:
   - Create investment with 100 tokens at $1000/token
   - Verify `currentValue = 100 × 1000 × 1.15 = $115,000`
   - Verify `roi` calculation matches mobile app

2. **Test Wallet Aggregation**:
   - Create multiple investments
   - Verify `totalEarnings = sum(currentValue - investedAmount)` for all investments
   - Verify `totalValue = usdc + portfolioTotalValue`

3. **Test Transaction Signs**:
   - Create investment
   - Verify transaction amount is negative
   - Verify deposit/withdrawal amounts have correct signs

4. **Test Portfolio Calculations**:
   - Verify portfolio `totalCurrentValueUSDT` uses 15% growth
   - Verify all calculations match mobile app expectations

---

**Status**: ✅ **ALL CALCULATIONS AND FIELDS ALIGNED WITH MOBILE APP**

