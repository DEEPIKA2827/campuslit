# CampusLit — Principal Software Architect Review & Scalability Assessment

**Reviewer Role:** Principal Software Architect (Ex-Google / Microsoft Infrastructure Team)  
**Target System:** CampusLit (Karnataka Student Operating System)  
**Target Scale:** 500,000+ Active Karnataka Engineering Students | 100M+ Monthly Attendance Writes  
**Document Purpose:** Pre-Review Architectural Hardening & Scalability Audit  

---

## Executive Summary

The CampusLit v2.0 database architecture demonstrates **exceptional domain modeling and clean separation of concerns**. Separating identity (`users`), profile (`student_profiles`), and preferences (`student_settings`), alongside dedicated modules for Attendance, CIE, AI Mentor, and Scholarships, reflects a modern 3NF relational design.

However, to transition from a **well-designed prototype schema** to a **production-ready, Tier-1 Big Tech distributed SaaS architecture**, 5 critical architectural enhancements must be addressed before final senior engineering sign-off:

```
[ Architect Review Findings ]
├── 1. Normalization & Functional Dependencies (Derivability vs. Cache Denormalization)
├── 2. Missing Core Entities (Multi-college Notifications, Audit Logs, AI Tokens)
├── 3. Advanced Indexing Strategy (Composite B-Tree, GIN for Full-Text Search, Partial Indexes)
└── 4. Distributed Scalability & High Availability (Time-Series Partitioning, Write Amplification)
```

---

## 1. Normalization & Functional Dependency Audit

### A. Derivability vs. Controlled Denormalization (`attendance_summaries`)
*   **Observation**: `attendance_summaries.current_percentage` and `safe_bunks_available` are calculated fields derived from `attendance_logs`.
*   **Architect Verdict**: Storing derived values in 3NF is strictly a **controlled denormalization pattern** for query optimization. If done without transactional guarantees, `attendance_summaries` will suffer from **race conditions** when multiple attendance logs are inserted concurrently.
*   **Mitigation**:
    - Enforce atomic updates using database triggers, OR
    - Maintain `attendance_summaries` via an async event-driven worker, OR
    - Compute `current_percentage` dynamically via a PostgreSQL Generated Column (`STORED`).

### B. College & Scheme Normalization (`courses`)
*   **Observation**: `courses.department` is currently a raw `VARCHAR` string.
*   **Risk**: String typos (`"CSE"`, `"Computer Science"`, `"Comp Sci"`) will break aggregations and course filtering.
*   **Mitigation**: Normalize `departments` into a lookup table or enforce an Enum Type (`department_enum`).

---

## 2. Missing Entities & Edge-Case Defenses

To support real-world student workflows across Karnataka, the schema requires 4 additional core infrastructure tables:

| Missing Entity | Purpose | Why It's Required |
| :--- | :--- | :--- |
| **`notifications`** | System & Academic Alerts | Critical for notifying students when attendance drops below 75% or when scholarship deadlines approach. |
| **`ai_usage_logs`** | Token Billing & Rate Limiting | Tracks Gemini API token consumption per user (`user_id`, `prompt_tokens`, `completion_tokens`) to prevent API abuse. |
| **`course_enrollments`** | Student-to-Course Mapping | Maps which student is taking which course in the current semester (currently implicit). |
| **`audit_logs`** | Security & Compliance Audit | Tracks critical mutations (e.g. CIE mark updates, profile changes) for compliance. |

---

## 3. High-Performance Indexing Strategy

In a high-concurrency database, query performance depends entirely on indexing strategies. Below is the mandatory index matrix required for CampusLit:

### A. Composite B-Tree Indexes (Frequent Read Paths)
1. **Attendance Log Lookup**:
   ```sql
   CREATE INDEX idx_attendance_logs_user_course_date 
   ON attendance_logs(user_id, course_id, date DESC);
   ```
   *Rationale*: Optimizes daily attendance history fetching and calendar heatmaps.

2. **CIE Evaluation Scores**:
   ```sql
   CREATE INDEX idx_student_cie_marks_user_assessment 
   ON student_cie_marks(user_id, assessment_id);
   ```

### B. Partial Indexes (Low Memory Overhead)
3. **Active Student Lookup**:
   ```sql
   CREATE INDEX idx_users_active_email 
   ON users(email) WHERE is_active = TRUE AND deleted_at IS NULL;
   ```
   *Rationale*: Ignores soft-deleted or deactivated users, reducing index tree size by up to 30%.

4. **Pending Scholarship Alerts**:
   ```sql
   CREATE INDEX idx_scholarships_upcoming_deadline 
   ON scholarships(deadline) WHERE deadline >= CURRENT_DATE;
   ```

### C. GIN (Generalized Inverted Index) for Full-Text Search
5. **Search Opportunities & PYQs**:
   ```sql
   CREATE INDEX idx_opportunities_fts 
   ON opportunities USING GIN (to_tsvector('english', title || ' ' || organizer || ' ' || domain));
   ```
   *Rationale*: Enables millisecond full-text search across thousands of hackathons, internships, and notes.

---

## 4. Distributed Scalability & High Availability Architecture

### A. Time-Series Partitioning (`attendance_logs`)
At 500,000 students taking 6 courses daily, `attendance_logs` will accumulate **~3,000,000 writes/day (~1 Billion rows/year)**.
*   **Scalability Risk**: A single monolithic table will cause index bloat and slow down `SELECT` queries.
*   **Solution**: Implement **Range Partitioning by Academic Year / Month**:
    ```sql
    CREATE TABLE attendance_logs (
        id UUID NOT NULL,
        user_id UUID NOT NULL,
        course_id UUID NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    ) PARTITION BY RANGE (date);
    ```

### B. Connection Pooling & Read Replicas
- **Write Path**: Direct all `POST/PUT/DELETE` traffic to Primary PostgreSQL DB (Neon / Supabase / GCP Cloud SQL).
- **Read Path**: Route high-frequency `GET` requests (Scholarship listings, PYQ downloads, Roadmaps) to **Read Replicas** with PgBouncer connection pooling.

### C. Soft Delete Standard (`deleted_at`)
- Enforce universal soft deletion on `users`, `student_profiles`, and `chat_threads` using `deleted_at TIMESTAMPTZ DEFAULT NULL`.
- Prevents cascade orphan deletions while fulfilling DPDP data retention requirements.

---

## 5. Architectural Recommendations Summary

```
[ Pre-Review Action Items ]
├── ✅ 1. Introduce `course_enrollments` junction table to map student course registration.
├── ✅ 2. Add `notifications` and `ai_usage_logs` entities for production readiness.
├── ✅ 3. Document controlled denormalization strategy for `attendance_summaries`.
├── ✅ 4. Apply Composite, Partial, and GIN index definitions in Drizzle ORM schema.
└── ✅ 5. Define PostgreSQL table partitioning strategy for `attendance_logs`.
```
