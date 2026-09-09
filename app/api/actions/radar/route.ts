/**
 * @file app/api/actions/radar/route.ts
 * @description Next.js Route Handler for CampusOS Proactive Student Action Radar.
 * @purpose Evaluates multi-domain signals (attendance risk, exam priorities, deadlines, roadmaps) to emit Rule-of-One daily missions.
 * @security Strictly enforces getAuthenticatedUser() session verification.
 */

import { NextRequest } from "next/server";
import { ActionRadarService } from "@/services/action-radar.service";
import { getAuthenticatedUser } from "@/lib/auth";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

const actionRadarService = new ActionRadarService();

/**
 * GET /api/actions/radar
 * Retrieves personalized Proactive Action Radar payload for authenticated student.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return ResponseBuilder.error("Unauthorized: Authentication required.", 401, "UNAUTHORIZED");
    }

    Logger.info("GET /api/actions/radar requested", { userId: session.userId });
    const radarData = await actionRadarService.buildRadarPayload(session.userId);

    return ResponseBuilder.success(radarData, "Action radar intelligence retrieved successfully.");
  } catch (error: unknown) {
    Logger.error("GET /api/actions/radar error", error);
    return ResponseBuilder.error(
      "Internal Server Error: Failed to generate Action Radar payload.",
      500,
      "INTERNAL_SERVER_ERROR"
    );
  }
}
