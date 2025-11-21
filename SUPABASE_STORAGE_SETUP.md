# Supabase Storage Setup Guide

## 📦 Required Buckets

1. **`certificates`** - Private bucket for transaction/portfolio certificates
2. **`property-documents`** - Public/Private bucket for property legal docs
3. **`assets`** - Public bucket for certificate stamps/logos

---

## 🚀 Quick Setup Steps

### Step 1: Create Buckets in Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** → **Buckets**
4. Click **"New bucket"** for each:

#### Bucket 1: `certificates`
- **Name:** `certificates`
- **Public:** ❌ **NO** (Private)
- **File size limit:** 10 MB (or your preference)
- **Allowed MIME types:** `application/pdf`

#### Bucket 2: `property-documents`
- **Name:** `property-documents`
- **Public:** ✅ **YES** (or NO if you want private)
- **File size limit:** 10 MB
- **Allowed MIME types:** `application/pdf`

#### Bucket 3: `assets`
- **Name:** `assets`
- **Public:** ✅ **YES** (Must be public)
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/png,image/jpeg,image/jpg`

---

### Step 2: Set Up Storage Policies

**Option A: Using SQL Editor (Recommended)**

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the SQL from `supabase-storage-policies.sql`
3. Click **"Run"**

**Option B: Using Dashboard UI**

1. Go to **Storage** → **Policies**
2. For each bucket, create policies:
   - **certificates:** Service role only (private)
   - **property-documents:** Public read, service role write
   - **assets:** Public read, service role write

---

### Step 3: Upload Assets

1. Go to **Storage** → **Buckets** → **assets**
2. Create folder: `stamps/`
3. Upload:
   - `secp.png` (SECP stamp/logo)
   - `sbp.png` (SBP stamp/logo)

---

## 🔐 Do You Need Policies?

### ✅ **YES, if:**
- You want to allow direct client-side access
- You want an extra security layer
- You want to restrict access even with service role key
- You want public access to certain files

### ❌ **NO, if:**
- You're only using service role key (backend only)
- All access goes through your backend API
- You don't need direct client access

**Note:** Since your backend uses `SUPABASE_SERVICE_ROLE_KEY`, it bypasses RLS policies. However, policies are still recommended for:
- Security best practices
- Future-proofing
- Allowing direct client access if needed

---

## 📋 Policy Summary

### `certificates` Bucket (Private)
- ✅ Service role: Full access (upload, read, update, delete)
- ❌ Public: No access
- ✅ Access via: Backend API → Signed URLs

### `property-documents` Bucket (Public)
- ✅ Public: Read access
- ✅ Service role: Full access (upload, read, update, delete)
- ✅ Access via: Public URLs or Backend API

### `assets` Bucket (Public)
- ✅ Public: Read access
- ✅ Service role: Full access (upload, read, update, delete)
- ✅ Access via: Public URLs

---

## 🧪 Testing

### Test 1: Upload Certificate (Backend)
```bash
# This should work if service role key is set
# Backend will upload via service role key
```

### Test 2: Access Public Asset
```bash
# Should work if assets bucket is public
curl https://klglyxwyrjtjsxfzbzfv.supabase.co/storage/v1/object/public/assets/stamps/secp.png
```

### Test 3: Generate Signed URL (Backend)
```bash
# Backend generates signed URL for private certificates
# This should work if service role key is set
```

---

## ⚠️ Troubleshooting

### Error: "Bucket not found"
**Solution:** Create the bucket in Supabase Dashboard

### Error: "Access denied"
**Solution:** 
- Check service role key is set in `.env`
- Verify bucket exists
- Check policies are created

### Error: "Policy already exists"
**Solution:** 
```sql
DROP POLICY IF EXISTS "policy_name" ON storage.objects;
```
Then recreate the policy.

### Assets not loading
**Solution:**
- Ensure `assets` bucket is **PUBLIC**
- Check file paths match: `assets/stamps/secp.png`
- Verify files are uploaded

---

## 📝 Environment Variables

Make sure these are set in your `.env`:

```env
SUPABASE_URL=https://klglyxwyrjtjsxfzbzfv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ASSETS_BUCKET=assets
SUPABASE_CERTIFICATES_BUCKET=certificates
SUPABASE_PROPERTY_DOCUMENTS_BUCKET=property-documents
```

---

## ✅ Checklist

- [ ] All 3 buckets created
- [ ] Buckets have correct public/private settings
- [ ] Storage policies created (optional but recommended)
- [ ] Assets uploaded (`stamps/secp.png`, `stamps/sbp.png`)
- [ ] Service role key set in `.env`
- [ ] Test upload works
- [ ] Test public URL access works
- [ ] Test signed URL generation works

---

**You're all set! The policies are optional but recommended for security and flexibility.**

