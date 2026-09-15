/**
 * @file services/profile.service.ts
 * @description Business Logic Layer (BLL) for Student Profiles and Profile Settings.
 * @domain Bounded Context: Student Profile Management
 * @purpose Implements business validation rules and orchestrates data flow between API routes and Repositories.
 */

import { userRepository, UserRepository } from "@/repositories/user.repository";
import { profileRepository, ProfileRepository } from "@/repositories/profile.repository";
import {
  UserValidation,
  CreateProfileInput,
  UpdateProfileInput,
  UpdateSettingsInput,
  VALID_CORE_BRANCHES,
  VALID_HIGHER_ED_BRANCHES,
} from "@/validations/user.validation";
import { ProfileValidation } from "@/validations/profile.validation";
import {
  StudentProfileDTO,
  StudentSettingsDTO,
} from "@/types/api.types";
import { SafeUserAggregateDTO } from "./user.service";
import { Logger } from "@/lib/logger";

export class ProfileService {
  constructor(
    private profileRepo: ProfileRepository = profileRepository,
    private userRepo: UserRepository = userRepository
  ) {}

  /**
   * Retrieves profile for an authenticated student.
   */
  async getStudentProfile(userId: number): Promise<StudentProfileDTO | null> {
    Logger.info("ProfileService.getStudentProfile invoked", { userId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }

    return this.profileRepo.findByUserId(userId);
  }

  /**
   * Orchestrates profile setup: validates input schema, checks user existence & duplicate registration, saves via repository.
   */
  async setupStudentProfile(
    userId: number,
    input: Partial<CreateProfileInput>
  ): Promise<StudentProfileDTO> {
    Logger.info("ProfileService.setupStudentProfile invoked", { userId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }

    // Step 1: Syntactic validation
    const validation = ProfileValidation.validateCreateInput(input);
    if (!validation.valid || !validation.data) {
      throw new Error(`Validation Error: ${validation.errors?.join(", ")}`);
    }

    // Step 2: Semantic check — User must exist
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("Not Found Error: User does not exist.");
    }

    // Step 3: Semantic check — Profile must not already exist
    const existing = await this.profileRepo.findByUserId(userId);
    if (existing) {
      throw new Error("Conflict Error: Student profile already exists.");
    }

    // Step 4: Persist via Data Access Layer
    return this.profileRepo.createProfile(userId, validation.data);
  }

  /**
   * Updates an existing student profile with partial fields.
   */
  async updateStudentProfile(
    userId: number,
    input: Partial<UpdateProfileInput>
  ): Promise<StudentProfileDTO> {
    Logger.info("ProfileService.updateStudentProfile invoked", { userId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }

    // Step 1: Syntactic validation
    const validation = UserValidation.validateUpdateProfileInput(input);
    if (!validation.valid || !validation.data) {
      throw new Error(`Validation Error: ${validation.errors?.join(", ")}`);
    }

    // Step 2: Semantic check — User must exist
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("Not Found Error: User does not exist.");
    }

    // Step 3: Semantic check — Profile must already exist
    const existingProfile = await this.profileRepo.findByUserId(userId);
    if (!existingProfile) {
      throw new Error("Not Found Error: Student profile not found. Please setup profile first.");
    }

    const effectiveCareerGoal = validation.data.careerGoal !== undefined ? validation.data.careerGoal : existingProfile.careerGoal;
    let effectiveSpecializationBranch: string | null = null;
    if (effectiveCareerGoal === "core" || effectiveCareerGoal === "higher_ed") {
      effectiveSpecializationBranch = validation.data.specializationBranch !== undefined
        ? validation.data.specializationBranch
        : existingProfile.specializationBranch;
    } else {
      // For sde, ai_ml, founder, or unconfigured career goal: specializationBranch must be null
      effectiveSpecializationBranch = null;
    }

    // Semantic validation against effectiveCareerGoal
    if (effectiveSpecializationBranch !== null) {
      if (effectiveCareerGoal === "core" && !VALID_CORE_BRANCHES.includes(effectiveSpecializationBranch as any)) {
        throw new Error(`Validation Error: Invalid specialization branch '${effectiveSpecializationBranch}' for Core track.`);
      }
      if (effectiveCareerGoal === "higher_ed" && !VALID_HIGHER_ED_BRANCHES.includes(effectiveSpecializationBranch as any)) {
        throw new Error(`Validation Error: Invalid specialization branch '${effectiveSpecializationBranch}' for Higher Ed track.`);
      }
    }

    // Step 4: Merge existing fields with valid updates
    const mergedInput: CreateProfileInput = {
      firstName: validation.data.firstName ?? existingProfile.firstName,
      lastName: validation.data.lastName !== undefined ? validation.data.lastName : existingProfile.lastName,
      collegeId: validation.data.collegeId !== undefined ? (validation.data.collegeId ?? 0) : (existingProfile.collegeId ?? 0),
      courseId: validation.data.courseId !== undefined ? (validation.data.courseId ?? 0) : (existingProfile.courseId ?? 0),
      semester: validation.data.semester !== undefined ? validation.data.semester : existingProfile.semester,
      careerGoal: effectiveCareerGoal,
      evaluationScheme: validation.data.evaluationScheme !== undefined ? validation.data.evaluationScheme : existingProfile.evaluationScheme,
      targetSgpa: validation.data.targetSgpa !== undefined ? validation.data.targetSgpa : existingProfile.targetSgpa,
      programmingLevel: validation.data.programmingLevel !== undefined ? validation.data.programmingLevel : existingProfile.programmingLevel,
      technicalInterests: validation.data.technicalInterests !== undefined ? validation.data.technicalInterests : existingProfile.technicalInterests,
      specializationBranch: effectiveSpecializationBranch,
    };

    // Step 5: Persist via Data Access Layer
    return this.userRepo.upsertProfile(userId, mergedInput);
  }

  /**
   * Retrieves student settings preferences for an authenticated user.
   */
  async getStudentSettings(userId: number): Promise<StudentSettingsDTO | null> {
    Logger.debug("ProfileService.getStudentSettings invoked", { userId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }

    return this.userRepo.getSettings(userId);
  }

  /**
   * Updates student settings preferences.
   */
  async updateStudentSettings(
    userId: number,
    input: Partial<UpdateSettingsInput>
  ): Promise<StudentSettingsDTO> {
    Logger.info("ProfileService.updateStudentSettings invoked", { userId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }

    // Step 1: Syntactic validation
    const validation = UserValidation.validateSettingsInput(input);
    if (!validation.valid || !validation.data) {
      throw new Error(`Validation Error: ${validation.errors?.join(", ")}`);
    }

    // Step 2: Semantic check — User must exist
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("Not Found Error: User does not exist.");
    }

    // Step 3: Persist via Data Access Layer
    return this.userRepo.updateSettings(userId, validation.data);
  }

  /**
   * Retrieves full profile aggregate (User, Profile, and Settings) without passwordHash.
   */
  async getFullProfile(userId: number): Promise<SafeUserAggregateDTO | null> {
    Logger.debug("ProfileService.getFullProfile invoked", { userId });

    if (!userId || typeof userId !== "number" || userId <= 0) {
      throw new Error("Validation Error: User ID must be a positive integer.");
    }

    const aggregate = await this.userRepo.getUserWithProfileAndSettings(userId);
    if (!aggregate) return null;

    return {
      user: {
        userId: aggregate.user.userId,
        email: aggregate.user.email,
        role: aggregate.user.role,
        createdAt: aggregate.user.createdAt,
      },
      profile: aggregate.profile,
      settings: aggregate.settings,
    };
  }
}

export const profileService = new ProfileService();
