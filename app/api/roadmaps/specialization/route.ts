/**
 * @file app/api/roadmaps/specialization/route.ts
 * @description Next.js 16 Route Handler for updating student specialization branch.
 * @purpose Allows students to set, change, or clear their specialization branch for Core Engineering and Higher Studies tracks.
 * @security Strictly enforces getAuthenticatedUser() session verification and career-track branch validation.
 */

import { NextRequest } from "next/server";
import { roadmapService } from "@/services/roadmap.service";
import { getAuthenticatedUser } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

/**
 * PATCH /api/roadmaps/specialization
 * Updates the student's specialization branch and returns the recalculated personalized roadmap.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return ResponseBuilder.error("Unauthorized: Authentication required.", 401, "UNAUTHORIZED");
    }

    const body = await request.json().catch(() => ({}));
    const branch = body.specializationBranch !== undefined ? body.specializationBranch : null;

    Logger.info("PATCH /api/roadmaps/specialization requested", { userId: session.userId, branch });

    const updatedRoadmap = await roadmapService.updateStudentSpecialization(session.userId, branch);

    return ResponseBuilder.success(updatedRoadmap, "Specialization branch updated successfully.");
  } catch (error: unknown) {
    Logger.error("PATCH /api/roadmaps/specialization failed", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred while updating specialization branch.";
    const status = message.startsWith("Validation Error") ? 400 : message.startsWith("Not Found") ? 404 : 500;
    const code = message.startsWith("Validation Error") ? "VALIDATION_ERROR" : message.startsWith("Not Found") ? "NOT_FOUND" : "INTERNAL_ERROR";
    return ResponseBuilder.error(message, status, code);
  }
}
