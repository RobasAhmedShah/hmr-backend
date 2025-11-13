# Mobile Authentication Setup

## Overview

Traditional JWT-based authentication for the Blocks mobile app backend. This implementation provides email/password authentication with optional global enable/disable flag.

## Features

- ✅ Email/password authentication
- ✅ JWT access tokens and refresh tokens
- ✅ Global auth enable/disable flag (`ENABLE_AUTH`)
- ✅ Public route decorator (`@Public()`)
- ✅ Auto-creation of Wallet, KYC, and Portfolio on registration
- ✅ Password hashing with bcrypt

## Environment Variables

Add these to your `.env` file:

```env
# Authentication Toggle
ENABLE_AUTH=true  # Set to 'false' to disable all authentication globally

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_REFRESH_SECRET=your-refresh-secret-key  # Optional, defaults to JWT_SECRET
```

### ENABLE_AUTH Flag

- **`ENABLE_AUTH=true`** (default): Authentication is required for protected routes
- **`ENABLE_AUTH=false`**: All routes are accessible without authentication (useful for development/testing)

When `ENABLE_AUTH=false`:
- All `@UseGuards(JwtAuthGuard)` are bypassed
- Routes marked with `@Public()` are still accessible
- `req.user` will be `undefined` in protected routes

## API Endpoints

### POST /api/mobile/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890"  // Optional
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "displayCode": "USR-000001",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-01-12T10:00:00Z"
  },
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

**Auto-Created:**
- Wallet (with 0 balance)
- KYC verification (pending status)
- Portfolio (with 0 values)

### POST /api/mobile/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### POST /api/mobile/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "token": "new_jwt_access_token",
  "refreshToken": "new_jwt_refresh_token"
}
```

### POST /api/mobile/auth/logout
Logout (protected endpoint).

**Headers:**
```
Authorization: Bearer <jwt_access_token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/mobile/auth/me
Get current user information (protected endpoint).

**Headers:**
```
Authorization: Bearer <jwt_access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "displayCode": "USR-000001",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "user",
  "isActive": true,
  ...
}
```

## Usage in Controllers

### Protect Entire Controller
```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../mobile-auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../admin/entities/user.entity';

@Controller('api/mobile/investments')
@UseGuards(JwtAuthGuard)  // All routes require auth
export class MobileInvestmentsController {
  
  @Get()
  async getMyInvestments(@CurrentUser() user: User) {
    return this.service.findByUserId(user.id);
  }
}
```

### Public Routes
```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('api/mobile/properties')
export class MobilePropertiesController {
  
  @Get()
  @Public()  // This route is public (no auth required)
  async getAllProperties() {
    return this.service.findAll();
  }
}
```

### Mixed Routes
```typescript
@Controller('api/mobile/properties')
export class MobilePropertiesController {
  
  @Get()
  @Public()  // Public route
  async getAllProperties() {
    return this.service.findAll();
  }
  
  @Get('my-bookmarks')
  @UseGuards(JwtAuthGuard)  // Protected route
  async getMyBookmarks(@CurrentUser() user: User) {
    return this.service.findByUserId(user.id);
  }
}
```

## Database Migration

Run the migration to add the password field:

```bash
# Using psql
psql -U your_user -d your_database -f database/migrations/add-password-to-users.sql

# Or manually
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## Testing

### With Authentication Enabled (ENABLE_AUTH=true)

1. **Register:**
```bash
curl -X POST http://localhost:3000/api/mobile/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

3. **Access Protected Route:**
```bash
curl -X GET http://localhost:3000/api/mobile/auth/me \
  -H "Authorization: Bearer <token_from_login>"
```

### With Authentication Disabled (ENABLE_AUTH=false)

All routes are accessible without tokens:

```bash
# No auth required
curl -X GET http://localhost:3000/api/mobile/auth/me
```

## Security Notes

1. **Password Storage**: Passwords are hashed using bcrypt (10 rounds)
2. **JWT Tokens**: Access tokens expire in 7 days, refresh tokens in 30 days
3. **Password Field**: Marked as `select: false` in TypeORM to prevent accidental exposure
4. **HTTPS**: Always use HTTPS in production
5. **JWT Secret**: Use a strong, random secret in production

## Next Steps

1. Run the database migration
2. Set `ENABLE_AUTH=true` in `.env`
3. Test registration and login endpoints
4. Integrate with mobile app
5. (Future) Add Magic Link authentication as alternative

## Troubleshooting

### "User not found or inactive"
- User doesn't exist or `isActive` is `false`
- Check user in database

### "Invalid email or password"
- Email doesn't exist
- Password is incorrect
- User doesn't have a password set

### "User with this email already exists"
- Email is already registered
- Use login endpoint instead

### Auth not working
- Check `ENABLE_AUTH` is set correctly
- Verify `JWT_SECRET` is set
- Check token is sent in `Authorization: Bearer <token>` header

