# Roadmap-Tools: Comprehensive Implementation Plan

**Generated:** January 6, 2026
**Repository:** roadmap-tools
**Analysis Scope:** Architecture, UI, Backend, State Management, Security/DevOps

---

## A) EXECUTIVE SUMMARY

### What This System Is

**Roadmap-Tools** is a SaaS product roadmap management platform built with modern web technologies:

- **Purpose:** Enable teams to create, manage, and publicly share product roadmaps with voting, filtering, and changelog features
- **Core Features:**
  - Multi-view roadmap display (Kanban board, timeline, changelog feed)
  - Public embeddable roadmaps via URL slugs
  - Item voting and email subscriptions
  - Admin dashboard for roadmap/item CRUD
  - FluxPoster integration for external changelog sync
  - Customizable theming (CSS variables)

### Tech Stack Summary

| Layer             | Technology              | Version |
| ----------------- | ----------------------- | ------- |
| Frontend          | Next.js (App Router)    | 15.1.11 |
| UI Framework      | React                   | 19.0.0  |
| Styling           | Tailwind CSS + Radix UI | v4      |
| Component Library | shadcn/ui               | Latest  |
| Database          | Firebase Firestore      | -       |
| Auth              | NextAuth.js             | v5 beta |
| Language          | TypeScript              | 5.x     |
| Hosting           | Firebase Hosting        | -       |

### What's Missing (Critical Gaps)

| Priority | Gap                                       | Risk Level                          |
| -------- | ----------------------------------------- | ----------------------------------- |
| P0       | **No input validation/sanitization**      | CRITICAL - XSS vulnerability        |
| P0       | **No test coverage (0%)**                 | CRITICAL - Regression risk          |
| P0       | **No CI/CD pipeline**                     | CRITICAL - Manual deployment errors |
| P0       | **Weak type safety (12 files use `any`)** | HIGH - Runtime errors               |
| P1       | **No error boundaries**                   | HIGH - Cascading UI crashes         |
| P1       | **No rate limiting on APIs**              | HIGH - DoS vulnerability            |
| P1       | **No structured logging/monitoring**      | HIGH - Blind in production          |
| P1       | **No RBAC (Role-Based Access)**           | HIGH - All users can access admin   |
| P2       | **No database pagination**                | MEDIUM - Breaks at 1000+ items      |
| P2       | **No real-time updates**                  | MEDIUM - Stale data                 |
| P2       | **Missing .env.example**                  | MEDIUM - Onboarding friction        |
| P3       | **No API documentation**                  | LOW - Developer friction            |

### Recommended Direction

1. **Immediate (Week 1-2):** Security hardening - input validation, XSS prevention, rate limiting
2. **Short-term (Week 3-4):** Testing infrastructure + CI/CD pipeline
3. **Medium-term (Week 5-8):** Type safety overhaul + data layer abstraction
4. **Long-term (Week 9+):** Performance optimization, real-time features, multi-tenancy

---

## B) TECHNICAL PLAN

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Public Pages  │  │   Admin Pages   │  │   Auth Pages    │          │
│  │  /r/[ws]/[slug] │  │  /admin/*       │  │  /login         │          │
│  │  /embed-demo    │  │                 │  │                 │          │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│           │                    │                    │                    │
│  ┌────────▼────────────────────▼────────────────────▼────────┐          │
│  │                    COMPONENT LIBRARY                       │          │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │          │
│  │  │ roadmap/*   │  │  admin/*    │  │   ui/*      │        │          │
│  │  │ (8 comps)   │  │  (2 comps)  │  │ (12 comps)  │        │          │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │          │
│  └───────────────────────────────────────────────────────────┘          │
│                                                                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                          BUSINESS LOGIC LAYER                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐     ┌─────────────────────┐                    │
│  │   Server Actions    │     │     API Routes      │                    │
│  │   /lib/actions.ts   │     │   /app/api/*        │                    │
│  │   • createRoadmap   │     │   • auth/[...next]  │                    │
│  │   • createItem      │     │   • v1/roadmaps     │                    │
│  │   • toggleVote      │     │   • fluxposter/*    │                    │
│  │   • subscribeToItem │     │                     │                    │
│  └──────────┬──────────┘     └──────────┬──────────┘                    │
│             │                           │                                │
│  ┌──────────▼───────────────────────────▼──────────┐                    │
│  │              VALIDATION LAYER (MISSING)          │  ◄── TO ADD       │
│  │              Zod schemas for all inputs          │                    │
│  └──────────────────────────────────────────────────┘                    │
│                                                                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                           DATA ACCESS LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐     ┌─────────────────────┐                    │
│  │  Firebase Admin SDK │     │  Firebase Client SDK│                    │
│  │  /lib/firebase-     │     │  /lib/firebase.ts   │                    │
│  │       admin.ts      │     │  (Auth only)        │                    │
│  └──────────┬──────────┘     └─────────────────────┘                    │
│             │                                                            │
│  ┌──────────▼───────────────────────────────────────┐                   │
│  │           REPOSITORY LAYER (MISSING)             │  ◄── TO ADD       │
│  │           /lib/db/repositories/*.ts              │                   │
│  └──────────────────────────────────────────────────┘                   │
│                                                                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                          FIREBASE FIRESTORE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Collections:                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  roadmaps   │  │   items     │  │   users     │  │  sessions   │    │
│  │  └─groups   │  │  └─subscr.  │  │  (NextAuth) │  │  (NextAuth) │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model (Firestore Schema)

```typescript
// === CORE ENTITIES ===

interface Roadmap {
  id: string // Auto-generated
  title: string // Display title
  slug: string // URL identifier (unique)
  publicTitle?: string // Public-facing title
  description?: string // Roadmap description
  workspaceId: string // Multi-tenancy (currently "default")
  ownerId: string // FK to users (MISSING - TO ADD)
  itemCount: number // Denormalized counter
  themeConfig: ThemeConfig // CSS variable overrides
  viewConfig: ViewConfig // Display preferences
  createdAt: Timestamp
  updatedAt: Timestamp

  // Subcollection: groups/{groupId}
}

interface Item {
  id: string
  title: string
  description?: string
  contentHtml?: string // Rich HTML content
  status: "EXPLORING" | "BUILDING" | "TESTING" | "SHIPPED" | "CANCELLED"
  confidence?: "TENTATIVE" | "LIKELY" | "CONFIDENT"
  roadmapId: string // FK to roadmaps
  groupId?: string // FK to groups
  votes: number // Vote count
  featured: boolean // Featured flag
  externalId?: string // FluxPoster integration
  tags?: string[]
  categories?: string[]
  featuredImageUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp

  // Subcollection: subscribers/{email}
}

interface Group {
  id: string
  name: string
  order?: number // Sort order (TO ADD)
  createdAt: Timestamp
}

interface Subscriber {
  email: string
  createdAt: Timestamp
}

// === CONFIGURATION ===

interface ThemeConfig {
  primaryColor?: string // HSL value
  backgroundColor?: string
  fontFamily?: string
  borderRadius?: string
}

interface ViewConfig {
  defaultZoom: "snapshot" | "standard" | "deep"
  availableViews: ("list" | "board" | "timeline" | "changelog")[]
  defaultView?: string
}

// === AUTH (Managed by NextAuth) ===

interface User {
  id: string
  name?: string
  email: string
  image?: string
  role?: "admin" | "editor" | "viewer" // TO ADD
}
```

### API Routes & Contracts

| Method | Endpoint                             | Auth   | Purpose              | Request           | Response              |
| ------ | ------------------------------------ | ------ | -------------------- | ----------------- | --------------------- |
| GET    | `/api/v1/roadmaps/[slug]`            | None   | Public roadmap fetch | -                 | `{ roadmap, items }`  |
| POST   | `/api/fluxposter/posts`              | Bearer | Create/update item   | FluxPosterPayload | `{ postId, url }`     |
| PUT    | `/api/fluxposter/posts/[externalId]` | Bearer | Update item          | FluxPosterPayload | `{ postId, message }` |
| DELETE | `/api/fluxposter/posts/[externalId]` | Bearer | Delete item          | -                 | 204 No Content        |
| \*     | `/api/auth/[...nextauth]`            | -      | NextAuth handlers    | -                 | -                     |

**FluxPoster Payload Schema (TO VALIDATE):**

```typescript
interface FluxPosterPayload {
  id: string // Required
  title: string // Required
  bodyHtml: string // Required - SANITIZE!
  summary?: string
  status?: string
  publishedAt?: string
  tags?: string[]
  categories?: string[]
  images?: { role?: string; url: string }[]
}
```

### UI Module Breakdown

```
src/components/
├── ui/                          # shadcn/ui primitives (DO NOT MODIFY)
│   ├── button.tsx               # CVA variants: default, destructive, outline, etc.
│   ├── card.tsx                 # Card, CardHeader, CardTitle, CardContent, CardFooter
│   ├── dialog.tsx               # Modal dialogs
│   ├── sheet.tsx                # Side panels/drawers
│   ├── select.tsx               # Dropdown selects
│   ├── dropdown-menu.tsx        # Context menus
│   ├── input.tsx                # Text inputs
│   ├── label.tsx                # Form labels
│   ├── badge.tsx                # Status badges
│   ├── avatar.tsx               # User avatars
│   ├── tabs.tsx                 # Tab navigation
│   └── skeleton.tsx             # Loading placeholders
│
├── roadmap/                     # Feature components
│   ├── roadmap-view.tsx         # Main orchestrator (REFACTOR NEEDED)
│   ├── roadmap-board.tsx        # Kanban view
│   ├── roadmap-timeline.tsx     # Timeline view
│   ├── changelog-feed.tsx       # Changelog view
│   ├── item-card.tsx            # Item display card
│   ├── item-detail-drawer.tsx   # Item detail panel
│   ├── filter-bar.tsx           # Search + filters
│   ├── zoom-toggle.tsx          # Zoom level control
│   ├── theme-studio.tsx         # Theme customization
│   └── disclaimer-banner.tsx    # Notice banner
│
└── admin/                       # Admin components
    ├── admin-dashboard.tsx      # Roadmap listing
    └── item-form.tsx            # Item creation form
```

---

## C) IMPLEMENTATION ROADMAP

### Phase 0: Foundation & Security Hardening (Week 1-2)

**Goal:** Eliminate critical security vulnerabilities and establish project standards

| Milestone | Deliverable                       | Priority |
| --------- | --------------------------------- | -------- |
| M0.1      | Input validation with Zod schemas | P0       |
| M0.2      | HTML sanitization (DOMPurify)     | P0       |
| M0.3      | Security headers in middleware    | P0       |
| M0.4      | Environment validation on startup | P1       |
| M0.5      | .env.example file                 | P1       |
| M0.6      | Error boundaries (error.tsx)      | P1       |
| M0.7      | Basic rate limiting               | P1       |

### Phase 1: Core Infrastructure (Week 3-4)

**Goal:** Establish testing, CI/CD, and type safety foundations

| Milestone | Deliverable                    | Priority |
| --------- | ------------------------------ | -------- |
| M1.1      | Jest/Vitest testing setup      | P0       |
| M1.2      | GitHub Actions CI pipeline     | P0       |
| M1.3      | Comprehensive TypeScript types | P0       |
| M1.4      | Data repository layer          | P1       |
| M1.5      | Structured logging (Pino)      | P1       |
| M1.6      | Error monitoring (Sentry)      | P1       |
| M1.7      | Pre-commit hooks (Husky)       | P2       |

### Phase 2: Quality & Scaling (Week 5-8)

**Goal:** Improve reliability, performance, and developer experience

| Milestone | Deliverable                 | Priority |
| --------- | --------------------------- | -------- |
| M2.1      | Database pagination         | P1       |
| M2.2      | Caching layer (React Query) | P1       |
| M2.3      | Role-based access control   | P1       |
| M2.4      | API documentation (OpenAPI) | P2       |
| M2.5      | Component refactoring       | P2       |
| M2.6      | E2E tests (Playwright)      | P2       |
| M2.7      | Performance optimization    | P2       |

### Phase 3: Polish & Growth (Week 9+)

**Goal:** Add advanced features and prepare for scale

| Milestone | Deliverable                             | Priority |
| --------- | --------------------------------------- | -------- |
| M3.1      | Real-time updates (Firestore listeners) | P2       |
| M3.2      | Multi-workspace support                 | P2       |
| M3.3      | Team collaboration features             | P3       |
| M3.4      | Audit logging                           | P3       |
| M3.5      | Analytics dashboard                     | P3       |
| M3.6      | Webhook system for integrations         | P3       |

---

## D) TASK LIST (TICKET FORMAT)

### Phase 0 Tickets

---

#### TICKET-001: Implement Zod Validation Schemas

**Priority:** P0 - Critical
**Estimate:** 4 hours

**Description:**
Create comprehensive Zod schemas for all server actions and API routes to prevent invalid data from entering the system.

**Files/Folders:**

- `src/lib/validation/` (NEW)
  - `schemas.ts` - All entity schemas
  - `index.ts` - Exports
- `src/lib/actions.ts` - Apply validation
- `src/app/api/fluxposter/posts/route.ts` - Apply validation
- `src/app/api/v1/roadmaps/[slug]/route.ts` - Apply validation

**Acceptance Criteria:**

- [ ] Zod package installed (`npm install zod`)
- [ ] `RoadmapSchema` validates title (1-200 chars), slug (3-50 chars, alphanumeric-hyphen)
- [ ] `ItemSchema` validates all fields including status/confidence enums
- [ ] `FluxPosterSchema` validates webhook payloads
- [ ] `EmailSchema` validates email format
- [ ] All server actions use `.safeParse()` and return typed errors
- [ ] All API routes validate request bodies before processing

**Testing Notes:**

- Unit tests for each schema with valid/invalid inputs
- Test edge cases: empty strings, XSS payloads, oversized inputs

---

#### TICKET-002: Add HTML Sanitization

**Priority:** P0 - Critical
**Estimate:** 2 hours

**Description:**
Sanitize all HTML content before storage to prevent XSS attacks, particularly for FluxPoster bodyHtml field.

**Files/Folders:**

- `src/lib/sanitize.ts` (NEW)
- `src/app/api/fluxposter/posts/route.ts` - Apply sanitization
- `src/app/api/fluxposter/posts/[externalId]/route.ts` - Apply sanitization

**Acceptance Criteria:**

- [ ] `isomorphic-dompurify` package installed
- [ ] `sanitizeHtml()` function created with allowed tags whitelist
- [ ] Allowed tags: `p, br, strong, em, a, ul, ol, li, h1-h6, code, pre, blockquote`
- [ ] Allowed attributes: `href, title, class` (no onclick, onerror, etc.)
- [ ] All incoming HTML sanitized before Firestore write
- [ ] Existing data migration script for stored HTML (optional)

**Testing Notes:**

- Test with XSS payloads: `<script>alert('xss')</script>`, `<img onerror="...">`, etc.
- Verify legitimate HTML passes through correctly

---

#### TICKET-003: Add Security Headers Middleware

**Priority:** P0 - Critical
**Estimate:** 2 hours

**Description:**
Configure security headers to protect against common web vulnerabilities.

**Files/Folders:**

- `src/middleware.ts` - Add security headers
- `next.config.ts` - Add headers configuration

**Acceptance Criteria:**

- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- [ ] Content-Security-Policy with script-src, style-src restrictions
- [ ] Headers verified in browser DevTools

**Testing Notes:**

- Use securityheaders.com to verify grade
- Test that application still functions with CSP

---

#### TICKET-004: Environment Validation

**Priority:** P1 - High
**Estimate:** 1 hour

**Description:**
Validate all required environment variables on application startup to fail fast with clear error messages.

**Files/Folders:**

- `src/lib/env.ts` (NEW)
- `src/lib/firebase-admin.ts` - Import and validate
- `.env.example` (NEW)

**Acceptance Criteria:**

- [ ] `validateEnv()` function checks all required variables
- [ ] Required: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- [ ] Required: `FLUXPOSTER_API_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [ ] Optional with defaults: `NEXT_PUBLIC_SITE_URL`
- [ ] Clear error messages indicating which variable is missing
- [ ] `.env.example` documents all variables with placeholder values
- [ ] Application fails to start if validation fails

**Testing Notes:**

- Remove each env var and verify error message
- Verify successful startup with all vars present

---

#### TICKET-005: Add Error Boundaries

**Priority:** P1 - High
**Estimate:** 2 hours

**Description:**
Implement React error boundaries to gracefully handle component errors without crashing the entire application.

**Files/Folders:**

- `src/app/error.tsx` (NEW) - Global error boundary
- `src/app/not-found.tsx` (NEW) - 404 page
- `src/app/admin/error.tsx` (NEW) - Admin error boundary
- `src/components/error-boundary.tsx` (NEW) - Reusable component

**Acceptance Criteria:**

- [ ] Global error.tsx catches unhandled errors
- [ ] Error page shows user-friendly message (not stack trace)
- [ ] "Try again" button resets error state
- [ ] Error logged to console (and Sentry when configured)
- [ ] 404 page styled consistently with app
- [ ] Admin section has its own error boundary

**Testing Notes:**

- Throw error in component and verify boundary catches it
- Verify error details not exposed to users
- Test reset functionality

---

#### TICKET-006: Implement Rate Limiting

**Priority:** P1 - High
**Estimate:** 3 hours

**Description:**
Add rate limiting to API endpoints to prevent abuse and DoS attacks.

**Files/Folders:**

- `src/lib/rate-limit.ts` (NEW)
- `src/app/api/fluxposter/posts/route.ts` - Apply rate limiting
- `src/app/api/v1/roadmaps/[slug]/route.ts` - Apply rate limiting

**Acceptance Criteria:**

- [ ] In-memory rate limiter for MVP (consider Upstash Redis later)
- [ ] FluxPoster endpoints: 100 requests/minute per IP
- [ ] Public API: 60 requests/minute per IP
- [ ] Rate limit headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- [ ] 429 Too Many Requests response when exceeded
- [ ] Rate limiter resets correctly after window

**Testing Notes:**

- Simulate burst traffic and verify limiting works
- Verify legitimate traffic not affected

---

### Phase 1 Tickets

---

#### TICKET-007: Setup Testing Infrastructure

**Priority:** P0 - Critical
**Estimate:** 4 hours

**Description:**
Configure Jest/Vitest with React Testing Library for unit and integration testing.

**Files/Folders:**

- `jest.config.ts` (NEW)
- `jest.setup.ts` (NEW)
- `src/__tests__/` (NEW directory)
- `package.json` - Add test scripts

**Acceptance Criteria:**

- [ ] Jest configured with TypeScript support
- [ ] React Testing Library installed
- [ ] Path aliases (`@/`) working in tests
- [ ] Test scripts: `test`, `test:watch`, `test:coverage`
- [ ] Coverage thresholds: 50% minimum (increase over time)
- [ ] Example test for a utility function
- [ ] Example test for a React component

**Testing Notes:**

- Verify `npm test` runs successfully
- Verify coverage report generates

---

#### TICKET-008: GitHub Actions CI Pipeline

**Priority:** P0 - Critical
**Estimate:** 3 hours

**Description:**
Create CI/CD pipeline that runs on every push and PR.

**Files/Folders:**

- `.github/workflows/ci.yml` (NEW)
- `.github/workflows/deploy.yml` (NEW)

**Acceptance Criteria:**

- [ ] Runs on push to main/develop and all PRs
- [ ] Steps: checkout, setup-node, install, lint, test, build
- [ ] Caches node_modules for faster runs
- [ ] Uploads coverage to Codecov
- [ ] Runs `npm audit` for security vulnerabilities
- [ ] Deploy workflow triggers on main branch merge
- [ ] Firebase deployment with secrets

**Testing Notes:**

- Create test PR and verify pipeline runs
- Verify failing tests block PR

---

#### TICKET-009: Comprehensive TypeScript Types

**Priority:** P0 - Critical
**Estimate:** 4 hours

**Description:**
Replace all `any` types with proper TypeScript interfaces and eliminate type safety issues.

**Files/Folders:**

- `src/types/index.ts` - Expand with all entity types
- `src/types/api.ts` (NEW) - API request/response types
- All files with `any` types (12 files identified)

**Acceptance Criteria:**

- [ ] `Roadmap`, `Item`, `Group`, `Subscriber` interfaces defined
- [ ] `ApiResponse<T>` generic type for API responses
- [ ] `ServerActionResult<T>` type for server actions
- [ ] Zero `any` types in codebase (ESLint rule enforced)
- [ ] Props interfaces for all components
- [ ] Event handler types properly typed

**Testing Notes:**

- Run `tsc --noEmit` with zero errors
- Verify IDE autocomplete works correctly

---

#### TICKET-010: Data Repository Layer

**Priority:** P1 - High
**Estimate:** 6 hours

**Description:**
Create a repository pattern to centralize all Firestore operations and remove direct database calls from pages/components.

**Files/Folders:**

- `src/lib/db/` (NEW directory)
  - `repositories/roadmap.repository.ts`
  - `repositories/item.repository.ts`
  - `repositories/group.repository.ts`
  - `index.ts`
- `src/app/r/[workspaceSlug]/[roadmapSlug]/page.tsx` - Refactor
- `src/app/admin/page.tsx` - Refactor
- `src/lib/actions.ts` - Refactor

**Acceptance Criteria:**

- [ ] `RoadmapRepository` with: `findBySlug()`, `findAll()`, `create()`, `update()`, `delete()`
- [ ] `ItemRepository` with: `findByRoadmapId()`, `findByExternalId()`, `create()`, `update()`, `delete()`, `incrementVotes()`
- [ ] `GroupRepository` with: `findByRoadmapId()`, `create()`, `delete()`
- [ ] All repositories return typed entities (not `any`)
- [ ] Error handling in repository methods
- [ ] No direct `adminDb.collection()` calls outside repositories

**Testing Notes:**

- Unit tests for each repository method
- Mock Firestore for testing

---

#### TICKET-011: Structured Logging

**Priority:** P1 - High
**Estimate:** 3 hours

**Description:**
Implement structured JSON logging for debugging and monitoring.

**Files/Folders:**

- `src/lib/logger.ts` (NEW)
- All API routes - Add logging
- `src/lib/actions.ts` - Add logging

**Acceptance Criteria:**

- [ ] Logger with levels: debug, info, warn, error, audit
- [ ] JSON format with timestamp, level, message, context
- [ ] Request ID correlation for tracing
- [ ] Audit logging for security events (login, admin actions)
- [ ] No sensitive data in logs (passwords, tokens)
- [ ] Environment-aware: verbose in dev, minimal in prod

**Testing Notes:**

- Verify log output format
- Verify sensitive data not logged

---

#### TICKET-012: Sentry Error Monitoring

**Priority:** P1 - High
**Estimate:** 2 hours

**Description:**
Integrate Sentry for production error monitoring and alerting.

**Files/Folders:**

- `sentry.client.config.ts` (NEW)
- `sentry.server.config.ts` (NEW)
- `sentry.edge.config.ts` (NEW)
- `next.config.ts` - Wrap with Sentry
- `src/app/global-error.tsx` (NEW)

**Acceptance Criteria:**

- [ ] `@sentry/nextjs` installed and configured
- [ ] Source maps uploaded for stack traces
- [ ] Environment tags (production, staging, development)
- [ ] User context attached to errors (when authenticated)
- [ ] Sample rate configured (100% errors, 10% transactions)
- [ ] Test error verified in Sentry dashboard

**Testing Notes:**

- Trigger intentional error and verify in Sentry
- Verify source maps work correctly

---

### Phase 2 Tickets

---

#### TICKET-013: Database Pagination

**Priority:** P1 - High
**Estimate:** 4 hours

**Description:**
Implement cursor-based pagination for roadmaps and items to handle large datasets.

**Files/Folders:**

- `src/lib/db/repositories/roadmap.repository.ts` - Add pagination
- `src/lib/db/repositories/item.repository.ts` - Add pagination
- `src/app/admin/page.tsx` - Use pagination
- `src/components/admin/admin-dashboard.tsx` - Add pagination UI

**Acceptance Criteria:**

- [ ] `findAll()` returns `{ data, nextCursor, hasMore }`
- [ ] Page size configurable (default 20)
- [ ] Cursor-based (not offset) for consistency
- [ ] "Load more" button in admin dashboard
- [ ] Items sorted by createdAt descending
- [ ] Works with filters applied

**Testing Notes:**

- Test with 100+ items
- Verify cursor works correctly across pages

---

#### TICKET-014: Role-Based Access Control

**Priority:** P1 - High
**Estimate:** 6 hours

**Description:**
Implement RBAC to restrict admin access and enable future multi-user workspaces.

**Files/Folders:**

- `src/types/index.ts` - Add Role type
- `src/auth.ts` - Add role to session
- `src/lib/auth/permissions.ts` (NEW)
- `src/middleware.ts` - Check roles
- `src/app/admin/*` - Apply role checks
- Firestore rules update

**Acceptance Criteria:**

- [ ] Roles: `admin`, `editor`, `viewer`
- [ ] Role stored on user document in Firestore
- [ ] Role included in NextAuth session
- [ ] `checkPermission(user, action, resource)` utility
- [ ] Admin routes require `admin` or `editor` role
- [ ] Firestore rules enforce ownership
- [ ] First user gets `admin` role automatically

**Testing Notes:**

- Test each role's access levels
- Verify unauthorized access blocked

---

#### TICKET-015: React Query Integration

**Priority:** P1 - High
**Estimate:** 4 hours

**Description:**
Add React Query for client-side data fetching, caching, and optimistic updates.

**Files/Folders:**

- `src/lib/query-client.ts` (NEW)
- `src/app/providers.tsx` (NEW) - QueryClientProvider
- `src/app/layout.tsx` - Wrap with providers
- `src/hooks/use-roadmap.ts` (NEW)
- `src/hooks/use-items.ts` (NEW)

**Acceptance Criteria:**

- [ ] QueryClient configured with defaults
- [ ] `useRoadmap(slug)` hook for fetching roadmap
- [ ] `useItems(roadmapId)` hook for fetching items
- [ ] `useVoteMutation()` with optimistic update
- [ ] Stale time: 5 minutes for roadmap data
- [ ] Error handling with retry logic

**Testing Notes:**

- Verify caching works (no duplicate requests)
- Test optimistic updates rollback on error

---

#### TICKET-016: Component Refactoring

**Priority:** P2 - Medium
**Estimate:** 4 hours

**Description:**
Refactor large components into smaller, focused units.

**Files/Folders:**

- `src/components/roadmap/roadmap-view.tsx` - Split into:
  - `src/components/roadmap/roadmap-container.tsx`
  - `src/components/roadmap/roadmap-controls.tsx`
  - `src/hooks/use-roadmap-filters.ts`
  - `src/hooks/use-roadmap-zoom.ts`

**Acceptance Criteria:**

- [ ] `roadmap-view.tsx` reduced from 174 to ~50 lines
- [ ] Filter logic in `useRoadmapFilters` hook
- [ ] Zoom logic in `useRoadmapZoom` hook
- [ ] Controls extracted to separate component
- [ ] No functionality changes (pure refactor)
- [ ] All existing features still work

**Testing Notes:**

- Snapshot tests before/after refactor
- Manual testing of all views and filters

---

#### TICKET-017: E2E Testing with Playwright

**Priority:** P2 - Medium
**Estimate:** 6 hours

**Description:**
Set up Playwright for end-to-end testing of critical user flows.

**Files/Folders:**

- `playwright.config.ts` (NEW)
- `e2e/` (NEW directory)
  - `auth.spec.ts` - Login flow
  - `admin.spec.ts` - Admin CRUD
  - `public-roadmap.spec.ts` - Public view

**Acceptance Criteria:**

- [ ] Playwright installed and configured
- [ ] Login flow tested (Google OAuth mock)
- [ ] Create roadmap flow tested
- [ ] Create item flow tested
- [ ] Public roadmap viewing tested
- [ ] Voting tested
- [ ] CI integration with Playwright

**Testing Notes:**

- Run against local dev server
- Screenshot on failure

---

### Phase 3 Tickets

---

#### TICKET-018: Real-time Updates

**Priority:** P2 - Medium
**Estimate:** 6 hours

**Description:**
Implement Firestore real-time listeners for live updates.

**Files/Folders:**

- `src/hooks/use-realtime-items.ts` (NEW)
- `src/components/roadmap/roadmap-view.tsx` - Use real-time hook

**Acceptance Criteria:**

- [ ] Items update in real-time when changed in Firestore
- [ ] Vote counts update live
- [ ] New items appear without refresh
- [ ] Proper cleanup of listeners on unmount
- [ ] Loading states for initial subscription

**Testing Notes:**

- Open two browser tabs, verify sync
- Test cleanup on navigation

---

#### TICKET-019: Multi-Workspace Support

**Priority:** P2 - Medium
**Estimate:** 8 hours

**Description:**
Enable multiple workspaces per user for team/organization separation.

**Files/Folders:**

- `src/types/index.ts` - Add Workspace type
- `src/lib/db/repositories/workspace.repository.ts` (NEW)
- `src/app/workspaces/` (NEW routes)
- Database migration for workspaceId

**Acceptance Criteria:**

- [ ] Workspace entity with name, slug, ownerId
- [ ] Users can create multiple workspaces
- [ ] Roadmaps scoped to workspace
- [ ] Workspace switcher in UI
- [ ] URL structure: `/w/[workspaceSlug]/...`
- [ ] Migrate existing data to default workspace

**Testing Notes:**

- Test workspace isolation
- Verify users can't access other workspaces

---

## E) DEFINITION OF DONE CHECKLIST

For any ticket to be considered complete:

### Code Quality

- [ ] Code follows TypeScript strict mode (no `any` types)
- [ ] ESLint passes with zero warnings
- [ ] All new code has JSDoc comments for public APIs
- [ ] No console.log statements (use logger)
- [ ] No hardcoded secrets or URLs

### Testing

- [ ] Unit tests written for new functions/hooks
- [ ] Integration tests for API changes
- [ ] All existing tests pass
- [ ] Coverage does not decrease

### Security

- [ ] Input validation on all user inputs
- [ ] No SQL/NoSQL injection vulnerabilities
- [ ] Authentication/authorization verified
- [ ] Sensitive data not logged

### Documentation

- [ ] README updated if setup changes
- [ ] API changes documented
- [ ] Breaking changes noted

### Review

- [ ] Code reviewed by at least one other developer
- [ ] PR description explains changes
- [ ] Screenshots for UI changes

### Deployment

- [ ] Works in development environment
- [ ] Works in staging/preview environment
- [ ] No console errors in browser
- [ ] Performance not degraded

---

## F) QUICK WINS & RECOMMENDATIONS

### Immediate Quick Wins (< 1 hour each)

1. **Create `.env.example`** - Document all required environment variables
2. **Add `error.tsx`** - Basic error boundary at app root
3. **Add `not-found.tsx`** - Custom 404 page
4. **Enable `reactStrictMode`** in next.config.ts
5. **Add `poweredByHeader: false`** to next.config.ts
6. **Fix ESLint config** - Add `no-explicit-any` rule

### Performance Notes

- **Bundle size:** Currently reasonable, shadcn/ui tree-shakes well
- **Images:** No image optimization configured (add `images.remotePatterns`)
- **Fonts:** Geist fonts loaded correctly via next/font
- **Database:** Need indexes for `roadmaps.slug` and `items.roadmapId`

### Security Notes

- **CRITICAL:** HTML sanitization missing for FluxPoster content
- **HIGH:** No rate limiting on any endpoint
- **MEDIUM:** Firestore rules need review (likely too permissive)
- **MEDIUM:** No CORS policy explicitly configured
- **LOW:** Consider adding CAPTCHA for public voting

---

## G) PROJECT-SPECIFIC NOTES

| Field                         | Value                                                 |
| ----------------------------- | ----------------------------------------------------- |
| **Project name**              | roadmap-tools (roadmapper)                            |
| **Target users**              | Product teams, SaaS companies, open-source projects   |
| **Key features**              | Public roadmaps, voting, changelog, embeddable widget |
| **Tech stack constraints**    | Next.js 15, Firebase (Firestore), TypeScript          |
| **Deploy target**             | Firebase Hosting                                      |
| **Must-have integrations**    | Google OAuth, FluxPoster webhook                      |
| **Nice-to-have integrations** | GitHub Issues sync, Slack notifications, Linear sync  |
| **Non-goals**                 | Mobile app, offline support, multi-language (for now) |

---

## H) RECOMMENDED LIBRARIES

| Purpose           | Library                             | Rationale                                     |
| ----------------- | ----------------------------------- | --------------------------------------------- |
| Validation        | `zod`                               | Type-safe, great TS integration, small bundle |
| HTML Sanitization | `isomorphic-dompurify`              | Works on server + client, comprehensive       |
| Rate Limiting     | `@upstash/ratelimit`                | Serverless-friendly, Redis-backed             |
| Logging           | `pino`                              | Fast, JSON-native, low overhead               |
| Error Monitoring  | `@sentry/nextjs`                    | Industry standard, great Next.js support      |
| Testing           | `vitest` + `@testing-library/react` | Fast, modern, good DX                         |
| E2E Testing       | `playwright`                        | Cross-browser, reliable, good debugging       |
| Data Fetching     | `@tanstack/react-query`             | Caching, optimistic updates, devtools         |
| Date Handling     | `date-fns`                          | Already installed, tree-shakeable             |
| Icons             | `lucide-react`                      | Already installed, consistent                 |

---

_Document generated by Claude Code analysis on January 6, 2026_
