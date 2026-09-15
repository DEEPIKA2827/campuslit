/**
 * @file repositories/profile.repository.ts
 * @description Data Access Layer for Student Profiles.
 * @purpose Delegates to canonical UserRepository while maintaining backwards compatibility.
 */

import { StudentProfileDTO } from "@/types/api.types";
import { CreateProfileInput } from "@/validations/profile.validation";
import { userRepository, UserRepository } from "./user.repository";

export class ProfileRepository {
  constructor(private userRepo: UserRepository = userRepository) {}

  /**
   * Finds a student profile by their unique User ID.
   */
  async findByUserId(userId: number): Promise<StudentProfileDTO | null> {
    return this.userRepo.getProfile(userId);
  }

  /**
   * Persists / updates a student profile in the database.
   */
  async createProfile(userId: number, input: CreateProfileInput): Promise<StudentProfileDTO> {
    return this.userRepo.upsertProfile(userId, {
      firstName: input.firstName,
      lastName: input.lastName || null,
      collegeId: input.collegeId,
      courseId: input.courseId,
      semester: input.semester || null,
      careerGoal: input.careerGoal || null,
      evaluationScheme: input.evaluationScheme || null,
      targetSgpa: input.targetSgpa ?? null,
      programmingLevel: input.programmingLevel || null,
      technicalInterests: input.technicalInterests || null,
      specializationBranch: input.specializationBranch || null,
    });
  }
}

export const profileRepository = new ProfileRepository();
