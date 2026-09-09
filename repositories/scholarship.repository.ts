/**
 * @file repositories/scholarship.repository.ts
 * @description Data Access Layer for Scholarships and Student Bookmarks.
 * @domain Bounded Context: Student Financial Aid & Scholarships
 * @tables scholarships, student_scholarship_bookmarks
 */

import { db, schema } from "@/lib/db";
import { eq, and, or, desc, asc, ilike, isNull, gte, sql } from "drizzle-orm";
import { Logger } from "@/lib/logger";
import {
  ScholarshipDTO,
  StudentScholarshipBookmarkDTO,
  ScholarshipWithBookmarkDTO,
} from "@/types/api.types";

export interface CreateScholarshipInput {
  scholarshipName: string;
  description?: string | null;
  eligibility?: string | null;
  applicationUrl?: string | null;
  deadline?: string | null;
}

export interface ScholarshipFilter {
  search?: string;
  activeOnly?: boolean;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedScholarshipsResult {
  items: ScholarshipWithBookmarkDTO[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface BookmarkedScholarshipDetail {
  scholarship: ScholarshipDTO;
  bookmarkedAt: string;
}

export class ScholarshipRepository {
  private getDb() {
    if (!db) {
      throw new Error(
        "Database operation failed: Database client is not initialized. Please ensure DATABASE_URL is configured."
      );
    }
    return db;
  }

  /**
   * Lists all available scholarships with optional search, category, and active deadline filters.
   */
  async listScholarships(filter?: ScholarshipFilter): Promise<ScholarshipDTO[]> {
    const client = this.getDb();
    Logger.debug("ScholarshipRepository.listScholarships", { ...filter });

    const conditions = [];

    if (filter?.search?.trim()) {
      const searchPattern = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.scholarships.scholarshipName, searchPattern),
          ilike(schema.scholarships.description, searchPattern),
          ilike(schema.scholarships.eligibility, searchPattern)
        )
      );
    }

    if (filter?.category && filter.category !== "all") {
      conditions.push(ilike(schema.scholarships.description, `%${filter.category}%`));
    }

    if (filter?.activeOnly) {
      conditions.push(
        or(
          isNull(schema.scholarships.deadline),
          gte(schema.scholarships.deadline, sql`CURRENT_DATE`)
        )
      );
    }

    const query = client.select().from(schema.scholarships);
    const records = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(asc(schema.scholarships.deadline))
      : await query.orderBy(asc(schema.scholarships.deadline));

    return records.map((r) => ({
      scholarshipId: r.scholarshipId,
      scholarshipName: r.scholarshipName,
      description: r.description,
      eligibility: r.eligibility,
      applicationUrl: r.applicationUrl,
      deadline: r.deadline,
    }));
  }

  /**
   * Lists all scholarships with the current user's bookmark state in a single LEFT JOIN (0 N+1 queries)
   * with server-side pagination support.
   */
  async listScholarshipsWithBookmarkStatus(
    userId: number,
    filter?: ScholarshipFilter
  ): Promise<ScholarshipWithBookmarkDTO[]> {
    const client = this.getDb();
    Logger.debug("ScholarshipRepository.listScholarshipsWithBookmarkStatus", { userId, ...filter });

    const conditions = [];

    if (filter?.search?.trim()) {
      const searchPattern = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.scholarships.scholarshipName, searchPattern),
          ilike(schema.scholarships.description, searchPattern),
          ilike(schema.scholarships.eligibility, searchPattern)
        )
      );
    }

    if (filter?.category && filter.category !== "all") {
      conditions.push(ilike(schema.scholarships.description, `%${filter.category}%`));
    }

    if (filter?.activeOnly) {
      conditions.push(
        or(
          isNull(schema.scholarships.deadline),
          gte(schema.scholarships.deadline, sql`CURRENT_DATE`)
        )
      );
    }

    let baseQuery = client
      .select({
        scholarshipId: schema.scholarships.scholarshipId,
        scholarshipName: schema.scholarships.scholarshipName,
        description: schema.scholarships.description,
        eligibility: schema.scholarships.eligibility,
        applicationUrl: schema.scholarships.applicationUrl,
        deadline: schema.scholarships.deadline,
        bookmarkedAt: schema.studentScholarshipBookmarks.bookmarkedAt,
      })
      .from(schema.scholarships)
      .leftJoin(
        schema.studentScholarshipBookmarks,
        and(
          eq(schema.scholarships.scholarshipId, schema.studentScholarshipBookmarks.scholarshipId),
          eq(schema.studentScholarshipBookmarks.userId, userId)
        )
      );

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
    }

    baseQuery = baseQuery.orderBy(asc(schema.scholarships.deadline)) as typeof baseQuery;

    if (filter?.limit) {
      const page = filter.page && filter.page > 0 ? filter.page : 1;
      const offset = (page - 1) * filter.limit;
      baseQuery = baseQuery.limit(filter.limit).offset(offset) as typeof baseQuery;
    }

    const records = await baseQuery;

    return records.map((r) => ({
      scholarshipId: r.scholarshipId,
      scholarshipName: r.scholarshipName,
      description: r.description,
      eligibility: r.eligibility,
      applicationUrl: r.applicationUrl,
      deadline: r.deadline,
      isBookmarked: r.bookmarkedAt !== null,
      bookmarkedAt: r.bookmarkedAt,
    }));
  }

  /**
   * Retrieves a single scholarship by primary key.
   */
  async getScholarshipById(scholarshipId: number): Promise<ScholarshipDTO | null> {
    const client = this.getDb();
    Logger.debug("ScholarshipRepository.getScholarshipById", { scholarshipId });

    const [record] = await client
      .select()
      .from(schema.scholarships)
      .where(eq(schema.scholarships.scholarshipId, scholarshipId));

    if (!record) return null;

    return {
      scholarshipId: record.scholarshipId,
      scholarshipName: record.scholarshipName,
      description: record.description,
      eligibility: record.eligibility,
      applicationUrl: record.applicationUrl,
      deadline: record.deadline,
    };
  }

  /**
   * Creates a new scholarship master record.
   */
  async createScholarship(input: CreateScholarshipInput): Promise<ScholarshipDTO> {
    const client = this.getDb();
    Logger.info("ScholarshipRepository.createScholarship", { name: input.scholarshipName });

    const [record] = await client
      .insert(schema.scholarships)
      .values({
        scholarshipName: input.scholarshipName,
        description: input.description || null,
        eligibility: input.eligibility || null,
        applicationUrl: input.applicationUrl || null,
        deadline: input.deadline || null,
      })
      .returning();

    return {
      scholarshipId: record.scholarshipId,
      scholarshipName: record.scholarshipName,
      description: record.description,
      eligibility: record.eligibility,
      applicationUrl: record.applicationUrl,
      deadline: record.deadline,
    };
  }

  /**
   * Deletes a scholarship and relies on database ON DELETE CASCADE for bookmarks.
   */
  async deleteScholarship(scholarshipId: number): Promise<boolean> {
    const client = this.getDb();
    Logger.info("ScholarshipRepository.deleteScholarship", { scholarshipId });

    const [deleted] = await client
      .delete(schema.scholarships)
      .where(eq(schema.scholarships.scholarshipId, scholarshipId))
      .returning();

    return !!deleted;
  }

  /**
   * Bookmarks a scholarship for a student.
   */
  async bookmarkScholarship(
    userId: number,
    scholarshipId: number
  ): Promise<StudentScholarshipBookmarkDTO> {
    const client = this.getDb();
    Logger.info("ScholarshipRepository.bookmarkScholarship", { userId, scholarshipId });

    const [record] = await client
      .insert(schema.studentScholarshipBookmarks)
      .values({
        userId,
        scholarshipId,
      })
      .onConflictDoNothing()
      .returning();

    if (!record) {
      const [existing] = await client
        .select()
        .from(schema.studentScholarshipBookmarks)
        .where(
          and(
            eq(schema.studentScholarshipBookmarks.userId, userId),
            eq(schema.studentScholarshipBookmarks.scholarshipId, scholarshipId)
          )
        );

      return {
        userId: existing.userId,
        scholarshipId: existing.scholarshipId,
        bookmarkedAt: existing.bookmarkedAt,
      };
    }

    return {
      userId: record.userId,
      scholarshipId: record.scholarshipId,
      bookmarkedAt: record.bookmarkedAt,
    };
  }

  /**
   * Removes a scholarship bookmark for a student.
   */
  async removeBookmark(userId: number, scholarshipId: number): Promise<boolean> {
    const client = this.getDb();
    Logger.info("ScholarshipRepository.removeBookmark", { userId, scholarshipId });

    const result = await client
      .delete(schema.studentScholarshipBookmarks)
      .where(
        and(
          eq(schema.studentScholarshipBookmarks.userId, userId),
          eq(schema.studentScholarshipBookmarks.scholarshipId, scholarshipId)
        )
      )
      .returning();

    return result.length > 0;
  }

  /**
   * Checks if a user has bookmarked a specific scholarship.
   */
  async isBookmarked(userId: number, scholarshipId: number): Promise<boolean> {
    const client = this.getDb();
    Logger.debug("ScholarshipRepository.isBookmarked", { userId, scholarshipId });

    const [record] = await client
      .select()
      .from(schema.studentScholarshipBookmarks)
      .where(
        and(
          eq(schema.studentScholarshipBookmarks.userId, userId),
          eq(schema.studentScholarshipBookmarks.scholarshipId, scholarshipId)
        )
      );

    return !!record;
  }

  /**
   * Retrieves all scholarships bookmarked by a student with full scholarship metadata.
   */
  async getUserBookmarkedScholarships(userId: number): Promise<BookmarkedScholarshipDetail[]> {
    const client = this.getDb();
    Logger.debug("ScholarshipRepository.getUserBookmarkedScholarships", { userId });

    const records = await client
      .select({
        scholarshipId: schema.scholarships.scholarshipId,
        scholarshipName: schema.scholarships.scholarshipName,
        description: schema.scholarships.description,
        eligibility: schema.scholarships.eligibility,
        applicationUrl: schema.scholarships.applicationUrl,
        deadline: schema.scholarships.deadline,
        bookmarkedAt: schema.studentScholarshipBookmarks.bookmarkedAt,
      })
      .from(schema.studentScholarshipBookmarks)
      .innerJoin(
        schema.scholarships,
        eq(schema.studentScholarshipBookmarks.scholarshipId, schema.scholarships.scholarshipId)
      )
      .where(eq(schema.studentScholarshipBookmarks.userId, userId))
      .orderBy(desc(schema.studentScholarshipBookmarks.bookmarkedAt));

    return records.map((r) => ({
      scholarship: {
        scholarshipId: r.scholarshipId,
        scholarshipName: r.scholarshipName,
        description: r.description,
        eligibility: r.eligibility,
        applicationUrl: r.applicationUrl,
        deadline: r.deadline,
      },
      bookmarkedAt: r.bookmarkedAt,
    }));
  }
}

export const scholarshipRepository = new ScholarshipRepository();
