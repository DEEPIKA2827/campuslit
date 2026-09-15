/**
 * @file validations/roadmap.validation.ts
 * @description Request body and parameter validation schemas for Learning Roadmaps, Nodes, and Progress Tracking.
 * @domain Bounded Context: Student Career Velocity & Skill Roadmaps
 */

import { RoadmapProgressStatus } from "@/types/api.types";
import { ValidationResult } from "./user.validation";

export interface CreateRoadmapInput {
  title: string;
  description?: string | null;
  career?: string | null;
}

export interface CreateRoadmapNodeInput {
  roadmapId?: number;
  title: string;
  description?: string | null;
  sequenceNo: number;
}

export interface UpdateNodeProgressInput {
  nodeId: number;
  status: RoadmapProgressStatus;
}

export interface RoadmapFilterInput {
  career?: string;
}

const VALID_PROGRESS_STATUSES: RoadmapProgressStatus[] = [
  "not_started",
  "in_progress",
  "completed",
];

export class RoadmapValidation {
  /**
   * Validates roadmap creation payload.
   */
  static validateCreateRoadmapInput(data: Partial<CreateRoadmapInput>): ValidationResult<CreateRoadmapInput> {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== "string" || data.title.trim().length === 0) {
      errors.push("Title is required.");
    } else if (data.title.trim().length > 255) {
      errors.push("Title must not exceed 255 characters.");
    }

    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== "string") {
        errors.push("Description must be a string.");
      } else if (data.description.trim().length > 2000) {
        errors.push("Description must not exceed 2000 characters.");
      }
    }

    if (data.career !== undefined && data.career !== null) {
      if (typeof data.career !== "string") {
        errors.push("Career must be a string.");
      } else if (data.career.trim().length > 150) {
        errors.push("Career must not exceed 150 characters.");
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
        description: data.description ? data.description.trim() : null,
        career: data.career ? data.career.trim() : null,
      },
    };
  }

  /**
   * Validates roadmap node creation payload.
   */
  static validateCreateNodeInput(data: Partial<CreateRoadmapNodeInput>): ValidationResult<CreateRoadmapNodeInput> {
    const errors: string[] = [];

    if (data.roadmapId !== undefined && (typeof data.roadmapId !== "number" || !Number.isInteger(data.roadmapId) || data.roadmapId <= 0)) {
      errors.push("Roadmap ID must be a positive integer.");
    }

    if (!data.title || typeof data.title !== "string" || data.title.trim().length === 0) {
      errors.push("Node title is required.");
    } else if (data.title.trim().length > 255) {
      errors.push("Node title must not exceed 255 characters.");
    }

    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== "string") {
        errors.push("Description must be a string.");
      } else if (data.description.trim().length > 2000) {
        errors.push("Description must not exceed 2000 characters.");
      }
    }

    if (data.sequenceNo === undefined || typeof data.sequenceNo !== "number" || !Number.isInteger(data.sequenceNo) || data.sequenceNo < 1) {
      errors.push("Sequence number is required and must be an integer >= 1.");
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        roadmapId: data.roadmapId!,
        title: data.title!.trim(),
        description: data.description ? data.description.trim() : null,
        sequenceNo: data.sequenceNo!,
      },
    };
  }

  /**
   * Validates student progress update payload on a node.
   */
  static validateUpdateNodeProgressInput(
    data: Partial<UpdateNodeProgressInput>
  ): ValidationResult<UpdateNodeProgressInput> {
    const errors: string[] = [];

    if (data.nodeId === undefined || typeof data.nodeId !== "number" || !Number.isInteger(data.nodeId) || data.nodeId <= 0) {
      errors.push("Node ID is required and must be a positive integer.");
    }

    if (!data.status || typeof data.status !== "string" || !VALID_PROGRESS_STATUSES.includes(data.status as RoadmapProgressStatus)) {
      errors.push(`Status is required and must be one of: ${VALID_PROGRESS_STATUSES.join(", ")}.`);
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        nodeId: data.nodeId!,
        status: data.status as RoadmapProgressStatus,
      },
    };
  }

  /**
   * Validates roadmap career filter parameter.
   */
  static validateRoadmapFilter(data: Partial<RoadmapFilterInput>): ValidationResult<RoadmapFilterInput> {
    const errors: string[] = [];

    if (data.career !== undefined) {
      if (typeof data.career !== "string") {
        errors.push("Career filter must be a string.");
      } else if (data.career.trim().length > 150) {
        errors.push("Career filter must not exceed 150 characters.");
      }
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        ...(data.career !== undefined && { career: data.career.trim() }),
      },
    };
  }

  /**
   * Validates gateway specialization branch selection input.
   */
  static validateSpecializationBranchInput(
    careerGoal: string | null,
    branch: unknown
  ): ValidationResult<{ specializationBranch: string | null }> {
    const errors: string[] = [];

    if (!careerGoal) {
      errors.push("Cannot select a specialization branch without an active career goal.");
      return { valid: false, success: false, errors };
    }

    if (branch === null || branch === undefined || (typeof branch === "string" && branch.trim().length === 0)) {
      return {
        valid: true,
        success: true,
        data: { specializationBranch: null },
      };
    }

    if (typeof branch !== "string") {
      errors.push("Specialization branch must be a string or null.");
      return { valid: false, success: false, errors };
    }

    const cleanBranch = branch.trim();

    if (careerGoal === "core") {
      const allowed = ["embedded", "iot", "robotics"];
      if (!allowed.includes(cleanBranch)) {
        errors.push(`Invalid specialization branch for Core Engineering: '${cleanBranch}'. Allowed branches: ${allowed.join(", ")}.`);
      }
    } else if (careerGoal === "higher_ed") {
      const allowed = ["gate", "ms", "mba"];
      if (!allowed.includes(cleanBranch)) {
        errors.push(`Invalid specialization branch for Higher Studies: '${cleanBranch}'. Allowed branches: ${allowed.join(", ")}.`);
      }
    } else {
      errors.push(`Specialization branch is not permitted for career goal '${careerGoal}'. It must be null.`);
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: { specializationBranch: cleanBranch },
    };
  }
}
