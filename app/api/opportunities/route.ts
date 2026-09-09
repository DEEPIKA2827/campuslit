/**
 * @file app/api/opportunities/route.ts
 * @description Next.js 16 Route Handler for Opportunity Radar Catalog Feed.
 * @purpose Exposes GET endpoint returning opportunities joined with student's tracking status, supporting search, category, workMode, active deadline filters, and pagination.
 * @security Strictly enforces getAuthenticatedUser() session verification.
 */

import { NextRequest } from "next/server";
import { opportunityService } from "@/services/opportunity.service";
import { OpportunityValidation } from "@/validations/opportunity.validation";
import { getAuthenticatedUser } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

/**
 * GET /api/opportunities
 * Retrieves opportunity catalog with student tracking status, supporting search, category, workMode, active deadline, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return ResponseBuilder.error("Unauthorized: Authentication required.", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const searchParam = searchParams.get("search");
    const categoryParam = searchParams.get("category");
    const workModeParam = searchParams.get("workMode");
    const activeOnlyParam = searchParams.get("activeOnly");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const rawFilter: {
      search?: string;
      category?: string;
      workMode?: string;
      activeOnly?: boolean;
      page?: number;
      limit?: number;
    } = {};

    if (searchParam !== null) {
      rawFilter.search = searchParam;
    }

    if (categoryParam !== null && categoryParam !== "all") {
      rawFilter.category = categoryParam;
    }

    if (workModeParam !== null && workModeParam !== "all") {
      rawFilter.workMode = workModeParam;
    }

    if (pageParam !== null) {
      const parsedPage = parseInt(pageParam, 10);
      if (!isNaN(parsedPage)) rawFilter.page = parsedPage;
    }

    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit)) rawFilter.limit = parsedLimit;
    }

    if (activeOnlyParam !== null) {
      if (activeOnlyParam === "true") {
        rawFilter.activeOnly = true;
      } else if (activeOnlyParam === "false") {
        rawFilter.activeOnly = false;
      } else {
        return ResponseBuilder.error(
          "Validation Error: activeOnly must be a boolean ('true' or 'false').",
          400,
          "VALIDATION_ERROR"
        );
      }
    }

    let filter;
    if (Object.keys(rawFilter).length > 0) {
      const validation = OpportunityValidation.validateOpportunityFilter(rawFilter);
      if (!validation.valid || !validation.data) {
        return ResponseBuilder.error(
          `Validation Error: ${validation.errors?.join(", ")}`,
          400,
          "VALIDATION_ERROR"
        );
      }
      filter = validation.data;
    }

    Logger.info("GET /api/opportunities requested", { userId: session.userId, filter });
    const opportunities = await opportunityService.listOpportunitiesForStudent(session.userId, filter);

    return ResponseBuilder.success(opportunities, "Opportunities retrieved successfully.");
  } catch (error: unknown) {
    Logger.error("GET /api/opportunities failed", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    if (message.startsWith("Validation Error")) {
      return ResponseBuilder.error(message, 400, "VALIDATION_ERROR");
    }

    return ResponseBuilder.error(
      "An unexpected error occurred while retrieving opportunities.",
      500,
      "INTERNAL_ERROR"
    );
  }
}
