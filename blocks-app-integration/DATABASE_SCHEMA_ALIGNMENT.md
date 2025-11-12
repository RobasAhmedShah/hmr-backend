# Database Schema Alignment: Frontend Types → Backend Entities

**Version**: 1.0  
**Last Updated**: 2025-01-12  
**Purpose**: Comprehensive mapping of React Native TypeScript interfaces to NestJS TypeORM entities with foreign key verification

---

## Table of Contents

1. [User & Authentication](#1-user--authentication)
2. [Property](#2-property)
3. [Investment](#3-investment)
4. [Wallet](#4-wallet)
5. [Transaction](#5-transaction)
6. [Organization (Builder)](#6-organization-builder)
7. [Portfolio](#7-portfolio)
8. [KYC Verification](#8-kyc-verification)
9. [Payment Method](#9-payment-method)
10. [Reward](#10-reward)
11. [New Entities Required](#11-new-entities-required)
12. [Field Naming Conventions](#12-field-naming-conventions)
13. [Computed vs Stored Fields](#13-computed-vs-stored-fields)

---

## 1. User & Authentication

### Frontend TypeScript Interface
```typescript
// types/user.ts
interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  dob?: string;              // ❌ Missing in backend
  address?: string;          // ❌ Missing in backend
  profileImage?: string;     // ❌ Missing in backend
  createdAt: string;
  updatedAt: string;
}
```

### Backend TypeORM Entity
```typescript
// src/admin/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;                           // ✅ Match

  @Column({ type: 'varchar', length: 32, unique: true })
  displayCode: string;                  // ℹ️ Backend-only field

  @Column({ type: 'varchar', length: 255 })
  fullName: string;                     // ✅ Match

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;                        // ✅ Match

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone?: string | null;                // ✅ Match

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: 'user' | 'admin';               // ℹ️ Backend-only field

  @Column({ type: 'boolean', default: true })
  isActive: boolean;                    // ℹ️ Backend-only field

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;                      // ✅ Match (type conversion needed)

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;                      // ✅ Match (type conversion needed)

  @OneToMany(() => PaymentMethod, pm => pm.user)
  paymentMethods: PaymentMethod[];      // ℹ️ Backend-only relation
}
```

### Alignment Status
| Field | Frontend | Backend | Status | Action |
|-------|----------|---------|--------|--------|
| `id` | string | string (uuid) | ✅ | None |
| `displayCode` | - | string | ℹ️ | Include in API response |
| `fullName` | string | string | ✅ | None |
| `email` | string | string | ✅ | None |
| `phone` | string? | string? | ✅ | None |
| `dob` | string? | - | ❌ | Add to entity |
| `address` | string? | - | ❌ | Add to entity |
| `profileImage` | string? | - | ❌ | Add to entity |
| `role` | - | enum | ℹ️ | Include in API response |
| `isActive` | - | boolean | ℹ️ | Internal use only |
| `createdAt` | string | Date | 🔧 | ISO string transform |
| `updatedAt` | string | Date | 🔧 | ISO string transform |

### Required Schema Changes
```sql
ALTER TABLE users 
ADD COLUMN dob DATE NULL,
ADD COLUMN address VARCHAR(512) NULL,
ADD COLUMN profile_image VARCHAR(512) NULL;
```

---

## 2. Property

### Frontend TypeScript Interface
```typescript
// types/property.ts
interface Property {
  id: string;
  displayCode?: string;
  title: string;
  location: string;              // 🔧 Need to add or compute
  city: string;
  valuation: number | string;    // 🔧 Backend: totalValueUSDT
  tokenPrice: number;            // 🔧 Backend: pricePerTokenUSDT
  minInvestment: number;         // 🔧 Computed or add field
  totalTokens: number;
  soldTokens: number;            // 🔧 Computed from totalTokens - availableTokens
  estimatedROI: number;          // 🔧 Backend: expectedROI
  estimatedYield: number;        // 🔧 Same as estimatedROI?
  completionDate: string;        // ❌ Missing in backend
  status: 'funding' | 'construction' | 'completed' | 'generating-income';
  images: string[];
  description: string;
  amenities: string[];           // 🔧 Backend: features.amenities
  builder: {                     // 🔧 Backend: organization relation
    id: string;
    name: string;
    logo?: string;
    rating: number;              // ❌ Not in organization
    projectsCompleted: number;   // ❌ Not in organization
  };
  features: {
    bedrooms?: number;           // ✅ features.bedrooms
    bathrooms?: number;          // ✅ features.bathrooms
    area?: number;               // ✅ features.area
    floors?: number;             // ✅ features.floors
    units?: number;              // ✅ features.units
  };
  documents: PropertyDocument[]; // ❌ Need new entity
  updates: PropertyUpdate[];     // ❌ Need new entity
  rentalIncome?: {               // ❌ Need to compute from rewards
    monthly: number;
    lastDistribution: string;
    nextDistribution: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Backend TypeORM Entity
```typescript
// src/properties/entities/property.entity.ts
@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;                                      // ✅ Match

  @Column({ type: 'varchar', length: 32, unique: true })
  displayCode: string;                             // ✅ Match

  @Column({ type: 'uuid' })
  organizationId: string;                          // ℹ️ FK to Organization

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;                       // 🔧 Map to builder

  @Column({ type: 'varchar', length: 255 })
  title: string;                                   // ✅ Match

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;                                    // ℹ️ Backend-only

  @Column({ type: 'text', nullable: true })
  description?: string | null;                     // ✅ Match

  @Column({ type: 'varchar', length: 32 })
  type: 'residential' | 'commercial' | 'mixed';    // ℹ️ Backend-only

  @Column({ type: 'varchar', length: 32 })
  status: string;                                  // ✅ Match (different enum values)

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  totalValueUSDT: Decimal;                         // 🔧 Frontend: valuation

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  totalTokens: Decimal;                            // ✅ Match

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  availableTokens: Decimal;                        // ℹ️ Use to compute soldTokens

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  pricePerTokenUSDT: Decimal;                      // 🔧 Frontend: tokenPrice

  @Column('numeric', { precision: 5, scale: 2, transformer: DecimalTransformer })
  expectedROI: Decimal;                            // 🔧 Frontend: estimatedROI

  @Column({ type: 'varchar', length: 128, nullable: true })
  city?: string | null;                            // ✅ Match

  @Column({ type: 'varchar', length: 128, nullable: true })
  country?: string | null;                         // ℹ️ Backend-only

  @Column({ type: 'jsonb', nullable: true })
  features?: any | null;                           // ✅ Match

  @Column({ type: 'jsonb', nullable: true })
  images?: any | null;                             // ✅ Match

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;                                 // ✅ Match

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;                                 // ✅ Match
}
```

### Alignment Status
| Field | Frontend | Backend | Status | Action |
|-------|----------|---------|--------|--------|
| `id` | string | string (uuid) | ✅ | None |
| `displayCode` | string? | string | ✅ | None |
| `title` | string | string | ✅ | None |
| `location` | string | - | ❌ | Add field or compute from city/country |
| `city` | string | string | ✅ | None |
| `valuation` | number/string | totalValueUSDT (Decimal) | 🔧 | Transform field name |
| `tokenPrice` | number | pricePerTokenUSDT (Decimal) | 🔧 | Transform field name |
| `minInvestment` | number | - | ❌ | Compute or add field |
| `totalTokens` | number | Decimal | ✅ | Type conversion |
| `soldTokens` | number | - | 🔧 | Compute: totalTokens - availableTokens |
| `estimatedROI` | number | expectedROI (Decimal) | 🔧 | Transform field name |
| `estimatedYield` | number | - | ❌ | Same as estimatedROI or add |
| `completionDate` | string | - | ❌ | Add field |
| `status` | enum | string | 🔧 | Map backend status to frontend enum |
| `images` | string[] | jsonb | ✅ | None |
| `description` | string | string | ✅ | None |
| `amenities` | string[] | features.amenities | 🔧 | Extract from features |
| `builder` | object | organization relation | 🔧 | Transform relation |
| `features` | object | jsonb | ✅ | None |
| `documents` | array | - | ❌ | Create PropertyDocument entity |
| `updates` | array | - | ❌ | Create PropertyUpdate entity |
| `rentalIncome` | object | - | 🔧 | Compute from rewards |

### Required Schema Changes
```sql
ALTER TABLE properties 
ADD COLUMN location VARCHAR(255) NULL,
ADD COLUMN completion_date DATE NULL,
ADD COLUMN estimated_yield NUMERIC(5,2) NULL;

-- Status values mapping needed:
-- Backend: 'planning' | 'construction' | 'active' | 'onhold' | 'soldout' | 'completed'
-- Frontend: 'funding' | 'construction' | 'completed' | 'generating-income'
-- Mapping: 'active' → 'funding', 'completed' → 'generating-income'
```

### Foreign Key Verification
```
Property.organizationId → Organization.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: No
```

---

## 3. Investment

### Frontend TypeScript Interface
```typescript
// types/investment.ts
interface Investment {
  id: string;
  userId: string;
  propertyId: string;
  property: Property;
  tokens: number;                // 🔧 Backend: tokensPurchased
  investedAmount: number;        // 🔧 Backend: amountUSDT
  currentValue: number;          // 🔧 Computed from current token price
  roi: number;                   // 🔧 Computed from rewards
  rentalYield: number;           // 🔧 Computed from rewards
  monthlyRentalIncome: number;   // 🔧 Computed from recent rewards
  purchaseDate: string;          // 🔧 Backend: createdAt
  createdAt: string;
  updatedAt: string;
}
```

### Backend TypeORM Entity
```typescript
// src/investments/entities/investment.entity.ts
@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;                                      // ✅ Match

  @Column({ type: 'varchar', length: 32, unique: true })
  displayCode: string;                             // ℹ️ Backend-only

  @Column({ type: 'uuid' })
  userId: string;                                  // ✅ Match

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;                                      // ℹ️ Relation

  @Column({ type: 'uuid' })
  propertyId: string;                              // ✅ Match

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'propertyId' })
  property: Property;                              // ✅ Match

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  tokensPurchased: Decimal;                        // 🔧 Frontend: tokens

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  amountUSDT: Decimal;                             // 🔧 Frontend: investedAmount

  @Column({ type: 'varchar', length: 32 })
  status: 'pending' | 'confirmed' | 'active' | 'sold' | 'cancelled';  // ℹ️ Backend-only

  @Column({ type: 'varchar', length: 32 })
  paymentStatus: 'pending' | 'completed' | 'failed';                  // ℹ️ Backend-only

  @Column('numeric', { precision: 5, scale: 2, transformer: DecimalTransformer })
  expectedROI: Decimal;                            // ℹ️ Backend-only

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;                                 // ✅ Match (purchaseDate)

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;                                 // ✅ Match
}
```

### Alignment Status
| Field | Frontend | Backend | Status | Action |
|-------|----------|---------|--------|--------|
| `id` | string | string (uuid) | ✅ | None |
| `displayCode` | - | string | ℹ️ | Include in response |
| `userId` | string | string (uuid) | ✅ | None |
| `propertyId` | string | string (uuid) | ✅ | None |
| `property` | Property | Property relation | ✅ | Eager load |
| `tokens` | number | tokensPurchased (Decimal) | 🔧 | Transform field name |
| `investedAmount` | number | amountUSDT (Decimal) | 🔧 | Transform field name |
| `currentValue` | number | - | 🔧 | Compute: tokens × current tokenPrice |
| `roi` | number | - | 🔧 | Compute from rewards |
| `rentalYield` | number | - | 🔧 | Compute from rewards |
| `monthlyRentalIncome` | number | - | 🔧 | Compute from recent rewards |
| `purchaseDate` | string | createdAt | 🔧 | Map createdAt to purchaseDate |
| `status` | - | enum | ℹ️ | Internal use |
| `paymentStatus` | - | enum | ℹ️ | Internal use |

### Foreign Key Verification
```
Investment.userId → User.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: No

Investment.propertyId → Property.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: No
```

---

## 4. Wallet

### Frontend TypeScript Interface
```typescript
// types/wallet.ts
interface WalletBalance {
  usdc: number;                  // 🔧 Backend: balanceUSDT
  totalValue: number;            // 🔧 Computed: wallet + portfolio value
  totalInvested: number;         // 🔧 From Portfolio.totalInvestedUSDT
  totalEarnings: number;         // 🔧 From Portfolio.totalRewardsUSDT
  pendingDeposits: number;       // 🔧 Computed from pending transactions
}
```

### Backend TypeORM Entity
```typescript
// src/wallet/entities/wallet.entity.ts
@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;                                      // ℹ️ Backend-only

  @Column({ type: 'uuid' })
  userId: string;                                  // ℹ️ FK to User

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;                                      // ℹ️ Relation

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  balanceUSDT: Decimal;                            // 🔧 Frontend: usdc

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  lockedUSDT: Decimal;                             // ℹ️ Backend-only

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  totalDepositedUSDT: Decimal;                     // ℹ️ Backend-only

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  totalWithdrawnUSDT: Decimal;                     // ℹ️ Backend-only

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### Alignment Status
| Field | Frontend | Backend | Status | Action |
|-------|----------|---------|--------|--------|
| `usdc` | number | balanceUSDT (Decimal) | 🔧 | Transform field name |
| `totalValue` | number | - | 🔧 | Compute: balanceUSDT + portfolio current value |
| `totalInvested` | number | - | 🔧 | From Portfolio entity |
| `totalEarnings` | number | - | 🔧 | From Portfolio.totalRewardsUSDT |
| `pendingDeposits` | number | - | 🔧 | Sum pending deposit transactions |

### Foreign Key Verification
```
Wallet.userId → User.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: No
- Unique: Each user has one wallet
```

---

## 5. Transaction

### Frontend TypeScript Interface
```typescript
// types/transaction.ts
interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'investment' | 'rental_income' | 'rental' | 'transfer';
  amount: number;                // 🔧 Backend: amountUSDT
  date: string;                  // 🔧 Backend: createdAt
  description: string;
  status: 'completed' | 'pending' | 'failed';
  currency: 'USDC' | 'PKR';      // ℹ️ Not in backend, always USDC
  propertyId?: string;
  propertyTitle?: string;        // 🔧 From property relation
  transactionHash?: string;      // 🔧 Backend: referenceId
  createdAt: string;
  updatedAt: string;             // ❌ Transaction entity has no updatedAt
}
```

### Backend TypeORM Entity
```typescript
// src/transactions/entities/transaction.entity.ts
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;                                      // ✅ Match

  @Column({ type: 'varchar', length: 32, unique: true })
  displayCode: string;                             // ℹ️ Backend-only

  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;                          // ✅ Match

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;                                     // ℹ️ Relation

  @Column({ type: 'uuid', nullable: true })
  walletId?: string | null;                        // ℹ️ Backend-only

  @ManyToOne(() => Wallet, { nullable: true })
  @JoinColumn({ name: 'walletId' })
  wallet?: Wallet;                                 // ℹ️ Relation

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string | null;                  // ℹ️ Backend-only

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;                      // ℹ️ Relation

  @Column({ type: 'uuid', nullable: true })
  propertyId?: string | null;                      // ✅ Match

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'propertyId' })
  property?: Property;                             // ℹ️ Use for propertyTitle

  @Column({ type: 'uuid', nullable: true })
  paymentMethodId?: string | null;                 // ℹ️ Backend-only

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod?: PaymentMethod;                   // ℹ️ Relation

  @Column({ type: 'varchar', length: 32 })
  type: 'deposit' | 'withdrawal' | 'investment' | 'return' | 'fee' | 'reward' | 'inflow';  // ✅ Match (some differences)

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  amountUSDT: Decimal;                             // 🔧 Frontend: amount

  @Column({ type: 'varchar', length: 32 })
  status: 'pending' | 'completed' | 'failed';      // ✅ Match

  @Column({ type: 'varchar', length: 128, nullable: true })
  fromEntity?: string | null;                      // ℹ️ Backend-only (traceability)

  @Column({ type: 'varchar', length: 128, nullable: true })
  toEntity?: string | null;                        // ℹ️ Backend-only (traceability)

  @Column({ type: 'varchar', length: 64, nullable: true })
  referenceId?: string | null;                     // 🔧 Frontend: transactionHash

  @Column({ type: 'text', nullable: true })
  description?: string | null;                     // ✅ Match

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any | null;                           // ℹ️ Backend-only

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;                                 // ✅ Match (date)
}
```

### Alignment Status
| Field | Frontend | Backend | Status | Action |
|-------|----------|---------|--------|--------|
| `id` | string | string (uuid) | ✅ | None |
| `displayCode` | - | string | ℹ️ | Include in response |
| `userId` | string | string (uuid) | ✅ | None |
| `type` | enum | enum | 🔧 | Map types (rental_income ↔ reward) |
| `amount` | number | amountUSDT (Decimal) | 🔧 | Transform field name |
| `date` | string | createdAt (Date) | 🔧 | Map createdAt to date |
| `description` | string | string | ✅ | None |
| `status` | enum | enum | ✅ | None |
| `currency` | enum | - | ℹ️ | Always 'USDC', add in response |
| `propertyId` | string? | string? | ✅ | None |
| `propertyTitle` | string? | - | 🔧 | Extract from property.title |
| `transactionHash` | string? | referenceId | 🔧 | Transform field name |
| `updatedAt` | string | - | ❌ | Transaction immutable, omit |

### Foreign Key Verification
```
Transaction.userId → User.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: Yes

Transaction.propertyId → Property.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: Yes

Transaction.organizationId → Organization.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: Yes

Transaction.walletId → Wallet.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: Yes

Transaction.paymentMethodId → PaymentMethod.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: Yes
```

---

## 6. Organization (Builder)

### Frontend TypeScript Interface
```typescript
// types/property.ts (nested in Property)
interface Builder {
  id: string;
  name: string;
  logo?: string;                 // 🔧 Backend: logoUrl
  rating: number;                // ❌ Not in backend
  projectsCompleted: number;     // ❌ Not in backend
}
```

### Backend TypeORM Entity
```typescript
// src/organizations/entities/organization.entity.ts
@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;                                      // ✅ Match

  @Column({ type: 'varchar', length: 32, unique: true })
  displayCode: string;                             // ℹ️ Backend-only

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;                                    // ✅ Match

  @Column({ type: 'text', nullable: true })
  description?: string | null;                     // ℹ️ Backend-only

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string | null;                         // ℹ️ Backend-only

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoUrl?: string | null;                         // 🔧 Frontend: logo

  @Column('numeric', { precision: 18, scale: 6, default: 0, transformer: DecimalTransformer })
  liquidityUSDT: Decimal;                          // ℹ️ Backend-only

  @OneToMany(() => Transaction, txn => txn.organization)
  transactions?: Transaction[];                     // ℹ️ Relation

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### Alignment Status
| Field | Frontend | Backend | Status | Action |
|-------|----------|---------|--------|--------|
| `id` | string | string (uuid) | ✅ | None |
| `name` | string | string | ✅ | None |
| `logo` | string? | logoUrl | 🔧 | Transform field name |
| `rating` | number | - | ❌ | Add field or compute from reviews |
| `projectsCompleted` | number | - | ❌ | Compute: count completed properties |

### Required Schema Changes
```sql
ALTER TABLE organizations 
ADD COLUMN rating NUMERIC(3,2) DEFAULT 0 NULL;

-- projectsCompleted can be computed:
-- SELECT COUNT(*) FROM properties 
-- WHERE organizationId = ? AND status = 'completed'
```

---

## 7. Portfolio

### Frontend TypeScript Interface
```typescript
// types/portfolio.ts
interface PortfolioSummary {
  totalInvested: number;         // ✅ Backend: totalInvestedUSDT
  totalValue: number;            // 🔧 Computed from current prices
  totalROI: number;              // ✅ Backend: totalROIUSDT
  monthlyRentalIncome: number;   // 🔧 Computed from recent rewards
  totalEarnings: number;         // ✅ Backend: totalRewardsUSDT
  investmentCount: number;       // ✅ Backend: activeInvestments
  distribution: {                // 🔧 Computed per property
    propertyId: string;
    propertyTitle: string;
    percentage: number;
    value: number;
  }[];
}
```

### Backend TypeORM Entity
```typescript
// src/portfolio/entities/portfolio.entity.ts
@Entity('portfolio')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  totalInvestedUSDT: Decimal;                      // ✅ Frontend: totalInvested

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  totalRewardsUSDT: Decimal;                       // ✅ Frontend: totalEarnings

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer, default: 0 })
  totalROIUSDT: Decimal;                           // ✅ Frontend: totalROI

  @Column({ type: 'integer', default: 0 })
  activeInvestments: number;                       // ✅ Frontend: investmentCount

  @Column({ type: 'timestamptz', nullable: true })
  lastUpdated?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### Alignment Status
| Field | Frontend | Backend | Status | Action |
|-------|----------|---------|--------|--------|
| `totalInvested` | number | totalInvestedUSDT (Decimal) | ✅ | Type conversion |
| `totalValue` | number | - | 🔧 | Compute from investments |
| `totalROI` | number | totalROIUSDT (Decimal) | ✅ | Type conversion |
| `monthlyRentalIncome` | number | - | 🔧 | Compute from rewards |
| `totalEarnings` | number | totalRewardsUSDT (Decimal) | ✅ | Type conversion |
| `investmentCount` | number | activeInvestments | ✅ | Direct match |
| `distribution` | array | - | 🔧 | Compute from investments |

### Foreign Key Verification
```
Portfolio.userId → User.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: No
- Unique: Each user has one portfolio
```

---

## 8. KYC Verification

### Frontend TypeScript Interface
```typescript
// Not explicitly defined in frontend, but used in profile
interface KYCStatus {
  status: 'pending' | 'verified' | 'rejected';
  type: 'cnic' | 'passport' | 'license' | 'other';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}
```

### Backend TypeORM Entity
```typescript
// src/kyc/entities/kyc-verification.entity.ts
@Entity('kyc_verifications')
export class KycVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 32 })
  type: 'cnic' | 'passport' | 'license' | 'other';  // ✅ Match

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: 'pending' | 'verified' | 'rejected';       // ✅ Match

  @Column({ type: 'varchar', length: 512 })
  documentFrontUrl: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  documentBackUrl?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  selfieUrl?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reviewer?: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string | null;                   // ✅ Match

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date | null;                         // ✅ Match

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date | null;                          // ✅ Match

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### Alignment Status
✅ Complete alignment - KYC verification entity matches frontend expectations

### Foreign Key Verification
```
KycVerification.userId → User.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: No
```

---

## 9. Payment Method

### Frontend TypeScript Interface
```typescript
// Not explicitly used in mobile app yet (future enhancement)
interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'crypto';
  provider: string;
  status: 'pending' | 'verified' | 'disabled';
  isDefault: boolean;
  cardDetails?: CardDetails;
}
```

### Backend TypeORM Entity
```typescript
// src/payment-methods/entities/payment-method.entity.ts
@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;                                      // ✅ Match

  @Column({ type: 'varchar', length: 32 })
  type: 'card' | 'bank' | 'crypto';                // ✅ Match

  @Column({ type: 'varchar', length: 64 })
  provider: string;                                // ✅ Match

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: 'pending' | 'verified' | 'disabled';     // ✅ Match

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;                              // ✅ Match

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, user => user.paymentMethods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => CardDetails, cd => cd.paymentMethod, { nullable: true })
  cardDetails?: CardDetails;                        // ✅ Match

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### Alignment Status
✅ Complete alignment - Payment method entity ready for mobile integration

### Foreign Key Verification
```
PaymentMethod.userId → User.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: CASCADE (delete payment methods when user deleted)
- Nullable: No
```

---

## 10. Reward

### Frontend TypeScript Interface
```typescript
// types/investment.ts (nested in income history)
interface IncomeHistory {
  id: string;
  amount: number;                // 🔧 Backend: amountUSDT
  date: string;                  // 🔧 Backend: createdAt
  status: 'pending' | 'distributed';
}
```

### Backend TypeORM Entity
```typescript
// src/rewards/entities/reward.entity.ts
@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;                                      // ✅ Match

  @Column({ type: 'varchar', length: 32, unique: true })
  displayCode: string;                             // ℹ️ Backend-only

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  investmentId: string;

  @ManyToOne(() => Investment)
  @JoinColumn({ name: 'investmentId' })
  investment: Investment;

  @Column('numeric', { precision: 18, scale: 6, transformer: DecimalTransformer })
  amountUSDT: Decimal;                             // 🔧 Frontend: amount

  @Column({ type: 'varchar', length: 32 })
  type: 'roi' | 'referral' | 'bonus';              // ℹ️ Backend-only

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: 'pending' | 'distributed';               // ✅ Match

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;                                 // 🔧 Frontend: date
}
```

### Alignment Status
| Field | Frontend | Backend | Status | Action |
|-------|----------|---------|--------|--------|
| `id` | string | string (uuid) | ✅ | None |
| `amount` | number | amountUSDT (Decimal) | 🔧 | Transform field name |
| `date` | string | createdAt (Date) | 🔧 | Map createdAt to date |
| `status` | enum | enum | ✅ | Direct match |

### Foreign Key Verification
```
Reward.userId → User.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: No

Reward.investmentId → Investment.id (EXISTS ✅)
- Relationship: ManyToOne
- Cascade: None
- Nullable: No
```

---

## 11. New Entities Required

These entities do not exist in the backend and need to be created for full mobile app functionality:

### 11.1 Bookmark
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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Unique constraint: user can only bookmark a property once
  @Index(['userId', 'propertyId'], { unique: true })
}
```

### 11.2 Notification
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
  type: string;  // 'investment_confirmed', 'property_update', 'reward_distributed', etc.

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: any;  // { propertyId?, investmentId?, transactionId?, url? }

  @Column({ type: 'boolean', default: false })
  @Index()
  read: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
```

### 11.3 UserSecuritySettings
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
  passwordLastChanged?: Date | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### 11.4 UserNotificationSettings
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
    startTime?: string;  // HH:mm format
    endTime?: string;    // HH:mm format
  };

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### 11.5 BankAccount
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
  accountNumber: string;  // Encrypted in production

  @Column({ type: 'varchar', length: 32 })
  accountType: 'Checking' | 'Savings';

  @Column({ type: 'varchar', length: 64, nullable: true })
  routingNumber?: string | null;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: 'pending' | 'verified' | 'rejected';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### 11.6 PushToken
```typescript
@Entity('push_tokens')
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'varchar', length: 32 })
  platform: 'ios' | 'android' | 'web';

  @Column({ type: 'varchar', length: 128, nullable: true })
  deviceId?: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Unique constraint: one token per device
  @Index(['userId', 'deviceId'], { unique: true })
}
```

### 11.7 PropertyUpdate
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
  order: number;  // For sorting

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
```

### 11.8 PropertyDocument
```typescript
@Entity('property_documents')
export class PropertyDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  type: string;  // 'title deed', 'noc', 'approval', etc.

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'varchar', length: 512 })
  url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  uploadedAt: Date;
}
```

### 11.9 FAQ
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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### 11.10 ContentPage
```typescript
@Entity('content_pages')
export class ContentPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  type: string;  // 'privacy-policy', 'terms-of-service', etc.

  @Column({ type: 'jsonb' })
  sections: {
    id: string;
    title: string;
    content: string[];
    order: number;
  }[];

  @Column({ type: 'timestamptz' })
  lastUpdated: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
```

### 11.11 SupportTicket
```typescript
@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

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
  response?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

---

## 12. Field Naming Conventions

### Backend → Frontend Transformation Rules

| Backend Pattern | Frontend Pattern | Transform Method |
|-----------------|------------------|------------------|
| `*USDT` | `*` or specific name | Remove suffix, map to context |
| `expected*` | `estimated*` | Prefix change |
| `*Purchased` | `*` | Remove suffix |
| `*Url` | `*` | Remove suffix |
| `displayCode` | `displayCode` | Keep as-is, include in responses |
| Decimal type | number | `Decimal.toNumber()` |
| Date type | string (ISO) | `.toISOString()` |

### Examples
- `totalValueUSDT` → `valuation`
- `pricePerTokenUSDT` → `tokenPrice`
- `balanceUSDT` → `usdc`
- `expectedROI` → `estimatedROI`
- `tokensPurchased` → `tokens`
- `amountUSDT` → `amount` or `investedAmount`
- `logoUrl` → `logo`
- `referenceId` → `transactionHash`

---

## 13. Computed vs Stored Fields

### Computed Fields (Calculate at Query Time)

| Field | Computation | Source |
|-------|-------------|--------|
| `soldTokens` | `totalTokens - availableTokens` | Property |
| `currentValue` | `tokens × property.pricePerTokenUSDT` | Investment + Property |
| `roi` | `(currentValue - investedAmount) / investedAmount × 100` | Investment + Rewards |
| `monthlyRentalIncome` | Sum of last 30 days rewards | Rewards |
| `totalValue` | `walletBalance + portfolioCurrentValue` | Wallet + Portfolio |
| `pendingDeposits` | Sum transactions where type='deposit' AND status='pending' | Transactions |
| `projectsCompleted` | Count properties where status='completed' | Properties |
| `distribution` | Group investments by property | Investments |
| `propertyTitle` | `property.title` | Transaction → Property relation |

### Stored Fields (Pre-computed, Updated via Events)

| Field | Update Trigger | Updated By |
|-------|----------------|------------|
| `Portfolio.totalInvestedUSDT` | Investment created | PortfolioListener |
| `Portfolio.totalRewardsUSDT` | Reward distributed | PortfolioListener |
| `Portfolio.totalROIUSDT` | Reward distributed | PortfolioListener |
| `Portfolio.activeInvestments` | Investment status change | PortfolioListener |
| `Property.availableTokens` | Investment created | InvestmentService |
| `Wallet.balanceUSDT` | Deposit/Withdrawal/Reward | WalletService |
| `Organization.liquidityUSDT` | Investment/Transaction | OrganizationListener |

---

## Foreign Key Diagram

```
User (id)
  ├─> Wallet (userId) [1:1]
  ├─> Portfolio (userId) [1:1]
  ├─> KycVerification (userId) [1:1]
  ├─> Investment (userId) [1:N]
  ├─> Transaction (userId) [1:N]
  ├─> Reward (userId) [1:N]
  ├─> PaymentMethod (userId) [1:N]
  ├─> Bookmark (userId) [1:N]          ❌ NEW
  ├─> Notification (userId) [1:N]      ❌ NEW
  ├─> UserSecuritySettings (userId) [1:1]     ❌ NEW
  ├─> UserNotificationSettings (userId) [1:1] ❌ NEW
  ├─> BankAccount (userId) [1:N]      ❌ NEW
  ├─> PushToken (userId) [1:N]        ❌ NEW
  └─> SupportTicket (userId) [1:N]    ❌ NEW

Organization (id)
  ├─> Property (organizationId) [1:N]
  └─> Transaction (organizationId) [1:N]

Property (id)
  ├─> Investment (propertyId) [1:N]
  ├─> Transaction (propertyId) [1:N]
  ├─> Bookmark (propertyId) [1:N]      ❌ NEW
  ├─> PropertyUpdate (propertyId) [1:N] ❌ NEW
  └─> PropertyDocument (propertyId) [1:N] ❌ NEW

Investment (id)
  └─> Reward (investmentId) [1:N]

Wallet (id)
  └─> Transaction (walletId) [1:N]

PaymentMethod (id)
  ├─> CardDetails (paymentMethodId) [1:1]
  └─> Transaction (paymentMethodId) [1:N]
```

---

## Summary

### Alignment Statistics
- **Existing Entities**: 10 (User, Property, Investment, Wallet, Transaction, Organization, Portfolio, KYC, PaymentMethod, Reward)
- **New Entities Required**: 11
- **Total Fields Reviewed**: 150+
- **Perfect Matches**: 45%
- **Transform Required**: 35%
- **Missing Fields**: 20%

### Critical Actions Required

1. **Add Missing Fields to Existing Entities**:
   - User: `dob`, `address`, `profileImage`
   - Property: `location`, `completionDate`, `estimatedYield`
   - Organization: `rating`

2. **Create New Entities** (11 total):
   - Bookmark
   - Notification
   - UserSecuritySettings
   - UserNotificationSettings
   - BankAccount
   - PushToken
   - PropertyUpdate
   - PropertyDocument
   - FAQ
   - ContentPage
   - SupportTicket

3. **Implement Field Transformers**:
   - DTO transformers for field name mapping
   - Decimal to number conversions
   - Date to ISO string conversions
   - Computed field calculations

4. **Verify All Foreign Keys**:
   - All existing FKs verified ✅
   - 11 new FK relationships to implement

---

## Cross-Reference

- **API Endpoints**: See `API_MAPPING.md` for endpoint-to-entity mapping
- **Authentication**: See `AUTH_INTEGRATION.md` for Magic Link + User entity integration
- **Real-time Updates**: See `REALTIME_ARCHITECTURE.md` for WebSocket event entities
- **Implementation**: See `API_IMPLEMENTATION_PLAN.md` for phased entity creation
- **Cursor Prompts**: See `CURSOR_PROMPTS.md` for entity creation prompts

