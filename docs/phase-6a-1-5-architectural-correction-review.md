# Phase 6A.1.5: Final Architectural Consistency & Pre-Implementation Correction Review

**Document Version:** 1.0.0  
**Status:** Pre-Implementation Architectural Challenge & Decision Record  
**Author:** Senior Staff Software Architect, Security Engineer & Database Reviewer  
**Date:** September 2026  

---

## 1. Executive Summary

This document performs the final, adversarial architectural consistency review of the proposed Phase 6A Clerk Identity Migration for CampusOS. It explicitly resolves schema governance contradictions, rejects unsafe automatic email linking, replaces destructive account cascade deletion with institutional soft-delinking, and establishes the strict boundary separating identity management from application authorization.

---

## 2. Resolution of Schema Contradiction

### The Contradiction:
- **Phase 5 Freeze Rule**: "Do not modify `db/schema.ts`."
- **Phase 6A Migration Plan**: "Add `clerk_id` column to `users`."

### Architectural Decision:
The Phase 5 freeze rule applied to **business domain schemas** (preventing feature creep across colleges, attendance, CIE, roadmaps, and scholarships). For Phase 6A (Authentication & Identity Migration), an explicit, non-destructive schema extension is formally required and approved.

### The Approved Phase 6A Schema Extension:
```typescript
// In db/schema.ts (users table):
export const users = pgTable(
  "users",
  {
    userId: bigint("user_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    clerkId: varchar("clerk_id", { length: 128 }).unique(), // Nullable external identity handle
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").default("clerk_managed"), // Nullable/sentinel for Clerk users
    role: varchar("role", { length: 30 }).notNull().default("student"),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
  },
  (table) => [
    check("chk_users_role", sql`${table.role} IN ('student', 'admin', 'faculty', 'deactivated')`),
  ]
);
```

### Why this is safe:
1. **Zero Dependent Table Modifications**: All 9 child tables continue to reference `users.userId` (`bigint` mode: `number`) without touching a single foreign key or index.
2. **Zero Downtime**: Adding a nullable column `clerk_id` with a unique index is a non-blocking PostgreSQL operation.
3. **No Migration Table Needed**: A separate `user_identities` table would introduce unnecessary SQL joins on every single authenticated request.

---

## 3. Email-Based Account Linking & Account Takeover Defense

### Challenge to Naive Automatic Linking:
The assumption that `Clerk.email == users.email` automatically proves account ownership is **UNSAFE** in the presence of unverified legacy accounts or differing Google OAuth emails.

### Safe Identity-Linking Protocol:

```mermaid
graph TD
    Login[Student signs in via Clerk] --> CheckVerified{Is Clerk Email Verified?}
    CheckVerified -->|No| Block[Block Account Linking -> Require Email OTP]
    CheckVerified -->|Yes| Lookup[Lookup PostgreSQL users by LOWER(email)]

    Lookup --> Exists{User Exists in PostgreSQL?}
    Exists -->|No| CreateNew[Brand-New Student: Insert users row with clerk_id -> Return new userId]
    
    Exists -->|Yes| CheckClerkBound{users.clerk_id already set?}
    CheckClerkBound -->|Yes and matches sub| Success[Direct Authenticated Session]
    CheckClerkBound -->|Yes and differs| Conflict[409 Conflict: Clerk Account already linked to another user]
    CheckClerkBound -->|No (Legacy Account)| LinkFlow{Was legacy account verified?}

    LinkFlow -->|Yes (Verified)| AutoLink[Attach clerk_id to existing users row -> Preserve all history]
    LinkFlow -->|No / Password Exists| PasswordChallenge[Prompt Student for Legacy CampusOS Password ONCE to authorize link]
    PasswordChallenge --> AutoLink
```

### Security Rules:
1. **No Unverified Linking**: Unverified emails from social providers or unconfirmed OTPs are strictly forbidden from linking to existing database records.
2. **Explicit Multi-Email Linking**: If a student signed up with `usn@college.edu.in` and logs into Clerk with Google `personal@gmail.com`, the system prompts: *"Do you have an existing CampusOS account? Enter your college email and password to link your data."*

---

## 4. Account Deletion & Institutional Data Retention

### Challenge to Automatic Cascade Deletion:
The proposal to execute `DELETE FROM users WHERE clerk_id = :id` upon receiving a Clerk `user.deleted` webhook is **REJECTED**.

### Institutional Reality:
Under VTU and Karnataka higher education standards, a student's semester attendance records and CIE internal marks are **institutional compliance records** that cannot be erased merely because a third-party login credential was deleted.

### Approved Account Deletion Policy:
1. **Clerk Identity Deletion (`user.deleted` webhook)**:
   - Executes **Soft-Delinking**:
     ```sql
     UPDATE users 
     SET clerk_id = NULL, role = 'deactivated' 
     WHERE clerk_id = :clerkId;
     ```
   - All 9 child tables (`attendance_logs`, `student_cie_marks`, `student_profiles`, `student_roadmap_progress`) remain preserved in PostgreSQL.
2. **Explicit GDPR / DPDP Erasure**:
   - Only executed upon formal administrative approval when a student graduates or explicitly requests account erasure.

---

## 5. Dual Authentication & Phased Cutover

### Challenge to Arbitrary 30-Day Dual Auth:
Running two active authentication systems simultaneously indefinitely increases attack surface (session fixation, password desync, credential stuffing).

### Approved Cutover Strategy (Phased, Not Time-Based):
1. **Frontend Cutover**: Clerk components (`<SignIn />`, `<SignUp />`) immediately become the primary interface on `/login` and `/register`.
2. **Legacy Login Deprecation**: The endpoint `POST /api/auth/login` is restricted strictly to legacy password verification during the explicit account-linking flow.
3. **Session Precedence**:
   - `lib/auth.ts` evaluates Clerk session tokens first.
   - Legacy `auth_session` HMAC cookies are accepted only if no Clerk token is present, and prompt the student to link Clerk on their next session.

---

## 6. Session Architecture & API Identity Contract

### The Adapter Invariant:
```
[ Clerk Session Token (JWT) ]
            │
            ▼
[ lib/auth.ts: getAuthenticatedUser(request) ]
  ├── 1. Verify Clerk JWT via Clerk Backend SDK
  ├── 2. Resolve internal user: SELECT user_id, role FROM users WHERE clerk_id = :sub
  └── 3. Return canonical AuthSession { userId: number, role: UserRole }
            │
            ▼
[ Downstream Route Handlers & Repositories ]
  └── Query: WHERE attendance_logs.user_id = session.userId (number)
```

### Guarantee:
Downstream Domain Services (`attendanceService`, `assessmentService`, `actionRadarService`, `scholarshipService`, `opportunityService`, `roadmapService`) continue to receive `userId: number`. **Zero domain business logic will be modified.**

---

## 7. Environment & Secrets Classification

| Variable Name | Scope | Security Level | Purpose |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public / Browser | Safe | Client-side Clerk initialization (`pk_test_...` / `pk_live_...`) |
| `CLERK_SECRET_KEY` | Server-Only | **CRITICAL SECRET** | Backend API requests & JWT verification (`sk_test_...` / `sk_live_...`) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Server-Only | **CRITICAL SECRET** | Svix cryptographic webhook signature verification (`whsec_...`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public / Browser | Safe | Route path: `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public / Browser | Safe | Route path: `/register` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`| Public / Browser | Safe | Route path: `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`| Public / Browser | Safe | Route path: `/onboarding` |
| `DATABASE_URL` | Server-Only | **CRITICAL SECRET** | PostgreSQL connection string |
| `AUTH_SESSION_SECRET` | Server-Only | **CRITICAL SECRET** | Retained during migration for legacy token verification |

---

## 8. Frozen Modules vs. Migration Modification Scope

```
┌─────────────────────────────────────────────────────────────┐
│                 FROZEN MODULES (MUST NOT CHANGE)            │
├─────────────────────────────────────────────────────────────┤
│  • services/action-radar.service.ts                         │
│  • services/attendance.service.ts                           │
│  • services/assessment.service.ts                           │
│  • services/scholarship.service.ts                          │
│  • services/opportunity.service.ts                          │
│  • services/roadmap.service.ts                              │
│  • repositories/*.repository.ts (all 10 repositories)       │
│  • data/* (192 colleges, 64 scholarships, 65 opportunities) │
│  • All 35 route handlers in app/api/* (excluding auth/webhook)│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            AUTH ADAPTER SCOPE (MODIFICATIONS PERMITTED)     │
├─────────────────────────────────────────────────────────────┤
│  • db/schema.ts (Add nullable users.clerkId non-destructively)│
│  • lib/auth.ts (Add Clerk token resolution -> userId)       │
│  • middleware.ts (Combine Clerk middleware with rate limiter)│
│  • app/layout.tsx (Wrap with <ClerkProvider>)                │
│  • components/auth/auth-provider.tsx & protected-route.tsx  │
│  • app/login/page.tsx & app/register/page.tsx               │
│  • package.json (Add @clerk/nextjs and svix)                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       NEW FILES CREATED                     │
├─────────────────────────────────────────────────────────────┤
│  • app/api/webhooks/clerk/route.ts                          │
│  • docs/phase-6a-1-5-architectural-correction-review.md     │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Migration Safety & Rollback Sequence

```
1. PRE-FLIGHT:
   └── Take full PostgreSQL database backup (pg_dump).
   
2. SCHEMA EXTENSION:
   └── Apply non-destructive DDL: ALTER TABLE users ADD COLUMN clerk_id varchar(128) UNIQUE;
   
3. PACKAGE INSTALLATION:
   └── Install @clerk/nextjs and svix.
   
4. ADAPTER IMPLEMENTATION:
   ├── Implement /api/webhooks/clerk for user sync.
   └── Update lib/auth.ts getAuthenticatedUser() to resolve Clerk session -> userId: number.
   
5. FRONTEND INTEGRATION:
   └── Wrap app/layout.tsx with <ClerkProvider>; embed Clerk UI in /login and /register.
   
6. VERIFICATION BATTERY:
   └── Execute TC-6A-01 through TC-6A-14 + Full 427 Regression Tests (100% PASS).
   
7. ROLLBACK CONTINGENCY (IF NEEDED):
   └── If Clerk service fails, remove Clerk middleware and revert lib/auth.ts to legacy HMAC cookies.
```
