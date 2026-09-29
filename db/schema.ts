/**
 * @file db/schema.ts
 * @description Canonical Drizzle ORM PostgreSQL Schema for CampusLit.
 * @specification Strictly matches senior-approved docs/CampusLit_Corrected_Database_Schema.pdf (21 tables).
 */

import {
  pgTable,
  bigint,
  varchar,
  text,
  timestamp,
  date,
  smallint,
  integer,
  decimal,
  boolean,
  primaryKey,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ==========================================
// Level 0: Root Master Tables (0 Foreign Keys)
// ==========================================

/**
 * 1. USERS — Central identity table.
 */
export const users = pgTable(
  "users",
  {
    userId: bigint("user_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    clerkId: varchar("clerk_id", { length: 128 }).unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: varchar("role", { length: 30 }).notNull().default("student"),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
  },
  (table) => [
    check("chk_users_role", sql`${table.role} IN ('student', 'admin', 'faculty')`),
  ]
);

/**
 * 4. COLLEGES — Single canonical college table.
 */
export const colleges = pgTable("colleges", {
  collegeId: bigint("college_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  collegeName: varchar("college_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
});

/**
 * 15. SCHOLARSHIPS — Master list of scholarships.
 */
export const scholarships = pgTable("scholarships", {
  scholarshipId: bigint("scholarship_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  scholarshipName: varchar("scholarship_name", { length: 255 }).notNull(),
  description: text("description"),
  eligibility: text("eligibility"),
  applicationUrl: text("application_url"),
  deadline: date("deadline", { mode: "string" }),
});

/**
 * 17. ROADMAPS — Master career roadmap.
 */
export const roadmaps = pgTable("roadmaps", {
  roadmapId: bigint("roadmap_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  career: varchar("career", { length: 150 }),
  careerSlug: varchar("career_slug", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
});

/**
 * 20. OPPORTUNITIES — Master list of jobs, internships, hackathons, etc.
 */
export const opportunities = pgTable("opportunities", {
  opportunityId: bigint("opportunity_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  description: text("description"),
  applicationUrl: text("application_url"),
  deadline: date("deadline", { mode: "string" }),
});

// ==========================================
// Level 1: Dependencies on Level 0
// ==========================================

/**
 * 5. ACADEMIC_SCHEMES — Academic scheme belonging to a college.
 */
export const academicSchemes = pgTable("academic_schemes", {
  schemeId: bigint("scheme_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  collegeId: bigint("college_id", { mode: "number" })
    .notNull()
    .references(() => colleges.collegeId, { onDelete: "cascade" }),
  schemeName: varchar("scheme_name", { length: 100 }).notNull(),
  academicYear: varchar("academic_year", { length: 20 }),
});

/**
 * 3. STUDENT_SETTINGS — One settings record per user.
 */
export const studentSettings = pgTable("student_settings", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.userId, { onDelete: "cascade" }),
  notificationEnabled: boolean("notification_enabled").default(true).notNull(),
  theme: varchar("theme", { length: 20 }).default("system").notNull(),
  language: varchar("language", { length: 20 }).default("en").notNull(),
});

/**
 * 13. CHAT_THREADS — One user can have many AI Mentor chats.
 */
export const chatThreads = pgTable("chat_threads", {
  chatId: bigint("chat_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
});

/**
 * 16. STUDENT_SCHOLARSHIP_BOOKMARKS — Many-to-many scholarship bookmark bridge.
 */
export const studentScholarshipBookmarks = pgTable(
  "student_scholarship_bookmarks",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    scholarshipId: bigint("scholarship_id", { mode: "number" })
      .notNull()
      .references(() => scholarships.scholarshipId, { onDelete: "cascade" }),
    bookmarkedAt: timestamp("bookmarked_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.scholarshipId] }),
  ]
);

/**
 * 18. ROADMAP_NODES — Ordered nodes within a roadmap.
 */
export const roadmapNodes = pgTable(
  "roadmap_nodes",
  {
    nodeId: bigint("node_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    roadmapId: bigint("roadmap_id", { mode: "number" })
      .notNull()
      .references(() => roadmaps.roadmapId, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    sequenceNo: integer("sequence_no").notNull(),
    nodeKey: varchar("node_key", { length: 50 }),
    branchKey: varchar("branch_key", { length: 50 }).default("common").notNull(),
    targetSemester: smallint("target_semester"),
    difficulty: varchar("difficulty", { length: 20 }),
    skills: text("skills").array().default(sql`'{}'`).notNull(),
    prerequisiteKeys: text("prerequisite_keys").array().default(sql`'{}'`).notNull(),
    evidencePrompt: text("evidence_prompt"),
  },
  (table) => [
    unique("uq_roadmap_nodes_roadmap_seq").on(table.roadmapId, table.sequenceNo),
  ]
);

/**
 * 21. STUDENT_OPPORTUNITIES — Many-to-many user/opportunity tracking bridge.
 */
export const studentOpportunities = pgTable(
  "student_opportunities",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    opportunityId: bigint("opportunity_id", { mode: "number" })
      .notNull()
      .references(() => opportunities.opportunityId, { onDelete: "cascade" }),
    status: varchar("status", { length: 30 }).notNull().default("saved"),
    savedAt: timestamp("saved_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.opportunityId] }),
    check("chk_student_opportunities_status", sql`${table.status} IN ('saved', 'applied', 'shortlisted', 'rejected')`),
  ]
);

// ==========================================
// Level 2: Dependencies on Level 1
// ==========================================

/**
 * 6. COURSES — Course belonging to an academic scheme.
 */
export const courses = pgTable("courses", {
  courseId: bigint("course_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  schemeId: bigint("scheme_id", { mode: "number" })
    .notNull()
    .references(() => academicSchemes.schemeId, { onDelete: "cascade" }),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  courseCode: varchar("course_code", { length: 50 }).unique(),
});

/**
 * 14. CHAT_MESSAGES — Many messages belong to one chat.
 */
export const chatMessages = pgTable(
  "chat_messages",
  {
    messageId: bigint("message_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    chatId: bigint("chat_id", { mode: "number" })
      .notNull()
      .references(() => chatThreads.chatId, { onDelete: "cascade" }),
    senderType: varchar("sender_type", { length: 20 }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
  },
  (table) => [
    check("chk_chat_messages_sender_type", sql`${table.senderType} IN ('user', 'assistant')`),
  ]
);

/**
 * 19. STUDENT_ROADMAP_PROGRESS — Student progress for roadmap nodes.
 */
export const studentRoadmapProgress = pgTable(
  "student_roadmap_progress",
  {
    progressId: bigint("progress_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    roadmapId: bigint("roadmap_id", { mode: "number" })
      .notNull()
      .references(() => roadmaps.roadmapId, { onDelete: "cascade" }),
    nodeId: bigint("node_id", { mode: "number" })
      .notNull()
      .references(() => roadmapNodes.nodeId, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("not_started"),
    completedAt: timestamp("completed_at", { mode: "string", withTimezone: false }),
  },
  (table) => [
    check("chk_student_roadmap_progress_status", sql`${table.status} IN ('not_started', 'in_progress', 'completed')`),
  ]
);

// ==========================================
// Level 3: Dependencies on Level 2 (and Level 0/1)
// ==========================================

/**
 * 2. STUDENT_PROFILES — One-to-one student profile extension of USERS.
 */
export const studentProfiles = pgTable("student_profiles", {
  userId: bigint("user_id", { mode: "number" })
    .primaryKey()
    .references(() => users.userId, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  collegeId: bigint("college_id", { mode: "number" }).references(() => colleges.collegeId, { onDelete: "set null" }),
  courseId: bigint("course_id", { mode: "number" }).references(() => courses.courseId, { onDelete: "set null" }),
  semester: smallint("semester"),
  careerGoal: varchar("career_goal", { length: 50 }),
  evaluationScheme: varchar("evaluation_scheme", { length: 50 }),
  targetSgpa: decimal("target_sgpa", { precision: 4, scale: 2 }),
  programmingLevel: varchar("programming_level", { length: 50 }),
  technicalInterests: text("technical_interests").array(),
  specializationBranch: varchar("specialization_branch", { length: 50 }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: false }).defaultNow().notNull(),
});

/**
 * 7. ATTENDANCE_LOGS — Individual attendance event.
 */
export const attendanceLogs = pgTable(
  "attendance_logs",
  {
    attendanceId: bigint("attendance_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    courseId: bigint("course_id", { mode: "number" })
      .notNull()
      .references(() => courses.courseId, { onDelete: "cascade" }),
    attendanceDate: date("attendance_date", { mode: "string" }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
  },
  (table) => [
    check("chk_attendance_logs_status", sql`${table.status} IN ('present', 'absent', 'late')`),
  ]
);

/**
 * 8. ATTENDANCE_SUMMARIES — Course-wise attendance summary.
 */
export const attendanceSummaries = pgTable("attendance_summaries", {
  summaryId: bigint("summary_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  courseId: bigint("course_id", { mode: "number" })
    .notNull()
    .references(() => courses.courseId, { onDelete: "cascade" }),
  totalClasses: integer("total_classes").notNull(),
  attendedClasses: integer("attended_classes").notNull(),
  attendancePercentage: decimal("attendance_percentage", { precision: 5, scale: 2 }).notNull(),
});

/**
 * 9. CIE_ASSESSMENTS — Defines each CIE assessment.
 */
export const cieAssessments = pgTable("cie_assessments", {
  cieId: bigint("cie_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  courseId: bigint("course_id", { mode: "number" })
    .notNull()
    .references(() => courses.courseId, { onDelete: "cascade" }),
  assessmentName: varchar("assessment_name", { length: 100 }).notNull(),
  assessmentDate: date("assessment_date", { mode: "string" }),
  maxMarks: decimal("max_marks", { precision: 6, scale: 2 }).notNull(),
});

/**
 * 11. PYQS — Previous-year questions linked to courses.
 */
export const pyqs = pgTable(
  "pyqs",
  {
    pyqId: bigint("pyq_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    courseId: bigint("course_id", { mode: "number" })
      .notNull()
      .references(() => courses.courseId, { onDelete: "cascade" }),
    question: text("question").notNull(),
    examYear: smallint("exam_year"),
    marks: decimal("marks", { precision: 5, scale: 2 }),
    difficulty: varchar("difficulty", { length: 20 }),
  },
  (table) => [
    check("chk_pyqs_difficulty", sql`${table.difficulty} IS NULL OR ${table.difficulty} IN ('easy', 'medium', 'hard')`),
  ]
);

/**
 * 12. VIVA_QUESTIONS — Single canonical viva question table.
 */
export const vivaQuestions = pgTable(
  "viva_questions",
  {
    vivaId: bigint("viva_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    courseId: bigint("course_id", { mode: "number" })
      .notNull()
      .references(() => courses.courseId, { onDelete: "cascade" }),
    question: text("question").notNull(),
    difficulty: varchar("difficulty", { length: 20 }),
  },
  (table) => [
    check("chk_viva_questions_difficulty", sql`${table.difficulty} IS NULL OR ${table.difficulty} IN ('easy', 'medium', 'hard')`),
  ]
);

// ==========================================
// Level 4: Dependencies on Level 3 (and Level 0)
// ==========================================

/**
 * 10. STUDENT_CIE_MARKS — Student marks for each CIE assessment.
 */
export const studentCieMarks = pgTable(
  "student_cie_marks",
  {
    markId: bigint("mark_id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    cieId: bigint("cie_id", { mode: "number" })
      .notNull()
      .references(() => cieAssessments.cieId, { onDelete: "cascade" }),
    marksObtained: decimal("marks_obtained", { precision: 6, scale: 2 }).notNull(),
  },
  (table) => [
    unique("uq_student_cie_marks_user_cie").on(table.userId, table.cieId),
  ]
);
