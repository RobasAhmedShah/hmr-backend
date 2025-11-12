# Blocks App Backend Integration Documentation

**Version**: 1.0  
**Last Updated**: 2025-01-12  
**Purpose**: Complete integration strategy between Blocks mobile app and NestJS backend

---

## 📋 Overview

This folder contains comprehensive documentation for integrating the Blocks React Native mobile app with the NestJS backend. The plan covers **46 API endpoints** required by the mobile app, with detailed specifications, implementation guides, and ready-to-use Cursor AI prompts.

---

## 📚 Document Index

### 1. **API_MAPPING.md** 
**Complete mapping of required vs existing endpoints**

- ✅ Line-by-line comparison of BACKEND_API_REQUIREMENTS.md to API_ENDPOINTS.md
- 📊 Status indicators for each endpoint (COMPLETE, PARTIAL, MISSING, NEEDS_UPDATE)
- 🔧 Field alignment issues and transformation requirements
- 📈 Summary statistics (17% complete, 63% missing)

**Read this first** to understand what exists and what needs to be built.

---

### 2. **DATABASE_SCHEMA_ALIGNMENT.md**
**Frontend TypeScript types → Backend TypeORM entities mapping**

- 🗄️ Comprehensive entity field mappings
- 🔗 Foreign key verification for all relationships
- 🆕 11 new entities required (Bookmark, Notification, etc.)
- ⚙️ Computed vs stored field specifications
- 📝 SQL migration scripts for all schema changes

**Essential reference** for understanding data model alignment.

---

### 3. **AUTH_INTEGRATION.md**
**Magic Link passwordless authentication implementation**

- 🔐 Complete Magic SDK integration (client & server)
- 🎟️ JWT strategy and authentication flow
- 👥 Role-based access control (users, org admins, platform admins)
- 🔄 Session management and token refresh
- 🛡️ Security considerations and best practices

**Start here** for authentication implementation.

---

### 4. **REALTIME_ARCHITECTURE.md**
**WebSocket/Socket.io real-time updates**

- ⚡ Complete event specifications (7 event types)
- 🏠 Room management (user rooms, property rooms)
- 🔌 Backend Gateway implementation
- 📱 Frontend socket service integration
- 🔄 Integration with existing EventEmitter

**Critical** for implementing real-time features.

---

### 5. **API_IMPLEMENTATION_PLAN.md**
**Phased implementation roadmap (7-10 weeks)**

- 📅 **Phase 1** (2-3 weeks): Core functionality (15 endpoints)
- 📅 **Phase 2** (3-4 weeks): Enhanced features (18 endpoints)
- 📅 **Phase 3** (2-3 weeks): Additional features (13 endpoints)
- ⏱️ Time estimates for each endpoint
- 🗂️ Database migration scripts
- ✅ Testing strategy

**Use this** to plan your implementation timeline.

---

### 6. **CURSOR_PROMPTS.md**
**Ready-to-use Cursor AI prompts**

- 🤖 16 detailed prompts for each major feature
- 📝 Complete with context, requirements, and testing guidelines
- 🔧 Non-destructive approach (preserves existing apps)
- 📚 Cross-references to other documents
- ⚠️ Important notes and gotchas

**Copy-paste these** directly into Cursor AI for implementation.

---

### 7. **MOBILE_APP_ENDPOINTS.md**
**Complete API specification for /api/mobile/* namespace**

- 🌐 All 46 endpoints with full request/response specs
- 📊 Query parameters and filtering options
- 🔒 Authentication requirements
- ❌ Error response formats
- ⏱️ Rate limiting specifications

**API contract** between mobile app and backend.

---

## 🚀 Quick Start Guide

### For Backend Developers

1. **Read the Overview**
   - Start with `API_MAPPING.md` to see what needs to be built
   - Review `DATABASE_SCHEMA_ALIGNMENT.md` for entity changes

2. **Set Up Authentication**
   - Follow `AUTH_INTEGRATION.md` section by section
   - Use Prompt #1 from `CURSOR_PROMPTS.md`

3. **Implement Phase 1** (High Priority)
   - Follow `API_IMPLEMENTATION_PLAN.md` Phase 1 endpoints
   - Use corresponding prompts from `CURSOR_PROMPTS.md`
   - Reference `MOBILE_APP_ENDPOINTS.md` for exact specs

4. **Add Real-time Support**
   - Follow `REALTIME_ARCHITECTURE.md`
   - Use Prompt #16 from `CURSOR_PROMPTS.md`

5. **Continue with Phases 2 & 3**
   - Implement remaining endpoints systematically
   - Test thoroughly at each phase

### For Frontend Developers

1. **Review API Specs**
   - Read `MOBILE_APP_ENDPOINTS.md` for all endpoint details
   - Understand authentication flow in `AUTH_INTEGRATION.md`

2. **Set Up Magic SDK**
   - Follow frontend setup in `AUTH_INTEGRATION.md` section 3.1
   - Implement AuthContext with Magic integration

3. **Integrate Real-time Updates**
   - Follow `REALTIME_ARCHITECTURE.md` section 5 (Frontend Implementation)
   - Set up SocketContext and event listeners

4. **Field Transformations**
   - Use mappings from `DATABASE_SCHEMA_ALIGNMENT.md` section 12
   - Ensure frontend interfaces match backend responses

---

## 📊 Statistics

### Endpoints
- **Total Required**: 46 endpoints
- **Existing (Complete)**: 8 (17%)
- **Existing (Partial)**: 7 (15%)
- **Missing**: 31 (67%)

### Entities
- **Existing Entities**: 10
- **New Entities Required**: 11
- **Total Fields Reviewed**: 150+

### Implementation Time
- **Phase 1**: 2-3 weeks
- **Phase 2**: 3-4 weeks
- **Phase 3**: 2-3 weeks
- **Total**: 7-10 weeks

---

## 🎯 Implementation Principles

1. **Non-Destructive**: Add new endpoints, never modify existing ones
2. **DRY**: Reuse existing services, add new controller methods
3. **Type Safety**: DTOs match frontend TypeScript interfaces exactly
4. **Field Consistency**: Use exact same field names as backend entities
5. **Foreign Keys**: Always use proper relations, never duplicate data
6. **Performance**: Computed fields on-the-fly, eager/lazy loading strategy
7. **Security**: Magic Link auth for users, keep existing password auth for org admins
8. **Real-time**: WebSocket for critical updates, polling for non-critical

---

## 🛠️ Dependencies Required

### Backend (NestJS)

```json
{
  "@magic-sdk/admin": "^2.x",
  "@nestjs/websockets": "^10.x",
  "@nestjs/platform-socket.io": "^10.x",
  "socket.io": "^4.x",
  "@nestjs/jwt": "^10.x",
  "@nestjs/passport": "^10.x",
  "passport-jwt": "^4.x"
}
```

### Frontend (React Native)

```json
{
  "magic-sdk": "^28.x",
  "@magic-sdk/react-native-expo": "^23.x",
  "socket.io-client": "^4.x"
}
```

---

## 📝 Environment Variables

### Backend

```env
# Magic Authentication
MAGIC_SECRET_KEY=sk_live_YOUR_SECRET_KEY
MAGIC_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Database
DATABASE_URL=postgresql://...

# CORS
CORS_ORIGIN=http://localhost:8081,exp://...
```

### Frontend

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
```

---

## ✅ Testing Strategy

### Unit Tests
- Service methods for all new functionality
- DTO validation
- Field transformations
- Computed value calculations

### Integration Tests
- API endpoint tests with Supertest
- Database integration
- Magic SDK integration (mocked)
- WebSocket events

### E2E Tests
- Complete user flows:
  - Registration → Login → Browse → Invest → View Portfolio
  - Deposit → Invest → Receive Reward
  - Create Bookmark → View Bookmarks → Remove
  - Receive Notification → Mark Read

---

## 🗂️ Folder Structure (NestJS Backend)

```
src/
├── mobile-auth/              # Magic Link authentication (NEW)
│   ├── mobile-auth.module.ts
│   ├── mobile-auth.controller.ts
│   ├── mobile-auth.service.ts
│   ├── services/
│   │   └── magic.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── mobile/                   # Mobile-specific controllers (NEW)
│   ├── controllers/
│   │   ├── mobile-properties.controller.ts
│   │   ├── mobile-wallet.controller.ts
│   │   ├── mobile-transactions.controller.ts
│   │   ├── mobile-investments.controller.ts
│   │   ├── mobile-portfolio.controller.ts
│   │   └── mobile-profile.controller.ts
│   └── services/
│       ├── mobile-properties.service.ts
│       ├── mobile-wallet.service.ts
│       └── mobile-transactions.service.ts
├── bookmarks/                # Bookmarks module (NEW)
│   ├── bookmarks.module.ts
│   ├── bookmarks.controller.ts
│   ├── bookmarks.service.ts
│   └── entities/
│       └── bookmark.entity.ts
├── notifications/            # Notifications module (NEW)
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── entities/
│       ├── notification.entity.ts
│       └── push-token.entity.ts
├── support/                  # Support & content (NEW)
│   ├── support.module.ts
│   ├── support.controller.ts
│   ├── support.service.ts
│   └── entities/
│       ├── faq.entity.ts
│       ├── content-page.entity.ts
│       └── support-ticket.entity.ts
├── bank-accounts/            # Bank accounts module (NEW)
│   ├── bank-accounts.module.ts
│   ├── bank-accounts.controller.ts
│   ├── bank-accounts.service.ts
│   └── entities/
│       └── bank-account.entity.ts
├── websocket/                # Real-time WebSocket (NEW)
│   ├── websocket.module.ts
│   └── realtime.gateway.ts
├── users/                    # Enhanced (add settings entities)
│   ├── entities/
│   │   ├── user-security-settings.entity.ts (NEW)
│   │   └── user-notification-settings.entity.ts (NEW)
│   └── services/
│       ├── user-security-settings.service.ts (NEW)
│       └── user-notification-settings.service.ts (NEW)
├── properties/               # Enhanced (add PropertyUpdate, PropertyDocument)
│   └── entities/
│       ├── property-update.entity.ts (NEW)
│       └── property-document.entity.ts (NEW)
└── ... (existing modules remain unchanged)
```

---

## 🔗 Cross-Reference Guide

| If you need... | Start with... | Then refer to... |
|----------------|---------------|------------------|
| **Endpoint implementation** | `CURSOR_PROMPTS.md` | `MOBILE_APP_ENDPOINTS.md`, `API_MAPPING.md` |
| **Database changes** | `DATABASE_SCHEMA_ALIGNMENT.md` | `API_IMPLEMENTATION_PLAN.md` (migrations) |
| **Authentication setup** | `AUTH_INTEGRATION.md` | `CURSOR_PROMPTS.md` (Prompt #1-3) |
| **Real-time updates** | `REALTIME_ARCHITECTURE.md` | `CURSOR_PROMPTS.md` (Prompt #16) |
| **API specifications** | `MOBILE_APP_ENDPOINTS.md` | `DATABASE_SCHEMA_ALIGNMENT.md` |
| **Project timeline** | `API_IMPLEMENTATION_PLAN.md` | All other documents |

---

## 📞 Support

For questions or issues:
1. Review the relevant document thoroughly
2. Check cross-references for related information
3. Consult the Cursor prompts for implementation guidance
4. Test incrementally and verify each phase

---

## 🎉 Success Criteria

### Phase 1 Complete When:
- ✅ Users can login with Magic Link
- ✅ Users can browse properties with filters
- ✅ Users can create investments
- ✅ Users can view wallet balance
- ✅ Users can view transactions
- ✅ Users can view/update profile

### Phase 2 Complete When:
- ✅ All Phase 1 criteria met
- ✅ Users can bookmark properties
- ✅ Users can receive notifications
- ✅ Users can deposit/withdraw funds
- ✅ Users can view portfolio performance
- ✅ Users can manage settings

### Phase 3 Complete When:
- ✅ All Phase 2 criteria met
- ✅ Users can access FAQs and support
- ✅ Users can manage bank accounts
- ✅ Users can view property updates
- ✅ Real-time updates working for all features
- ✅ All 46 endpoints operational

---

## 📄 License

This documentation is part of the Blocks platform development and is proprietary to the Blocks team.

---

**Happy Coding! 🚀**

For the best results, follow the implementation plan phase by phase, use the provided Cursor prompts, and test thoroughly at each stage.

