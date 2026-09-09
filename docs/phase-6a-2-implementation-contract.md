# Phase 6A.2: Clerk Authentication Migration & Identity Bridge Implementation Contract

**Document Version:** 1.0.0  
**Status:** Approved Final Implementation Contract  
**Author:** Senior Staff Software Architect, Security Engineer & Database Reviewer  
**Date:** September 2026  

---

## 1. Executive Summary & Purpose

This contract establishes the **exact, immutable specifications** for implementing **Phase 6A.2: Clerk Authentication & Hybrid Identity Bridge** in CampusOS. 

### Core Architectural Invariant
> **The CampusOS internal identity `users.userId` (`bigint` mode: `number`) MUST remain the immutable surrogate primary key across all 9 relational application domains.** Under no circumstances will `users.userId` be replaced by Clerk's `user_id` string. Clerk acts strictly as an external identity provider mapped to the internal `userId`.

---

## 2. Exact Database Changes (`db/schema.ts`)

The database schema modification is **strictly non-destructive and additive**, preserving all 21 existing tables, foreign keys, and indexes.

### Exact DDL / Schema Specification
In `db/schema.ts`, table `users` will be updated as follows:

```typescript
export const users = pgTable(
  "users",
  {
    userId: bigint("user_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    clerkId: varchar("clerk_id", { length: 128 }).unique(), // Nullable external Clerk identity link
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash"), // Nullable: populated for legacy users, null for pure Clerk users
    role: varchar("role", { length: 30 }).notNull().default("student"),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
  },
  (table) => [
    check("chk_users_role", sql`${table.role} IN ('student', 'admin', 'faculty')`),
  ]
);
```

### Security Implications of Nullable `passwordHash`:
- **Legacy Users**: Retain their salted `scrypt` hash (`scrypt:<salt>:<hexKey>`).
- **New Clerk Users**: `passwordHash` is `null`.
- **Authentication Safety**: `PasswordUtil.verify(password, storedHash)` explicitly returns `false` if `storedHash` is `null`, `undefined`, or empty, preventing any password bypass on Clerk-provisioned accounts.

---

## 3. Exact Identity Mapping Architecture

```
CLERK MANAGED IDENTITY (EXTERNAL)
  └── Clerk User ID: sub (string: "user_2N9x...")
           │
           │ Mapped via users.clerkId
           ▼
CAMPUSOS APPLICATION STATE (INTERNAL)
  └── users table:
       ├── user_id: 101 (bigint integer) <── [IMMUTABLE INTERNAL SURROGATE PK]
       ├── clerk_id: "user_2N9x..."       <── [UNIQUE NULLABLE IDENTITY LINK]
       ├── email: "student@rvce.edu.in"
       ├── password_hash: null / scrypt
       └── role: "student"
           │
           ├── student_profiles (user_id = 101)
           ├── student_settings (user_id = 101)
           ├── attendance_logs (user_id = 101)
           ├── attendance_summaries (user_id = 101)
           ├── student_cie_marks (user_id = 101)
           ├── student_scholarship_bookmarks (user_id = 101)
           ├── student_opportunities (user_id = 101)
           ├── student_roadmap_progress (user_id = 101)
           └── chat_threads (user_id = 101)
```

---

## 4. Exact User Flows

### 4.1 New User Registration Flow
1. Student navigates to `/register` and signs up via Clerk (Email + OTP or Google Social SSO).
2. Clerk verifies the email and creates the Clerk user identity (`sub: "user_..."`).
3. Clerk triggers `user.created` webhook to `/api/webhooks/clerk`.
4. The webhook handler (or request-time JIT fallback) executes an atomic PostgreSQL insert:
   ```sql
   INSERT INTO users (clerk_id, email, password_hash, role)
   VALUES (:clerkId, :email, NULL, 'student')
   RETURNING user_id;
   ```
5. Inserts default row into `student_settings` (`user_id`, `notification_enabled: true`, `theme: 'system'`).
6. Student is redirected to `/onboarding` to complete profile details (`student_profiles`).

### 4.2 Existing User Migration & Identity Linking Flow
1. Existing student navigates to `/login` and signs in via Clerk using their registered email.
2. **Path A (Verified Matching Email)**:
   - If Clerk email is verified AND matches `LOWER(TRIM(users.email))` AND `users.clerk_id IS NULL`:
   - System executes atomic link: `UPDATE users SET clerk_id = :sub WHERE user_id = :existingUserId;`.
   - Student enters dashboard with **100% of historical attendance, CIE marks, bookmarks, and roadmaps intact**.
3. **Path B (Differing Email / Google Personal Account)**:
   - If the student signs in via a personal Google account (`student@gmail.com`) that differs from their registered college email (`usn@college.edu.in`):
   - System presents an **Explicit Account Linking Challenge**: *"Link existing CampusOS account by entering your college email and password."*
   - Upon verifying legacy password via `PasswordUtil.verify()`, system links `users.clerk_id = :sub`.

### 4.3 Login & Session Verification Flow
1. Student accesses CampusOS with Clerk session token (cookie / Bearer header).
2. `getAuthenticatedUser(request)` in `lib/auth.ts`:
   - Validates Clerk JWT claims (`sub`, `exp`).
   - Queries PostgreSQL: `SELECT user_id, role FROM users WHERE clerk_id = :sub`.
   - Returns typed `AuthSession { userId: number, role: UserRole, iat, exp }`.
3. Downstream API route handlers receive `session.userId: number`.

### 4.4 Logout Flow
1. Student clicks Logout in UI.
2. Frontend calls Clerk `useClerk().signOut()` to revoke Clerk session.
3. Calls `/api/auth/logout` to clear any residual legacy `auth_session` cookie.
4. Redirects to `/login`.

---

## 5. API Authorization Boundary & Invariant

### Invariant:
- **`clerk_id` is strictly quarantined at the Authentication Adapter boundary (`lib/auth.ts`).**
- **All Domain Services, Repositories, and Route Handlers receive ONLY `session.userId: number`.**
- Client-supplied `userId` fields in request bodies or query parameters are **strictly ignored and overwritten with `session.userId`**.

```typescript
// Canonical Downstream Signature (NEVER MODIFIED):
export async function getStudentDashboard(userId: number): Promise<AttendanceDashboardDTO>;
export async function recordStudentMark(userId: number, input: RecordMarkInput): Promise<StudentCieMarkDTO>;
export async function buildRadarPayload(userId: number): Promise<ActionRadarDTO>;
```

---

## 6. Password & Legacy Authentication Handling

1. **Legacy Auth Deprecation**:
   - For accounts where `users.clerk_id IS NOT NULL`, legacy `POST /api/auth/login` returns HTTP `403 Forbidden`: *"Account migrated to Clerk. Please sign in with Clerk / Google."*
2. **Legacy Dual-Auth Support**:
   - `lib/auth.ts` evaluates Clerk session first.
   - If no Clerk session is present, it falls back to verifying the legacy `auth_session` HMAC cookie during the migration cutover window.

---

## 7. Account Deletion & Institutional Data Policy

1. **Clerk `user.deleted` Webhook**:
   - Executes **Soft-Delinking** (NOT hard delete):
     ```sql
     UPDATE users SET clerk_id = NULL WHERE clerk_id = :clerkId;
     ```
   - Preserves all 9 child tables (`attendance_logs`, `student_cie_marks`, `student_profiles`) for institutional auditing and academic compliance.
2. **Hard Deletion (GDPR / DPDP Erasure)**:
   - Permitted only via an authorized administrative API (`DELETE /api/admin/users/:id`), executing full relational cascade wipe only when authorized.

---

## 8. Exact Webhook Events Required

Endpoint: `POST /api/webhooks/clerk` (Protected by `svix` signature verification)

| Event Type | Handler Action | Idempotency & Error Handling |
| :--- | :--- | :--- |
| `user.created` | Inserts `users` (`clerk_id`, `email`, `role`) + `student_settings`. | `ON CONFLICT (clerk_id) DO NOTHING` |
| `user.updated` | Updates `users.email` if verified in Clerk. | Verified email assertion; skips if unverified. |
| `user.deleted` | Soft-delinks: `UPDATE users SET clerk_id = NULL WHERE clerk_id = :id`. | Safe idempotent update. |

---

## 9. Environment Variables Specification

### Public Client Configuration (Safe for Browser)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`

### Server-Only Secrets (Never Exposed to Client)
- `CLERK_SECRET_KEY=sk_test_...`
- `CLERK_WEBHOOK_SIGNING_SECRET=whsec_...`
- `DATABASE_URL=postgresql://...`
- `AUTH_SESSION_SECRET=...` (Retained for legacy HMAC verification during migration)

---

## 10. File Impact Map

### Files That Will Change in Phase 6A.2:
1. `package.json` (add `@clerk/nextjs` and `svix`)
2. `db/schema.ts` (add nullable `clerkId` to `users` table)
3. `lib/auth.ts` (add Clerk identity resolution adapter returning `AuthSession { userId: number }`)
4. `middleware.ts` (combine Clerk middleware with sliding-window rate limiter)
5. `app/layout.tsx` (wrap with `<ClerkProvider>`)
6. `components/auth/auth-provider.tsx` (bridge Clerk client hooks `useUser()` / `useAuth()`)
7. `components/auth/protected-route.tsx` (use Clerk auth loading / sign-in state)
8. `app/login/page.tsx` & `app/register/page.tsx` (embed Clerk `<SignIn />` and `<SignUp />` components)
9. `app/api/webhooks/clerk/route.ts` (NEW: Webhook handler for user sync)
10. `app/api/auth/link-legacy/route.ts` (NEW: Explicit linking challenge endpoint for differing emails)

### Files That MUST NOT Change (Strictly Frozen):
- `services/action-radar.service.ts`
- `services/attendance.service.ts`
- `services/assessment.service.ts`
- `services/scholarship.service.ts`
- `services/opportunity.service.ts`
- `services/roadmap.service.ts`
- `repositories/*.repository.ts` (all 10 repositories)
- `data/*` (all 192 colleges, 64 scholarships, 65 opportunities, 22 course vaults)
- All 35 existing route handlers in `app/api/*` (excluding auth/webhook routes)

---

## 11. Database Backup & Rollback Procedure

### Backup Procedure (Prior to Migration):
1. Create PostgreSQL dump: `pg_dump -Fc -v "$DATABASE_URL" -f "campusos_pre_phase6a_backup.dump"`.
2. Verify table row counts on all 21 tables.

### Rollback Procedure (If Clerk Integration Encounters Blocker):
1. Remove Clerk middleware from `middleware.ts`.
2. Revert `lib/auth.ts` to evaluate legacy `auth_session` HMAC cookies directly.
3. Database remains 100% operational (nullable `clerk_id` column does not affect legacy queries).

---

## 12. Security Acceptance Tests (Phase 6A.2 Battery)

- **TC-6A-01**: New student registers via Clerk $\to$ PostgreSQL `users` row created with `clerk_id` $\to$ default `student_settings` created.
- **TC-6A-02**: Student signs in via Google OAuth $\to$ profile hydrates $\to$ redirects to `/onboarding`.
- **TC-6A-03**: Existing student logs in with matching verified email $\to$ `clerk_id` automatically linked $\to$ existing attendance and CIE marks intact.
- **TC-6A-04**: Existing student logs in with differing Google email $\to$ explicit linking challenge prompts for legacy password $\to$ links upon correct verification.
- **TC-6A-05**: Student with unverified Clerk email attempts linking $\to$ system denies linking and requests email OTP.
- **TC-6A-06**: Downstream API route (`/api/actions/radar`) receives `session.userId: number` $\to$ executes Rule-of-One prioritization with 0 errors.
- **TC-6A-07**: 75% Bunk Defense calculator accurately reads logged attendance records after Clerk migration.
- **TC-6A-08**: IDOR defense verified: User A with valid Clerk session cannot view or mutate User B's records.
- **TC-6A-09**: Clerk session revocation immediately blocks subsequent API requests (`401 Unauthorized`).
- **TC-6A-10**: Webhook `user.deleted` soft-delinks `clerk_id` without deleting PostgreSQL academic records.
- **TC-6A-11**: Full 427 regression tests across Phases 5A–5F pass with 100% success rate.
- **TC-6A-12**: `npx tsc --noEmit` and `npm run build` pass with 0 errors.
