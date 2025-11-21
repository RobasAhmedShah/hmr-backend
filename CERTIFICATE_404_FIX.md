# Certificate API 404 Error - Diagnosis & Fix

## 🔍 Problem Analysis

**Error:** HTTP 404 when clicking "View Certificate" on completed investment transactions

**Possible Causes:**
1. ❌ Backend server not running or not accessible
2. ❌ API URL mismatch (mobile app pointing to wrong backend)
3. ❌ Transaction ID format mismatch
4. ❌ Transaction not found in database
5. ❌ Missing relations (user, property) on transaction

---

## ✅ Fixes Applied

### 1. Improved Error Handling in Controller
- Added better error logging
- More descriptive error messages
- Better transaction lookup with UUID/displayCode support

### 2. Improved Certificate Service
- Added UUID/displayCode support in `getTransactionCertificate`
- Better logging for debugging
- Proper transaction lookup before certificate generation

---

## 🔧 Verification Steps

### Step 1: Check Backend URL
**Mobile App Config:** `Blocks-App/app.json`
```json
"apiUrl": "https://blocks-backend.vercel.app"
```

**For Local Testing:**
- Change to: `"apiUrl": "http://localhost:3000"` (for local dev)
- Or: `"apiUrl": "http://YOUR_IP:3000"` (for device testing)

### Step 2: Verify Backend is Running
```bash
cd Blocks-Backend
npm run start:dev
```

Check if server starts on port 3000.

### Step 3: Test API Endpoint Directly
```bash
# Test with a real transaction ID
curl http://localhost:3000/api/mobile/certificates/transactions/YOUR_TRANSACTION_ID
```

### Step 4: Check Transaction in Database
```sql
-- Check if transaction exists
SELECT id, "displayCode", type, status, "userId", "propertyId" 
FROM transactions 
WHERE type = 'investment' AND status = 'completed'
LIMIT 5;
```

### Step 5: Verify Transaction Has Relations
```sql
-- Check if transaction has user and property
SELECT 
  t.id,
  t."displayCode",
  t."userId",
  t."propertyId",
  u.id as user_exists,
  p.id as property_exists
FROM transactions t
LEFT JOIN users u ON u.id = t."userId"
LEFT JOIN properties p ON p.id = t."propertyId"
WHERE t.type = 'investment' AND t.status = 'completed'
LIMIT 5;
```

---

## 🐛 Common Issues

### Issue 1: Backend Not Running
**Symptom:** 404 or connection error
**Solution:** Start backend server

### Issue 2: Wrong API URL
**Symptom:** 404 on all requests
**Solution:** Update `app.json` with correct backend URL

### Issue 3: Transaction Not Found
**Symptom:** 404 with "Transaction not found" message
**Solution:** 
- Verify transaction exists in database
- Check transaction ID format (UUID vs displayCode)
- Ensure transaction has `userId` and `propertyId`

### Issue 4: Missing Relations
**Symptom:** 404 when generating certificate
**Solution:**
- Ensure transaction has associated user
- Ensure transaction has associated property
- Check foreign key constraints

### Issue 5: Supabase Not Configured
**Symptom:** 500 error when generating certificate
**Solution:**
- Check Supabase environment variables
- Verify Supabase buckets exist
- Check service role key

---

## 📝 Testing Checklist

- [ ] Backend server is running
- [ ] API URL is correct in `app.json`
- [ ] Transaction exists in database
- [ ] Transaction has `userId` and `propertyId`
- [ ] Transaction type is 'investment'
- [ ] Transaction status is 'completed'
- [ ] Supabase is configured
- [ ] Test endpoint directly with curl/Postman

---

## 🔍 Debug Logging

The updated code now includes better logging:
- Transaction lookup attempts
- Certificate generation steps
- Error details

Check backend console logs when testing.

---

## 🚀 Next Steps

1. **Verify Backend URL** - Make sure mobile app points to correct backend
2. **Check Backend Logs** - Look for error messages when clicking "View Certificate"
3. **Test with Real Transaction ID** - Use a transaction ID from your database
4. **Check Database** - Verify transaction exists and has required relations

---

**The fixes are applied. Now test again and check the backend logs for detailed error messages!**

