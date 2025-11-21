# Certificate System Testing Guide

## ✅ Fixed Issues

1. **TypeScript Import Error** - Fixed `certificate.listener.ts` to use `import type` for `InvestmentCompletedEvent`

## 🧪 Testing Steps

### Prerequisites

1. ✅ Server is running (`npm start` or `npm run start:dev`)
2. ✅ Environment variables are set in `.env`:
   ```env
   SUPABASE_URL=https://klglyxwyrjtjsxfzbzfv.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_ASSETS_BUCKET=assets
   SUPABASE_CERTIFICATES_BUCKET=certificates
   SUPABASE_PROPERTY_DOCUMENTS_BUCKET=property-documents
   ```
3. ✅ Supabase buckets exist:
   - `assets` (public) - for stamps
   - `certificates` (private) - for generated PDFs
   - `property-documents` (public) - for property legal docs

### Test 1: Get Transaction Certificate

**Endpoint:** `GET /api/mobile/certificates/transactions/{transactionId}`

**Steps:**
1. Get a JWT token by logging in:
   ```bash
   POST http://localhost:3000/api/mobile/auth/login
   Content-Type: application/json
   
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```

2. Copy the `token` from the response

3. Get a transaction ID from your database (investment transaction)

4. Request the certificate:
   ```bash
   GET http://localhost:3000/api/mobile/certificates/transactions/{transactionId}
   Authorization: Bearer {your-jwt-token}
   ```

**Expected Response:**
```json
{
  "success": true,
  "transactionId": "uuid-here",
  "pdfUrl": "https://...signed-url..."
}
```

**What Happens:**
- If certificate doesn't exist, it's auto-generated
- PDF is uploaded to Supabase: `certificates/transactions/{userId}/{transactionId}.pdf`
- Signed URL is returned (expires in 1 hour)

### Test 2: Get Property Legal Document

**Endpoint:** `GET /api/mobile/certificates/properties/{propertyId}/legal-document`

**Steps:**
1. Use the same JWT token from Test 1
2. Get a property ID from your database
3. Request the legal document:
   ```bash
   GET http://localhost:3000/api/mobile/certificates/properties/{propertyId}/legal-document
   Authorization: Bearer {your-jwt-token}
   ```

**Expected Response:**
```json
{
  "success": true,
  "propertyId": "uuid-here",
  "pdfUrl": "https://...signed-url..."
}
```

**Note:** This requires a legal document to be uploaded to Supabase `property-documents` bucket. If not found, you'll get a 404.

### Test 3: Generate Portfolio Summary Certificate

**Endpoint:** `GET /api/mobile/certificates/portfolio/{propertyId}`

**Steps:**
1. Use the same JWT token
2. Get a property ID where the logged-in user has investments
3. Request the portfolio summary:
   ```bash
   GET http://localhost:3000/api/mobile/certificates/portfolio/{propertyId}
   Authorization: Bearer {your-jwt-token}
   ```

**Expected Response:**
```json
{
  "success": true,
  "propertyId": "uuid-here",
  "pdfUrl": "https://...signed-url...",
  "certificatePath": "portfolio/{userId}/{propertyId}.pdf"
}
```

**What Happens:**
- Aggregates all user's investments in the property
- Generates PDF with transaction history
- Uploads to Supabase: `certificates/portfolio/{userId}/{propertyId}.pdf`
- Returns signed URL

### Test 4: Auto-Generation (Investment Flow)

**Steps:**
1. Make an investment:
   ```bash
   POST http://localhost:3000/api/mobile/investments
   Authorization: Bearer {your-jwt-token}
   Content-Type: application/json
   
   {
     "propertyId": "property-uuid",
     "tokenCount": 2.5
   }
   ```

2. Wait a few seconds for the certificate to be generated (async)

3. Get the transaction ID from the investment response

4. Request the certificate (should already exist):
   ```bash
   GET http://localhost:3000/api/mobile/certificates/transactions/{transactionId}
   Authorization: Bearer {your-jwt-token}
   ```

**What Happens:**
- Investment is created
- Transaction is created
- `investment.completed` event is emitted
- `CertificateListener` catches the event
- Certificate is auto-generated in the background
- PDF is uploaded to Supabase

## 📋 Test Checklist

- [ ] Server starts without errors
- [ ] Login endpoint works and returns JWT token
- [ ] Transaction certificate endpoint returns PDF URL
- [ ] Property legal document endpoint works (or returns 404 if no doc)
- [ ] Portfolio summary endpoint generates PDF
- [ ] Auto-generation works after investment
- [ ] PDF URLs are accessible and open correctly
- [ ] Signed URLs expire after 1 hour

## 🔍 Verification

After getting a PDF URL, verify:
1. URL is accessible (opens in browser)
2. PDF contains correct information
3. PDF includes SECP/SBP stamps (if uploaded)
4. PDF is properly formatted

## 🐛 Troubleshooting

### Error: "Supabase URL and Service Role Key must be configured"
- Check `.env` file has correct variable names
- Restart server after adding env vars

### Error: "Failed to upload certificate"
- Verify `certificates` bucket exists in Supabase
- Check bucket permissions (should be private)
- Verify SERVICE_ROLE_KEY is correct

### Error: "Transaction not found"
- Use valid transaction ID
- Ensure transaction belongs to logged-in user

### Error: "No investments found"
- User must have investments in the property
- Check investments table in database

### PDF generation fails
- Check Puppeteer is installed
- On some systems, may need additional dependencies
- Check server logs for detailed error

## 📝 Test Results Template

```
Test Date: ___________
Server Status: [ ] Running [ ] Error
Environment: [ ] Configured [ ] Missing vars

Test 1 - Transaction Certificate:
- Status: [ ] Pass [ ] Fail
- Response: ___________
- PDF URL: ___________
- Notes: ___________

Test 2 - Property Legal Document:
- Status: [ ] Pass [ ] Fail
- Response: ___________
- PDF URL: ___________
- Notes: ___________

Test 3 - Portfolio Summary:
- Status: [ ] Pass [ ] Fail
- Response: ___________
- PDF URL: ___________
- Notes: ___________

Test 4 - Auto-Generation:
- Status: [ ] Pass [ ] Fail
- Certificate Generated: [ ] Yes [ ] No
- Time Taken: ___________
- Notes: ___________
```

