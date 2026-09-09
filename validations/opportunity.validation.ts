/**
 * @file validations/opportunity.validation.ts
 * @description Request body and parameter validation schemas for Opportunities and Student Application Tracking.
 * @domain Bounded Context: Internships, Jobs, Hackathons & Application Tracking
 */

import { OpportunityStatus } from "@/types/api.types";
import { ValidationResult } from "./user.validation";

export interface CreateOpportunityInput {
  title: string;
  company?: string | null;
  description?: string | null;
  applicationUrl?: string | null;
  deadline?: string | null;
}

export interface OpportunityFilterInput {
  search?: string;
  activeOnly?: boolean;
  category?: string;
  workMode?: string;
  page?: number;
  limit?: number;
}

export interface TrackOpportunityInput {
  opportunityId: number;
  status: OpportunityStatus;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const URL_REGEX = /^(https?:\/\/)?[\w.-]+(\.[\w.-]+)+[/#?]?.*$/;
const VALID_TRACKING_STATUSES: OpportunityStatus[] = ["saved", "applied", "shortlisted", "rejected"];

export class OpportunityValidation {
  /**
   * Validates master opportunity creation payload.
   */
  static validateCreateOpportunityInput(
    data: Partial<CreateOpportunityInput>
  ): ValidationResult<CreateOpportunityInput> {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== "string" || data.title.trim().length === 0) {
      errors.push("Opportunity title is required.");
    } else if (data.title.trim().length > 255) {
      errors.push("Opportunity title must not exceed 255 characters.");
    }

    if (data.company !== undefined && data.company !== null) {
      if (typeof data.company !== "string") {
        errors.push("Company name must be a string.");
      } else if (data.company.trim().length > 255) {
        errors.push("Company name must not exceed 255 characters.");
      }
    }

    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== "string") {
        errors.push("Description must be a string.");
      } else if (data.description.trim().length > 5000) {
        errors.push("Description must not exceed 5000 characters.");
      }
    }

    if (data.applicationUrl !== undefined && data.applicationUrl !== null) {
      if (typeof data.applicationUrl !== "string") {
        errors.push("Application URL must be a string.");
      } else if (data.applicationUrl.trim().length > 1000) {
        errors.push("Application URL must not exceed 1000 characters.");
      } else if (!URL_REGEX.test(data.applicationUrl.trim())) {
        errors.push("Application URL must be a valid web URL.");
      }
    }

    if (data.deadline !== undefined && data.deadline !== null) {
      if (typeof data.deadline !== "string" || !ISO_DATE_REGEX.test(data.deadline.trim())) {
        errors.push("Deadline must be in YYYY-MM-DD format.");
      }
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        title: data.title!.trim(),
        company: data.company ? data.company.trim() : null,
        description: data.description ? data.description.trim() : null,
        applicationUrl: data.applicationUrl ? data.applicationUrl.trim() : null,
        deadline: data.deadline ? data.deadline.trim() : null,
      },
    };
  }

  /**
   * Validates opportunity catalog search, category, workMode, active deadline filter, and pagination.
   */
  static validateOpportunityFilter(
    data: Partial<OpportunityFilterInput>
  ): ValidationResult<OpportunityFilterInput> {
    const errors: string[] = [];

    if (data.search !== undefined) {
      if (typeof data.search !== "string") {
        errors.push("Search query must be a string.");
      } else if (data.search.trim().length > 100) {
        errors.push("Search query must not exceed 100 characters.");
      }
    }

    if (data.category !== undefined && typeof data.category !== "string") {
      errors.push("Category must be a string.");
    }

    if (data.workMode !== undefined && typeof data.workMode !== "string") {
      errors.push("WorkMode must be a string.");
    }

    if (data.activeOnly !== undefined && typeof data.activeOnly !== "boolean") {
      errors.push("activeOnly must be a boolean.");
    }

    if (data.page !== undefined && (!Number.isInteger(data.page) || data.page < 1)) {
      errors.push("page must be a positive integer.");
    }

    if (data.limit !== undefined && (!Number.isInteger(data.limit) || data.limit < 1 || data.limit > 100)) {
      errors.push("limit must be an integer between 1 and 100.");
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        ...(data.search !== undefined && { search: data.search.trim() }),
        ...(data.category !== undefined && { category: data.category.trim() }),
        ...(data.workMode !== undefined && { workMode: data.workMode.trim() }),
        ...(data.activeOnly !== undefined && { activeOnly: data.activeOnly }),
        ...(data.page !== undefined && { page: data.page }),
        ...(data.limit !== undefined && { limit: data.limit }),
      },
    };
  }

  /**
   * Validates opportunity application tracking status update payload.
   */
  static validateTrackOpportunityInput(
    data: Partial<TrackOpportunityInput>
  ): ValidationResult<TrackOpportunityInput> {
    const errors: string[] = [];

    if (data.opportunityId === undefined || typeof data.opportunityId !== "number" || !Number.isInteger(data.opportunityId) || data.opportunityId <= 0) {
      errors.push("Opportunity ID is required and must be a positive integer.");
    }

    if (!data.status || typeof data.status !== "string" || !VALID_TRACKING_STATUSES.includes(data.status as OpportunityStatus)) {
      errors.push(`Status is required and must be one of: ${VALID_TRACKING_STATUSES.join(", ")}.`);
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        opportunityId: data.opportunityId!,
        status: data.status as OpportunityStatus,
      },
    };
  }
}
