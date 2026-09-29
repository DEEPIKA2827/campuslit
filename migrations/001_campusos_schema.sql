-- ============================================================================
-- Migration: 001_campuslit_schema.sql
-- Description: Canonical 21-Table Relational Schema for CampusLit
-- Specification: Strictly matches docs/CampusLit_Corrected_Database_Schema.pdf
-- Engine: PostgreSQL 15+ / Supabase
-- Dependency Order: Sequential (Level 0 through Level 4)
-- ============================================================================

-- 1. USERS — Central identity table.
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'faculty')),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. COLLEGES — Single canonical college table.
CREATE TABLE IF NOT EXISTS colleges (
    college_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. ACADEMIC_SCHEMES — Academic scheme belonging to a college.
CREATE TABLE IF NOT EXISTS academic_schemes (
    scheme_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    college_id BIGINT NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
    scheme_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20)
);

-- 4. COURSES — Course belonging to an academic scheme.
CREATE TABLE IF NOT EXISTS courses (
    course_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    scheme_id BIGINT NOT NULL REFERENCES academic_schemes(scheme_id) ON DELETE CASCADE,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) UNIQUE
);

-- 5. STUDENT_PROFILES — One-to-one student profile extension of USERS.
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    college_id BIGINT REFERENCES colleges(college_id) ON DELETE SET NULL,
    course_id BIGINT REFERENCES courses(course_id) ON DELETE SET NULL,
    semester SMALLINT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. STUDENT_SETTINGS — One settings record per user.
CREATE TABLE IF NOT EXISTS student_settings (
    user_id BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    theme VARCHAR(20) DEFAULT 'system' NOT NULL,
    language VARCHAR(20) DEFAULT 'en' NOT NULL
);

-- 7. ATTENDANCE_LOGS — Individual attendance event.
CREATE TABLE IF NOT EXISTS attendance_logs (
    attendance_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late'))
);

-- 8. ATTENDANCE_SUMMARIES — Course-wise attendance summary.
CREATE TABLE IF NOT EXISTS attendance_summaries (
    summary_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    total_classes INT NOT NULL,
    attended_classes INT NOT NULL,
    attendance_percentage DECIMAL(5, 2) NOT NULL
);

-- 9. CIE_ASSESSMENTS — Defines each CIE assessment.
CREATE TABLE IF NOT EXISTS cie_assessments (
    cie_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    assessment_name VARCHAR(100) NOT NULL,
    assessment_date DATE,
    max_marks DECIMAL(6, 2) NOT NULL
);

-- 10. STUDENT_CIE_MARKS — Student marks for each CIE assessment.
CREATE TABLE IF NOT EXISTS student_cie_marks (
    mark_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    cie_id BIGINT NOT NULL REFERENCES cie_assessments(cie_id) ON DELETE CASCADE,
    marks_obtained DECIMAL(6, 2) NOT NULL,
    CONSTRAINT uq_student_cie_marks_user_cie UNIQUE (user_id, cie_id)
);

-- 11. PYQS — Previous-year questions linked to courses.
CREATE TABLE IF NOT EXISTS pyqs (
    pyq_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    exam_year SMALLINT,
    marks DECIMAL(5, 2),
    difficulty VARCHAR(20) CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard'))
);

-- 12. VIVA_QUESTIONS — Single canonical viva question table.
CREATE TABLE IF NOT EXISTS viva_questions (
    viva_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard'))
);

-- 13. CHAT_THREADS — One user can have many AI Mentor chats.
CREATE TABLE IF NOT EXISTS chat_threads (
    chat_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 14. CHAT_MESSAGES — Many messages belong to one chat.
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chat_id BIGINT NOT NULL REFERENCES chat_threads(chat_id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'assistant')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 15. SCHOLARSHIPS — Master list of scholarships.
CREATE TABLE IF NOT EXISTS scholarships (
    scholarship_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    scholarship_name VARCHAR(255) NOT NULL,
    description TEXT,
    eligibility TEXT,
    application_url TEXT,
    deadline DATE
);

-- 16. STUDENT_SCHOLARSHIP_BOOKMARKS — Many-to-many scholarship bookmark bridge.
CREATE TABLE IF NOT EXISTS student_scholarship_bookmarks (
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    scholarship_id BIGINT NOT NULL REFERENCES scholarships(scholarship_id) ON DELETE CASCADE,
    bookmarked_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, scholarship_id)
);

-- 17. ROADMAPS — Master career roadmap.
CREATE TABLE IF NOT EXISTS roadmaps (
    roadmap_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    career VARCHAR(150)
);

-- 18. ROADMAP_NODES — Ordered nodes within a roadmap.
CREATE TABLE IF NOT EXISTS roadmap_nodes (
    node_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    roadmap_id BIGINT NOT NULL REFERENCES roadmaps(roadmap_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_no INT NOT NULL,
    CONSTRAINT uq_roadmap_nodes_roadmap_seq UNIQUE (roadmap_id, sequence_no)
);

-- 19. STUDENT_ROADMAP_PROGRESS — Student progress for roadmap nodes.
CREATE TABLE IF NOT EXISTS student_roadmap_progress (
    progress_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    roadmap_id BIGINT NOT NULL REFERENCES roadmaps(roadmap_id) ON DELETE CASCADE,
    node_id BIGINT NOT NULL REFERENCES roadmap_nodes(node_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    completed_at TIMESTAMP WITHOUT TIME ZONE
);

-- 20. OPPORTUNITIES — Master list of jobs, internships, hackathons, etc.
CREATE TABLE IF NOT EXISTS opportunities (
    opportunity_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    description TEXT,
    application_url TEXT,
    deadline DATE
);

-- 21. STUDENT_OPPORTUNITIES — Many-to-many user/opportunity tracking bridge.
CREATE TABLE IF NOT EXISTS student_opportunities (
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'shortlisted', 'rejected')),
    saved_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, opportunity_id)
);

-- ============================================================================
-- Performance Indexes (Core Read Paths)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_student_profiles_college ON student_profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_course ON student_profiles(course_id);
CREATE INDEX IF NOT EXISTS idx_academic_schemes_college ON academic_schemes(college_id);
CREATE INDEX IF NOT EXISTS idx_courses_scheme ON courses(scheme_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_course_date ON attendance_logs(user_id, course_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_summaries_user_course ON attendance_summaries(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_cie_assessments_course ON cie_assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_student_cie_marks_user ON student_cie_marks(user_id);
CREATE INDEX IF NOT EXISTS idx_pyqs_course ON pyqs(course_id);
CREATE INDEX IF NOT EXISTS idx_viva_questions_course ON viva_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_user ON chat_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_roadmap ON roadmap_nodes(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_student_roadmap_progress_user ON student_roadmap_progress(user_id);
