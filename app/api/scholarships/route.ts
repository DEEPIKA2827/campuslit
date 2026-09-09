/**
 * @file app/api/scholarships/route.ts
 * @description Next.js 16 Route Handler for Scholarship Catalog Feed.
 * @purpose Exposes GET endpoint returning scholarships joined with student bookmark status, supporting search, category, active deadline filters, and pagination.
 * @security Strictly enforces getAuthenticatedUser() session verification.
 */

import { NextRequest } from "next/server";
import { scholarshipService } from "@/services/scholarship.service";
import { ScholarshipValidation } from "@/validations/scholarship.validation";
import { getAuthenticatedUser } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

/**
 * GET /api/scholarships
 * Retrieves scholarship catalog with student bookmark state, supporting search, category, active deadline, and pagination.
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
    const activeOnlyParam = searchParams.get("activeOnly");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const rawFilter: {
      search?: string;
      category?: string;
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
      const validation = ScholarshipValidation.validateScholarshipFilter(rawFilter);
      if (!validation.valid || !validation.data) {
        return ResponseBuilder.error(
          `Validation Error: ${validation.errors?.join(", ")}`,
          400,
          "VALIDATION_ERROR"
        );
      }
      filter = validation.data;
    }

    Logger.info("GET /api/scholarships requested", { userId: session.userId, filter });
    const scholarships = await scholarshipService.listScholarshipsForStudent(session.userId, filter);

    return ResponseBuilder.success(scholarships, "Scholarships retrieved successfully.");
  } catch (error: unknown) {
    Logger.error("GET /api/scholarships failed", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    if (message.startsWith("Validation Error")) {
      return ResponseBuilder.error(message, 400, "VALIDATION_ERROR");
    }

    return ResponseBuilder.error(
      "An unexpected error occurred while retrieving scholarships.",
      500,
      "INTERNAL_ERROR"
    );
  }
}
