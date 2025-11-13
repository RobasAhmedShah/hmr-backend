# Mobile Profile API

## Overview

Mobile-optimized user profile endpoints at `/api/mobile/profile` with aggregated user information and settings.

## Endpoints

### 1. GET /api/mobile/profile

Get user profile with security and notification settings.

**Authentication**: Required

**Response** (200):
```json
{
  "userInfo": {
    "id": "uuid",
    "displayCode": "USR-000001",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phone": "+923001234567",
    "dob": null,
    "address": null,
    "profileImage": null,
    "createdAt": "2025-01-12T10:00:00.000Z",
    "updatedAt": "2025-01-12T10:00:00.000Z"
  },
  "securitySettings": {
    "twoFactorAuth": false,
    "biometricLogin": false,
    "passwordLastChanged": null
  },
  "notificationSettings": {
    "pushNotifications": true,
    "emailNotifications": true,
    "smsNotifications": false,
    "investmentUpdates": true,
    "propertyAlerts": true,
    "monthlyReports": true,
    "marketingOffers": false,
    "securityAlerts": true,
    "paymentReminders": true,
    "portfolioMilestones": true,
    "doNotDisturb": {
      "enabled": false,
      "startTime": "22:00",
      "endTime": "08:00"
    }
  }
}
```

---

### 2. PATCH /api/mobile/profile

Update user profile information.

**Authentication**: Required

**Request Body** (all fields optional):
```json
{
  "fullName": "John Michael Doe",
  "email": "newemail@example.com",
  "phone": "+923001234567",
  "dob": "1990-01-15",
  "address": "123 Main St, Karachi, Pakistan",
  "profileImage": "https://example.com/new-image.jpg"
}
```

**Response** (200):
```json
{
  "id": "uuid",
  "displayCode": "USR-000001",
  "email": "newemail@example.com",
  "fullName": "John Michael Doe",
  "phone": "+923001234567",
  "dob": null,
  "address": null,
  "profileImage": null,
  "createdAt": "2025-01-12T10:00:00.000Z",
  "updatedAt": "2025-01-12T11:00:00.000Z"
}
```

**Note**: Currently, only `fullName`, `email`, and `phone` are persisted. Fields like `dob`, `address`, and `profileImage` are accepted but not yet stored (will be added to User entity in future updates).

---

## Field Descriptions

### User Info
- `id`: User UUID
- `displayCode`: User display code (e.g., "USR-000001")
- `email`: User email address
- `fullName`: User's full name
- `phone`: User's phone number (optional)
- `dob`: Date of birth (currently null, TODO: add to User entity)
- `address`: User address (currently null, TODO: add to User entity)
- `profileImage`: Profile image URL (currently null, TODO: add to User entity)
- `createdAt`: Account creation date
- `updatedAt`: Last update date

### Security Settings (Default)
- `twoFactorAuth`: Two-factor authentication enabled (default: false)
- `biometricLogin`: Biometric login enabled (default: false)
- `passwordLastChanged`: Last password change date (default: null)

**Note**: Security settings are currently returned as defaults. A `UserSecuritySettingsService` will be implemented in Phase 2 to persist these settings.

### Notification Settings (Default)
- `pushNotifications`: Push notifications enabled (default: true)
- `emailNotifications`: Email notifications enabled (default: true)
- `smsNotifications`: SMS notifications enabled (default: false)
- `investmentUpdates`: Investment update notifications (default: true)
- `propertyAlerts`: Property alert notifications (default: true)
- `monthlyReports`: Monthly report emails (default: true)
- `marketingOffers`: Marketing offer emails (default: false)
- `securityAlerts`: Security alert notifications (default: true)
- `paymentReminders`: Payment reminder notifications (default: true)
- `portfolioMilestones`: Portfolio milestone notifications (default: true)
- `doNotDisturb`: Do not disturb settings
  - `enabled`: DND enabled (default: false)
  - `startTime`: DND start time (default: "22:00")
  - `endTime`: DND end time (default: "08:00")

**Note**: Notification settings are currently returned as defaults. A `UserNotificationSettingsService` will be implemented in Phase 2 to persist these settings.

---

## Testing

### Test with cURL

```bash
# Get profile (requires authentication token)
curl -X GET http://localhost:3000/api/mobile/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update profile
curl -X PATCH http://localhost:3000/api/mobile/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Michael Doe",
    "phone": "+923001234567"
  }'
```

### Test with Insomnia/Postman

1. **Get Profile**:
   - Method: `GET`
   - URL: `{{base_url}}/api/mobile/profile`
   - Headers:
     - `Authorization: Bearer {{auth_token}}`

2. **Update Profile**:
   - Method: `PATCH`
   - URL: `{{base_url}}/api/mobile/profile`
   - Headers:
     - `Authorization: Bearer {{auth_token}}`
     - `Content-Type: application/json`
   - Body:
     ```json
     {
       "fullName": "John Michael Doe",
       "phone": "+923001234567"
     }
     ```

---

## Implementation Details

### Files Created

- `src/mobile-profile/dto/update-profile.dto.ts` - Update profile DTO with validation
- `src/mobile-profile/mobile-profile.service.ts` - Profile service with transformation logic
- `src/mobile-profile/mobile-profile.controller.ts` - Profile controller
- `src/mobile-profile/mobile-profile.module.ts` - Module configuration

### Dependencies

- Uses existing `UsersService`
- Uses existing `User` entity
- No breaking changes to existing endpoints

---

## Future Enhancements

1. **User Entity Updates**: Add `dob`, `address`, and `profileImage` fields to User entity
2. **Security Settings Service**: Implement `UserSecuritySettingsService` to persist security preferences
3. **Notification Settings Service**: Implement `UserNotificationSettingsService` to persist notification preferences
4. **Profile Image Upload**: Add endpoint for uploading profile images
5. **Password Change**: Add endpoint for changing password
6. **Two-Factor Auth**: Implement 2FA setup and verification

---

## Notes

- All endpoints require authentication
- User can only access their own profile
- Security and notification settings are currently defaults (not persisted)
- Fields `dob`, `address`, and `profileImage` are accepted but not yet stored
- Only `fullName`, `email`, and `phone` are currently persisted when updating profile

