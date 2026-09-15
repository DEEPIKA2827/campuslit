/**
 * @file app/api/roadmaps/personalized/route.ts
 * @description Next.js 16 Route Handler for Deterministic Personalized Roadmap Engine.
 * @purpose Directly provides personalized career roadmap matching, node filtering, and prerequisite status.
 * @security Strictly enforces getAuthenticatedUser() session verification and student context isolation.
 */

import { NextRequest } from "next/server";
import { roadmapService } from "@/services/roadmap.service";
import { getAuthenticatedUser } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

/**
 * GET /api/roadmaps/personalized
 * Retrieves the deterministic personalized roadmap for the authenticated student.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return ResponseBuilder.error("Unauthorized: Authentication required.", 401, "UNAUTHORIZED");
    }

    Logger.info("GET /api/roadmaps/personalized requested", { userId: session.userId });
    const personalized = await roadmapService.getPersonalizedRoadmapForStudent(session.userId);

    return ResponseBuilder.success(personalized, "Personalized roadmap retrieved successfully.");
  } catch (error: unknown) {
    Logger.error("GET /api/roadmaps/personalized failed", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred while retrieving personalized roadmap.";
    return ResponseBuilder.error(message, 500, "INTERNAL_ERROR");
  }
}
