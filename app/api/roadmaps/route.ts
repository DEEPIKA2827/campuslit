/**
 * @file app/api/roadmaps/route.ts
 * @description Next.js 16 Route Handler for Career Skill Velocity Roadmaps.
 * @purpose Connects HTTP GET requests to RoadmapService using authenticated session identity.
 * @security Strictly enforces getAuthenticatedUser() session verification and isolates progress per student.
 */

import { NextRequest } from "next/server";
import { roadmapService } from "@/services/roadmap.service";
import { getAuthenticatedUser } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

/**
 * GET /api/roadmaps
 * If query param ?personalized=true (or ?mode=personalized), returns the deterministic personalized roadmap.
 * Otherwise, lists all career roadmaps with student completion percentage summaries.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return ResponseBuilder.error("Unauthorized: Authentication required.", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const isPersonalized = searchParams.get("personalized") === "true" || searchParams.get("mode") === "personalized";

    if (isPersonalized) {
      Logger.info("GET /api/roadmaps?personalized=true requested", { userId: session.userId });
      const personalized = await roadmapService.getPersonalizedRoadmapForStudent(session.userId);
      return ResponseBuilder.success(personalized, "Personalized roadmap retrieved successfully.");
    }

    Logger.info("GET /api/roadmaps requested", { userId: session.userId });
    const roadmaps = await roadmapService.listStudentRoadmaps(session.userId);

    return ResponseBuilder.success(roadmaps, "Roadmaps retrieved successfully.");
  } catch (error: unknown) {
    Logger.error("GET /api/roadmaps failed", error);
    return ResponseBuilder.error("An unexpected error occurred while retrieving roadmaps.", 500, "INTERNAL_ERROR");
  }
}
