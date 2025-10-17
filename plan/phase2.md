Here’s the **updated master prompt** you can drop into Cursor (or any AI-assisted code workspace) so it fully understands your fractional-token architecture.
It replaces the “1 row = 1 token” model with a clean, fractional ownership ledger while keeping every part of your NestJS + TypeORM stack consistent.

---

## ⚙️ HMR Backend – Fractional Token Model Prompt (v2)

```
You are a senior NestJS + TypeORM backend architect building the HMR Builders Tokenization Platform.

────────────────────────────
SYSTEM CONTEXT
────────────────────────────
HMR is a real-estate tokenization ecosystem.
Each property is split into a fixed conceptual supply of tokens (default 1000),
but ownership is tracked **fractionally**—users may own 0.1 token or 7.25 tokens.
All values are in **USDT** using DECIMAL(18,6).  
Neon Postgres is the database.

────────────────────────────
CORE MODULES
────────────────────────────
1. UsersModule – profile, role, activity
2. KycModule – identity docs and status
3. OrganizationsModule – developer / group
4. PropertiesModule – tokenized assets
5. WalletModule – user balances
6. TransactionsModule – immutable ledger
7. InvestmentsModule – fractional ownership + purchase logic
8. RewardsModule – ROI / yield distribution
9. PortfolioModule – aggregated dashboard

────────────────────────────
ENTITY MODEL (UPDATED)
────────────────────────────

### USERS
- id (uuid, PK)
- fullName, email(unique), phone?
- role(user|admin)
- isActive(bool)
- createdAt, updatedAt

### KYC_VERIFICATIONS
- id (uuid, PK)
- userId (FK users.id)
- type(cnic|passport|license|other)
- status(pending|verified|rejected)
- documentFrontUrl, documentBackUrl?, selfieUrl?
- reviewer?, rejectionReason?, metadata(jsonb)
- submittedAt, reviewedAt?

### ORGANIZATIONS
- id (uuid, PK)
- name(unique), description?, website?, logoUrl?
- createdAt, updatedAt

### PROPERTIES
- id (uuid, PK)
- organizationId (FK organizations.id)
- title, slug(unique), description?
- type(residential|commercial|mixed)
- status(planning|construction|active|onhold|soldout|completed)
- totalValueUSDT DECIMAL(18,6)
- totalTokens DECIMAL(18,6)  // conceptual supply (default 1000)
- availableTokens DECIMAL(18,6)
- pricePerTokenUSDT DECIMAL(18,6)
- expectedROI DECIMAL(5,2)
- city?, country?
- features JSONB  // amenities, unit types, metadata
- images JSONB
- createdAt, updatedAt

### WALLETS
- id (uuid, PK)
- userId (FK users.id)
- balanceUSDT DECIMAL(18,6)
- lockedUSDT DECIMAL(18,6)
- totalDepositedUSDT DECIMAL(18,6)
- totalWithdrawnUSDT DECIMAL(18,6)
- createdAt, updatedAt

### TRANSACTIONS
- id (uuid, PK)
- userId (FK users.id)
- walletId (FK wallets.id)
- type(deposit|withdrawal|investment|return|fee|reward)
- amountUSDT DECIMAL(18,6)
- status(pending|completed|failed)
- referenceId?, description?, metadata JSONB?
- createdAt

### INVESTMENTS  (fractional ownership ledger)
- id (uuid, PK)
- userId (FK users.id)
- propertyId (FK properties.id)
- tokensPurchased DECIMAL(18,6)
- amountUSDT DECIMAL(18,6)
- status(pending|confirmed|active|sold|cancelled)
- paymentStatus(pending|completed|failed)
- expectedROI DECIMAL(5,2)
- createdAt, updatedAt

### REWARDS
- id (uuid, PK)
- userId (FK users.id)
- investmentId (FK investments.id)
- amountUSDT DECIMAL(18,6)
- type(roi|referral|bonus)
- description?, status(pending|distributed)
- createdAt

### PORTFOLIO
- id (uuid, PK)
- userId (FK users.id)
- totalInvestedUSDT DECIMAL(18,6)
- totalRewardsUSDT DECIMAL(18,6)
- totalROIUSDT DECIMAL(18,6)
- activeInvestments INT
- lastUpdated timestamp

────────────────────────────
DATA FLOW
────────────────────────────

**1. Organization → Property**
- Admin creates organization, then property.
- Backend computes pricePerTokenUSDT = totalValueUSDT / totalTokens.
- availableTokens initialized = totalTokens.

**2. User → Wallet + KYC**
- User created via Neon Auth.
- Wallet auto-created (balance = 0).
- KYC handled separately.

**3. Deposit**
- User deposits USDT → wallet.balanceUSDT += amount.
- Transaction(type = deposit) inserted.

**4. Investment (Fractional Tokens)**
Request:
```

POST /investments
{ userId, propertyId, amountUSDT }

```
Flow:
1. Fetch wallet + property with `pessimistic_write` locks.
2. Calculate tokens = amountUSDT / pricePerTokenUSDT.
3. Ensure property.availableTokens ≥ tokens.
4. property.availableTokens -= tokens.
5. wallet.balanceUSDT -= amountUSDT.
6. Insert investment(tokensPurchased = tokens, amountUSDT = amount).
7. Insert transaction(type = investment).
8. Commit transaction.

No physical token rows; ownership is numeric.

**5. ROI / Rewards**
Admin or cron runs ROI distribution:
```

roiShare = (tokensOwned / totalTokens) * totalROI

```
- Insert reward rows.
- Credit wallet.balanceUSDT += roiShare.
- Insert transaction(type = reward).

**6. Withdrawals**
- Validate balance ≥ request.
- Deduct, insert transaction(type = withdrawal).

**7. Portfolio Updates**
Background worker aggregates totals from investments + rewards.

────────────────────────────
TEST DATA EXAMPLE
────────────────────────────
Organization: “HMR Builders”
Property: “Marina View Residences”
totalValueUSDT = 1 000 000 USDT  
totalTokens = 1000 → pricePerTokenUSDT = 1000 USDT  
availableTokens = 1000

Users:
Ali Khan (5000 USDT wallet)  
Sara Ahmed (2000 USDT wallet)

Investments:
Ali → 2.5 tokens (2500 USDT)  
Sara → 1.25 tokens (1250 USDT)  
Property.availableTokens = 996.25  

ROI 10 % = 100 000 USDT total  
Ali gets 250 USDT, Sara 125 USDT → rewards inserted + wallets credited.

────────────────────────────
OBJECTIVE
────────────────────────────
Generate:
• TypeORM entities reflecting this fractional model  
• PropertyService that auto-computes pricePerToken  
• InvestmentService that performs atomic investment transactions  
• RewardService that distributes ROI fractionally  
• Proper DTOs and validation decorators  
• Seed/test data consistent with flow above

────────────────────────────
CODING STANDARDS
────────────────────────────
• Use NestJS DI and `TypeOrmModule.forFeature()`
• `synchronize: false`
• Use `DataSource.transaction()` for multi-table writes
• All timestamps are `timestamptz`
• Keep financial precision with DECIMAL(18,6)
• Enforce FK constraints and indexes on (userId, propertyId)
• Return structured DTO responses for APIs
```

---

That’s the version you feed directly to Cursor.
It knows:

* Tokens are **conceptual**, not discrete.
* Ownership is **fractional** and numeric.
* Wallet, investment, and property balances must stay in perfect sync inside transactions.

Next step (if you want): I can write you the **exact Phase-4 Cursor prompt** to build out the InvestmentService + ROI logic using this schema.
