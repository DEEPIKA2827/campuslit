/**
 * @file lib/ingestion/types.ts
 * @description Data contracts and types for CampusOS Catalog Ingestion Engine.
 * @purpose Defines strict provenance, verification tiers, and normalized entity shapes for discovery datasets.
 */

export type ProvenanceTier =
  | "verified"        // Manually or programmatically verified against canonical portal within 90 days
  | "curated_static" // Curated from official university/foundation publications
  | "imported"       // Ingested via external structured CSV/JSON feed
  | "provisional"    // Community/student network submission pending senior verification
  | "live_api";      // Actively synchronized via live authenticated API endpoint

export type DeadlineStatus = "active" | "expired" | "archived" | "open_all_year";

export interface IngestedScholarship {
  scholarshipId?: number;
  scholarshipName: string;
  provider: string;
  source: string;
  sourceUrl: string;
  applicationUrl: string;
  category: "government_state" | "government_central" | "trust_foundation" | "corporate_csr" | "women_in_tech" | "merit_based" | "need_based" | "special_category";
  grantAmount: string;
  grantType: "one_time" | "annual_recurring" | "monthly_stipend" | "tuition_fee_waiver";
  annualValue: number;
  deadline?: string | null;
  deadlineStatus: DeadlineStatus;
  eligibility: string;
  academicCriteria: string;
  maxIncome?: string | null;
  documentsRequired: string[];
  tags: string[];
  provenance: ProvenanceTier;
  verificationStatus: "verified" | "provisional" | "unverified";
  lastVerifiedAt: string;
  notes?: string | null;
}

export interface IngestedOpportunity {
  opportunityId?: number;
  title: string;
  company: string;
  source: string;
  sourceUrl: string;
  applicationUrl: string;
  category: "internships" | "jobs" | "hackathons" | "competitions" | "fellowships" | "opensource" | "campus_drives" | "research" | "trainee_roles" | "apprenticeships";
  workMode: "Remote" | "Hybrid" | "On-site";
  location: string;
  batch: string[];
  minCGPA: number;
  stipend: string;
  isPaid: boolean;
  deadline?: string | null;
  deadlineStatus: DeadlineStatus;
  isUrgent: boolean;
  tags: string[];
  description: string;
  teammatesNeeded: boolean;
  provenance: ProvenanceTier;
  verificationStatus: "verified" | "provisional" | "unverified";
  lastVerifiedAt: string;
}

export interface IngestedHighFrequencyQuestion {
  questionId: string;
  question: string;
  papersAnalyzed: number;
  occurrenceCount: number;
  frequencyRatio: number;
  classification: string;
  typicalMarks: number;
  module: number;
  isSufficientData: boolean;
}

export interface IngestedVivaQuestion {
  vivaId: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  coreConcept: string;
  sampleAnswer?: string | null;
}

export interface IngestedResourceItem {
  resourceId: string;
  title: string;
  type: "Notes" | "PYQs" | "Question Banks" | "High-Frequency Questions" | "Model Papers" | "Lab Manuals" | "Viva Playbooks" | "Assignments" | "Important Derivations" | "Video Lectures" | "Reference Books";
  format: string;
  source: string;
  sourceUrl: string;
  author: string;
  lastVerifiedAt: string;
}

export interface IngestedCourseVault {
  courseId: number;
  courseCode: string;
  courseName: string;
  branch: string;
  semester: number;
  scheme: string;
  credits: number;
  resources: IngestedResourceItem[];
  highFrequencyQuestions: IngestedHighFrequencyQuestion[];
  vivaQuestions: IngestedVivaQuestion[];
}

export interface IngestionValidationResult<T> {
  validRecords: T[];
  rejectedRecords: Array<{
    record: unknown;
    reasons: string[];
    index: number;
  }>;
  totalParsed: number;
  validCount: number;
  rejectedCount: number;
}
