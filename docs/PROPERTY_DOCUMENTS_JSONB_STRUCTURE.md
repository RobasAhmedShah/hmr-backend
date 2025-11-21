# Property Documents JSONB Structure

## Overview
The `documents` column in the `properties` table is a JSONB column that stores an array of property document metadata.

## JSONB Structure

### Recommended Structure (Array of Objects)

```json
[
  {
    "name": "Property Deed",
    "type": "PDF",
    "verified": true,
    "url": "https://supabase.co/storage/v1/object/public/property-documents/property-123/deed.pdf"
  },
  {
    "name": "Appraisal Report",
    "type": "PDF",
    "verified": true,
    "url": "https://supabase.co/storage/v1/object/public/property-documents/property-123/appraisal.pdf"
  },
  {
    "name": "Legal Opinion",
    "type": "PDF",
    "verified": false,
    "url": "https://supabase.co/storage/v1/object/public/property-documents/property-123/legal.pdf"
  }
]
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name of the document (e.g., "Property Deed", "Appraisal Report") |
| `type` | string | No | Document type (default: "PDF") |
| `verified` | boolean | No | Whether the document is verified (default: true) |
| `url` | string | No | Public URL to the document file (can be Supabase Storage URL or external URL) |

### Alternative Structure (Object with Items)

If you prefer a nested structure, you can also use:

```json
{
  "items": [
    {
      "name": "Property Deed",
      "type": "PDF",
      "verified": true,
      "url": "https://..."
    }
  ]
}
```

The backend will automatically extract the array from `items`, `list`, or `docs` properties if the root is an object.

## Example SQL Insert/Update

### Insert with Documents

```sql
INSERT INTO properties (
  "displayCode",
  "organizationId",
  "title",
  "slug",
  "documents",
  -- ... other fields
) VALUES (
  'PROP-000001',
  'org-uuid-here',
  'Sample Property',
  'sample-property',
  '[
    {
      "name": "Property Deed",
      "type": "PDF",
      "verified": true,
      "url": "https://supabase.co/storage/v1/object/public/property-documents/prop-123/deed.pdf"
    },
    {
      "name": "Appraisal Report",
      "type": "PDF",
      "verified": true,
      "url": "https://supabase.co/storage/v1/object/public/property-documents/prop-123/appraisal.pdf"
    }
  ]'::jsonb,
  -- ... other values
);
```

### Update Documents

```sql
UPDATE properties
SET documents = '[
  {
    "name": "Property Deed",
    "type": "PDF",
    "verified": true,
    "url": "https://supabase.co/storage/v1/object/public/property-documents/prop-123/deed.pdf"
  }
]'::jsonb
WHERE id = 'property-uuid-here';
```

### Set Documents to NULL (will use fallback in frontend)

```sql
UPDATE properties
SET documents = NULL
WHERE id = 'property-uuid-here';
```

## Frontend Fallback Behavior

If the `documents` field is:
- `NULL`
- `undefined`
- Empty array `[]`
- Not an array

The frontend will automatically use fallback documents:
- Property Deed
- Appraisal Report
- Legal Opinion

All with placeholder URLs pointing to a dummy PDF.

## Best Practices

1. **Always use an array** - The frontend expects an array of document objects
2. **Include URLs** - While optional, documents without URLs will use a placeholder
3. **Use Supabase Storage URLs** - Store actual PDFs in Supabase Storage and use public URLs
4. **Set verified status** - Mark documents as verified when they've been reviewed
5. **Use descriptive names** - Clear document names help users understand what they're viewing

## Supabase Storage Integration

Documents should be stored in the `property-documents` bucket with a structure like:

```
property-documents/
  {propertyId}/
    deed.pdf
    appraisal.pdf
    legal.pdf
```

Then use the public URL format:
```
https://{project-ref}.supabase.co/storage/v1/object/public/property-documents/{propertyId}/{filename}.pdf
```

