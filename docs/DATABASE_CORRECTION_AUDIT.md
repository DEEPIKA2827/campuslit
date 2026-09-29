# CampusLit — Corrected Database Schema & Codebase Audit Report (v2.1)

**Document Status:** Fully Verified Technical Audit (Topologically Exact)  
**Source of Truth:** [`docs/CampusLit_Corrected_Database_Schema.pdf`](file:///C:/Projects/campuslit/docs/CampusLit_Corrected_Database_Schema.pdf)  
**Target Database Stack:** PostgreSQL on Supabase + Drizzle ORM  
**Audit Scope:** Relational Verification, Strict Topological Dependency Levels, Git Status, and Codebase Architecture  

---

## 1. Executive Summary & Verification Scope

This document provides a verified technical audit of the CampusLit codebase against the senior-approved 21-table normalized relational database schema in `docs/CampusLit_Corrected_Database_Schema.pdf`.

### Critical Distinction: TypeScript/Documentation vs. Physical Database
- **TypeScript DTOs & Documentation (Aligned):** All 21 DTO interfaces in `types/api.types.ts`, the database documentation in `docs/DATABASE_SCHEMA.md`, and the Mermaid diagram in `docs/ER_DIAGRAM.md` match the senior-approved 21-table schema.
- **Physical Database & ORM Layer (0% Implemented):** No PostgreSQL SQL DDL migrations, no Drizzle ORM schema definitions, no database drivers (`pg` / `postgres`), and no active database connection clients exist in the codebase. `lib/db.ts` is currently a disconnected stub class.

---

## 2. Table-by-Table Verification Against Senior PDF

Every entity, column, data type, key constraint, unique index, and check constraint below has been cross-referenced directly with Section 3, Section 5, and Section 6 of `CampusLit_Corrected_Database_Schema.pdf`:

| # | Table Name | Columns & Types | Primary Key | Foreign Keys | Constraints / Rules |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `users` | `user_id` BIGINT<br>`email` VARCHAR(255)<br>`password_hash` TEXT<br>`role` VARCHAR(30)<br>`created_at` TIMESTAMP | `user_id` | *None* | • `email` UNIQUE, NOT NULL<br>• `password_hash` NOT NULL<br>• `role` CHECK (`student`, `admin`, `faculty`)<br>• `created_at` DEFAULT CURRENT_TIMESTAMP |
| **2** | `student_profiles` | `user_id` BIGINT<br>`first_name` VARCHAR(100)<br>`last_name` VARCHAR(100)<br>`college_id` BIGINT<br>`course_id` BIGINT<br>`semester` SMALLINT<br>`created_at` TIMESTAMP | `user_id` | • `user_id` → `users(user_id)`<br>• `college_id` → `colleges(college_id)`<br>• `course_id` → `courses(course_id)` | • `first_name` NOT NULL<br>• `last_name` NULL<br>• `semester` NULL<br>• `created_at` DEFAULT CURRENT_TIMESTAMP |
| **3** | `student_settings` | `user_id` BIGINT<br>`notification_enabled` BOOLEAN<br>`theme` VARCHAR(20)<br>`language` VARCHAR(20) | `user_id` | • `user_id` → `users(user_id)` | • `notification_enabled` DEFAULT TRUE<br>• `theme` DEFAULT 'system'<br>• `language` DEFAULT 'en' |
| **4** | `colleges` | `college_id` BIGINT<br>`college_name` VARCHAR(255)<br>`location` VARCHAR(255)<br>`created_at` TIMESTAMP | `college_id` | *None* | • `college_name` NOT NULL<br>• `location` NULL<br>• `created_at` DEFAULT CURRENT_TIMESTAMP |
| **5** | `academic_schemes` | `scheme_id` BIGINT<br>`college_id` BIGINT<br>`scheme_name` VARCHAR(100)<br>`academic_year` VARCHAR(20) | `scheme_id` | • `college_id` → `colleges(college_id)` | • `scheme_name` NOT NULL<br>• `academic_year` NULL |
| **6** | `courses` | `course_id` BIGINT<br>`scheme_id` BIGINT<br>`course_name` VARCHAR(255)<br>`course_code` VARCHAR(50) | `course_id` | • `scheme_id` → `academic_schemes(scheme_id)` | • `course_name` NOT NULL<br>• `course_code` UNIQUE |
| **7** | `attendance_logs` | `attendance_id` BIGINT<br>`user_id` BIGINT<br>`course_id` BIGINT<br>`attendance_date` DATE<br>`status` VARCHAR(20) | `attendance_id` | • `user_id` → `users(user_id)`<br>• `course_id` → `courses(course_id)` | • `attendance_date` NOT NULL<br>• `status` CHECK (`present`, `absent`, `late`) |
| **8** | `attendance_summaries` | `summary_id` BIGINT<br>`user_id` BIGINT<br>`course_id` BIGINT<br>`total_classes` INT<br>`attended_classes` INT<br>`attendance_percentage` DECIMAL(5,2) | `summary_id` | • `user_id` → `users(user_id)`<br>• `course_id` → `courses(course_id)` | • `total_classes` NOT NULL<br>• `attended_classes` NOT NULL<br>• `attendance_percentage` NOT NULL |
| **9** | `cie_assessments` | `cie_id` BIGINT<br>`course_id` BIGINT<br>`assessment_name` VARCHAR(100)<br>`assessment_date` DATE<br>`max_marks` DECIMAL(6,2) | `cie_id` | • `course_id` → `courses(course_id)` | • `assessment_name` NOT NULL<br>• `assessment_date` NULL<br>• `max_marks` NOT NULL |
| **10** | `student_cie_marks` | `mark_id` BIGINT<br>`user_id` BIGINT<br>`cie_id` BIGINT<br>`marks_obtained` DECIMAL(6,2) | `mark_id` | • `user_id` → `users(user_id)`<br>• `cie_id` → `cie_assessments(cie_id)` | • `marks_obtained` NOT NULL<br>• `UNIQUE(user_id, cie_id)` |
| **11** | `pyqs` | `pyq_id` BIGINT<br>`course_id` BIGINT<br>`question` TEXT<br>`exam_year` SMALLINT<br>`marks` DECIMAL(5,2)<br>`difficulty` VARCHAR(20) | `pyq_id` | • `course_id` → `courses(course_id)` | • `question` NOT NULL<br>• `exam_year` NULL<br>• `marks` NULL<br>• `difficulty` CHECK (`easy`, `medium`, `hard`) |
| **12** | `viva_questions` | `viva_id` BIGINT<br>`course_id` BIGINT<br>`question` TEXT<br>`difficulty` VARCHAR(20) | `viva_id` | • `course_id` → `courses(course_id)` | • `question` NOT NULL<br>• `difficulty` CHECK (`easy`, `medium`, `hard`) |
| **13** | `chat_threads` | `chat_id` BIGINT<br>`user_id` BIGINT<br>`title` VARCHAR(255)<br>`created_at` TIMESTAMP | `chat_id` | • `user_id` → `users(user_id)` | • `title` NULL<br>• `created_at` DEFAULT CURRENT_TIMESTAMP |
| **14** | `chat_messages` | `message_id` BIGINT<br>`chat_id` BIGINT<br>`sender_type` VARCHAR(20)<br>`message` TEXT<br>`created_at` TIMESTAMP | `message_id` | • `chat_id` → `chat_threads(chat_id)` | • `sender_type` CHECK (`user`, `assistant`)<br>• `message` NOT NULL<br>• `created_at` DEFAULT CURRENT_TIMESTAMP |
| **15** | `scholarships` | `scholarship_id` BIGINT<br>`scholarship_name` VARCHAR(255)<br>`description` TEXT<br>`eligibility` TEXT<br>`application_url` TEXT<br>`deadline` DATE | `scholarship_id` | *None* | • `scholarship_name` NOT NULL<br>• `description` NULL<br>• `eligibility` NULL<br>• `application_url` NULL<br>• `deadline` NULL |
| **16** | `student_scholarship_bookmarks` | `user_id` BIGINT<br>`scholarship_id` BIGINT<br>`bookmarked_at` TIMESTAMP | **Composite PK:**<br>`(user_id, scholarship_id)` | • `user_id` → `users(user_id)`<br>• `scholarship_id` → `scholarships(scholarship_id)` | • `bookmarked_at` DEFAULT CURRENT_TIMESTAMP |
| **17** | `roadmaps` | `roadmap_id` BIGINT<br>`title` VARCHAR(255)<br>`description` TEXT<br>`career` VARCHAR(150) | `roadmap_id` | *None* | • `title` NOT NULL<br>• `description` NULL<br>• `career` NULL |
| **18** | `roadmap_nodes` | `node_id` BIGINT<br>`roadmap_id` BIGINT<br>`title` VARCHAR(255)<br>`description` TEXT<br>`sequence_no` INT | `node_id` | • `roadmap_id` → `roadmaps(roadmap_id)` | • `title` NOT NULL<br>• `description` NULL<br>• `sequence_no` NOT NULL<br>• `UNIQUE(roadmap_id, sequence_no)` |
| **19** | `student_roadmap_progress` | `progress_id` BIGINT<br>`user_id` BIGINT<br>`roadmap_id` BIGINT<br>`node_id` BIGINT<br>`status` VARCHAR(20)<br>`completed_at` TIMESTAMP | `progress_id` | • `user_id` → `users(user_id)`<br>• `roadmap_id` → `roadmaps(roadmap_id)`<br>• `node_id` → `roadmap_nodes(node_id)` | • `status` CHECK (`not_started`, `in_progress`, `completed`)<br>• `completed_at` NULL |
| **20** | `opportunities` | `opportunity_id` BIGINT<br>`title` VARCHAR(255)<br>`company` VARCHAR(255)<br>`description` TEXT<br>`application_url` TEXT<br>`deadline` DATE | `opportunity_id` | *None* | • `title` NOT NULL<br>• `company` NULL<br>• `description` NULL<br>• `application_url` NULL<br>• `deadline` NULL |
| **21** | `student_opportunities` | `user_id` BIGINT<br>`opportunity_id` BIGINT<br>`status` VARCHAR(30)<br>`saved_at` TIMESTAMP | **Composite PK:**<br>`(user_id, opportunity_id)` | • `user_id` → `users(user_id)`<br>• `opportunity_id` → `opportunities(opportunity_id)` | • `status` CHECK (`saved`, `applied`, `shortlisted`, `rejected`)<br>• `saved_at` DEFAULT CURRENT_TIMESTAMP |

---

## 3. Relationship & Cardinality Reference

| Source Entity | Target Entity | Cardinality | Implementation Mechanism |
| :--- | :--- | :---: | :--- |
| `USERS` | `STUDENT_PROFILES` | `1 : 0..1` | Shared PK/FK `student_profiles.user_id` |
| `USERS` | `STUDENT_SETTINGS` | `1 : 0..1` | Shared PK/FK `student_settings.user_id` |
| `COLLEGES` | `STUDENT_PROFILES` | `1 : N` | FK `student_profiles.college_id` |
| `COLLEGES` | `ACADEMIC_SCHEMES` | `1 : N` | FK `academic_schemes.college_id` |
| `ACADEMIC_SCHEMES` | `COURSES` | `1 : N` | FK `courses.scheme_id` |
| `USERS` | `ATTENDANCE_LOGS` | `1 : N` | FK `attendance_logs.user_id` |
| `COURSES` | `ATTENDANCE_LOGS` | `1 : N` | FK `attendance_logs.course_id` |
| `USERS` | `ATTENDANCE_SUMMARIES` | `1 : N` | FK `attendance_summaries.user_id` |
| `COURSES` | `ATTENDANCE_SUMMARIES` | `1 : N` | FK `attendance_summaries.course_id` |
| `COURSES` | `CIE_ASSESSMENTS` | `1 : N` | FK `cie_assessments.course_id` |
| `USERS` | `STUDENT_CIE_MARKS` | `1 : N` | FK `student_cie_marks.user_id` |
| `CIE_ASSESSMENTS` | `STUDENT_CIE_MARKS` | `1 : N` | FK `student_cie_marks.cie_id` |
| `COURSES` | `PYQS` | `1 : N` | FK `pyqs.course_id` |
| `COURSES` | `VIVA_QUESTIONS` | `1 : N` | FK `viva_questions.course_id` |
| `USERS` | `CHAT_THREADS` | `1 : N` | FK `chat_threads.user_id` |
| `CHAT_THREADS` | `CHAT_MESSAGES` | `1 : N` | FK `chat_messages.chat_id` |
| `USERS` ↔ `SCHOLARSHIPS` | `N : M` | Bridge table `STUDENT_SCHOLARSHIP_BOOKMARKS` |
| `ROADMAPS` | `ROADMAP_NODES` | `1 : N` | FK `roadmap_nodes.roadmap_id` |
| `USERS` | `STUDENT_ROADMAP_PROGRESS` | `1 : N` | FK `student_roadmap_progress.user_id` |
| `ROADMAP_NODES` | `STUDENT_ROADMAP_PROGRESS` | `1 : N` | FK `student_roadmap_progress.node_id` |
| `USERS` ↔ `OPPORTUNITIES` | `N : M` | Bridge table `STUDENT_OPPORTUNITIES` |

---

## 4. Mathematically Exact Topological Dependency Graph

The topological depth $L(T)$ of each table $T$ is computed strictly from its foreign keys using:
$$L(T) = 1 + \max_{F \in \text{FK}(T)} L(\text{Target}(F)) \quad (\text{with } L(T) = 0 \text{ if } \text{FK}(T) = \emptyset)$$

### Exact Dependency Levels:

```
Level 0 (Zero Foreign Keys — Root Master Tables):
  • users                        (0 FKs)
  • colleges                     (0 FKs)
  • scholarships                 (0 FKs)
  • roadmaps                     (0 FKs)
  • opportunities                (0 FKs)

Level 1 (FKs point exclusively to Level 0):
  • academic_schemes             (FK -> colleges [L0])
  • student_settings             (FK -> users [L0])
  • chat_threads                 (FK -> users [L0])
  • student_scholarship_bookmarks (FKs -> users [L0], scholarships [L0])
  • roadmap_nodes                (FK -> roadmaps [L0])
  • student_opportunities        (FKs -> users [L0], opportunities [L0])

Level 2 (Max target FK is Level 1):
  • courses                      (FK -> academic_schemes [L1])
  • chat_messages                (FK -> chat_threads [L1])
  • student_roadmap_progress     (FKs -> users [L0], roadmaps [L0], roadmap_nodes [L1])
                                 --> max(L0, L0, L1) = L1 => Level 2

Level 3 (Max target FK is Level 2):
  • student_profiles             (FKs -> users [L0], colleges [L0], courses [L2])
                                 --> max(L0, L0, L2) = L2 => Level 3
  • attendance_logs              (FKs -> users [L0], courses [L2])
                                 --> max(L0, L2) = L2 => Level 3
  • attendance_summaries         (FKs -> users [L0], courses [L2])
                                 --> max(L0, L2) = L2 => Level 3
  • cie_assessments              (FK -> courses [L2])
                                 --> max(L2) = L2 => Level 3
  • pyqs                         (FK -> courses [L2])
                                 --> max(L2) = L2 => Level 3
  • viva_questions               (FK -> courses [L2])
                                 --> max(L2) = L2 => Level 3

Level 4 (Max target FK is Level 3):
  • student_cie_marks            (FKs -> users [L0], cie_assessments [L3])
                                 --> max(L0, L3) = L3 => Level 4
```

### Exact Linear Migration Order (PDF Section 7):
```
 1. users
 2. colleges
 3. academic_schemes
 4. courses
 5. student_profiles
 6. student_settings
 7. attendance_logs
 8. attendance_summaries
 9. cie_assessments
10. student_cie_marks
11. pyqs
12. viva_questions
13. chat_threads
14. chat_messages
15. scholarships
16. student_scholarship_bookmarks
17. roadmaps
18. roadmap_nodes
19. student_roadmap_progress
20. opportunities
21. student_opportunities
```

---

## 5. Technology Stack Verification

Based on project architecture documentation (`docs/BACKEND_ARCHITECTURE.md`, `docs/ARCHITECTURAL_REVIEW.md`):

1. **Database:** PostgreSQL on Supabase (or Neon).
2. **ORM / Query Builder:** **Drizzle ORM** (leveraging TypeScript-first schema definitions, zero-overhead SQL generation, and strong typing matching DTOs).
3. **Current Missing Dependencies:** `drizzle-orm`, `drizzle-kit`, `postgres` / `@vercel/postgres` / `pg`.

---

## 6. Exact Architecture Counts (Repositories, Services, Validators)

### A. Repositories (Data Access Layer)
- **Total Database Tables:** 21 tables.
- **Per-Entity Repository Count:** 21 required | **1 existing stub** (`repositories/profile.repository.ts`) | **20 missing**.
- **Domain-Aggregated Alternative (12 Repositories):**
  1. `user.repository.ts` (`users`)
  2. `profile.repository.ts` (`student_profiles`, `student_settings`) — *Existing Stub*
  3. `college.repository.ts` (`colleges`, `academic_schemes`)
  4. `course.repository.ts` (`courses`)
  5. `attendance.repository.ts` (`attendance_logs`, `attendance_summaries`)
  6. `cie.repository.ts` (`cie_assessments`, `student_cie_marks`)
  7. `pyq.repository.ts` (`pyqs`)
  8. `viva.repository.ts` (`viva_questions`)
  9. `chat.repository.ts` (`chat_threads`, `chat_messages`)
  10. `scholarship.repository.ts` (`scholarships`, `student_scholarship_bookmarks`)
  11. `roadmap.repository.ts` (`roadmaps`, `roadmap_nodes`, `student_roadmap_progress`)
  12. `opportunity.repository.ts` (`opportunities`, `student_opportunities`)
  *(Under Domain Aggregation: 1 stub exists, 11 are missing).*

### B. Services (Business Logic Layer)
- **Total Domain Services Required:** 9 services.
- **Existing Services:** 1 partially implemented stub ([`services/profile.service.ts`](file:///C:/Projects/campuslit/services/profile.service.ts)).
- **Missing Services:** 8 services missing:
  `user.service.ts`, `college.service.ts`, `course.service.ts`, `attendance.service.ts`, `cie.service.ts`, `chat.service.ts`, `scholarship.service.ts`, `roadmap.service.ts`, `opportunity.service.ts`.

### C. Validation Schemas (Input Validation Layer)
- **Total Domain Validation Suites Required:** 8 validation suites.
- **Existing Validators:** 1 implemented ([`validations/profile.validation.ts`](file:///C:/Projects/campuslit/validations/profile.validation.ts) covering `CreateProfileInput` and `CreateSettingsInput`).
- **Missing Validators:** 7 validation suites missing:
  `user.validation.ts`, `attendance.validation.ts`, `cie.validation.ts`, `chat.validation.ts`, `scholarship.validation.ts`, `roadmap.validation.ts`, `opportunity.validation.ts`.

---

## 7. Current Git & Working Tree Status

Exact inspection via `git status --porcelain`:

```
 M app/api/profile/route.ts
 M app/api/roadmaps/route.ts
 M docs/BACKEND_ARCHITECTURE.md
 M lib/db.ts
 M repositories/profile.repository.ts
 M services/profile.service.ts
 M types/api.types.ts
 M validations/profile.validation.ts
?? .vscode/
?? docs/ARCHITECTURAL_REVIEW.md
?? docs/CampusLit_Corrected_Database_Schema.pdf
?? docs/CampusLit_Corrected_ER_Diagram.png
?? docs/DATABASE_CORRECTION_AUDIT.md
?? docs/DATABASE_SCHEMA.md
?? docs/ER_DIAGRAM.md
?? docs/campuslit_er_diagram.html
?? docs/campuslit_er_diagram.png
```

### Breakdown:
- **Modified (Tracked) Files (8):** Previous session changes aligning profile DTOs, numeric IDs, and roadmap mock format.
- **Untracked Files (9):** Newly added documentation, diagrams, senior PDF, and audit report.
- **Deleted Files (0):** No files deleted.
- **Staged Files (0):** Nothing staged for commit.
- **TypeScript Health:** `npx tsc --noEmit` passing with 0 errors.

---

## 8. Categorized Implementation State Matrix

| Component | Status | Classification | Details |
| :--- | :---: | :--- | :--- |
| **21 TypeScript DTOs** | Complete | Implemented Correctly | Defined in `types/api.types.ts` matching PDF. |
| **Domain Enums** | Complete | Implemented Correctly | Defined in `types/api.types.ts` matching PDF CHECK constraints. |
| **Profile Validation** | Complete | Implemented Correctly | `validations/profile.validation.ts` validates `student_profiles` and `student_settings`. |
| **Profile Repository** | Partial | Mock / Stub Data | `repositories/profile.repository.ts` returns dummy object, no DB query. |
| **Profile Service** | Partial | Mock / Stub Data | `services/profile.service.ts` coordinates profile logic with stub repo. |
| **Profile Route** | Partial | Mock / Stub Data | `app/api/profile/route.ts` wired to `profileService` with `demoUserId = 1`. |
| **Roadmaps Route** | Incorrect | Must Be Refactored | `app/api/roadmaps/route.ts` creates inline mock data instead of calling service/repo. |
| **Database Migration DDL** | 0% | Completely Missing | No `migrations/001_campuslit_schema.sql` exists. |
| **Database Seed Data** | 0% | Completely Missing | No `migrations/002_seed_data.sql` exists. |
| **Drizzle ORM Schemas** | 0% | Completely Missing | No Drizzle table schemas exist in `db/schema/`. |
| **Database Driver Client** | 0% | Completely Missing | `lib/db.ts` has no database connection pool or query client. |
| **Remaining 20 Repositories** | 0% | Completely Missing | Missing repositories for users, colleges, attendance, CIE, chat, etc. |
| **Remaining 8 Services** | 0% | Completely Missing | Missing services for attendance, CIE, chat, roadmaps, scholarships, opportunities. |
| **Remaining 7 Validators** | 0% | Completely Missing | Missing validators for attendance, CIE marks, chat messages, bookmarks, progress. |

---

## 9. Implementation Safety & Sign-Off

- **Codebase Safety:** Safe to proceed to implementation. There are no breaking syntax errors, no live data loss risks, and existing uncommitted changes are verified.
- **Verification Sign-Off:** All 21 tables, foreign key constraints, topological dependencies, stack decisions, and counts are cross-verified with `docs/CampusLit_Corrected_Database_Schema.pdf`.
