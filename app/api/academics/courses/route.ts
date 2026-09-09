/**
 * @file app/api/academics/courses/route.ts
 * @description Next.js 16 Route Handler for Academic Courses.
 * @purpose Exposes GET endpoint with optional schemeId and search filtering.
 * @security Strictly enforces getAuthenticatedUser() session verification.
 */

import { NextRequest } from "next/server";
import { academicService } from "@/services/academic.service";
import { AcademicValidation } from "@/validations/academic.validation";
import { getAuthenticatedUser } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

/**
 * GET /api/academics/courses
 * Retrieves courses with optional scheme and search query filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return ResponseBuilder.error("Unauthorized: Authentication required.", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const schemeIdParam = searchParams.get("schemeId");
    const searchParam = searchParams.get("search");

    const rawFilter: { schemeId?: number; search?: string } = {};

    if (schemeIdParam !== null) {
      const parsedSchemeId = Number(schemeIdParam);
      rawFilter.schemeId = parsedSchemeId;
    }

    if (searchParam !== null) {
      rawFilter.search = searchParam;
    }

    let filter;
    if (Object.keys(rawFilter).length > 0) {
      const validation = AcademicValidation.validateCourseFilter(rawFilter);
      if (!validation.valid || !validation.data) {
        return ResponseBuilder.error(
          `Validation Error: ${validation.errors?.join(", ")}`,
          400,
          "VALIDATION_ERROR"
        );
      }
      filter = validation.data;
    }

    Logger.info("GET /api/academics/courses requested", { userId: session.userId, filter });
    const courses = await academicService.listCourses(filter);

    return ResponseBuilder.cached(courses, "Courses retrieved successfully.", 3600, 86400);
  } catch (error: unknown) {
    Logger.error("GET /api/academics/courses failed", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    if (message.startsWith("Validation Error")) {
      return ResponseBuilder.error(message, 400, "VALIDATION_ERROR");
    }

    return ResponseBuilder.error("An unexpected error occurred while retrieving courses.", 500, "INTERNAL_ERROR");
  }
}
