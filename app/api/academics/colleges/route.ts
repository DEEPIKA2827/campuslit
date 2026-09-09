/**
 * @file app/api/academics/colleges/route.ts
 * @description Next.js 16 Route Handler for Academic Institutions / Colleges.
 * @purpose Exposes GET endpoint returning the master college directory.
 * @security Strictly enforces getAuthenticatedUser() session verification.
 */

import { NextRequest } from "next/server";
import { academicService } from "@/services/academic.service";
import { getAuthenticatedUser } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

/**
 * GET /api/academics/colleges
 * Retrieves list of all registered academic institutions.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return ResponseBuilder.error("Unauthorized: Authentication required.", 401, "UNAUTHORIZED");
    }

    Logger.info("GET /api/academics/colleges requested", { userId: session.userId });
    const colleges = await academicService.listColleges();

    return ResponseBuilder.cached(colleges, "Colleges retrieved successfully.", 3600, 86400);
  } catch (error: unknown) {
    Logger.error("GET /api/academics/colleges failed", error);
    return ResponseBuilder.error("An unexpected error occurred while retrieving colleges.", 500, "INTERNAL_ERROR");
  }
}
