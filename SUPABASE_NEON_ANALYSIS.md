# Supabase & Neon Database Analysis for Certificate APIs

## ✅ Analysis Complete

---

## 📊 Neon Database Analysis

### Project Details:
- **Project ID:** `frosty-frost-91275260`
- **Project Name:** HMR
- **Database:** PostgreSQL 18
- **Region:** AWS ap-southeast-1
- **Status:** ✅ Active and Ready

---

## ✅ Database Schema Verification

### 1. **transactions** Table
**Status:** ✅ **READY**

**Required Column:**
- ✅ `certificatePath` (text, nullable) - **EXISTS**
  - Used to store path to transaction certificate PDF in Supabase
  - Path format: `transactions/{userId}/{transactionId}.pdf`

**Other Relevant Columns:**
- ✅ `id` (uuid) - Primary key
- ✅ `displayCode` (varchar) - For lookup by display code
- ✅ `userId` (uuid) - Foreign key to users
- ✅ `propertyId` (uuid) - Foreign key to properties
- ✅ `status` (varchar) - Transaction status
- ✅ `type` (varchar) - Transaction type

**Indexes:**
- ✅ Indexed on `id`, `displayCode`, `userId`, `propertyId`

---

### 2. **properties** Table
**Status:** ✅ **READY**

**Required Column:**
- ✅ `legalDocPath` (text, nullable) - **EXISTS**
  - Used to store path to property legal document PDF in Supabase
  - Path format: `{propertyId}.pdf` in `property-documents` bucket

**Other Relevant Columns:**
- ✅ `id` (uuid) - Primary key
- ✅ `displayCode` (varchar) - For lookup by display code
- ✅ `documents` (jsonb) - Property documents metadata

**Indexes:**
- ✅ Indexed on `id`, `displayCode`

---

### 3. **investments** Table
**Status:** ✅ **READY**

**Required Column:**
- ✅ `certificatePath` (text, nullable) - **EXISTS**
  - Used to store path to portfolio summary certificate PDF in Supabase
  - Path format: `portfolio/{userId}/{propertyId}.pdf`

**Other Relevant Columns:**
- ✅ `id` (uuid) - Primary key
- ✅ `userId` (uuid) - Foreign key to users
- ✅ `propertyId` (uuid) - Foreign key to properties
- ✅ `tokensPurchased` (numeric) - For portfolio summary
- ✅ `amountUSDT` (numeric) - For portfolio summary

**Indexes:**
- ✅ Indexed on `id`, `userId`, `propertyId`

---

## 🔍 Supabase Configuration Analysis

### Supabase URL Found:
```
https://klglyxwyrjtjsxfzbzfv.supabase.co
```

### Required Environment Variables:
```env
SUPABASE_URL=https://klglyxwyrjtjsxfzbzfv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_ASSETS_BUCKET=assets
SUPABASE_CERTIFICATES_BUCKET=certificates
SUPABASE_PROPERTY_DOCUMENTS_BUCKET=property-documents
```

---

## 📦 Required Supabase Buckets

### 1. **certificates** Bucket
**Purpose:** Store generated certificate PDFs
**Required:** ✅ **MUST EXIST**

**Storage Structure:**
```
certificates/
  ├── transactions/
  │   └── {userId}/
  │       └── {transactionId}.pdf
  └── portfolio/
      └── {userId}/
          └── {propertyId}.pdf
```

**Permissions:**
- Should be **PRIVATE** (use signed URLs for access)
- Service role key required for uploads

---

### 2. **property-documents** Bucket
**Purpose:** Store property legal documents
**Required:** ✅ **MUST EXIST**

**Storage Structure:**
```
property-documents/
  └── {propertyId}.pdf
```

**Permissions:**
- Can be **PUBLIC** or **PRIVATE**
- If private, use signed URLs
- If public, use `getPropertyDocumentUrl()`

---

### 3. **assets** Bucket
**Purpose:** Store certificate assets (stamps, watermarks)
**Required:** ✅ **MUST EXIST**

**Storage Structure:**
```
assets/
  └── stamps/
      ├── secp.png
      └── sbp.png
```

**Permissions:**
- Should be **PUBLIC** (accessed via public URLs)

---

## ⚠️ Verification Checklist

### Database ✅
- [x] `transactions.certificatePath` column exists
- [x] `properties.legalDocPath` column exists
- [x] `investments.certificatePath` column exists
- [x] All foreign keys properly configured
- [x] Indexes on lookup columns

### Supabase Configuration ⚠️
- [ ] **VERIFY:** `certificates` bucket exists
- [ ] **VERIFY:** `property-documents` bucket exists
- [ ] **VERIFY:** `assets` bucket exists
- [ ] **VERIFY:** `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- [ ] **VERIFY:** Service role key has proper permissions

---

## 🔧 Setup Instructions

### Step 1: Verify Supabase Buckets

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (URL: `klglyxwyrjtjsxfzbzfv.supabase.co`)
3. Navigate to **Storage** → **Buckets**
4. Verify these buckets exist:
   - ✅ `certificates`
   - ✅ `property-documents`
   - ✅ `assets`

### Step 2: Create Missing Buckets (if needed)

If any bucket is missing:

1. Click **"New bucket"**
2. Enter bucket name (e.g., `certificates`)
3. Set visibility:
   - `certificates` → **Private**
   - `property-documents` → **Public** (or Private with signed URLs)
   - `assets` → **Public**
4. Click **"Create bucket"**

### Step 3: Upload Assets

1. Go to `assets` bucket
2. Create folder: `stamps/`
3. Upload:
   - `secp.png` (SECP stamp/logo)
   - `sbp.png` (SBP stamp/logo)

### Step 4: Verify Service Role Key

1. Go to **Settings** → **API**
2. Copy **Service Role Key** (keep it secret!)
3. Add to `.env` file:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 5: Test Bucket Access

Run this in your backend to test:
```typescript
// Test Supabase connection
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test bucket access
const { data, error } = await supabase.storage
  .from('certificates')
  .list('', { limit: 1 });

if (error) {
  console.error('Bucket access error:', error);
} else {
  console.log('✅ Bucket access OK');
}
```

---

## 🚨 Potential Issues

### Issue 1: Buckets Don't Exist
**Symptom:** `Failed to upload certificate to Supabase: Bucket not found`
**Solution:** Create the required buckets in Supabase dashboard

### Issue 2: Service Role Key Missing/Invalid
**Symptom:** `Supabase URL and Service Role Key must be configured`
**Solution:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` file

### Issue 3: Bucket Permissions
**Symptom:** `Failed to upload certificate: Access denied`
**Solution:** Ensure service role key has write permissions to buckets

### Issue 4: Assets Missing
**Symptom:** Certificate PDFs generated but stamps/logos missing
**Solution:** Upload `secp.png` and `sbp.png` to `assets/stamps/` bucket

---

## ✅ Summary

### Database Status: ✅ **READY**
- All required columns exist
- Foreign keys properly configured
- Indexes in place

### Supabase Status: ⚠️ **NEEDS VERIFICATION**
- URL configured: `https://klglyxwyrjtjsxfzbzfv.supabase.co`
- **Action Required:** Verify buckets exist and service role key is set

---

## 📝 Next Steps

1. ✅ **Database is ready** - No changes needed
2. ⚠️ **Verify Supabase buckets** - Check dashboard
3. ⚠️ **Verify service role key** - Check `.env` file
4. ⚠️ **Upload assets** - Add stamp images if missing
5. ✅ **Test certificate generation** - Run API tests

---

**All database requirements are met! Just need to verify Supabase buckets and configuration.** 🎉

