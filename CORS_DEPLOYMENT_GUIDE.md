# CORS Fix for PATCH Requests - Deployment Guide

## Problem
PATCH requests were being blocked by CORS when deployed to Vercel, even though they worked locally.

## Solution Applied

### 1. Enhanced CORS Configuration in `src/main.ts`
- Added comprehensive CORS configuration with explicit PATCH method support
- Added Fastify hooks to handle CORS headers at the server level
- Added serverless-level CORS handling in the Vercel handler

### 2. Updated `vercel.json`
- Added explicit CORS headers at the Vercel routing level
- Ensured PATCH method is included in allowed methods

### 3. Multi-Layer CORS Protection
The solution now handles CORS at three levels:
1. **Vercel Level**: Routes and headers in `vercel.json`
2. **Serverless Handler Level**: CORS handling in the main handler function
3. **NestJS Level**: Application-level CORS configuration

## Files Modified

### `src/main.ts`
- Enhanced `app.enableCors()` configuration
- Added Fastify hooks for CORS handling
- Added serverless-level OPTIONS handling

### `vercel.json`
- Added CORS headers to route configuration
- Explicitly included PATCH in allowed methods

## Testing

### Local Testing
```bash
# Start the development server
npm run start:dev

# Test CORS with the provided test script
node test-cors.js
```

### Production Testing
```bash
# Deploy to Vercel
npm run deploy

# Test your deployed API
curl -X OPTIONS https://your-app.vercel.app/users/USR-000001 \
  -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -H "Origin: https://your-frontend.com"

curl -X PATCH https://your-app.vercel.app/users/USR-000001 \
  -H "Content-Type: application/json" \
  -H "Origin: https://your-frontend.com" \
  -d '{"fullName": "Updated Name"}'
```

## Key CORS Headers Set

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD`
- `Access-Control-Allow-Headers: Content-Type, Authorization, Accept, Origin, X-Requested-With`
- `Access-Control-Max-Age: 86400`

## Troubleshooting

If you still experience CORS issues:

1. **Check browser developer tools** for specific CORS error messages
2. **Verify preflight requests** are returning 204 status
3. **Test with different origins** to ensure wildcard (*) is working
4. **Check Vercel function logs** for any server-side errors

## Security Note

The current configuration uses `Access-Control-Allow-Origin: *` which allows all origins. For production, consider restricting this to specific domains:

```typescript
origin: ['https://your-frontend.com', 'https://your-admin.com']
```

## Cleanup

After confirming the fix works, you can remove the test file:
```bash
rm test-cors.js
```
