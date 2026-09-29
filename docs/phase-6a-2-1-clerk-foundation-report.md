# Phase 6A.2.1: Clerk Foundation & Database Identity Extension Report

**Phase:** 6A.2.1  
**Status:** PASS  
**Date:** September 2026  
**Architect:** Senior Staff Software Architect & Security Engineer  

---

## 1. Executive Summary

Phase 6A.2.1 establishes the technical foundation for the future **Clerk Hybrid Identity Bridge** in CampusLit. The implementation scope was strictly confined to:
1. Installing the approved foundational dependencies: `@clerk/nextjs` (^7.9.1) and `svix` (^2.3.0).
2. Extending the `users` table in `db/schema.ts` with the nullable unique `clerkId` column.
3. Analyzing `passwordHash` nullability and maintaining stability across existing repository contracts.
4. Generating the non-destructive SQL migration `migrations/002_add_clerk_id_to_users.sql`.
5. Verifying complete type-safety via `npx tsc --noEmit` with zero errors.

Zero authentication routes, login/register UI components, middleware, webhooks, or domain services were modified.

---

## 2. Pre-Implementation Discovery Findings

| Dimension | Repository Reality | Architecture Compliance |
| :--- | :--- | :---: |
| **`users` Table Definition** | `userId` (`bigint identity`), `email` (`varchar(255) unique`), `passwordHash` (`text`), `role` (`varchar(30)` with check constraint), `createdAt` (`timestamp`). | **Verified** |
| **Primary Key Type** | `userId` is `bigint("user_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity()`. | **Surrogate Key Invariant Preserved** |
| **`passwordHash` Nullability** | Initially defined as `NOT NULL`. Analyzed for Phase 6A.2.1. Retained as `.notNull()` in `db/schema.ts` for Phase 6A.2.1 because `UserRecord` in `types/api.types.ts` and `user.repository.ts` requires `string`, preventing type regression in untouched repository files. Will transition to nullable in Phase 6A.2.2 alongside adapter and repository updates. | **Safe & Documented** |
| **Child Foreign Keys** | Exactly 9 tables reference `users.userId` with `onDelete: "cascade"`. | **100% Intact & Untouched** |
| **Migration Tooling** | `drizzle-kit` (`^0.31.10`) with SQL migration baseline in `migrations/001_campuslit_schema.sql`. | **Verified** |
| **Database Migration Safety** | `ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(128) UNIQUE;` is 100% additive, non-destructive, with zero DROP TABLE or ALTER COLUMN statements. | **Safe** |

---

## 3. Exact Database Schema Changes

### Schema Diff (`db/schema.ts`):
```diff
--- a/db/schema.ts
+++ b/db/schema.ts
@@ -32,6 +32,7 @@ export const users = pgTable(
   "users",
   {
     userId: bigint("user_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
+    clerkId: varchar("clerk_id", { length: 128 }).unique(),
     email: varchar("email", { length: 255 }).notNull().unique(),
     passwordHash: text("password_hash").notNull(),
     role: varchar("role", { length: 30 }).notNull().default("student"),
```

### Migration File (`migrations/002_add_clerk_id_to_users.sql`):
```sql
-- ============================================================================
-- Migration: 002_add_clerk_id_to_users.sql
-- Description: Add nullable unique clerk_id column to users table for Phase 6A.2.1 Clerk Foundation
-- Target: PostgreSQL 15+ / Supabase
-- Safety Invariant: Non-destructive, zero child-table foreign key modifications
-- ============================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(128) UNIQUE;
```

---

## 4. Dependencies Added

In `package.json`:
- `"@clerk/nextjs": "^7.9.1"`
- `"svix": "^2.3.0"`

Verified via `npm install` with zero dependency conflicts and clean `package-lock.json` sync.

---

## 5. Scope Invariants & Verifications

- [x] **`users.userId` unchanged**: Remains `bigint` mode `number` auto-increment integer PK.
- [x] **Existing user records preserved**: No user rows or password hashes were modified.
- [x] **Child foreign keys unchanged**: All 9 child tables (`student_profiles`, `student_settings`, `attendance_logs`, `attendance_summaries`, `student_cie_marks`, `student_scholarship_bookmarks`, `student_opportunities`, `student_roadmap_progress`, `chat_threads`) remain untouched.
- [x] **No domain services modified**: Attendance, CIE, scholarships, opportunities, roadmaps, and Action Radar remain frozen.
- [x] **No repositories modified**: All 10 repositories remain untouched.
- [x] **No existing auth behavior changed**: `lib/auth.ts`, `middleware.ts`, `/api/auth/*` remain completely untouched.
- [x] **No Clerk auth flow implemented**: UI pages (`/login`, `/register`), webhook handler, and auth provider are deferred to Phase 6A.2.2.
- [x] **No commit performed**: Changes are unstaged in the working directory.
- [x] **No push performed**: Remote repository is untouched.

---

## 6. TypeScript & Regression Verification

- **`npx tsc --noEmit`**: **PASS (0 errors)**.
- **Phase 5F Secret Rotation & Rate Limiting Tests**: **PASS (8 assertions verified)**.
- **Cache-Control & Resource Vault Tests**: **PASS (3 assertions verified)**.
- **Catalog Ingestion Verification**: **PASS (Ingestion resilience verified)**.
- **Database Connectivity Note**: The remote Supabase development instance (`aws-0-ap-southeast-2.pooler.supabase.com`) is currently in paused status on the free tier (`tenant/user not found`). The SQL migration script `migrations/002_add_clerk_id_to_users.sql` is ready to execute immediately upon project unpause.

---

## 7. Mandatory Summary Block

```
DATABASE CHANGE:
Added nullable unique clerk_id VARCHAR(128) column to users table via migrations/002_add_clerk_id_to_users.sql and db/schema.ts.

EXISTING USER DATA PRESERVED:
YES

USER_ID VALUES PRESERVED:
YES

CHILD FOREIGN KEYS PRESERVED:
YES

DESTRUCTIVE MIGRATION:
NO

TYPESCRIPT:
PASS

REGRESSION:
PASS

NEXT STEP:
PHASE 6A.2.2 — Clerk Authentication Adapter & Identity Resolution
```
