/**
 * @file types/api.types.ts
 * @description Core API DTOs, request/response wrapper interfaces, and backend generic types.
 * @purpose Enforces consistent contract shapes across all HTTP API responses.
 */

/**
 * Standardized API Response Wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiErrorPayload;
  meta?: ApiMetaPayload;
}

/**
 * Standardized Error Payload
 */
export interface ApiErrorPayload {
  code: string;
  details?: unknown;
  timestamp: string;
}

/**
 * Standardized Pagination Metadata Payload
 */
export interface ApiMetaPayload {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export type UserRole = 'student' | 'admin' | 'faculty';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ChatSenderType = 'user' | 'assistant';
export type RoadmapProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type OpportunityStatus = 'saved' | 'applied' | 'shortlisted' | 'rejected';

/**
 * Users DTO
 */
export interface UserDTO {
  /** user_id (BIGINT PK) */
  userId: number;
  /** email (VARCHAR 255 UNIQUE NOT NULL) */
  email: string;
  /** password_hash (TEXT NOT NULL) */
  passwordHash: string;
  /** role (VARCHAR 30: student/admin/faculty) */
  role: UserRole;
  /** created_at (TIMESTAMP) */
  createdAt: string;
}

/**
 * Student Profiles DTO
 */
export interface StudentProfileDTO {
  /** user_id (BIGINT PK+FK→users) */
  userId: number;
  /** first_name (VARCHAR 100 NOT NULL) */
  firstName: string;
  /** last_name (VARCHAR 100 NULL) */
  lastName: string | null;
  /** college_id (BIGINT FK→colleges, NULLABLE) */
  collegeId: number | null;
  /** course_id (BIGINT FK→courses, NULLABLE) */
  courseId: number | null;
  /** semester (SMALLINT NULL) */
  semester: number | null;
  /** career_goal (VARCHAR 50 NULLABLE) */
  careerGoal: string | null;
  /** evaluation_scheme (VARCHAR 50 NULLABLE) */
  evaluationScheme: string | null;
  /** target_sgpa (DECIMAL 4,2 NULLABLE) */
  targetSgpa: number | null;
  /** programming_level (VARCHAR 50 NULLABLE) */
  programmingLevel: string | null;
  /** technical_interests (TEXT[] NULLABLE) */
  technicalInterests: string[] | null;
  /** specialization_branch (VARCHAR 50 NULLABLE) */
  specializationBranch: string | null;
  /** created_at (TIMESTAMP) */
  createdAt: string;
}

/**
 * Student Settings DTO
 */
export interface StudentSettingsDTO {
  /** user_id (BIGINT PK+FK→users) */
  userId: number;
  /** notification_enabled (BOOLEAN DEFAULT TRUE) */
  notificationEnabled: boolean;
  /** theme (VARCHAR 20 DEFAULT 'system') */
  theme: string;
  /** language (VARCHAR 20 DEFAULT 'en') */
  language: string;
}

/**
 * Colleges DTO
 */
export interface CollegeDTO {
  /** college_id (BIGINT PK) */
  collegeId: number;
  /** college_name (VARCHAR 255 NOT NULL) */
  collegeName: string;
  /** location (VARCHAR 255 NULL) */
  location: string | null;
  /** created_at (TIMESTAMP) */
  createdAt: string;
}

/**
 * Academic Schemes DTO
 */
export interface AcademicSchemeDTO {
  /** scheme_id (BIGINT PK) */
  schemeId: number;
  /** college_id (BIGINT FK→colleges) */
  collegeId: number;
  /** scheme_name (VARCHAR 100 NOT NULL) */
  schemeName: string;
  /** academic_year (VARCHAR 20 NULL) */
  academicYear: string | null;
}

/**
 * Courses DTO
 */
export interface CourseDTO {
  /** course_id (BIGINT PK) */
  courseId: number;
  /** scheme_id (BIGINT FK→academic_schemes) */
  schemeId: number;
  /** course_name (VARCHAR 255 NOT NULL) */
  courseName: string;
  /** course_code (VARCHAR 50 UNIQUE, NULLABLE) */
  courseCode: string | null;
}

/**
 * Attendance Logs DTO
 */
export interface AttendanceLogDTO {
  /** attendance_id (BIGINT PK) */
  attendanceId: number;
  /** user_id (BIGINT FK→users) */
  userId: number;
  /** course_id (BIGINT FK→courses) */
  courseId: number;
  /** attendance_date (DATE NOT NULL) */
  attendanceDate: string;
  /** status (VARCHAR 20: present/absent/late) */
  status: AttendanceStatus;
}

/**
 * Attendance Summaries DTO
 */
export interface AttendanceSummaryDTO {
  /** summary_id (BIGINT PK) */
  summaryId: number;
  /** user_id (BIGINT FK→users) */
  userId: number;
  /** course_id (BIGINT FK→courses) */
  courseId: number;
  /** total_classes (INT NOT NULL) */
  totalClasses: number;
  /** attended_classes (INT NOT NULL) */
  attendedClasses: number;
  /** attendance_percentage (DECIMAL 5,2 NOT NULL) */
  attendancePercentage: number;
}

/**
 * Attendance Summary with Course Details (Joined DTO)
 */
export interface AttendanceSummaryWithCourseDTO {
  summaryId: number;
  userId: number;
  courseId: number;
  courseName: string;
  courseCode: string | null;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
}

/**
 * CIE Assessments DTO
 */
export interface CieAssessmentDTO {
  /** cie_id (BIGINT PK) */
  cieId: number;
  /** course_id (BIGINT FK→courses) */
  courseId: number;
  /** assessment_name (VARCHAR 100 NOT NULL) */
  assessmentName: string;
  /** assessment_date (DATE NULL) */
  assessmentDate: string | null;
  /** max_marks (DECIMAL 6,2 NOT NULL) */
  maxMarks: number;
}

/**
 * Student CIE Marks DTO
 */
export interface StudentCieMarkDTO {
  /** mark_id (BIGINT PK) */
  markId: number;
  /** user_id (BIGINT FK→users) */
  userId: number;
  /** cie_id (BIGINT FK→cie_assessments) */
  cieId: number;
  /** marks_obtained (DECIMAL 6,2 NOT NULL) */
  marksObtained: number;
}

/**
 * Student CIE Mark with Assessment & Course Details (Joined DTO)
 */
export interface StudentCieMarkWithCourseDTO {
  markId: number;
  userId: number;
  cieId: number;
  marksObtained: number;
  assessmentName: string;
  assessmentDate: string | null;
  maxMarks: number;
  courseId: number;
  courseName: string;
  courseCode: string | null;
}

/**
 * PYQs DTO
 */
export interface PyqDTO {
  /** pyq_id (BIGINT PK) */
  pyqId: number;
  /** course_id (BIGINT FK→courses) */
  courseId: number;
  /** question (TEXT NOT NULL) */
  question: string;
  /** exam_year (SMALLINT NULL) */
  examYear: number | null;
  /** marks (DECIMAL 5,2 NULL) */
  marks: number | null;
  /** difficulty (VARCHAR 20: easy/medium/hard) */
  difficulty: Difficulty;
}

/**
 * Viva Questions DTO
 */
export interface VivaQuestionDTO {
  /** viva_id (BIGINT PK) */
  vivaId: number;
  /** course_id (BIGINT FK→courses) */
  courseId: number;
  /** question (TEXT NOT NULL) */
  question: string;
  /** difficulty (VARCHAR 20: easy/medium/hard) */
  difficulty: Difficulty;
}

/**
 * Chat Threads DTO
 */
export interface ChatThreadDTO {
  /** chat_id (BIGINT PK) */
  chatId: number;
  /** user_id (BIGINT FK→users) */
  userId: number;
  /** title (VARCHAR 255 NULL) */
  title: string | null;
  /** created_at (TIMESTAMP) */
  createdAt: string;
}

/**
 * Chat Messages DTO
 */
export interface ChatMessageDTO {
  /** message_id (BIGINT PK) */
  messageId: number;
  /** chat_id (BIGINT FK→chat_threads) */
  chatId: number;
  /** sender_type (VARCHAR 20: user/assistant) */
  senderType: ChatSenderType;
  /** message (TEXT NOT NULL) */
  message: string;
  /** created_at (TIMESTAMP) */
  createdAt: string;
}

/**
 * Chat Thread Preview DTO (for Sidebar / Conversations List)
 */
export interface ChatThreadPreviewDTO {
  chatId: number;
  userId: number;
  title: string | null;
  createdAt: string;
  lastMessage: string | null;
  lastSenderType: ChatSenderType | null;
  lastMessageAt: string | null;
  messageCount: number;
}

/**
 * Scholarships DTO
 */
export interface ScholarshipDTO {
  /** scholarship_id (BIGINT PK) */
  scholarshipId: number;
  /** scholarship_name (VARCHAR 255 NOT NULL) */
  scholarshipName: string;
  /** description (TEXT NULL) */
  description: string | null;
  /** eligibility (TEXT NULL) */
  eligibility: string | null;
  /** application_url (TEXT NULL) */
  applicationUrl: string | null;
  /** deadline (DATE NULL) */
  deadline: string | null;
}

/**
 * Scholarship with User Bookmark State DTO (Catalog Feed)
 */
export interface ScholarshipWithBookmarkDTO extends ScholarshipDTO {
  isBookmarked: boolean;
  bookmarkedAt: string | null;
}

/**
 * Student Scholarship Bookmarks DTO
 */
export interface StudentScholarshipBookmarkDTO {
  /** user_id (BIGINT PK+FK→users) */
  userId: number;
  /** scholarship_id (BIGINT PK+FK→scholarships) */
  scholarshipId: number;
  /** bookmarked_at (TIMESTAMP) */
  bookmarkedAt: string;
}

/**
 * Roadmaps DTO
 */
export interface RoadmapDTO {
  /** roadmap_id (BIGINT PK) */
  roadmapId: number;
  /** title (VARCHAR 255 NOT NULL) */
  title: string;
  /** description (TEXT NULL) */
  description: string | null;
  /** career (VARCHAR 150 NULL) */
  career: string | null;
  /** career_slug (VARCHAR 50 NULL) */
  careerSlug?: string | null;
}

/**
 * Roadmap Nodes DTO
 */
export interface RoadmapNodeDTO {
  /** node_id (BIGINT PK) */
  nodeId: number;
  /** roadmap_id (BIGINT FK→roadmaps) */
  roadmapId: number;
  /** title (VARCHAR 255 NOT NULL) */
  title: string;
  /** description (TEXT NULL) */
  description: string | null;
  /** sequence_no (INT NOT NULL) */
  sequenceNo: number;
}

/**
 * Student Roadmap Progress DTO
 */
export interface StudentRoadmapProgressDTO {
  /** progress_id (BIGINT PK) */
  progressId: number;
  /** user_id (BIGINT FK→users) */
  userId: number;
  /** roadmap_id (BIGINT FK→roadmaps) */
  roadmapId: number;
  /** node_id (BIGINT FK→roadmap_nodes) */
  nodeId: number;
  /** status (VARCHAR 20: not_started/in_progress/completed) */
  status: RoadmapProgressStatus;
  /** completed_at (TIMESTAMP NULL) */
  completedAt: string | null;
}

/**
 * Roadmap with Aggregated Student Progress Summary DTO (Roadmap Hub Overview)
 */
export interface RoadmapWithProgressSummaryDTO {
  roadmapId: number;
  title: string;
  description: string | null;
  career: string | null;
  totalNodes: number;
  completedNodes: number;
  inProgressNodes: number;
  completionPercentage: number;
}

/**
 * Roadmap Node Calculated Status
 */
export type RoadmapNodeStatus = "locked" | "unlocked" | "in_progress" | "completed";

/**
 * Personalized Roadmap Header DTO
 */
export interface PersonalizedRoadmapDTO {
  id: number;
  roadmapId?: number;
  careerSlug: string;
  title: string;
  description: string | null;
  career?: string | null;
  totalNodes: number;
  completedNodes: number;
  inProgressNodes: number;
  progressPercentage: number;
  requiresSpecializationSelection: boolean;
  specializationPrompt: string | null;
  nodes: PersonalizedRoadmapNodeDTO[];
}

/**
 * Student Context for Personalized Roadmap DTO
 */
export interface RoadmapStudentContextDTO {
  userId?: number;
  careerGoal: string | null;
  specializationBranch: string | null;
  semester: number | null;
  programmingLevel?: string | null;
  technicalInterests: string[] | null;
  targetSgpa?: number | null;
  evaluationScheme?: string | null;
}

/**
 * Node within a Personalized Roadmap DTO
 */
export interface PersonalizedRoadmapNodeDTO {
  id: number;
  nodeId?: number;
  roadmapId: number;
  nodeKey: string;
  sequenceNo: number;
  title: string;
  description: string | null;
  category: string | null;
  tier: string | null;
  branch: string | null;
  branchKey?: string;
  isElective: boolean;
  isGateway: boolean;
  isConvergence: boolean;
  targetSemester?: number | null;
  difficulty?: string | null;
  skills?: string[];
  prerequisiteKeys: string[];
  evidencePrompt?: string | null;
  status: RoadmapNodeStatus;
  isUnlocked: boolean;
  prerequisiteSatisfied?: boolean;
  lockedReason?: string | null;
  missingPrerequisites?: string[];
}

/**
 * Complete Personalized Roadmap Response DTO
 */
export interface PersonalizedRoadmapResponseDTO {
  configured: boolean;
  roadmap: PersonalizedRoadmapDTO | null;
  studentContext: RoadmapStudentContextDTO;
  nodes?: PersonalizedRoadmapNodeDTO[];
  message?: string;
}

/**
 * Opportunities DTO
 */
export interface OpportunityDTO {
  /** opportunity_id (BIGINT PK) */
  opportunityId: number;
  /** title (VARCHAR 255 NOT NULL) */
  title: string;
  /** company (VARCHAR 255 NULL) */
  company: string | null;
  /** description (TEXT NULL) */
  description: string | null;
  /** application_url (TEXT NULL) */
  applicationUrl: string | null;
  /** deadline (DATE NULL) */
  deadline: string | null;
}

/**
 * Opportunity with Student Tracking Status DTO (Single-query feed)
 */
export interface OpportunityWithTrackingDTO extends OpportunityDTO {
  /** Current user's tracking status ('saved' | 'applied' | 'shortlisted' | 'rejected' | null) */
  trackingStatus: OpportunityStatus | null;
  /** Timestamp when the opportunity was tracked (ISO string or null) */
  savedAt: string | null;
}

/**
 * Student Opportunities DTO
 */
export interface StudentOpportunityDTO {
  /** user_id (BIGINT PK+FK→users) */
  userId: number;
  /** opportunity_id (BIGINT PK+FK→opportunities) */
  opportunityId: number;
  /** status (VARCHAR 30: saved/applied/shortlisted/rejected) */
  status: OpportunityStatus;
  /** saved_at (TIMESTAMP) */
  savedAt: string;
}

