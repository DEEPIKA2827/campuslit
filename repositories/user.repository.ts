/**
 * @file repositories/user.repository.ts
 * @description Data Access Layer for User Identity, Student Profiles, and Student Settings.
 * @domain Bounded Context: User Management & Identity
 * @tables users, student_profiles, student_settings
 */

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Logger } from "@/lib/logger";
import {
  UserDTO,
  StudentProfileDTO,
  StudentSettingsDTO,
  UserRole,
} from "@/types/api.types";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role?: UserRole;
}

export interface UpsertProfileInput {
  firstName: string;
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

export interface UpdateSettingsInput {
  notificationEnabled?: boolean;
  theme?: string;
  language?: string;
}

export interface FullUserAggregate {
  user: UserDTO;
  profile: StudentProfileDTO | null;
  settings: StudentSettingsDTO | null;
}

export class UserRepository {
  private getDb() {
    if (!db) {
      throw new Error(
        "Database operation failed: Database client is not initialized. Please ensure DATABASE_URL is configured."
      );
    }
    return db;
  }

  /**
   * Finds a user record by primary key (user_id).
   */
  async findById(userId: number): Promise<UserDTO | null> {
    const client = this.getDb();
    Logger.debug("UserRepository.findById", { userId });

    const [record] = await client
      .select()
      .from(schema.users)
      .where(eq(schema.users.userId, userId));

    if (!record) return null;

    return {
      userId: record.userId,
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role as UserRole,
      createdAt: record.createdAt,
    };
  }

  /**
   * Finds a user record by email address.
   */
  async findByEmail(email: string): Promise<UserDTO | null> {
    const client = this.getDb();
    Logger.debug("UserRepository.findByEmail", { email });

    const [record] = await client
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()));

    if (!record) return null;

    return {
      userId: record.userId,
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role as UserRole,
      createdAt: record.createdAt,
    };
  }

  /**
   * Atomically registers a new user with default student_settings and optional profile in a transaction.
   */
  async createUserWithDefaults(
    input: CreateUserInput,
    profileInput?: UpsertProfileInput
  ): Promise<FullUserAggregate> {
    const client = this.getDb();
    Logger.info("UserRepository.createUserWithDefaults (atomic)", { email: input.email });

    return await client.transaction(async (tx) => {
      // 1. Insert User
      const [userRecord] = await tx
        .insert(schema.users)
        .values({
          email: input.email.toLowerCase().trim(),
          passwordHash: input.passwordHash,
          role: input.role || "student",
        })
        .returning();

      // 2. Insert Default Settings
      const [settingsRecord] = await tx
        .insert(schema.studentSettings)
        .values({
          userId: userRecord.userId,
          notificationEnabled: true,
          theme: "system",
          language: "en",
        })
        .returning();

      // 3. Insert Profile if provided
      let profileRecord: typeof schema.studentProfiles.$inferSelect | null = null;
      if (profileInput) {
        const [insertedProfile] = await tx
          .insert(schema.studentProfiles)
          .values({
            userId: userRecord.userId,
            firstName: profileInput.firstName,
            lastName: profileInput.lastName || null,
            collegeId: profileInput.collegeId || null,
            courseId: profileInput.courseId || null,
            semester: profileInput.semester || null,
            careerGoal: profileInput.careerGoal || null,
            evaluationScheme: profileInput.evaluationScheme || null,
            targetSgpa: profileInput.targetSgpa !== undefined && profileInput.targetSgpa !== null ? profileInput.targetSgpa.toFixed(2) : null,
            programmingLevel: profileInput.programmingLevel || null,
            technicalInterests: profileInput.technicalInterests || null,
            specializationBranch: profileInput.specializationBranch || null,
          })
          .returning();
        profileRecord = insertedProfile;
      }

      return {
        user: {
          userId: userRecord.userId,
          email: userRecord.email,
          passwordHash: userRecord.passwordHash,
          role: userRecord.role as UserRole,
          createdAt: userRecord.createdAt,
        },
        settings: {
          userId: settingsRecord.userId,
          notificationEnabled: settingsRecord.notificationEnabled,
          theme: settingsRecord.theme,
          language: settingsRecord.language,
        },
        profile: profileRecord
          ? {
              userId: profileRecord.userId,
              firstName: profileRecord.firstName,
              lastName: profileRecord.lastName,
              collegeId: profileRecord.collegeId,
              courseId: profileRecord.courseId,
              semester: profileRecord.semester,
              careerGoal: profileRecord.careerGoal,
              evaluationScheme: profileRecord.evaluationScheme,
              targetSgpa: profileRecord.targetSgpa ? parseFloat(profileRecord.targetSgpa) : null,
              programmingLevel: profileRecord.programmingLevel,
              technicalInterests: profileRecord.technicalInterests,
              specializationBranch: profileRecord.specializationBranch ?? null,
              createdAt: profileRecord.createdAt,
            }
          : null,
      };
    });
  }

  /**
   * Retrieves a student profile by user_id.
   */
  async getProfile(userId: number): Promise<StudentProfileDTO | null> {
    const client = this.getDb();
    Logger.debug("UserRepository.getProfile", { userId });

    const [record] = await client
      .select()
      .from(schema.studentProfiles)
      .where(eq(schema.studentProfiles.userId, userId));

    if (!record) return null;

    return {
      userId: record.userId,
      firstName: record.firstName,
      lastName: record.lastName,
      collegeId: record.collegeId,
      courseId: record.courseId,
      semester: record.semester,
      careerGoal: record.careerGoal,
      evaluationScheme: record.evaluationScheme,
      targetSgpa: record.targetSgpa ? parseFloat(record.targetSgpa) : null,
      programmingLevel: record.programmingLevel,
      technicalInterests: record.technicalInterests,
      specializationBranch: record.specializationBranch ?? null,
      createdAt: record.createdAt,
    };
  }

  /**
   * Upserts a student profile for an existing user.
   */
  async upsertProfile(userId: number, input: UpsertProfileInput): Promise<StudentProfileDTO> {
    const client = this.getDb();
    Logger.info("UserRepository.upsertProfile", { userId });

    const targetSgpaStr =
      input.targetSgpa !== undefined && input.targetSgpa !== null
        ? input.targetSgpa.toFixed(2)
        : null;

    const [record] = await client
      .insert(schema.studentProfiles)
      .values({
        userId,
        firstName: input.firstName,
        lastName: input.lastName || null,
        collegeId: input.collegeId || null,
        courseId: input.courseId || null,
        semester: input.semester || null,
        careerGoal: input.careerGoal || null,
        evaluationScheme: input.evaluationScheme || null,
        targetSgpa: targetSgpaStr,
        programmingLevel: input.programmingLevel || null,
        technicalInterests: input.technicalInterests || null,
        specializationBranch: input.specializationBranch || null,
      })
      .onConflictDoUpdate({
        target: schema.studentProfiles.userId,
        set: {
          firstName: input.firstName,
          lastName: input.lastName || null,
          collegeId: input.collegeId || null,
          courseId: input.courseId || null,
          semester: input.semester || null,
          ...(input.careerGoal !== undefined && { careerGoal: input.careerGoal || null }),
          ...(input.evaluationScheme !== undefined && { evaluationScheme: input.evaluationScheme || null }),
          ...(input.targetSgpa !== undefined && { targetSgpa: targetSgpaStr }),
          ...(input.programmingLevel !== undefined && { programmingLevel: input.programmingLevel || null }),
          ...(input.technicalInterests !== undefined && { technicalInterests: input.technicalInterests || null }),
          ...(input.specializationBranch !== undefined && { specializationBranch: input.specializationBranch || null }),
        },
      })
      .returning();

    return {
      userId: record.userId,
      firstName: record.firstName,
      lastName: record.lastName,
      collegeId: record.collegeId,
      courseId: record.courseId,
      semester: record.semester,
      careerGoal: record.careerGoal,
      evaluationScheme: record.evaluationScheme,
      targetSgpa: record.targetSgpa ? parseFloat(record.targetSgpa) : null,
      programmingLevel: record.programmingLevel,
      technicalInterests: record.technicalInterests,
      specializationBranch: record.specializationBranch ?? null,
      createdAt: record.createdAt,
    };
  }

  /**
   * Retrieves student settings by user_id.
   */
  async getSettings(userId: number): Promise<StudentSettingsDTO | null> {
    const client = this.getDb();
    Logger.debug("UserRepository.getSettings", { userId });

    const [record] = await client
      .select()
      .from(schema.studentSettings)
      .where(eq(schema.studentSettings.userId, userId));

    if (!record) return null;

    return {
      userId: record.userId,
      notificationEnabled: record.notificationEnabled,
      theme: record.theme,
      language: record.language,
    };
  }

  /**
   * Updates student settings preferences.
   */
  async updateSettings(userId: number, input: UpdateSettingsInput): Promise<StudentSettingsDTO> {
    const client = this.getDb();
    Logger.info("UserRepository.updateSettings", { userId });

    const [record] = await client
      .update(schema.studentSettings)
      .set({
        ...(input.notificationEnabled !== undefined && { notificationEnabled: input.notificationEnabled }),
        ...(input.theme !== undefined && { theme: input.theme }),
        ...(input.language !== undefined && { language: input.language }),
      })
      .where(eq(schema.studentSettings.userId, userId))
      .returning();

    if (!record) {
      throw new Error(`Settings not found for user_id: ${userId}`);
    }

    return {
      userId: record.userId,
      notificationEnabled: record.notificationEnabled,
      theme: record.theme,
      language: record.language,
    };
  }

  /**
   * Retrieves a full user aggregate (user, profile, and settings) in a single unified LEFT JOIN query.
   */
  async getUserWithProfileAndSettings(userId: number): Promise<FullUserAggregate | null> {
    const client = this.getDb();
    Logger.debug("UserRepository.getUserWithProfileAndSettings", { userId });

    const [record] = await client
      .select({
        user: schema.users,
        profile: schema.studentProfiles,
        settings: schema.studentSettings,
      })
      .from(schema.users)
      .leftJoin(schema.studentProfiles, eq(schema.users.userId, schema.studentProfiles.userId))
      .leftJoin(schema.studentSettings, eq(schema.users.userId, schema.studentSettings.userId))
      .where(eq(schema.users.userId, userId));

    if (!record || !record.user) return null;

    return {
      user: {
        userId: record.user.userId,
        email: record.user.email,
        passwordHash: record.user.passwordHash,
        role: record.user.role as UserRole,
        createdAt: record.user.createdAt,
      },
      profile: record.profile
        ? {
            userId: record.profile.userId,
            firstName: record.profile.firstName,
            lastName: record.profile.lastName,
            collegeId: record.profile.collegeId,
            courseId: record.profile.courseId,
            semester: record.profile.semester,
            careerGoal: record.profile.careerGoal ?? null,
            evaluationScheme: record.profile.evaluationScheme ?? null,
            targetSgpa: record.profile.targetSgpa ? parseFloat(record.profile.targetSgpa) : null,
            programmingLevel: record.profile.programmingLevel ?? null,
            technicalInterests: record.profile.technicalInterests ?? null,
            specializationBranch: record.profile.specializationBranch ?? null,
            createdAt: record.profile.createdAt,
          }
        : null,
      settings: record.settings
        ? {
            userId: record.settings.userId,
            notificationEnabled: record.settings.notificationEnabled,
            theme: record.settings.theme,
            language: record.settings.language,
          }
        : null,
    };
  }

  /**
   * Fetches paginated users list for administrative inspection.
   * Strips passwordHash and returns strictly safe user records.
   */
  async listAllUsers(limit = 50, offset = 0): Promise<Array<Omit<UserDTO, "passwordHash">>> {
    const client = this.getDb();
    Logger.debug("UserRepository.listAllUsers", { limit, offset });

    const records = await client
      .select({
        userId: schema.users.userId,
        email: schema.users.email,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .limit(limit)
      .offset(offset);

    return records.map((r) => ({
      userId: r.userId,
      email: r.email,
      role: r.role as UserRole,
      createdAt: r.createdAt,
    }));
  }
}

export const userRepository = new UserRepository();
