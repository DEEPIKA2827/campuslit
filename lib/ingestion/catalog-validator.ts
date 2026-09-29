/**
 * @file lib/ingestion/catalog-validator.ts
 * @description Zod validation schemas and sanitization logic for CampusLit ingestion.
 * @purpose Enforces non-null required fields, valid canonical URLs, sane date ranges, and duplicate detection.
 */

import { z } from "zod";
import {
  IngestedScholarship,
  IngestedOpportunity,
  IngestedCourseVault,
  IngestionValidationResult,
  DeadlineStatus,
} from "./types";

// Valid URL schema checking protocol
const urlSchema = z.string().trim().refine((val) => {
  if (!val || val.length === 0) return false;
  try {
    const parsed = new URL(val);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}, { message: "Must be a valid HTTP/HTTPS URL" });

export const ScholarshipSchema = z.object({
  scholarshipId: z.number().int().positive().optional(),
  scholarshipName: z.string().trim().min(3, "Scholarship name must be at least 3 characters"),
  provider: z.string().trim().min(2, "Provider must be specified"),
  source: z.string().trim().min(2, "Source attribution is mandatory"),
  sourceUrl: urlSchema,
  applicationUrl: urlSchema,
  category: z.enum([
    "government_state",
    "government_central",
    "trust_foundation",
    "corporate_csr",
    "women_in_tech",
    "merit_based",
    "need_based",
    "special_category",
  ]),
  grantAmount: z.string().trim().min(1, "Grant amount description is required"),
  grantType: z.enum(["one_time", "annual_recurring", "monthly_stipend", "tuition_fee_waiver"]).default("annual_recurring"),
  annualValue: z.number().nonnegative().default(0),
  deadline: z.string().nullable().optional(),
  eligibility: z.string().trim().min(5, "Eligibility criteria required"),
  academicCriteria: z.string().trim().min(3, "Academic criteria required"),
  maxIncome: z.string().nullable().optional(),
  documentsRequired: z.array(z.string().trim()).default([]),
  tags: z.array(z.string().trim()).default([]),
  provenance: z.enum(["verified", "curated_static", "imported", "provisional", "live_api"]).default("curated_static"),
  verificationStatus: z.enum(["verified", "provisional", "unverified"]).default("verified"),
  lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "lastVerifiedAt must be YYYY-MM-DD format"),
  notes: z.string().nullable().optional(),
});

export const OpportunitySchema = z.object({
  opportunityId: z.number().int().positive().optional(),
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  company: z.string().trim().min(2, "Company/organization is mandatory"),
  source: z.string().trim().min(2, "Source attribution is mandatory"),
  sourceUrl: urlSchema,
  applicationUrl: urlSchema,
  category: z.enum([
    "internships",
    "jobs",
    "hackathons",
    "competitions",
    "fellowships",
    "opensource",
    "campus_drives",
    "research",
    "trainee_roles",
    "apprenticeships",
  ]),
  workMode: z.enum(["Remote", "Hybrid", "On-site"]),
  location: z.string().trim().min(2, "Location is required"),
  batch: z.array(z.string().trim()).min(1, "At least one target batch year required"),
  minCGPA: z.number().min(0).max(10).default(0),
  stipend: z.string().trim().min(1, "Stipend or CTC description required"),
  isPaid: z.boolean().default(true),
  deadline: z.string().nullable().optional(),
  isUrgent: z.boolean().default(false),
  tags: z.array(z.string().trim()).default([]),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  teammatesNeeded: z.boolean().default(false),
  provenance: z.enum(["verified", "curated_static", "imported", "provisional", "live_api"]).default("curated_static"),
  verificationStatus: z.enum(["verified", "provisional", "unverified"]).default("verified"),
  lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "lastVerifiedAt must be YYYY-MM-DD format"),
});

export const HighFrequencyQuestionSchema = z.object({
  questionId: z.string().trim().min(1),
  question: z.string().trim().min(10, "Question text must be substantive"),
  papersAnalyzed: z.number().int().nonnegative(),
  occurrenceCount: z.number().int().nonnegative(),
  frequencyRatio: z.number().min(0).max(1),
  classification: z.string().trim().min(2),
  typicalMarks: z.number().positive(),
  module: z.number().int().min(1).max(5),
  isSufficientData: z.boolean().default(true),
});

export const VivaQuestionSchema = z.object({
  vivaId: z.string().trim().min(1),
  question: z.string().trim().min(5),
  difficulty: z.enum(["easy", "medium", "hard"]),
  coreConcept: z.string().trim().min(2),
  sampleAnswer: z.string().nullable().optional(),
});

export const ResourceItemSchema = z.object({
  resourceId: z.string().trim().min(1),
  title: z.string().trim().min(3),
  type: z.enum([
    "Notes",
    "PYQs",
    "Question Banks",
    "High-Frequency Questions",
    "Model Papers",
    "Lab Manuals",
    "Viva Playbooks",
    "Assignments",
    "Important Derivations",
    "Video Lectures",
    "Reference Books",
  ]),
  format: z.string().trim().min(2),
  source: z.string().trim().min(2),
  sourceUrl: urlSchema,
  author: z.string().trim().min(2),
  lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const CourseVaultSchema = z.object({
  courseId: z.number().int().positive(),
  courseCode: z.string().trim().min(3),
  courseName: z.string().trim().min(3),
  branch: z.string().trim().min(2),
  semester: z.number().int().min(1).max(8),
  scheme: z.string().trim().min(2),
  credits: z.number().positive(),
  resources: z.array(ResourceItemSchema).default([]),
  highFrequencyQuestions: z.array(HighFrequencyQuestionSchema).default([]),
  vivaQuestions: z.array(VivaQuestionSchema).default([]),
});

export class CatalogValidator {
  /**
   * Evaluates dynamic deadline status based on ISO date
   */
  static evaluateDeadlineStatus(deadlineStr?: string | null): DeadlineStatus {
    if (!deadlineStr || deadlineStr.toLowerCase().includes("all year") || deadlineStr.toLowerCase().includes("open")) {
      return "open_all_year";
    }

    try {
      const deadlineDate = new Date(deadlineStr);
      if (isNaN(deadlineDate.getTime())) {
        return "open_all_year";
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return "expired";
      }
      return "active";
    } catch {
      return "open_all_year";
    }
  }

  /**
   * Validates and deduplicates scholarships list
   */
  static validateScholarships(rawItems: unknown[]): IngestionValidationResult<IngestedScholarship> {
    const validRecords: IngestedScholarship[] = [];
    const rejectedRecords: IngestionValidationResult<IngestedScholarship>["rejectedRecords"] = [];
    const seenKeys = new Set<string>();

    rawItems.forEach((raw, idx) => {
      const parseResult = ScholarshipSchema.safeParse(raw);
      if (!parseResult.success) {
        rejectedRecords.push({
          record: raw,
          reasons: parseResult.error.issues.map((e: { path: (string | number | symbol)[]; message: string }) => `${e.path.map(String).join(".")}: ${e.message}`),
          index: idx,
        });
        return;
      }

      const data = parseResult.data;
      const dedupeKey = `${data.scholarshipName.toLowerCase().trim()}|${data.provider.toLowerCase().trim()}`;
      if (seenKeys.has(dedupeKey)) {
        rejectedRecords.push({
          record: raw,
          reasons: [`Duplicate scholarship: "${data.scholarshipName}" by ${data.provider}`],
          index: idx,
        });
        return;
      }

      seenKeys.add(dedupeKey);
      validRecords.push({
        ...data,
        deadlineStatus: this.evaluateDeadlineStatus(data.deadline),
      });
    });

    return {
      validRecords,
      rejectedRecords,
      totalParsed: rawItems.length,
      validCount: validRecords.length,
      rejectedCount: rejectedRecords.length,
    };
  }

  /**
   * Validates and deduplicates opportunities list
   */
  static validateOpportunities(rawItems: unknown[]): IngestionValidationResult<IngestedOpportunity> {
    const validRecords: IngestedOpportunity[] = [];
    const rejectedRecords: IngestionValidationResult<IngestedOpportunity>["rejectedRecords"] = [];
    const seenKeys = new Set<string>();

    rawItems.forEach((raw, idx) => {
      const parseResult = OpportunitySchema.safeParse(raw);
      if (!parseResult.success) {
        rejectedRecords.push({
          record: raw,
          reasons: parseResult.error.issues.map((e: { path: (string | number | symbol)[]; message: string }) => `${e.path.map(String).join(".")}: ${e.message}`),
          index: idx,
        });
        return;
      }

      const data = parseResult.data;
      const dedupeKey = `${data.title.toLowerCase().trim()}|${data.company.toLowerCase().trim()}|${data.category}`;
      if (seenKeys.has(dedupeKey)) {
        rejectedRecords.push({
          record: raw,
          reasons: [`Duplicate opportunity: "${data.title}" at ${data.company}`],
          index: idx,
        });
        return;
      }

      seenKeys.add(dedupeKey);
      validRecords.push({
        ...data,
        deadlineStatus: this.evaluateDeadlineStatus(data.deadline),
      });
    });

    return {
      validRecords,
      rejectedRecords,
      totalParsed: rawItems.length,
      validCount: validRecords.length,
      rejectedCount: rejectedRecords.length,
    };
  }

  /**
   * Validates hierarchical course vaults
   */
  static validateCourseVaults(rawItems: unknown[]): IngestionValidationResult<IngestedCourseVault> {
    const validRecords: IngestedCourseVault[] = [];
    const rejectedRecords: IngestionValidationResult<IngestedCourseVault>["rejectedRecords"] = [];
    const seenCodes = new Set<string>();

    rawItems.forEach((raw, idx) => {
      const parseResult = CourseVaultSchema.safeParse(raw);
      if (!parseResult.success) {
        rejectedRecords.push({
          record: raw,
          reasons: parseResult.error.issues.map((e: { path: (string | number | symbol)[]; message: string }) => `${e.path.map(String).join(".")}: ${e.message}`),
          index: idx,
        });
        return;
      }

      const data = parseResult.data;
      const codeKey = `${data.courseCode.toUpperCase().trim()}|${data.scheme.toLowerCase().trim()}`;
      if (seenCodes.has(codeKey)) {
        rejectedRecords.push({
          record: raw,
          reasons: [`Duplicate course code: "${data.courseCode}" under ${data.scheme}`],
          index: idx,
        });
        return;
      }

      seenCodes.add(codeKey);

      // Validate high-frequency statistical integrity
      const processedHfq = data.highFrequencyQuestions.map((q) => {
        const isSufficient = q.papersAnalyzed >= 3;
        return {
          ...q,
          isSufficientData: isSufficient,
          classification: isSufficient ? q.classification : "Insufficient data (Less than 3 papers analyzed)",
        };
      });

      validRecords.push({
        ...data,
        highFrequencyQuestions: processedHfq,
      });
    });

    return {
      validRecords,
      rejectedRecords,
      totalParsed: rawItems.length,
      validCount: validRecords.length,
      rejectedCount: rejectedRecords.length,
    };
  }
}
