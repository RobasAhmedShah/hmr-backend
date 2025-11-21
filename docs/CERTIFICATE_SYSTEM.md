# PDF Certificate System Documentation

## Overview

This system generates and manages PDF certificates for:
1. **Property Legal Documents** - Uploaded by admin (stored in Supabase)
2. **Transaction Certificates** - Auto-generated when users buy tokens
3. **Portfolio Summary Certificates** - Generated on-demand for user's property holdings

## Architecture

### Storage
- **Supabase Storage** - All PDFs stored in Supabase buckets
- **Database** - Certificate paths stored in PostgreSQL

### Flow
1. PDF generated using Puppeteer (HTML → PDF)
2. Uploaded to Supabase Storage
3. Path saved to database
4. Signed URLs generated for mobile app access

## Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://klglyxwyrjtjsxfzbzfv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Supabase Storage Buckets
SUPABASE_ASSETS_BUCKET=assets
SUPABASE_CERTIFICATES_BUCKET=certificates
SUPABASE_PROPERTY_DOCUMENTS_BUCKET=property-documents
```

**Important:** You need the **SERVICE_ROLE_KEY** (not publishable/secret key) for backend operations.

To get it:
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (keep it secret!)

## API Endpoints

### Mobile App Endpoints

#### 1. Get Transaction Certificate
```
GET /api/mobile/certificates/transactions/:transactionId
```
Returns signed URL for transaction certificate PDF.

#### 2. Get Property Legal Document
```
GET /api/mobile/certificates/properties/:propertyId/legal-document
```
Returns signed URL for property legal document PDF.

#### 3. Generate Portfolio Summary
```
GET /api/mobile/certificates/portfolio/:propertyId
```
Generates and returns signed URL for portfolio summary PDF.

## Auto-Generation

Transaction certificates are **automatically generated** when:
- User completes an investment
- Investment transaction is created
- `CertificateListener` handles the `investment.completed` event

## Database Schema

### New Columns Added

**transactions table:**
- `certificate_path` (TEXT, nullable) - Path to certificate PDF in Supabase

**investments table:**
- `certificate_path` (TEXT, nullable) - Path to certificate PDF in Supabase

**properties table:**
- `legal_doc_path` (TEXT, nullable) - Path to legal document PDF in Supabase

## File Structure

```
src/
├── certificates/
│   ├── certificates.module.ts
│   ├── certificates.service.ts
│   └── templates/
│       ├── transaction-certificate.ejs
│       └── portfolio-summary.ejs
├── pdf/
│   ├── pdf.module.ts
│   └── pdf.service.ts
├── supabase/
│   ├── supabase.module.ts
│   └── supabase.service.ts
└── mobile-certificates/
    ├── mobile-certificates.module.ts
    └── mobile-certificates.controller.ts
```

## Supabase Storage Structure

```
assets/ (public)
└── stamps/
    ├── secp.png
    └── sbp.png

certificates/ (private)
├── transactions/
│   └── USER_ID/
│       └── TRANS_ID.pdf
└── portfolio/
    └── USER_ID/
        └── PROPERTY_ID.pdf

property-documents/ (public)
└── PROPERTY_ID.pdf
```

## Testing

1. Make an investment → Certificate auto-generated
2. Call `GET /api/mobile/certificates/transactions/:id` → Get PDF URL
3. Call `GET /api/mobile/certificates/portfolio/:propertyId` → Generate summary PDF

## Notes

- Certificates are generated asynchronously (non-blocking)
- Signed URLs expire after 1 hour (configurable)
- PDFs include SECP and SBP official stamps
- All certificates are stored in private bucket for security

