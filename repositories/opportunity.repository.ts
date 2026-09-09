/**
 * @file repositories/opportunity.repository.ts
 * @description Data Access Layer for Opportunities and Student Application Tracking.
 * @domain Bounded Context: Internships, Jobs, Hackathons & Application Tracking
 * @tables opportunities, student_opportunities
 */

import { db, schema } from "@/lib/db";
import { eq, and, desc, asc, ilike, or, isNull, gte, sql } from "drizzle-orm";
import { Logger } from "@/lib/logger";
import {
  OpportunityDTO,
  OpportunityWithTrackingDTO,
  StudentOpportunityDTO,
  OpportunityStatus,
} from "@/types/api.types";

export interface CreateOpportunityInput {
  title: string;
  company?: string | null;
  description?: string | null;
  applicationUrl?: string | null;
  deadline?: string | null;
}

export interface OpportunityFilter {
  search?: string;
  activeOnly?: boolean;
  category?: string;
  workMode?: string;
  page?: number;
  limit?: number;
}

export interface TrackedOpportunityDetail {
  opportunity: OpportunityDTO;
  status: OpportunityStatus;
  savedAt: string;
}

export class OpportunityRepository {
  private getDb() {
    if (!db) {
      throw new Error(
        "Database operation failed: Database client is not initialized. Please ensure DATABASE_URL is configured."
      );
    }
    return db;
  }

  // ==========================================
  // Opportunities (Master Catalog)
  // ==========================================

  /**
   * Lists master opportunities with optional multi-field search and active deadline filtering.
   */
  async listOpportunities(filter?: OpportunityFilter): Promise<OpportunityDTO[]> {
    const client = this.getDb();
    Logger.debug("OpportunityRepository.listOpportunities", { ...filter });

    const conditions = [];

    if (filter?.search?.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.opportunities.title, term),
          ilike(schema.opportunities.company, term),
          ilike(schema.opportunities.description, term)
        )
      );
    }

    if (filter?.category && filter.category !== "all") {
      conditions.push(ilike(schema.opportunities.description, `%${filter.category}%`));
    }

    if (filter?.workMode && filter.workMode !== "all") {
      conditions.push(ilike(schema.opportunities.description, `%${filter.workMode}%`));
    }

    if (filter?.activeOnly) {
      conditions.push(
        or(
          isNull(schema.opportunities.deadline),
          gte(schema.opportunities.deadline, sql`CURRENT_DATE`)
        )
      );
    }

    const query = client.select().from(schema.opportunities);
    const records = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    return records.map((r) => ({
      opportunityId: r.opportunityId,
      title: r.title,
      company: r.company,
      description: r.description,
      applicationUrl: r.applicationUrl,
      deadline: r.deadline,
    }));
  }

  /**
   * Lists all opportunities with the current student's tracking status in a single LEFT JOIN (0 N+1 queries)
   * with server-side pagination and multi-facet filtering support.
   */
  async listOpportunitiesWithTrackingStatus(
    userId: number,
    filter?: OpportunityFilter
  ): Promise<OpportunityWithTrackingDTO[]> {
    const client = this.getDb();
    Logger.debug("OpportunityRepository.listOpportunitiesWithTrackingStatus", { userId, ...filter });

    const conditions = [];

    if (filter?.search?.trim()) {
      const term = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.opportunities.title, term),
          ilike(schema.opportunities.company, term),
          ilike(schema.opportunities.description, term)
        )
      );
    }

    if (filter?.category && filter.category !== "all") {
      conditions.push(ilike(schema.opportunities.description, `%${filter.category}%`));
    }

    if (filter?.workMode && filter.workMode !== "all") {
      conditions.push(ilike(schema.opportunities.description, `%${filter.workMode}%`));
    }

    if (filter?.activeOnly) {
      conditions.push(
        or(
          isNull(schema.opportunities.deadline),
          gte(schema.opportunities.deadline, sql`CURRENT_DATE`)
        )
      );
    }

    let baseQuery = client
      .select({
        opportunityId: schema.opportunities.opportunityId,
        title: schema.opportunities.title,
        company: schema.opportunities.company,
        description: schema.opportunities.description,
        applicationUrl: schema.opportunities.applicationUrl,
        deadline: schema.opportunities.deadline,
        status: schema.studentOpportunities.status,
        savedAt: schema.studentOpportunities.savedAt,
      })
      .from(schema.opportunities)
      .leftJoin(
        schema.studentOpportunities,
        and(
          eq(schema.opportunities.opportunityId, schema.studentOpportunities.opportunityId),
          eq(schema.studentOpportunities.userId, userId)
        )
      );

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions)) as typeof baseQuery;
    }

    baseQuery = baseQuery.orderBy(asc(schema.opportunities.deadline)) as typeof baseQuery;

    if (filter?.limit) {
      const page = filter.page && filter.page > 0 ? filter.page : 1;
      const offset = (page - 1) * filter.limit;
      baseQuery = baseQuery.limit(filter.limit).offset(offset) as typeof baseQuery;
    }

    const records = await baseQuery;

    return records.map((r) => ({
      opportunityId: r.opportunityId,
      title: r.title,
      company: r.company,
      description: r.description,
      applicationUrl: r.applicationUrl,
      deadline: r.deadline,
      trackingStatus: (r.status as OpportunityStatus) || null,
      savedAt: r.savedAt || null,
    }));
  }

  /**
   * Retrieves a single opportunity by its primary key.
   */
  async getOpportunityById(opportunityId: number): Promise<OpportunityDTO | null> {
    const client = this.getDb();
    Logger.debug("OpportunityRepository.getOpportunityById", { opportunityId });

    const [record] = await client
      .select()
      .from(schema.opportunities)
      .where(eq(schema.opportunities.opportunityId, opportunityId));

    if (!record) return null;

    return {
      opportunityId: record.opportunityId,
      title: record.title,
      company: record.company,
      description: record.description,
      applicationUrl: record.applicationUrl,
      deadline: record.deadline,
    };
  }

  /**
   * Creates a new master opportunity record.
   */
  async createOpportunity(input: CreateOpportunityInput): Promise<OpportunityDTO> {
    const client = this.getDb();
    Logger.info("OpportunityRepository.createOpportunity", { title: input.title });

    const [record] = await client
      .insert(schema.opportunities)
      .values({
        title: input.title,
        company: input.company || null,
        description: input.description || null,
        applicationUrl: input.applicationUrl || null,
        deadline: input.deadline || null,
      })
      .returning();

    return {
      opportunityId: record.opportunityId,
      title: record.title,
      company: record.company,
      description: record.description,
      applicationUrl: record.applicationUrl,
      deadline: record.deadline,
    };
  }

  /**
   * Deletes a master opportunity and relies on database ON DELETE CASCADE for student_opportunities.
   */
  async deleteOpportunity(opportunityId: number): Promise<boolean> {
    const client = this.getDb();
    Logger.info("OpportunityRepository.deleteOpportunity", { opportunityId });

    const [deleted] = await client
      .delete(schema.opportunities)
      .where(eq(schema.opportunities.opportunityId, opportunityId))
      .returning();

    return !!deleted;
  }

  // ==========================================
  // Student Opportunities Tracking
  // ==========================================

  /**
   * Tracks or updates application status for a student (saved, applied, shortlisted, rejected).
   * Scoped strictly by userId.
   */
  async trackOpportunity(
    userId: number,
    opportunityId: number,
    status: OpportunityStatus
  ): Promise<StudentOpportunityDTO> {
    const client = this.getDb();
    Logger.info("OpportunityRepository.trackOpportunity", { userId, opportunityId, status });

    const [record] = await client
      .insert(schema.studentOpportunities)
      .values({
        userId,
        opportunityId,
        status,
      })
      .onConflictDoUpdate({
        target: [schema.studentOpportunities.userId, schema.studentOpportunities.opportunityId],
        set: {
          status,
          savedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning();

    return {
      userId: record.userId,
      opportunityId: record.opportunityId,
      status: record.status as OpportunityStatus,
      savedAt: record.savedAt,
    };
  }

  /**
   * Untracks an opportunity for a student. Scoped strictly by userId.
   */
  async untrackOpportunity(userId: number, opportunityId: number): Promise<boolean> {
    const client = this.getDb();
    Logger.info("OpportunityRepository.untrackOpportunity", { userId, opportunityId });

    const result = await client
      .delete(schema.studentOpportunities)
      .where(
        and(
          eq(schema.studentOpportunities.userId, userId),
          eq(schema.studentOpportunities.opportunityId, opportunityId)
        )
      )
      .returning();

    return result.length > 0;
  }

  /**
   * Retrieves a student's tracked opportunity status. Scoped strictly by userId.
   */
  async getStudentTrackingStatus(
    userId: number,
    opportunityId: number
  ): Promise<StudentOpportunityDTO | null> {
    const client = this.getDb();
    Logger.debug("OpportunityRepository.getStudentTrackingStatus", { userId, opportunityId });

    const [record] = await client
      .select()
      .from(schema.studentOpportunities)
      .where(
        and(
          eq(schema.studentOpportunities.userId, userId),
          eq(schema.studentOpportunities.opportunityId, opportunityId)
        )
      );

    if (!record) return null;

    return {
      userId: record.userId,
      opportunityId: record.opportunityId,
      status: record.status as OpportunityStatus,
      savedAt: record.savedAt,
    };
  }

  /**
   * Retrieves all opportunities tracked by a student with full opportunity details.
   * Scoped strictly by userId, filtered optionally by status.
   */
  async getStudentOpportunities(
    userId: number,
    status?: OpportunityStatus
  ): Promise<TrackedOpportunityDetail[]> {
    const client = this.getDb();
    Logger.debug("OpportunityRepository.getStudentOpportunities", { userId, status });

    const conditions = [eq(schema.studentOpportunities.userId, userId)];
    if (status) {
      conditions.push(eq(schema.studentOpportunities.status, status));
    }

    const records = await client
      .select({
        opportunityId: schema.opportunities.opportunityId,
        title: schema.opportunities.title,
        company: schema.opportunities.company,
        description: schema.opportunities.description,
        applicationUrl: schema.opportunities.applicationUrl,
        deadline: schema.opportunities.deadline,
        status: schema.studentOpportunities.status,
        savedAt: schema.studentOpportunities.savedAt,
      })
      .from(schema.studentOpportunities)
      .innerJoin(
        schema.opportunities,
        eq(schema.studentOpportunities.opportunityId, schema.opportunities.opportunityId)
      )
      .where(and(...conditions))
      .orderBy(desc(schema.studentOpportunities.savedAt));

    return records.map((r) => ({
      opportunity: {
        opportunityId: r.opportunityId,
        title: r.title,
        company: r.company,
        description: r.description,
        applicationUrl: r.applicationUrl,
        deadline: r.deadline,
      },
      status: r.status as OpportunityStatus,
      savedAt: r.savedAt,
    }));
  }

  /**
   * Alias for getStudentTrackingStatus for backwards compatibility.
   */
  async getStudentOpportunityStatus(
    userId: number,
    opportunityId: number
  ): Promise<StudentOpportunityDTO | null> {
    return this.getStudentTrackingStatus(userId, opportunityId);
  }

  /**
   * Alias for getStudentOpportunities for backwards compatibility.
   */
  async getUserTrackedOpportunities(
    userId: number,
    status?: OpportunityStatus
  ): Promise<TrackedOpportunityDetail[]> {
    return this.getStudentOpportunities(userId, status);
  }
}

export const opportunityRepository = new OpportunityRepository();
