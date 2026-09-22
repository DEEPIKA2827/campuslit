/**
 * @file validations/user.validation.ts
 * @description Request body and parameter validation schemas for User Identity, Profiles, and Settings.
 * @domain Bounded Context: User Management & Identity
 */

import { UserRole } from "@/types/api.types";

export interface ValidationResult<T = unknown> {
  valid: boolean;
  success: boolean;
  errors?: string[];
  data?: T;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface CreateProfileInput {
  firstName: string;
  lastName?: string | null;
  collegeId: number;
  courseId: number;
  semester?: number | null;
  careerGoal?: string | null;
  evaluationScheme?: string | null;
  targetSgpa?: number | null;
  programmingLevel?: string | null;
  technicalInterests?: string[] | null;
  specializationBranch?: string | null;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string | null;
  collegeId?: number | null;
  courseId?: number | null;
  semester?: number | null;
  careerGoal?: string | null;
  evaluationScheme?: string | null;
  targetSgpa?: number | null;
  programmingLevel?: string | null;
  technicalInterests?: string[] | null;
  specializationBranch?: string | null;
}

export interface CreateSettingsInput {
  notificationEnabled?: boolean;
  theme?: string;
  language?: string;
}

export interface UpdateSettingsInput {
  notificationEnabled?: boolean;
  theme?: string;
  language?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: UserRole[] = ["student", "faculty", "admin"];
const VALID_THEMES = ["light", "dark", "system"];
export const CANONICAL_CAREER_GOALS = ["sde", "ai_ml", "core", "higher_ed", "founder"] as const;
export const EXTENDED_CAREER_GOALS = [
  "data_science",
  "cybersecurity",
  "cloud_devops",
  "iot_embedded",
  "blockchain_web3",
  "product_design",
  "data_engineering",
  "other",
] as const;
export const VALID_CAREER_GOALS = [
  ...CANONICAL_CAREER_GOALS,
  ...EXTENDED_CAREER_GOALS,
] as const;
export const VALID_EVALUATION_SCHEMES = ["vtu", "autonomous"] as const;
export const VALID_PROGRAMMING_LEVELS = ["beginner", "c_basic", "python_basic", "web_dev"] as const;
export const VALID_CORE_BRANCHES = ["embedded", "iot", "robotics"] as const;
export const VALID_HIGHER_ED_BRANCHES = ["gate", "ms", "mba"] as const;

export function validateOnboardingContextFields(
  data: Partial<CreateProfileInput | UpdateProfileInput>,
  errors: string[]
): {
  careerGoal?: string | null;
  evaluationScheme?: string | null;
  targetSgpa?: number | null;
  programmingLevel?: string | null;
  technicalInterests?: string[] | null;
  specializationBranch?: string | null;
} {
  let careerGoal: string | null | undefined = undefined;
  let evaluationScheme: string | null | undefined = undefined;
  let targetSgpa: number | null | undefined = undefined;
  let programmingLevel: string | null | undefined = undefined;
  let technicalInterests: string[] | null | undefined = undefined;
  let specializationBranch: string | null | undefined = undefined;

  // careerGoal validation (supports canonical goals, extended domains, and custom career goals up to 50 chars)
  if (data.careerGoal !== undefined && data.careerGoal !== null) {
    if (typeof data.careerGoal !== "string" || data.careerGoal.trim().length === 0) {
      errors.push("Career goal must be a non-empty string.");
    } else if (data.careerGoal.trim().length > 50) {
      errors.push("Career goal must not exceed 50 characters.");
    } else {
      careerGoal = data.careerGoal.trim();
    }
  } else if (data.careerGoal === null) {
    careerGoal = null;
  }

  // specializationBranch validation (supports engineering branches as well as roadmap track specializations)
  if (data.specializationBranch !== undefined && data.specializationBranch !== null) {
    if (typeof data.specializationBranch !== "string" || data.specializationBranch.trim().length === 0) {
      errors.push("Specialization branch must be a non-empty string.");
    } else if (data.specializationBranch.trim().length > 50) {
      errors.push("Specialization branch must not exceed 50 characters.");
    } else {
      const branch = data.specializationBranch.trim();
      specializationBranch = branch;
    }
  } else if (data.specializationBranch === null) {
    specializationBranch = null;
  }

  // evaluationScheme validation
  if (data.evaluationScheme !== undefined && data.evaluationScheme !== null) {
    if (typeof data.evaluationScheme !== "string" || data.evaluationScheme.trim().length === 0) {
      errors.push("Evaluation scheme must be a non-empty string.");
    } else if (data.evaluationScheme.trim().length > 50) {
      errors.push("Evaluation scheme must not exceed 50 characters.");
    } else if (!VALID_EVALUATION_SCHEMES.includes(data.evaluationScheme.trim() as any)) {
      errors.push(`Evaluation scheme must be one of: ${VALID_EVALUATION_SCHEMES.join(", ")}.`);
    } else {
      evaluationScheme = data.evaluationScheme.trim();
    }
  } else if (data.evaluationScheme === null) {
    evaluationScheme = null;
  }

  // targetSgpa validation
  if (data.targetSgpa !== undefined && data.targetSgpa !== null) {
    const rawVal = data.targetSgpa;
    const num =
      typeof rawVal === "number"
        ? rawVal
        : typeof rawVal === "string" && (rawVal as string).trim().length > 0
        ? Number(rawVal)
        : NaN;
    if (typeof rawVal === "boolean" || typeof rawVal === "object" || isNaN(num) || !isFinite(num)) {
      errors.push("Target SGPA must be a valid numeric value.");
    } else if (num < 0.0 || num > 10.0) {
      errors.push("Target SGPA must be between 0.0 and 10.0.");
    } else {
      targetSgpa = parseFloat(num.toFixed(2));
    }
  } else if (data.targetSgpa === null) {
    targetSgpa = null;
  }

  // programmingLevel validation
  if (data.programmingLevel !== undefined && data.programmingLevel !== null) {
    if (typeof data.programmingLevel !== "string" || data.programmingLevel.trim().length === 0) {
      errors.push("Programming level must be a non-empty string.");
    } else if (data.programmingLevel.trim().length > 50) {
      errors.push("Programming level must not exceed 50 characters.");
    } else if (!VALID_PROGRAMMING_LEVELS.includes(data.programmingLevel.trim() as any)) {
      errors.push(`Programming level must be one of: ${VALID_PROGRAMMING_LEVELS.join(", ")}.`);
    } else {
      programmingLevel = data.programmingLevel.trim();
    }
  } else if (data.programmingLevel === null) {
    programmingLevel = null;
  }

  // technicalInterests validation
  if (data.technicalInterests !== undefined && data.technicalInterests !== null) {
    if (!Array.isArray(data.technicalInterests)) {
      errors.push("Technical interests must be an array of strings.");
    } else if (data.technicalInterests.length > 15) {
      errors.push("Technical interests must not exceed 15 items.");
    } else {
      const sanitized: string[] = [];
      for (const item of data.technicalInterests) {
        if (typeof item !== "string" || item.trim().length === 0 || item.trim().length > 50) {
          errors.push("Each technical interest must be a non-empty string up to 50 characters.");
          break;
        }
        sanitized.push(item.trim());
      }
      technicalInterests = sanitized;
    }
  } else if (data.technicalInterests === null) {
    technicalInterests = null;
  }

  return { careerGoal, evaluationScheme, targetSgpa, programmingLevel, technicalInterests, specializationBranch };
}

export class UserValidation {
  /**
   * Validates user registration payload.
   */
  static validateRegisterInput(data: Partial<CreateUserInput>): ValidationResult<CreateUserInput> {
    const errors: string[] = [];

    if (!data.email || typeof data.email !== "string" || data.email.trim().length === 0) {
      errors.push("Email is required.");
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.push("Invalid email format.");
    } else if (data.email.trim().length > 255) {
      errors.push("Email must not exceed 255 characters.");
    }

    if (!data.password || typeof data.password !== "string") {
      errors.push("Password is required.");
    } else if (data.password.length < 6) {
      errors.push("Password must be at least 6 characters long.");
    } else if (data.password.length > 255) {
      errors.push("Password must not exceed 255 characters.");
    }

    if (data.role !== undefined) {
      if (typeof data.role !== "string" || !VALID_ROLES.includes(data.role as UserRole)) {
        errors.push(`Role must be one of: ${VALID_ROLES.join(", ")}.`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        email: data.email!.trim().toLowerCase(),
        password: data.password!,
        role: data.role as UserRole | undefined,
      },
    };
  }

  /**
   * Validates user login payload.
   */
  static validateLoginInput(data: Partial<LoginUserInput>): ValidationResult<LoginUserInput> {
    const errors: string[] = [];

    if (!data.email || typeof data.email !== "string" || data.email.trim().length === 0) {
      errors.push("Email is required.");
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.push("Invalid email format.");
    }

    if (!data.password || typeof data.password !== "string" || data.password.length === 0) {
      errors.push("Password is required.");
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        email: data.email!.trim().toLowerCase(),
        password: data.password!,
      },
    };
  }

  /**
   * Validates student profile setup payload.
   */
  static validateCreateProfileInput(data: Partial<CreateProfileInput>): ValidationResult<CreateProfileInput> {
    const errors: string[] = [];

    if (!data.firstName || typeof data.firstName !== "string" || data.firstName.trim().length === 0) {
      errors.push("First name is required.");
    } else if (data.firstName.trim().length > 100) {
      errors.push("First name must not exceed 100 characters.");
    }

    if (data.lastName !== undefined && data.lastName !== null) {
      if (typeof data.lastName !== "string") {
        errors.push("Last name must be a string.");
      } else if (data.lastName.trim().length > 100) {
        errors.push("Last name must not exceed 100 characters.");
      }
    }

    if (data.collegeId === undefined || typeof data.collegeId !== "number" || !Number.isInteger(data.collegeId) || data.collegeId <= 0) {
      errors.push("College ID is required and must be a positive integer.");
    }

    if (data.courseId === undefined || typeof data.courseId !== "number" || !Number.isInteger(data.courseId) || data.courseId <= 0) {
      errors.push("Course ID is required and must be a positive integer.");
    }

    if (data.semester !== undefined && data.semester !== null) {
      if (typeof data.semester !== "number" || !Number.isInteger(data.semester) || data.semester < 1 || data.semester > 8) {
        errors.push("Semester must be a valid integer between 1 and 8.");
      }
    }

    const contextFields = validateOnboardingContextFields(data, errors);

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        firstName: data.firstName!.trim(),
        lastName: data.lastName ? data.lastName.trim() : null,
        collegeId: data.collegeId!,
        courseId: data.courseId!,
        semester: data.semester || null,
        careerGoal: contextFields.careerGoal ?? null,
        evaluationScheme: contextFields.evaluationScheme ?? null,
        targetSgpa: contextFields.targetSgpa ?? null,
        programmingLevel: contextFields.programmingLevel ?? null,
        technicalInterests: contextFields.technicalInterests ?? null,
        specializationBranch: contextFields.specializationBranch ?? null,
      },
    };
  }

  /**
   * Validates student profile update payload (all fields optional).
   */
  static validateUpdateProfileInput(data: Partial<UpdateProfileInput>): ValidationResult<UpdateProfileInput> {
    const errors: string[] = [];

    if (data.firstName !== undefined) {
      if (typeof data.firstName !== "string" || data.firstName.trim().length === 0) {
        errors.push("First name cannot be empty.");
      } else if (data.firstName.trim().length > 100) {
        errors.push("First name must not exceed 100 characters.");
      }
    }

    if (data.lastName !== undefined && data.lastName !== null) {
      if (typeof data.lastName !== "string") {
        errors.push("Last name must be a string.");
      } else if (data.lastName.trim().length > 100) {
        errors.push("Last name must not exceed 100 characters.");
      }
    }

    if (data.collegeId !== undefined && data.collegeId !== null) {
      if (typeof data.collegeId !== "number" || !Number.isInteger(data.collegeId) || data.collegeId <= 0) {
        errors.push("College ID must be a positive integer.");
      }
    }

    if (data.courseId !== undefined && data.courseId !== null) {
      if (typeof data.courseId !== "number" || !Number.isInteger(data.courseId) || data.courseId <= 0) {
        errors.push("Course ID must be a positive integer.");
      }
    }

    if (data.semester !== undefined && data.semester !== null) {
      if (typeof data.semester !== "number" || !Number.isInteger(data.semester) || data.semester < 1 || data.semester > 8) {
        errors.push("Semester must be a valid integer between 1 and 8.");
      }
    }

    const contextFields = validateOnboardingContextFields(data, errors);

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName.trim() }),
        ...(data.lastName !== undefined && { lastName: data.lastName ? data.lastName.trim() : null }),
        ...(data.collegeId !== undefined && { collegeId: data.collegeId }),
        ...(data.courseId !== undefined && { courseId: data.courseId }),
        ...(data.semester !== undefined && { semester: data.semester }),
        ...(contextFields.careerGoal !== undefined && { careerGoal: contextFields.careerGoal }),
        ...(contextFields.evaluationScheme !== undefined && { evaluationScheme: contextFields.evaluationScheme }),
        ...(contextFields.targetSgpa !== undefined && { targetSgpa: contextFields.targetSgpa }),
        ...(contextFields.programmingLevel !== undefined && { programmingLevel: contextFields.programmingLevel }),
        ...(contextFields.technicalInterests !== undefined && { technicalInterests: contextFields.technicalInterests }),
        ...(contextFields.specializationBranch !== undefined && { specializationBranch: contextFields.specializationBranch }),
      },
    };
  }

  /**
   * Validates student settings payload.
   */
  static validateSettingsInput(data: Partial<UpdateSettingsInput>): ValidationResult<UpdateSettingsInput> {
    const errors: string[] = [];

    if (data.notificationEnabled !== undefined && typeof data.notificationEnabled !== "boolean") {
      errors.push("Notification enabled must be a boolean.");
    }

    if (data.theme !== undefined) {
      if (typeof data.theme !== "string" || !VALID_THEMES.includes(data.theme)) {
        errors.push(`Theme must be one of: ${VALID_THEMES.join(", ")}.`);
      }
    }

    if (data.language !== undefined) {
      if (typeof data.language !== "string" || data.language.trim().length === 0 || data.language.trim().length > 10) {
        errors.push("Language must be a valid string between 1 and 10 characters.");
      }
    }

    if (errors.length > 0) {
      return { valid: false, success: false, errors };
    }

    return {
      valid: true,
      success: true,
      data: {
        ...(data.notificationEnabled !== undefined && { notificationEnabled: data.notificationEnabled }),
        ...(data.theme !== undefined && { theme: data.theme.trim() }),
        ...(data.language !== undefined && { language: data.language.trim() }),
      },
    };
  }
}
