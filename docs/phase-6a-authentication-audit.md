# Phase 6A: Authentication, Authorization & User Identity Migration Audit

**Document Version:** 1.0.0  
**Status:** Audit & Migration Design Specification  
**Author:** Senior Staff Software Architect & Security Engineer  
**Date:** September 2026  

---

## 1. Executive Summary

CampusLit is currently an **advanced MVP / pre-pilot engineering student platform** built inside the Next.js 16 App Router ecosystem with TypeScript and PostgreSQL. The application domain layer—including the 192 Karnataka Engineering College catalogue, 64 Scholarships, 65 Opportunities, 22-Course Academic Vault, 75% Bunk Defense calculator, and Proactive Action Radar—is fully implemented and protected by 427 verified automated tests.

This audit evaluates the **current in-house authentication system**, examines its **security boundaries and authorization invariants**, and designs an **enterprise-grade, zero-data-loss migration strategy to Clerk / Managed Authentication**.

---

## 2. Phase 1: Repository Discovery & Dependency Map

### 2.1 Codebase Artifacts Audited
- **Database Layer**: `db/schema.ts` (21 canonical tables), `lib/db.ts` (PostgreSQL connection pool).
- **Authentication Engine**: `lib/auth.ts`, `components/auth/auth-provider.tsx`, `components/auth/protected-route.tsx`.
- **Edge Routing & Guards**: `middleware.ts` (sliding-window rate limiter & CORS).
- **Auth Endpoints**: `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`.
- **UI Surfaces**: `app/login/page.tsx`, `app/register/page.tsx`, `app/onboarding/page.tsx`.
- **Domain Services**: `services/user.service.ts`, `services/profile.service.ts`, `services/action-radar.service.ts`, `services/attendance.service.ts`, `services/assessment.service.ts`, `services/chat.service.ts`, `services/opportunity.service.ts`, `services/roadmap.service.ts`, `services/scholarship.service.ts`.
- **Data Repositories**: `repositories/*.repository.ts` (10 repositories).
- **Validation Schemas**: `validations/*.validation.ts` (10 schemas).
- **Configuration & Env**: `lib/env.ts`, `config/app.config.ts`, `drizzle.config.ts`, `package.json`.

---

## 3. Phase 2: Current Authentication Flow

### 3.1 Registration Flow
1. **Client Submission**: Student visits `/register` and submits `email`, `password`, and confirmation.
2. **HTTP Interception**: Request hits `POST /api/auth/register`. `middleware.ts` evaluates `AUTH` rate limit tier (30 requests/min in prod).
3. **Defensive Parsing**: Body is parsed with `.catch(() => null)`.
4. **Syntactic Validation**: `UserValidation.validateRegisterInput()` asserts RFC 5322 email formatting and $\ge 8$ character password complexity.
5. **Duplicate Prevention**: `userRepo.findByEmail()` checks for duplicate email ($\to$ returns HTTP `409 Conflict` if existing).
6. **Salted Hashing**: `PasswordUtil.hash()` generates `scrypt:<16-byte-salt>:<64-byte-key>` using Node.js `crypto.scryptSync`.
7. **Atomic Persistence**: `userRepo.createUserWithDefaults()` executes an atomic PostgreSQL transaction inserting into `users` (`role: student`) and `student_settings` (`notification_enabled: true`, `theme: system`).
8. **Token Issuance**: `createSessionToken(userId, role)` signs `<payload>.<signature>` using HMAC-SHA256 with the active key from `AUTH_SESSION_SECRETS`.
9. **Cookie Attachment**: `setAuthCookie()` sets `auth_session` cookie (`httpOnly: true`, `sameSite: "lax"`, `secure: isProd`, `maxAge: 604800`).
10. **Sanitized Response**: Returns HTTP `201 Created` with `SafeUserDTO` (password hash stripped).

### 3.2 Login Flow
1. Client submits credentials to `POST /api/auth/login`.
2. `userRepo.findByEmail()` fetches user record.
3. `PasswordUtil.verify()` extracts the salt and verifies derived key against stored hash using `crypto.timingSafeEqual()`.
4. On failure: Returns standardized HTTP `401 Unauthorized` with generic message ("Invalid email or password").
5. On success: Generates new signed session token and sets `auth_session` cookie.

### 3.3 Session Verification Flow
1. Incoming API requests invoke `getAuthenticatedUser(request)` in `lib/auth.ts`.
2. Token is extracted from the `auth_session` cookie (or `Authorization: Bearer` header).
3. Signature is validated against all configured rotation keys in `AUTH_SESSION_SECRETS` via `crypto.timingSafeEqual()`.
4. Expiration timestamp (`exp`) and role schema are asserted.
5. Returns typed `AuthSession { userId, role, iat, exp }` or `null`.

---

## 4. Phase 3: User Data Dependency Map

```
users (PK: user_id [bigint identity / integer])
 ├── student_profiles (PK: user_id [FK -> users.user_id, onDelete: CASCADE])
 ├── student_settings (PK: user_id [FK -> users.user_id, onDelete: CASCADE])
 ├── attendance_logs (FK: user_id -> users.user_id, onDelete: CASCADE)
 ├── attendance_summaries (FK: user_id -> users.user_id, onDelete: CASCADE)
 ├── student_cie_marks (FK: user_id -> users.user_id, onDelete: CASCADE)
 ├── student_scholarship_bookmarks (FK: user_id -> users.user_id, onDelete: CASCADE) [Composite PK]
 ├── student_opportunities (FK: user_id -> users.user_id, onDelete: CASCADE) [Composite PK]
 ├── student_roadmap_progress (FK: user_id -> users.user_id, onDelete: CASCADE)
 └── chat_threads (FK: user_id -> users.user_id, onDelete: CASCADE)
      └── chat_messages (FK: chat_id -> chat_threads.chat_id, onDelete: CASCADE)
```

### Table Dependency Matrix

| Dependent Table | Foreign Key Column | Data Mode | Constraint / Cascade | Ownership Scope |
| :--- | :--- | :--- | :--- | :--- |
| `student_profiles` | `user_id` | `bigint` (mode: number) | PK & FK $\to$ `users.user_id` (CASCADE) | 1-to-1 Profile Extension |
| `student_settings` | `user_id` | `bigint` (mode: number) | PK & FK $\to$ `users.user_id` (CASCADE) | 1-to-1 Preferences |
| `attendance_logs` | `user_id` | `bigint` (mode: number) | FK $\to$ `users.user_id` (CASCADE) | Event log |
| `attendance_summaries` | `user_id` | `bigint` (mode: number) | FK $\to$ `users.user_id` (CASCADE) | Aggregate cache |
| `student_cie_marks` | `user_id` | `bigint` (mode: number) | FK $\to$ `users.user_id` (CASCADE) | Unique (`user_id`, `cie_id`) |
| `student_scholarship_bookmarks` | `user_id` | `bigint` (mode: number) | FK $\to$ `users.user_id` (CASCADE) | Composite PK (`user_id`, `scholarship_id`) |
| `student_opportunities` | `user_id` | `bigint` (mode: number) | FK $\to$ `users.user_id` (CASCADE) | Composite PK (`user_id`, `opportunity_id`) |
| `student_roadmap_progress` | `user_id` | `bigint` (mode: number) | FK $\to$ `users.user_id` (CASCADE) | Node progress |
| `chat_threads` | `user_id` | `bigint` (mode: number) | FK $\to$ `users.user_id` (CASCADE) | AI chat sessions |

> **Critical Invariant**: All 9 relational dependencies rely on `users.user_id` as an **integer auto-increment identity (`number`)**. Under no circumstances should `users.user_id` be altered to a `varchar` string (Clerk ID), as this would cause a catastrophic, breaking migration across 9 tables.

---

## 5. Phase 4: Server-Side Authorization Audit

| Route & Domain | Auth Required? | Ownership Enforcement Mechanism | IDOR / Spoofing Risk |
| :--- | :---: | :--- | :---: |
| **Profile** (`/api/profile`) | Yes | Scoped to `getAuthenticatedUser(request).userId`. Client payload cannot spoof `userId`. | **None (OK)** |
| **Attendance** (`/api/attendance/*`) | Yes | Query explicitly appends `eq(attendanceLogs.userId, userId)`. | **None (OK)** |
| **CIE Marks** (`/api/assessments/marks/*`) | Yes | Mutation checks `and(eq(studentCieMarks.markId, markId), eq(studentCieMarks.userId, userId))`. | **None (OK)** |
| **AI Chat** (`/api/chat/threads/*`) | Yes | Ownership validated: `and(eq(chatThreads.chatId, id), eq(chatThreads.userId, userId))`. | **None (OK)** |
| **Scholarships Bookmarks** | Yes | Bridge insert uses `session.userId`. Delete query filters on `session.userId`. | **None (OK)** |
| **Opportunity Tracking** | Yes | Bridge insert uses `session.userId`. Status query filters on `session.userId`. | **None (OK)** |
| **Roadmap Progress** | Yes | Progress row upserted strictly with `session.userId`. | **None (OK)** |
| **Action Radar** (`/api/actions/radar`) | Yes | Calculates metrics strictly for `session.userId`. | **None (OK)** |

**Result**: Zero IDOR vulnerabilities found. All mutating handlers discard client-provided `userId` values and enforce ownership server-side.

---

## 6. Phase 5: Clerk Migration Architectural Comparison

| Dimension | Option A: Sovereign Custom Auth | Option B: Clerk Managed Auth (Recommended) |
| :--- | :--- | :--- |
| **Security & Hashing** | Salted `scrypt` + HMAC-SHA256 (Robust) | Managed Enterprise Auth (SOC2 Type II, Passkeys) |
| **Social SSO (Google/GitHub)** | 🔴 Missing (High dev effort) | 🟢 Built-In (1-Click Enable) |
| **Institutional Email Verification**| 🔴 Missing (Requires custom SMTP) | 🟢 Built-In (Automated OTP / Magic Link) |
| **Self-Service Password Reset** | 🔴 Missing (Requires token engine) | 🟢 Built-In (Automated email reset) |
| **Admin User Management** | 🔴 Missing (Raw SQL / Drizzle Studio only) | 🟢 Dedicated Web Dashboard (Search, Ban, Impersonate) |
| **MFA / 2FA** | 🔴 Missing | 🟢 Built-In (SMS / TOTP / Passkeys) |
| **Session Revocation** | 🟡 Stateless JWT (Valid until expiry) | 🟢 Instant Server-Side Revocation |
| **Vendor Dependency** | 🟢 Zero Vendor Lock-in | 🟡 Dependency on Clerk API |
| **Cost** | 🟢 Free | 🟢 Free up to 10,000 Monthly Active Users |
| **Database Sync Complexity** | 🟢 None (Direct DB operations) | 🟡 Requires Webhook / On-Demand Sync Adapter |

---

## 7. Phase 6: Identity Mapping Architecture

```
CLERK AUTHENTICATION (IDENTITY LAYER)
  └── Clerk User ID (string: "user_2N9x...")
           │
           │ Webhook / Session Token / On-Demand Sync
           ▼
CAMPUSLIT POSTGRESQL (APPLICATION STATE LAYER)
  └── users table:
       ├── user_id (bigint integer: 101)  <── [INTERNAL SURROGATE PK]
       ├── clerk_id (varchar(128) unique) <── [EXTERNAL IDENTITY LINK]
       ├── email (varchar(255) unique)
       └── role (varchar(30) default "student")
           │
           ├── student_profiles (user_id = 101)
           ├── attendance_logs (user_id = 101)
           ├── student_cie_marks (user_id = 101)
           └── student_roadmap_progress (user_id = 101)
```

### Identity Synchronization Strategy:
1. When a student signs in via Clerk, Clerk emits a session JWT containing `sub` (e.g. `user_2N9x...`) and `email`.
2. The CampusLit Auth Adapter looks up the student in PostgreSQL by `clerk_id` (or by `email` for existing accounts).
3. If no record exists, an atomic insertion creates the row in `users` (`clerk_id: sub`, `email`, `role: "student"`) and `student_settings`.
4. Downstream Route Handlers and Repositories continue to receive `session.userId: 101` (`number`), ensuring **100% backward compatibility** with all 21 tables and existing domain logic.

---

## 8. Phase 7: Zero-Data-Loss Migration & Rollback Strategy

1. **Step 1: Non-Breaking Schema Extension**: Add optional, nullable `clerk_id varchar(128) unique` to table `users`.
2. **Step 2: Dual Identity Resolution**: During cutover, `getAuthenticatedUser()` checks for Clerk session first, falling back to legacy `auth_session` cookie if absent.
3. **Step 3: Seamless Account Linking**: When an existing student logs in via Clerk with their registered email, the adapter attaches their `clerk_id` to their existing `user_id` without touching attendance, marks, or profile history.
4. **Step 4: Rollback Safety**: If Clerk experiences an outage or requires rollback, the legacy HMAC engine remains available, and all data remains intact in PostgreSQL.

---

## 9. Phase 8: Environment & Secrets Transition

### Current Environment Variables
- `DATABASE_URL` (PostgreSQL connection string)
- `AUTH_SESSION_SECRET` / `AUTH_SESSION_SECRETS` (HMAC cryptographic signing key)
- `NODE_ENV`
- `DB_MAX_CONNECTIONS`
- `DB_PREPARE_STATEMENTS`

### Target Environment Variables (Phase 6A)
- `DATABASE_URL` (Unchanged)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (Clerk Client API key)
- `CLERK_SECRET_KEY` (Clerk Backend API secret)
- `CLERK_WEBHOOK_SIGNING_SECRET` (Svix webhook verification secret)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`
- `AUTH_SESSION_SECRET` (Retained during migration window for legacy fallback)

---

## 10. Phase 9: Acceptance Test Matrix for Phase 6A

| Test ID | Scenario | Expected Behavior |
| :--- | :--- | :--- |
| `TC-6A-01` | Clerk Sign-Up with Email + OTP | User receives verification OTP; PostgreSQL `users` and `student_settings` created. |
| `TC-6A-02` | Google Social Sign-In | User signs in via Google OAuth; profile hydrated seamlessly. |
| `TC-6A-03` | Self-Service Password Reset | User requests reset link via email; updates password without admin intervention. |
| `TC-6A-04` | Existing Student Migration | Existing student signs in with registered email; `clerk_id` linked to existing `user_id`. |
| `TC-6A-05` | Protected API Authorization | API endpoints extract `session.userId: number` and scope queries properly. |
| `TC-6A-06` | IDOR & Cross-User Defense | User A cannot mutate User B's attendance, marks, or AI chat threads. |
| `TC-6A-07` | Session Revocation | Revoking a session in Clerk dashboard immediately terminates API access (`401`). |
| `TC-6A-08` | Full Regression Stability | All 427 domain tests across Phases 5A–5F pass with 0 regressions. |
